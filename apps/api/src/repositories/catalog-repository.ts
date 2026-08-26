import type { BicycleType, ComponentCategory } from '@goweskit/contracts';
import { asc, eq } from 'drizzle-orm';

import type { Database } from '../db/client.js';
import { bicycleTypes, componentCategories } from '../db/schema.js';

export interface CatalogRepository {
  listBicycleTypes(): Promise<BicycleType[]>;
  findBicycleTypeBySlug(slug: string): Promise<BicycleType | null>;
  listComponentCategories(): Promise<ComponentCategory[]>;
  findComponentCategoryBySlug(slug: string): Promise<ComponentCategory | null>;
}

export class DrizzleCatalogRepository implements CatalogRepository {
  public constructor(private readonly database: Database) {}

  public async listBicycleTypes(): Promise<BicycleType[]> {
    return this.database
      .select()
      .from(bicycleTypes)
      .orderBy(asc(bicycleTypes.name));
  }

  public async findBicycleTypeBySlug(
    slug: string,
  ): Promise<BicycleType | null> {
    const [bicycleType] = await this.database
      .select()
      .from(bicycleTypes)
      .where(eq(bicycleTypes.slug, slug))
      .limit(1);
    return bicycleType ?? null;
  }

  public async listComponentCategories(): Promise<ComponentCategory[]> {
    return this.database
      .select()
      .from(componentCategories)
      .orderBy(asc(componentCategories.name));
  }

  public async findComponentCategoryBySlug(
    slug: string,
  ): Promise<ComponentCategory | null> {
    const [category] = await this.database
      .select()
      .from(componentCategories)
      .where(eq(componentCategories.slug, slug))
      .limit(1);
    return category ?? null;
  }
}
