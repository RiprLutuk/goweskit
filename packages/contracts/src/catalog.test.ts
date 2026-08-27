import { describe, expect, it } from 'vitest';

import {
  bicycleAnatomyResponseSchema,
  componentDetailSchema,
  glossaryListResponseSchema,
  LEARN_SEARCH_MAX_RESULTS,
  learnSearchQuerySchema,
  learnSearchResponseSchema,
} from './catalog.js';

const component = {
  id: '10000000-0000-4000-8000-000000000001',
  slug: 'fork',
  name: 'Fork',
  description: 'Holds the front wheel and steers the bike.',
};

describe('Learn catalog contracts', () => {
  it('accepts accessible anatomy content with bounded hotspot positions', () => {
    const response = bicycleAnatomyResponseSchema.parse({
      anatomy: {
        bicycleType: {
          id: '10000000-0000-4000-8000-000000000002',
          slug: 'mtb_hardtail',
          name: 'MTB Hardtail',
          summary: 'A mountain bike.',
          typicalUse: 'Trails.',
          beginnerNotes: 'Confirm standards before upgrading.',
        },
        overview: 'Tap a numbered point or use the component list.',
        hotspots: [
          {
            component,
            xPercent: 24,
            yPercent: 50,
            beginnerLabel: 'Front support and steering',
            beginnerSummary: 'The fork holds and guides the front wheel.',
          },
        ],
      },
    });

    expect(response.anatomy?.hotspots[0]?.component.slug).toBe('fork');
    expect(
      bicycleAnatomyResponseSchema.safeParse({
        anatomy: {
          ...response.anatomy,
          hotspots: [
            {
              ...response.anatomy?.hotspots[0],
              xPercent: 101,
            },
          ],
        },
      }).success,
    ).toBe(false);
  });

  it('requires actionable identification and upgrade guidance', () => {
    const detail = componentDetailSchema.parse({
      ...component,
      beginnerSummary: 'Start by checking the markings on the fork.',
      identificationSteps: ['Look for a label near the fork crown.'],
      upgradeChecks: ['Confirm steerer and axle standards.'],
      unknownGuidance: 'Leave it unknown until you can confirm the markings.',
    });

    expect(detail.identificationSteps).toHaveLength(1);
    expect(
      componentDetailSchema.safeParse({
        ...detail,
        identificationSteps: [],
      }).success,
    ).toBe(false);
  });

  it('supports an explicit empty anatomy response for later bike types', () => {
    expect(bicycleAnatomyResponseSchema.parse({ anatomy: null })).toStrictEqual(
      { anatomy: null },
    );
  });

  it('bounds and trims deterministic Learn search queries', () => {
    expect(learnSearchQuerySchema.parse({ q: '  boost  ' })).toEqual({
      q: 'boost',
    });
    expect(learnSearchQuerySchema.safeParse({ q: 'a' }).success).toBe(false);
    expect(
      learnSearchQuerySchema.safeParse({ q: 'x'.repeat(61) }).success,
    ).toBe(false);
    expect(
      learnSearchQuerySchema.safeParse({ q: 'boost', center: 'private' })
        .success,
    ).toBe(false);
  });

  it('models curated glossary definitions and bounded search results', () => {
    const term = {
      slug: 'boost',
      term: 'Boost',
      plainDefinition: 'A wider MTB hub and axle layout.',
      technicalDefinition:
        'Boost commonly refers to 15 × 110 mm front and 12 × 148 mm rear spacing.',
      aliases: ['boost spacing'],
      relatedComponentSlugs: ['hub', 'wheel'],
    };
    expect(glossaryListResponseSchema.parse({ terms: [term] }).terms).toEqual([
      term,
    ]);
    expect(
      learnSearchResponseSchema.parse({
        query: 'boost',
        results: [
          {
            kind: 'glossary',
            slug: term.slug,
            title: term.term,
            summary: term.plainDefinition,
          },
        ],
      }).results,
    ).toHaveLength(1);
    expect(
      learnSearchResponseSchema.safeParse({
        query: 'boost',
        results: Array.from(
          { length: LEARN_SEARCH_MAX_RESULTS + 1 },
          (_, index) => ({
            kind: 'glossary',
            slug: `term-${String(index)}`,
            title: `Term ${String(index)}`,
            summary: 'A curated definition.',
          }),
        ),
      }).success,
    ).toBe(false);
  });
});
