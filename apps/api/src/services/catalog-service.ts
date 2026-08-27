import type {
  BicycleAnatomy,
  BicycleType,
  ComponentCategory,
  ComponentDetail,
  GlossaryTerm,
  LearnSearchResponse,
} from '@goweskit/contracts';

import { AppError } from '../errors.js';
import {
  getAnatomyContent,
  getComponentGuide,
} from '../learn/catalog-content.js';
import {
  CURATED_GLOSSARY,
  searchLearnCatalog,
} from '../learn/glossary-content.js';
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

  public listGlossary(): GlossaryTerm[] {
    return [...CURATED_GLOSSARY];
  }

  public async search(query: string): Promise<LearnSearchResponse> {
    const [bicycleTypes, componentCategories] = await Promise.all([
      this.repository.listBicycleTypes(),
      this.repository.listComponentCategories(),
    ]);
    return searchLearnCatalog(query, bicycleTypes, componentCategories);
  }

  public async getComponentCategory(slug: string): Promise<ComponentDetail> {
    const category = await this.repository.findComponentCategoryBySlug(slug);
    if (category === null) {
      throw new AppError(
        'COMPONENT_CATEGORY_NOT_FOUND',
        'Component category not found.',
        404,
      );
    }
    return { ...category, ...getComponentGuide(category) };
  }

  public async getBicycleTypeAnatomy(
    slug: string,
  ): Promise<BicycleAnatomy | null> {
    const bicycleType = await this.getBicycleType(slug);
    const content = getAnatomyContent(bicycleType);
    if (content === null) return null;

    const categories = await this.repository.listComponentCategories();
    const categoriesBySlug = new Map(
      categories.map((category) => [category.slug, category]),
    );
    const hotspots = content.hotspots.flatMap((hotspot) => {
      const component = categoriesBySlug.get(hotspot.componentSlug);
      if (component === undefined) return [];
      return [
        {
          component,
          xPercent: hotspot.xPercent,
          yPercent: hotspot.yPercent,
          beginnerLabel: hotspot.beginnerLabel,
          beginnerSummary: hotspot.beginnerSummary,
        },
      ];
    });
    if (hotspots.length !== content.hotspots.length) {
      throw new AppError(
        'INTERNAL_ERROR',
        'Anatomy content is temporarily unavailable.',
        500,
      );
    }

    return {
      bicycleType,
      overview: content.overview,
      hotspots,
    };
  }
}
