import type { User } from '@goweskit/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp, type AppServices } from '../app.js';

const user: User = {
  id: '10000000-0000-4000-8000-000000000001',
  displayName: 'Demo Rider',
  email: 'demo@example.com',
  createdAt: '2026-08-01T00:00:00.000Z',
};
const openApps: ReturnType<typeof buildApp>[] = [];

function buildSavedItemsApp() {
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
      garage: {} as AppServices['garage'],
      installedComponents: {} as AppServices['installedComponents'],
      maintenance: {} as AppServices['maintenance'],
      savedItems: {
        save: () =>
          Promise.resolve({
            saved: true,
            savedAt: '2026-08-28T21:40:00.000Z',
          }),
      } as unknown as NonNullable<AppServices['savedItems']>,
    },
  });
  openApps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(openApps.splice(0).map(async (app) => app.close()));
});

describe('Saved item route', () => {
  it('saves a validated place or route for the authenticated user', async () => {
    const response = await buildSavedItemsApp().inject({
      method: 'POST',
      url: '/api/v1/user/saved-items',
      payload: {
        itemKind: 'place',
        itemId: '20000000-0000-4000-8000-000000000001',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      saved: true,
      savedAt: '2026-08-28T21:40:00.000Z',
    });
  });

  it('rejects unsupported saved item kinds', async () => {
    const response = await buildSavedItemsApp().inject({
      method: 'POST',
      url: '/api/v1/user/saved-items',
      payload: {
        itemKind: 'community',
        itemId: '20000000-0000-4000-8000-000000000001',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: 'INVALID_REQUEST' },
    });
  });
});
