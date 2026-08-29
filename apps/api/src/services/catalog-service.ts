import type {
  BicycleAnatomy,
  BicycleType,
  ComponentCategory,
  ComponentDetail,
  CreateGlossaryTermRequest,
  GlossaryTerm,
  LearnSearchResponse,
  UpdateGlossaryTermRequest,
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
  private readonly glossaryStore: Map<string, GlossaryTerm> = new Map(
    CURATED_GLOSSARY.map((term) => [term.slug, term]),
  );

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
    return Array.from(this.glossaryStore.values());
  }

  public createGlossaryTerm(input: CreateGlossaryTermRequest): GlossaryTerm {
    if (this.glossaryStore.has(input.slug)) {
      throw new AppError(
        'GLOSSARY_TERM_EXISTS',
        `Istilah dengan slug "${input.slug}" sudah ada di kamus.`,
        409,
      );
    }
    const term: GlossaryTerm = {
      slug: input.slug,
      term: input.term,
      plainDefinition: input.plainDefinition,
      technicalDefinition: input.technicalDefinition,
      aliases: input.aliases || [],
      relatedComponentSlugs: input.relatedComponentSlugs || [],
    };
    this.glossaryStore.set(term.slug, term);
    return term;
  }

  public updateGlossaryTerm(
    slug: string,
    input: UpdateGlossaryTermRequest,
  ): GlossaryTerm {
    const existing = this.glossaryStore.get(slug);
    if (existing === undefined) {
      throw new AppError(
        'GLOSSARY_TERM_NOT_FOUND',
        `Istilah dengan slug "${slug}" tidak ditemukan.`,
        404,
      );
    }
    const updated: GlossaryTerm = {
      ...existing,
      term: input.term ?? existing.term,
      plainDefinition: input.plainDefinition ?? existing.plainDefinition,
      technicalDefinition:
        input.technicalDefinition ?? existing.technicalDefinition,
      aliases: input.aliases ?? existing.aliases,
      relatedComponentSlugs:
        input.relatedComponentSlugs ?? existing.relatedComponentSlugs,
    };
    this.glossaryStore.set(slug, updated);
    return updated;
  }

  public deleteGlossaryTerm(slug: string): boolean {
    if (!this.glossaryStore.has(slug)) {
      throw new AppError(
        'GLOSSARY_TERM_NOT_FOUND',
        `Istilah dengan slug "${slug}" tidak ditemukan.`,
        404,
      );
    }
    this.glossaryStore.delete(slug);
    return true;
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
