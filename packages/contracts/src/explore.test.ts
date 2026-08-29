import { describe, expect, it } from 'vitest';

import {
  EXPLORE_MAX_RADIUS_KM,
  nearbyExploreRequestSchema,
  nearbyExploreResponseSchema,
  routeElevationResponseSchema,
} from './explore.js';

describe('Explore contracts', () => {
  it('validates an ordered and bounded route elevation profile', () => {
    const routeId = '30000000-0000-4000-8000-000000000001';
    expect(
      routeElevationResponseSchema.parse({
        routeId,
        elevationProfile: [
          { distanceMeters: 0, elevationMeters: 768 },
          { distanceMeters: 1500, elevationMeters: 820 },
          { distanceMeters: 3500, elevationMeters: 910 },
        ],
        maxGradientPercent: 4.5,
        averageGradientPercent: 4.1,
      }).routeId,
    ).toBe(routeId);
    expect(
      routeElevationResponseSchema.safeParse({
        routeId,
        elevationProfile: [
          { distanceMeters: 100, elevationMeters: 768 },
          { distanceMeters: 50, elevationMeters: 820 },
        ],
        maxGradientPercent: 4.5,
        averageGradientPercent: 4.1,
      }).success,
    ).toBe(false);
  });

  it('allows mathematically valid gradients above one hundred percent', () => {
    expect(
      routeElevationResponseSchema.safeParse({
        routeId: '30000000-0000-4000-8000-000000000001',
        elevationProfile: [
          { distanceMeters: 0, elevationMeters: 0 },
          { distanceMeters: 1, elevationMeters: 100 },
        ],
        maxGradientPercent: 10_000,
        averageGradientPercent: 10_000,
      }).success,
    ).toBe(true);
  });

  it('accepts explicit longitude/latitude coordinates and filters', () => {
    expect(
      nearbyExploreRequestSchema.safeParse({
        center: { longitude: 107.6191, latitude: -6.9175 },
        radiusKm: 15,
        placeTypes: ['workshop', 'coffee'],
        routeTypes: ['road', 'gravel'],
        bikeType: 'gravel',
        beginnerFriendly: true,
      }).success,
    ).toBe(true);
  });

  it('rejects invalid coordinates and oversized radii', () => {
    expect(
      nearbyExploreRequestSchema.safeParse({
        center: { longitude: 181, latitude: -91 },
        radiusKm: EXPLORE_MAX_RADIUS_KM + 1,
      }).success,
    ).toBe(false);
  });

  it('requires at least two coordinates for a route line', () => {
    expect(
      nearbyExploreResponseSchema.safeParse({
        center: { longitude: 107.6191, latitude: -6.9175 },
        radiusKm: 10,
        places: [],
        routes: [
          {
            id: '10000000-0000-4000-8000-000000000101',
            kind: 'route',
            routeType: 'road',
            name: 'Invalid route',
            description: 'Only one coordinate.',
            geometry: {
              type: 'LineString',
              coordinates: [[107.6191, -6.9175]],
            },
            distanceMeters: 1000,
            elevationGainMeters: 20,
            difficulty: 'easy',
            surface: 'paved',
            bicycleTypes: ['road'],
            beginnerFriendly: true,
            verificationStatus: 'staff_verified',
            freshness: 'fresh',
            lastConfirmedAt: '2026-08-27T00:00:00.000Z',
            distanceFromUserMeters: 0,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects out-of-range longitude/latitude route positions', () => {
    expect(
      nearbyExploreResponseSchema.safeParse({
        center: { longitude: 107.6191, latitude: -6.9175 },
        radiusKm: 10,
        places: [],
        routes: [
          {
            id: '10000000-0000-4000-8000-000000000101',
            kind: 'route',
            routeType: 'road',
            name: 'Invalid route',
            description: 'Out-of-range position.',
            geometry: {
              type: 'LineString',
              coordinates: [
                [181, -6.9175],
                [107.62, -91],
              ],
            },
            distanceMeters: 1000,
            elevationGainMeters: 20,
            difficulty: 'easy',
            surface: 'paved',
            bicycleTypes: ['road'],
            beginnerFriendly: true,
            verificationStatus: 'staff_verified',
            freshness: 'fresh',
            lastConfirmedAt: '2026-08-27T00:00:00.000Z',
            distanceFromUserMeters: 0,
          },
        ],
      }).success,
    ).toBe(false);
  });
});
