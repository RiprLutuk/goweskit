import type { BicycleType, ComponentCategory } from '@goweskit/contracts';

import { AppError } from '../errors.js';
import type { CatalogRepository } from '../repositories/catalog-repository.js';

export class CatalogService {
  public constructor(private readonly repository: CatalogRepository) {}

  public listBicycleTypes(): Promise<BicycleType[]> {
    return this.repository.listBicycleTypes();
  }

  public async getBicycleType(slug: string): Promise<BicycleType> {
    const bicycleType = await this.repository.findBicycleTypeBySlug(slug);
    if (bicycleType === null) {
      throw new AppError(
        'BICYCLE_TYPE_NOT_FOUND',
        'Bicycle type not found.',
        404,
      );
    }
    return bicycleType;
  }

  public listComponentCategories(): Promise<ComponentCategory[]> {
    return this.repository.listComponentCategories();
  }

  public async getComponentCategory(slug: string): Promise<ComponentCategory> {
    const category = await this.repository.findComponentCategoryBySlug(slug);
    if (category === null) {
      throw new AppError(
        'COMPONENT_CATEGORY_NOT_FOUND',
        'Component category not found.',
        404,
      );
    }
    return category;
  }
}
