import type { BicycleType, ComponentCategory } from '@goweskit/contracts';
import { describe, expect, it } from 'vitest';

import { STARTER_ANATOMY_CONTENT } from '../learn/catalog-content.js';
import type { CatalogRepository } from '../repositories/catalog-repository.js';
import { CatalogService } from './catalog-service.js';

const bicycleTypes: BicycleType[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    slug: 'mtb_hardtail',
    name: 'MTB Hardtail',
    summary: 'A mountain bike with front suspension.',
    typicalUse: 'Trails and mixed surfaces.',
    beginnerNotes: 'Confirm standards before upgrading.',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    slug: 'road',
    name: 'Road Bike',
    summary: 'A bike for paved roads.',
    typicalUse: 'Paved rides.',
    beginnerNotes: 'Start with fit.',
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    slug: 'folding',
    name: 'Folding Bike',
    summary: 'A compact bicycle that folds for storage.',
    typicalUse: 'Urban trips and mixed transport.',
    beginnerNotes: 'Confirm compact-wheel and folding-specific standards.',
  },
];

const hotspotSlugs = [
  ...new Set(
    Object.values(STARTER_ANATOMY_CONTENT).flatMap(({ hotspots }) =>
      hotspots.map(({ componentSlug }) => componentSlug),
    ),
  ),
];

const categories: ComponentCategory[] = hotspotSlugs.map((slug, index) => ({
  id: `20000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  slug,
  name: slug
    .split('_')
    .map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`)
    .join(' '),
  description: `Beginner description for ${slug}.`,
}));

class MemoryCatalogRepository implements CatalogRepository {
  public constructor(
    private readonly storedTypes: BicycleType[] = bicycleTypes,
    private readonly storedCategories: ComponentCategory[] = categories,
  ) {}

  public listBicycleTypes(): Promise<BicycleType[]> {
    return Promise.resolve(this.storedTypes);
  }

  public findBicycleTypeBySlug(slug: string): Promise<BicycleType | null> {
    return Promise.resolve(
      this.storedTypes.find((type) => type.slug === slug) ?? null,
    );
  }

  public listComponentCategories(): Promise<ComponentCategory[]> {
    return Promise.resolve(this.storedCategories);
  }

  public findComponentCategoryBySlug(
    slug: string,
  ): Promise<ComponentCategory | null> {
    return Promise.resolve(
      this.storedCategories.find((category) => category.slug === slug) ?? null,
    );
  }
}

describe('CatalogService learning content', () => {
  it('combines hardtail hotspots with component records from the catalog', async () => {
    const service = new CatalogService(new MemoryCatalogRepository());

    const anatomy = await service.getBicycleTypeAnatomy('mtb_hardtail');

    expect(anatomy?.hotspots).toHaveLength(
      STARTER_ANATOMY_CONTENT.mtb_hardtail.hotspots.length,
    );
    expect(anatomy?.hotspots.every(({ component }) => component.id)).toBe(true);
    expect(
      anatomy?.hotspots.every(
        ({ beginnerLabel, beginnerSummary }) =>
          beginnerLabel.length > 0 && beginnerSummary.length > 0,
      ),
    ).toBe(true);
  });

  it('returns an explicit empty state for a bike without starter anatomy', async () => {
    const service = new CatalogService(new MemoryCatalogRepository());

    await expect(service.getBicycleTypeAnatomy('road')).resolves.toBeNull();
  });

  it('adds actionable beginner and unknown guidance to component detail', async () => {
    const service = new CatalogService(new MemoryCatalogRepository());

    const detail = await service.getComponentCategory('fork');

    expect(detail.identificationSteps.length).toBeGreaterThan(0);
    expect(detail.upgradeChecks).toContain(
      'Confirm steerer/headset fit and manufacturer-approved travel range.',
    );
    expect(detail.unknownGuidance).toContain('unknown');
  });

  it('fails safely when configured anatomy references missing catalog data', async () => {
    const service = new CatalogService(
      new MemoryCatalogRepository(bicycleTypes, []),
    );

    await expect(
      service.getBicycleTypeAnatomy('mtb_hardtail'),
    ).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      message: 'Anatomy content is temporarily unavailable.',
    });
  });

  it('publishes curated beginner and technical glossary definitions', () => {
    const service = new CatalogService(new MemoryCatalogRepository());

    const terms = service.listGlossary();

    expect(terms.length).toBeGreaterThanOrEqual(10);
    expect(terms.find(({ slug }) => slug === 'unknown-spec')).toMatchObject({
      term: 'Unknown specification',
      relatedComponentSlugs: [],
    });
    expect(
      terms.every(({ plainDefinition }) => plainDefinition.length > 0),
    ).toBe(true);
  });

  it('searches glossary, component, and bicycle content deterministically', async () => {
    const service = new CatalogService(new MemoryCatalogRepository());

    const first = await service.search('folding');
    const second = await service.search('folding');

    expect(second).toEqual(first);
    expect(first.results.map(({ kind }) => kind)).toEqual([
      'bicycle_type',
      'glossary',
      'component',
    ]);
    expect(first.results.map(({ slug }) => slug)).toEqual([
      'folding',
      'folding-hinge',
      'folding_hinge',
    ]);
  });

  it('ranks exact curated terms before descriptive matches', async () => {
    const service = new CatalogService(new MemoryCatalogRepository());

    const response = await service.search('boost');

    expect(response.results[0]).toMatchObject({
      kind: 'glossary',
      slug: 'boost',
    });
  });
});
