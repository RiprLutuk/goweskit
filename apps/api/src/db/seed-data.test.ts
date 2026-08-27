import {
  BIKE_SPEC_CODES,
  evaluateCompatibility,
  isAllowedStandardValue,
  type CompatibilityBike,
} from '@goweskit/bike-domain';
import { describe, expect, it } from 'vitest';

import {
  BICYCLE_TYPE_SEEDS,
  COMPONENT_CATEGORY_SEEDS,
  DEMO_BIKE_SEEDS,
  STANDARD_DEFINITION_SEEDS,
} from './seed-data.js';

function compatibilityBike(
  seed: (typeof DEMO_BIKE_SEEDS)[number],
): CompatibilityBike {
  return {
    specs: Object.fromEntries(
      seed.specs.map((spec) => [
        spec.standardCode,
        spec.knowledge === 'known'
          ? { knowledge: 'known', value: spec.value }
          : { knowledge: 'unknown' },
      ]),
    ),
  };
}

describe('v0.1 seed catalog', () => {
  it('contains the four P0 bicycle types', () => {
    expect(BICYCLE_TYPE_SEEDS.map(({ slug }) => slug).sort()).toEqual([
      'folding',
      'gravel',
      'mtb_hardtail',
      'road',
    ]);
  });

  it('contains every component category without duplicate slugs', () => {
    const slugs = COMPONENT_CATEGORY_SEEDS.map(({ slug }) => slug);
    expect(slugs).toHaveLength(20);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('derives every standard definition from the domain vocabulary', () => {
    expect(STANDARD_DEFINITION_SEEDS.map(({ code }) => code).sort()).toEqual(
      [...BIKE_SPEC_CODES].sort(),
    );
    expect(
      STANDARD_DEFINITION_SEEDS.every(
        ({ sourceUrl, version }) =>
          sourceUrl.startsWith('https://') && version.length > 0,
      ),
    ).toBe(true);
  });
});

describe('demo Garage seed', () => {
  it('provides one bike per seeded bicycle type and all six specs', () => {
    const typeSlugs = DEMO_BIKE_SEEDS.map(
      ({ bicycleTypeSlug }) => bicycleTypeSlug,
    ).sort();
    expect(typeSlugs).toEqual(
      BICYCLE_TYPE_SEEDS.map(({ slug }) => slug).sort(),
    );

    for (const bike of DEMO_BIKE_SEEDS) {
      expect(bike.specs.map(({ standardCode }) => standardCode).sort()).toEqual(
        [...BIKE_SPEC_CODES].sort(),
      );
      for (const spec of bike.specs) {
        if (spec.knowledge === 'known') {
          expect(isAllowedStandardValue(spec.standardCode, spec.value)).toBe(
            true,
          );
        }
      }
    }
  });

  it('demonstrates all four deterministic compatibility statuses', () => {
    const hardtail = compatibilityBike(DEMO_BIKE_SEEDS[0]);
    const folding = compatibilityBike(DEMO_BIKE_SEEDS[1]);
    const road = compatibilityBike(DEMO_BIKE_SEEDS[2]);

    expect(
      evaluateCompatibility(hardtail, [
        { ruleCode: 'rear_axle', knowledge: 'known', value: '12x148' },
      ]).status,
    ).toBe('compatible');
    expect(
      evaluateCompatibility(hardtail, [
        { ruleCode: 'rear_axle', knowledge: 'known', value: '12x142' },
      ]).status,
    ).toBe('incompatible');
    expect(
      evaluateCompatibility(road, [
        { ruleCode: 'freehub_cassette', knowledge: 'known', value: 'xd' },
      ]).status,
    ).toBe('conditional');
    expect(
      evaluateCompatibility(folding, [
        { ruleCode: 'front_axle', knowledge: 'known', value: 'qr_100' },
      ]).status,
    ).toBe('unknown');
  });
});
