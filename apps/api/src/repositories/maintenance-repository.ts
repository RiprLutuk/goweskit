import type {
  CreateMaintenanceEventRequest,
  MaintenanceEventType,
} from '@goweskit/contracts';
import { desc, eq } from 'drizzle-orm';

import type { Database } from '../db/client.js';
import { maintenanceEvents } from '../db/schema.js';

export interface StoredMaintenanceEvent {
  id: string;
  userId: string;
  userBikeId: string;
  type: MaintenanceEventType;
  performedAt: string;
  notes: string | null;
  nextDueDate: string | null;
  createdAt: Date;
}

export interface MaintenanceRepository {
  listForBike(bikeId: string): Promise<StoredMaintenanceEvent[]>;
  create(
    userId: string,
    bikeId: string,
    input: CreateMaintenanceEventRequest,
  ): Promise<StoredMaintenanceEvent>;
}

export class DrizzleMaintenanceRepository implements MaintenanceRepository {
  public constructor(private readonly database: Database) {}

  public listForBike(bikeId: string): Promise<StoredMaintenanceEvent[]> {
    return this.database
      .select()
      .from(maintenanceEvents)
      .where(eq(maintenanceEvents.userBikeId, bikeId))
      .orderBy(
        desc(maintenanceEvents.performedAt),
        desc(maintenanceEvents.createdAt),
      );
  }

  public async create(
    userId: string,
    bikeId: string,
    input: CreateMaintenanceEventRequest,
  ): Promise<StoredMaintenanceEvent> {
    const [created] = await this.database
      .insert(maintenanceEvents)
      .values({
        userId,
        userBikeId: bikeId,
        type: input.type,
        performedAt: input.performedAt,
        notes: input.notes ?? null,
        nextDueDate: input.nextDueDate ?? null,
      })
      .returning();

    if (created === undefined) {
      throw new Error('Maintenance event insert returned no row.');
    }
    return created;
  }
}
