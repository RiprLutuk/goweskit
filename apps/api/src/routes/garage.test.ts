import type { User } from '@goweskit/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp, type AppServices } from '../app.js';

const bikeId = '10000000-0000-4000-8000-000000000001';
const user: User = {
  id: '10000000-0000-4000-8000-000000000002',
  displayName: 'Demo Rider',
  email: 'rider@example.com',
  createdAt: '2026-08-01T00:00:00.000Z',
};
const openApps: ReturnType<typeof buildApp>[] = [];

function buildGarageApp() {
  const app = buildApp({
    logger: false,
    services: {
      auth: {
        authenticate: () => Promise.resolve(user),
      } as unknown as AppServices['auth'],
      catalog: {} as AppServices['catalog'],
      compatibility: {} as AppServices['compatibility'],
      community: {} as AppServices['community'],
      explore: {} as AppServices['explore'],
      garage: {
        updateBikeVisual: (
          _user: User,
          id: string,
          input: { photoUrl?: string | null; avatarPreset?: string | null },
        ) =>
          Promise.resolve({
            id,
            photoUrl: input.photoUrl ?? null,
            avatarPreset: input.avatarPreset ?? null,
          }),
      } as unknown as AppServices['garage'],
      installedComponents: {} as AppServices['installedComponents'],
      maintenance: {} as AppServices['maintenance'],
    },
  });
  openApps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(openApps.splice(0).map(async (app) => app.close()));
});

describe('Garage photo route', () => {
  it('updates a validated bike photo and avatar key', async () => {
    const response = await buildGarageApp().inject({
      method: 'PUT',
      url: `/api/v1/bikes/${bikeId}/photo`,
      payload: {
        photoUrl: 'https://cdn.example.com/bikes/demo.webp',
        avatarPreset: 'hardtail_lime',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      bike: {
        id: bikeId,
        photoUrl: 'https://cdn.example.com/bikes/demo.webp',
        avatarPreset: 'hardtail_lime',
      },
    });
  });

  it('rejects unsafe image protocols and empty patches', async () => {
    for (const payload of [{}, { photoUrl: 'javascript:alert(1)' }]) {
      const response = await buildGarageApp().inject({
        method: 'PUT',
        url: `/api/v1/bikes/${bikeId}/photo`,
        payload,
      });
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: { code: 'INVALID_REQUEST' },
      });
    }
  });
});
