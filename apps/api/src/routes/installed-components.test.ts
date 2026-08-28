import {
  apiErrorResponseSchema,
  installedComponentResponseSchema,
  type Bike,
  type User,
} from '@goweskit/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp, type AppServices } from '../app.js';
import type { InstalledComponentRepository } from '../repositories/installed-component-repository.js';
import {
  InstalledComponentService,
  type InstalledComponentBikeOwnership,
} from '../services/installed-component-service.js';

const user: User = {
  id: '10000000-0000-4000-8000-000000000010',
  displayName: 'Rider',
  email: 'rider@example.com',
  createdAt: '2026-08-01T00:00:00.000Z',
};
const bikeId = '10000000-0000-4000-8000-000000000001';
const categoryId = '10000000-0000-4000-8000-000000000020';

const repository: InstalledComponentRepository = {
  componentCategoryExists: () => Promise.resolve(true),
  listForBike: () => Promise.resolve([]),
  findForBike: () => Promise.resolve(null),
  create: (createdBikeId, input) =>
    Promise.resolve({
      id: '10000000-0000-4000-8000-000000000030',
      userBikeId: createdBikeId,
      componentCategoryId: input.componentCategoryId,
      customName: input.customName,
      brand: input.brand ?? null,
      model: input.model ?? null,
      serialNumber: input.serialNumber ?? null,
      notes: input.notes ?? null,
      installedAt: input.installedAt ?? null,
      standards: input.standards ?? [],
      createdAt: new Date('2026-08-27T00:00:00.000Z'),
      updatedAt: new Date('2026-08-27T00:00:00.000Z'),
    }),
  update: () => Promise.resolve(null),
  delete: () => Promise.resolve(),
};
const ownership: InstalledComponentBikeOwnership = {
  getBike: () => Promise.resolve({} as Bike),
};
const openApps: ReturnType<typeof buildApp>[] = [];

function buildInstalledComponentApp() {
  const installedComponents = new InstalledComponentService(
    repository,
    ownership,
  );
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
      installedComponents,
      maintenance: {} as AppServices['maintenance'],
    },
  });
  openApps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(openApps.splice(0).map(async (app) => app.close()));
});

describe('installed component routes', () => {
  it('creates a validated installed component', async () => {
    const response = await buildInstalledComponentApp().inject({
      method: 'POST',
      url: `/api/v1/bikes/${bikeId}/components`,
      payload: {
        componentCategoryId: categoryId,
        customName: 'Current rear wheel',
        standards: [
          {
            standardCode: 'rear_axle',
            knowledge: 'known',
            value: '12x148',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(201);
    expect(
      installedComponentResponseSchema.parse(response.json()).component,
    ).toMatchObject({ bikeId, customName: 'Current rear wheel' });
  });

  it('returns stable validation errors without accepting invented fields', async () => {
    const response = await buildInstalledComponentApp().inject({
      method: 'POST',
      url: `/api/v1/bikes/${bikeId}/components`,
      payload: {
        componentCategoryId: categoryId,
        customName: 'Current rear wheel',
        compatibilityStatus: 'compatible',
      },
    });
    const body = apiErrorResponseSchema.parse(response.json());

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe('INVALID_REQUEST');
  });
});
