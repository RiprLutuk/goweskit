import type { BikeSpecCode } from '@goweskit/bike-domain';
import type { CreateBikeRequest, UpdateBikeRequest } from '@goweskit/contracts';
import { asc, eq, inArray } from 'drizzle-orm';

import type { Database } from '../db/client.js';
import {
  bicycleTypes,
  bikeSpecs,
  type StoredSpecValue,
  userBikes,
} from '../db/schema.js';

export interface StoredBikeSpec {
  standardCode: BikeSpecCode;
  valueJson: StoredSpecValue | null;
  confidence: 'confirmed' | 'user_entered' | 'inferred' | 'unknown';
  source: string;
  updatedAt: Date;
}

export interface StoredBike {
  id: string;
  userId: string;
  nickname: string;
  bicycleType: { id: string; slug: string; name: string };
  brand: string | null;
  model: string | null;
  modelYear: number | null;
  photoUrl: string | null;
  notes: string | null;
  specs: StoredBikeSpec[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredSpecInput {
  standardCode: BikeSpecCode;
  valueJson: StoredSpecValue | null;
  confidence: 'user_entered' | 'unknown';
  source: 'garage_onboarding' | 'garage_edit';
}

export interface GarageRepository {
  bicycleTypeExists(id: string): Promise<boolean>;
  createBike(
    userId: string,
    input: CreateBikeRequest,
    specs: StoredSpecInput[],
  ): Promise<StoredBike>;
  listBikes(userId: string): Promise<StoredBike[]>;
  findBikeById(id: string): Promise<StoredBike | null>;
  updateBike(id: string, input: UpdateBikeRequest): Promise<StoredBike | null>;
  deleteBike(id: string): Promise<void>;
  upsertSpec(bikeId: string, spec: StoredSpecInput): Promise<StoredBikeSpec>;
}

interface BikeRow {
  bike: typeof userBikes.$inferSelect;
  bicycleType: { id: string; slug: string; name: string };
}

export class DrizzleGarageRepository implements GarageRepository {
  public constructor(private readonly database: Database) {}

  public async bicycleTypeExists(id: string): Promise<boolean> {
    const [row] = await this.database
      .select({ id: bicycleTypes.id })
      .from(bicycleTypes)
      .where(eq(bicycleTypes.id, id))
      .limit(1);
    return row !== undefined;
  }

  public async createBike(
    userId: string,
    input: CreateBikeRequest,
    specs: StoredSpecInput[],
  ): Promise<StoredBike> {
    const bikeId = await this.database.transaction(async (transaction) => {
      const [created] = await transaction
        .insert(userBikes)
        .values({
          userId,
          nickname: input.nickname,
          bicycleTypeId: input.bicycleTypeId,
          brand: input.brand ?? null,
          model: input.model ?? null,
          modelYear: input.modelYear ?? null,
          photoUrl: input.photoUrl ?? null,
          notes: input.notes ?? null,
        })
        .returning({ id: userBikes.id });

      if (created === undefined) {
        throw new Error('Bike insert returned no row.');
      }

      if (specs.length > 0) {
        await transaction.insert(bikeSpecs).values(
          specs.map((spec) => ({
            userBikeId: created.id,
            ...spec,
          })),
        );
      }
      return created.id;
    });

    const bike = await this.findBikeById(bikeId);
    if (bike === null) throw new Error('Created bike could not be read.');
    return bike;
  }

  public async listBikes(userId: string): Promise<StoredBike[]> {
    const rows = await this.selectBikes(userId);
    return this.attachSpecs(rows);
  }

  public async findBikeById(id: string): Promise<StoredBike | null> {
    const rows = await this.selectBikes(undefined, id);
    const [bike] = await this.attachSpecs(rows);
    return bike ?? null;
  }

  public async updateBike(
    id: string,
    input: UpdateBikeRequest,
  ): Promise<StoredBike | null> {
    const patch: Partial<typeof userBikes.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.nickname !== undefined) patch.nickname = input.nickname;
    if (input.bicycleTypeId !== undefined)
      patch.bicycleTypeId = input.bicycleTypeId;
    if (input.brand !== undefined) patch.brand = input.brand;
    if (input.model !== undefined) patch.model = input.model;
    if (input.modelYear !== undefined) patch.modelYear = input.modelYear;
    if (input.photoUrl !== undefined) patch.photoUrl = input.photoUrl;
    if (input.notes !== undefined) patch.notes = input.notes;

    await this.database
      .update(userBikes)
      .set(patch)
      .where(eq(userBikes.id, id));
    return this.findBikeById(id);
  }

  public async deleteBike(id: string): Promise<void> {
    await this.database.delete(userBikes).where(eq(userBikes.id, id));
  }

  public async upsertSpec(
    bikeId: string,
    spec: StoredSpecInput,
  ): Promise<StoredBikeSpec> {
    const [stored] = await this.database
      .insert(bikeSpecs)
      .values({ userBikeId: bikeId, ...spec })
      .onConflictDoUpdate({
        target: [bikeSpecs.userBikeId, bikeSpecs.standardCode],
        set: {
          valueJson: spec.valueJson,
          confidence: spec.confidence,
          source: spec.source,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (stored === undefined)
      throw new Error('Bike spec upsert returned no row.');
    return stored;
  }

  private selectBikes(userId?: string, bikeId?: string) {
    const query = this.database
      .select({
        bike: userBikes,
        bicycleType: {
          id: bicycleTypes.id,
          slug: bicycleTypes.slug,
          name: bicycleTypes.name,
        },
      })
      .from(userBikes)
      .innerJoin(bicycleTypes, eq(userBikes.bicycleTypeId, bicycleTypes.id))
      .orderBy(asc(userBikes.createdAt));

    if (bikeId !== undefined) return query.where(eq(userBikes.id, bikeId));
    if (userId !== undefined) return query.where(eq(userBikes.userId, userId));
    return query;
  }

  private async attachSpecs(rows: BikeRow[]): Promise<StoredBike[]> {
    const ids = rows.map(({ bike }) => bike.id);
    const specs =
      ids.length === 0
        ? []
        : await this.database
            .select()
            .from(bikeSpecs)
            .where(inArray(bikeSpecs.userBikeId, ids));

    return rows.map(({ bike, bicycleType }) => ({
      ...bike,
      bicycleType,
      specs: specs.filter((spec) => spec.userBikeId === bike.id),
    }));
  }
}
