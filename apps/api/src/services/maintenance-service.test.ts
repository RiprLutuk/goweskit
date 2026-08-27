import type {
  Bike,
  CreateMaintenanceEventRequest,
  User,
} from '@goweskit/contracts';
import { describe, expect, it } from 'vitest';

import { AppError } from '../errors.js';
import type {
  MaintenanceRepository,
  StoredMaintenanceEvent,
} from '../repositories/maintenance-repository.js';
import {
  getMaintenanceDueStatus,
  MaintenanceService,
  type BikeOwnershipService,
} from './maintenance-service.js';

const user: User = {
  id: '10000000-0000-4000-8000-000000000010',
  displayName: 'Rider',
  email: 'rider@example.com',
  createdAt: '2026-08-01T00:00:00.000Z',
};
const bikeId = '10000000-0000-4000-8000-000000000001';

class RecordingRepository implements MaintenanceRepository {
  public events: StoredMaintenanceEvent[] = [];
  public createdWith: {
    userId: string;
    bikeId: string;
    input: CreateMaintenanceEventRequest;
  } | null = null;

  public listForBike(): Promise<StoredMaintenanceEvent[]> {
    return Promise.resolve(this.events);
  }

  public create(
    userId: string,
    createdBikeId: string,
    input: CreateMaintenanceEventRequest,
  ): Promise<StoredMaintenanceEvent> {
    this.createdWith = { userId, bikeId: createdBikeId, input };
    return Promise.resolve({
      id: '10000000-0000-4000-8000-000000000301',
      userId,
      userBikeId: createdBikeId,
      type: input.type,
      performedAt: input.performedAt,
      notes: input.notes ?? null,
      nextDueDate: input.nextDueDate ?? null,
      createdAt: new Date('2026-08-20T08:00:00.000Z'),
    });
  }
}

class OwnershipStub implements BikeOwnershipService {
  public checkedBikeIds: string[] = [];

  public constructor(private readonly allowed = true) {}

  public getBike(_user: User, checkedBikeId: string): Promise<Bike> {
    this.checkedBikeIds.push(checkedBikeId);
    if (!this.allowed) {
      return Promise.reject(
        new AppError('BIKE_NOT_FOUND', 'Bike not found.', 404),
      );
    }
    return Promise.resolve({} as Bike);
  }
}

describe('MaintenanceService', () => {
  it('maps deterministic reminder states against the current UTC date', () => {
    expect(getMaintenanceDueStatus(null, '2026-08-27')).toBe('none');
    expect(getMaintenanceDueStatus('2026-08-26', '2026-08-27')).toBe('overdue');
    expect(getMaintenanceDueStatus('2026-08-27', '2026-08-27')).toBe('due');
    expect(getMaintenanceDueStatus('2026-08-28', '2026-08-27')).toBe(
      'upcoming',
    );
  });

  it('checks bike ownership before storing a service log', async () => {
    const repository = new RecordingRepository();
    const ownership = new OwnershipStub();
    const service = new MaintenanceService(
      repository,
      ownership,
      () => new Date('2026-08-27T12:00:00.000Z'),
    );
    const input: CreateMaintenanceEventRequest = {
      type: 'chain_lube',
      performedAt: '2026-08-20',
      notes: 'Quiet again.',
      nextDueDate: '2026-09-20',
    };

    const event = await service.createEvent(user, bikeId, input);

    expect(ownership.checkedBikeIds).toEqual([bikeId]);
    expect(repository.createdWith).toEqual({ userId: user.id, bikeId, input });
    expect(event).toMatchObject({ bikeId, dueStatus: 'upcoming' });
  });

  it('does not query maintenance rows when the bike is not owned', async () => {
    const repository = new RecordingRepository();
    const service = new MaintenanceService(
      repository,
      new OwnershipStub(false),
      () => new Date('2026-08-27T12:00:00.000Z'),
    );

    await expect(service.listEvents(user, bikeId)).rejects.toMatchObject({
      code: 'BIKE_NOT_FOUND',
      statusCode: 404,
    });
  });

  it('rejects a service date in the future', async () => {
    const service = new MaintenanceService(
      new RecordingRepository(),
      new OwnershipStub(),
      () => new Date('2026-08-27T12:00:00.000Z'),
    );

    await expect(
      service.createEvent(user, bikeId, {
        type: 'tires',
        performedAt: '2026-08-28',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST', statusCode: 400 });
  });
});
