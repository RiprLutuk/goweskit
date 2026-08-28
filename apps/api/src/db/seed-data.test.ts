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
  DEMO_COMMUNITY_MEMBERSHIP_SEEDS,
  DEMO_COMMUNITY_MODERATION_AUDIT_SEEDS,
  DEMO_COMMUNITY_SEEDS,
  DEMO_COMMUNITY_USERS,
  DEMO_EVENT_PARTICIPATION_SEEDS,
  DEMO_INSTALLED_COMPONENT_SEEDS,
  DEMO_MAINTENANCE_EVENT_SEEDS,
  DEMO_PLACE_SEEDS,
  DEMO_ROUTE_SEEDS,
  DEMO_RIDE_EVENT_SEEDS,
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

describe('demo Community seed', () => {
  it('provides diverse communities and events without invalid coordinates', () => {
    expect(DEMO_COMMUNITY_SEEDS).toHaveLength(4);
    expect(DEMO_RIDE_EVENT_SEEDS).toHaveLength(6);
    expect(new Set(DEMO_COMMUNITY_SEEDS.map(({ id }) => id)).size).toBe(4);
    expect(new Set(DEMO_RIDE_EVENT_SEEDS.map(({ id }) => id)).size).toBe(6);

    for (const item of [...DEMO_COMMUNITY_SEEDS, ...DEMO_RIDE_EVENT_SEEDS]) {
      expect(item.coordinate.longitude).toBeGreaterThanOrEqual(-180);
      expect(item.coordinate.longitude).toBeLessThanOrEqual(180);
      expect(item.coordinate.latitude).toBeGreaterThanOrEqual(-90);
      expect(item.coordinate.latitude).toBeLessThanOrEqual(90);
      expect('name' in item ? item.name : item.title).toContain('Demo');
    }

    expect(
      DEMO_COMMUNITY_SEEDS.some(({ visibility }) => visibility === 'private'),
    ).toBe(true);
    expect(
      DEMO_COMMUNITY_SEEDS.some(({ joinMode }) => joinMode === 'request'),
    ).toBe(true);
    expect(
      DEMO_RIDE_EVENT_SEEDS.some(
        ({ visibility }) => visibility === 'members_only',
      ),
    ).toBe(true);
  });

  it('keeps memberships, participation, and moderation references coherent', () => {
    const communityIds = new Set(DEMO_COMMUNITY_SEEDS.map(({ id }) => id));
    const eventIds = new Set(DEMO_RIDE_EVENT_SEEDS.map(({ id }) => id));
    const membershipIds = new Set(
      DEMO_COMMUNITY_MEMBERSHIP_SEEDS.map(({ id }) => id),
    );
    const userKeys = new Set([
      'demo',
      ...DEMO_COMMUNITY_USERS.map(({ key }) => key),
    ]);

    for (const membership of DEMO_COMMUNITY_MEMBERSHIP_SEEDS) {
      expect(communityIds.has(membership.communityId)).toBe(true);
      expect(userKeys.has(membership.userKey)).toBe(true);
    }
    for (const participation of DEMO_EVENT_PARTICIPATION_SEEDS) {
      expect(eventIds.has(participation.eventId)).toBe(true);
      expect(userKeys.has(participation.userKey)).toBe(true);
    }
    for (const audit of DEMO_COMMUNITY_MODERATION_AUDIT_SEEDS) {
      expect(communityIds.has(audit.communityId)).toBe(true);
      expect(membershipIds.has(audit.membershipId)).toBe(true);
      expect(userKeys.has(audit.reviewerKey)).toBe(true);
    }

    expect(
      DEMO_COMMUNITY_MEMBERSHIP_SEEDS.some(
        ({ status }) => status === 'requested',
      ),
    ).toBe(true);
  });
});

describe('demo Garage seed', () => {
  it('provides one bike per seeded bicycle type and every normalized spec', () => {
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

  it('provides valid maintenance history without distance reminders', () => {
    expect(DEMO_MAINTENANCE_EVENT_SEEDS).toHaveLength(4);
    const bikeIds = new Set(DEMO_BIKE_SEEDS.map(({ id }) => id));

    for (const event of DEMO_MAINTENANCE_EVENT_SEEDS) {
      expect(bikeIds.has(event.bikeId)).toBe(true);
      expect(event.performedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(
        event.nextDueDate === null || event.nextDueDate >= event.performedAt,
      ).toBe(true);
      expect(event).not.toHaveProperty('distance');
    }
  });

  it('provides realistic installed components with only normalized standards', () => {
    expect(DEMO_INSTALLED_COMPONENT_SEEDS).toHaveLength(6);
    const bikeIds = new Set(DEMO_BIKE_SEEDS.map(({ id }) => id));
    const categorySlugs = new Set(
      COMPONENT_CATEGORY_SEEDS.map(({ slug }) => slug),
    );

    for (const component of DEMO_INSTALLED_COMPONENT_SEEDS) {
      expect(bikeIds.has(component.bikeId)).toBe(true);
      expect(categorySlugs.has(component.categorySlug)).toBe(true);
      for (const standard of component.standards) {
        if (standard.knowledge === 'known') {
          expect(
            isAllowedStandardValue(standard.standardCode, standard.value),
          ).toBe(true);
        } else {
          expect(standard).not.toHaveProperty('value');
        }
      }
    }
  });
});

describe('demo Explore seed', () => {
  it('provides diverse places and routes with valid longitude/latitude order', () => {
    expect(DEMO_PLACE_SEEDS).toHaveLength(8);
    expect(DEMO_ROUTE_SEEDS).toHaveLength(4);

    for (const place of DEMO_PLACE_SEEDS) {
      expect(place.coordinate.longitude).toBeGreaterThanOrEqual(-180);
      expect(place.coordinate.longitude).toBeLessThanOrEqual(180);
      expect(place.coordinate.latitude).toBeGreaterThanOrEqual(-90);
      expect(place.coordinate.latitude).toBeLessThanOrEqual(90);
      expect(place.name).toContain('Demo');
    }

    for (const route of DEMO_ROUTE_SEEDS) {
      expect(route.coordinates.length).toBeGreaterThanOrEqual(2);
      expect(route.name).toContain('Demo');
      for (const [longitude, latitude] of route.coordinates) {
        expect(longitude).toBeGreaterThanOrEqual(-180);
        expect(longitude).toBeLessThanOrEqual(180);
        expect(latitude).toBeGreaterThanOrEqual(-90);
        expect(latitude).toBeLessThanOrEqual(90);
      }
    }
  });

  it('contains fresh, aging, stale, verified, and unverified examples', () => {
    const dates = [...DEMO_PLACE_SEEDS, ...DEMO_ROUTE_SEEDS].map(
      ({ lastConfirmedAt }) => new Date(lastConfirmedAt),
    );
    const verificationStatuses = new Set(
      [...DEMO_PLACE_SEEDS, ...DEMO_ROUTE_SEEDS].map(
        ({ verificationStatus }) => verificationStatus,
      ),
    );

    expect(Math.max(...dates.map((date) => date.getTime()))).toBeGreaterThan(
      new Date('2026-08-01T00:00:00.000Z').getTime(),
    );
    expect(Math.min(...dates.map((date) => date.getTime()))).toBeLessThan(
      new Date('2026-01-01T00:00:00.000Z').getTime(),
    );
    expect(verificationStatuses).toEqual(
      new Set(['staff_verified', 'community_verified', 'unverified']),
    );
  });
});
