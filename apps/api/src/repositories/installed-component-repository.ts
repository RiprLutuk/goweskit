import type {
  CreateInstalledComponentRequest,
  InstalledComponentStandardInput,
  UpdateInstalledComponentRequest,
} from '@goweskit/contracts';
import { and, desc, eq } from 'drizzle-orm';

import type { Database } from '../db/client.js';
import { bikeComponentInstalls, componentCategories } from '../db/schema.js';

export interface StoredInstalledComponent {
  id: string;
  userBikeId: string;
  componentCategoryId: string;
  customName: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  notes: string | null;
  installedAt: string | null;
  standards: InstalledComponentStandardInput[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InstalledComponentRepository {
  componentCategoryExists(id: string): Promise<boolean>;
  listForBike(bikeId: string): Promise<StoredInstalledComponent[]>;
  findForBike(
    bikeId: string,
    installId: string,
  ): Promise<StoredInstalledComponent | null>;
  create(
    bikeId: string,
    input: CreateInstalledComponentRequest,
  ): Promise<StoredInstalledComponent>;
  update(
    installId: string,
    input: UpdateInstalledComponentRequest,
  ): Promise<StoredInstalledComponent | null>;
  delete(installId: string): Promise<void>;
}

export class DrizzleInstalledComponentRepository implements InstalledComponentRepository {
  public constructor(private readonly database: Database) {}

  public async componentCategoryExists(id: string): Promise<boolean> {
    const [row] = await this.database
      .select({ id: componentCategories.id })
      .from(componentCategories)
      .where(eq(componentCategories.id, id))
      .limit(1);
    return row !== undefined;
  }

  public listForBike(bikeId: string): Promise<StoredInstalledComponent[]> {
    return this.database
      .select()
      .from(bikeComponentInstalls)
      .where(eq(bikeComponentInstalls.userBikeId, bikeId))
      .orderBy(
        desc(bikeComponentInstalls.installedAt),
        desc(bikeComponentInstalls.createdAt),
      );
  }

  public async findForBike(
    bikeId: string,
    installId: string,
  ): Promise<StoredInstalledComponent | null> {
    const [component] = await this.database
      .select()
      .from(bikeComponentInstalls)
      .where(
        and(
          eq(bikeComponentInstalls.id, installId),
          eq(bikeComponentInstalls.userBikeId, bikeId),
        ),
      )
      .limit(1);
    return component ?? null;
  }

  public async create(
    bikeId: string,
    input: CreateInstalledComponentRequest,
  ): Promise<StoredInstalledComponent> {
    const [component] = await this.database
      .insert(bikeComponentInstalls)
      .values({
        userBikeId: bikeId,
        componentCategoryId: input.componentCategoryId,
        customName: input.customName,
        brand: input.brand ?? null,
        model: input.model ?? null,
        serialNumber: input.serialNumber ?? null,
        notes: input.notes ?? null,
        installedAt: input.installedAt ?? null,
        standards: input.standards ?? [],
      })
      .returning();

    if (component === undefined) {
      throw new Error('Installed component insert returned no row.');
    }
    return component;
  }

  public async update(
    installId: string,
    input: UpdateInstalledComponentRequest,
  ): Promise<StoredInstalledComponent | null> {
    const patch: Partial<typeof bikeComponentInstalls.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.componentCategoryId !== undefined)
      patch.componentCategoryId = input.componentCategoryId;
    if (input.customName !== undefined) patch.customName = input.customName;
    if (input.brand !== undefined) patch.brand = input.brand;
    if (input.model !== undefined) patch.model = input.model;
    if (input.serialNumber !== undefined)
      patch.serialNumber = input.serialNumber;
    if (input.notes !== undefined) patch.notes = input.notes;
    if (input.installedAt !== undefined) patch.installedAt = input.installedAt;
    if (input.standards !== undefined) patch.standards = input.standards;

    const [component] = await this.database
      .update(bikeComponentInstalls)
      .set(patch)
      .where(eq(bikeComponentInstalls.id, installId))
      .returning();
    return component ?? null;
  }

  public async delete(installId: string): Promise<void> {
    await this.database
      .delete(bikeComponentInstalls)
      .where(eq(bikeComponentInstalls.id, installId));
  }
}
