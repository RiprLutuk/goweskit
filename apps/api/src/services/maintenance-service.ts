import type {
  Bike,
  CreateMaintenanceEventRequest,
  MaintenanceDueStatus,
  MaintenanceEvent,
  User,
} from '@goweskit/contracts';

import { AppError } from '../errors.js';
import type {
  MaintenanceRepository,
  StoredMaintenanceEvent,
} from '../repositories/maintenance-repository.js';

export interface BikeOwnershipService {
  getBike(user: User, bikeId: string): Promise<Bike>;
}

function utcDate(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function getMaintenanceDueStatus(
  nextDueDate: string | null,
  today: string,
): MaintenanceDueStatus {
  if (nextDueDate === null) return 'none';
  if (nextDueDate < today) return 'overdue';
  if (nextDueDate === today) return 'due';
  return 'upcoming';
}

function mapEvent(
  event: StoredMaintenanceEvent,
  today: string,
): MaintenanceEvent {
  return {
    id: event.id,
    bikeId: event.userBikeId,
    type: event.type,
    performedAt: event.performedAt,
    notes: event.notes,
    nextDueDate: event.nextDueDate,
    dueStatus: getMaintenanceDueStatus(event.nextDueDate, today),
    createdAt: event.createdAt.toISOString(),
  };
}

export class MaintenanceService {
  public constructor(
    private readonly repository: MaintenanceRepository,
    private readonly bikeOwnership: BikeOwnershipService,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async listEvents(
    user: User,
    bikeId: string,
  ): Promise<MaintenanceEvent[]> {
    await this.bikeOwnership.getBike(user, bikeId);
    const today = utcDate(this.now());
    return (await this.repository.listForBike(bikeId)).map((event) =>
      mapEvent(event, today),
    );
  }

  public async createEvent(
    user: User,
    bikeId: string,
    input: CreateMaintenanceEventRequest,
  ): Promise<MaintenanceEvent> {
    await this.bikeOwnership.getBike(user, bikeId);
    const today = utcDate(this.now());
    if (input.performedAt > today) {
      throw new AppError(
        'INVALID_REQUEST',
        'Service date cannot be in the future.',
        400,
        { performedAt: input.performedAt },
      );
    }
    return mapEvent(
      await this.repository.create(user.id, bikeId, input),
      today,
    );
  }
}
