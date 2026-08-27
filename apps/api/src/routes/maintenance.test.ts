import {
  apiErrorResponseSchema,
  maintenanceEventResponseSchema,
  type Bike,
  type User,
} from '@goweskit/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp, type AppServices } from '../app.js';
import type { MaintenanceRepository } from '../repositories/maintenance-repository.js';
import {
  MaintenanceService,
  type BikeOwnershipService,
} from '../services/maintenance-service.js';

const user: User = {
  id: '10000000-0000-4000-8000-000000000010',
  displayName: 'Rider',
  email: 'rider@example.com',
  createdAt: '2026-08-01T00:00:00.000Z',
};
const bikeId = '10000000-0000-4000-8000-000000000001';

const repository: MaintenanceRepository = {
  listForBike: () => Promise.resolve([]),
  create: (userId, createdBikeId, input) =>
    Promise.resolve({
      id: '10000000-0000-4000-8000-000000000301',
      userId,
      userBikeId: createdBikeId,
      type: input.type,
      performedAt: input.performedAt,
      notes: input.notes ?? null,
      nextDueDate: input.nextDueDate ?? null,
      createdAt: new Date('2026-08-20T08:00:00.000Z'),
    }),
};
const ownership: BikeOwnershipService = {
  getBike: () => Promise.resolve({} as Bike),
};

const openApps: ReturnType<typeof buildApp>[] = [];

function buildMaintenanceApp() {
  const app = buildApp({
    logger: false,
    services: {
      auth: {
        authenticate: () => Promise.resolve(user),
      } as unknown as AppServices['auth'],
      catalog: {} as AppServices['catalog'],
      compatibility: {} as AppServices['compatibility'],
      explore: {} as AppServices['explore'],
      garage: {} as AppServices['garage'],
      installedComponents: {} as AppServices['installedComponents'],
      maintenance: new MaintenanceService(
        repository,
        ownership,
        () => new Date('2026-08-27T12:00:00.000Z'),
      ),
    },
  });
  openApps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(openApps.splice(0).map(async (app) => app.close()));
});

describe('bike maintenance routes', () => {
  it('creates a validated maintenance event', async () => {
    const response = await buildMaintenanceApp().inject({
      method: 'POST',
      url: `/api/v1/bikes/${bikeId}/maintenance`,
      payload: {
        type: 'chain_lube',
        performedAt: '2026-08-20',
        nextDueDate: '2026-09-20',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(maintenanceEventResponseSchema.parse(response.json()).event).toEqual(
      expect.objectContaining({ bikeId, dueStatus: 'upcoming' }),
    );
  });

  it('returns stable INVALID_REQUEST errors for malformed logs', async () => {
    const response = await buildMaintenanceApp().inject({
      method: 'POST',
      url: `/api/v1/bikes/${bikeId}/maintenance`,
      payload: { type: 'wash', performedAt: 'not-a-date' },
    });
    const body = apiErrorResponseSchema.parse(response.json());

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe('INVALID_REQUEST');
    expect(body.requestId).toEqual(expect.any(String));
  });
});
