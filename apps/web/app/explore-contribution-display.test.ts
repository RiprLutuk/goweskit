import { describe, expect, it } from 'vitest';

import {
  contributionCoordinateForItem,
  contributionLabel,
} from './explore-contribution-display.js';

describe('Explore contribution display', () => {
  it('uses the selected public place marker as the hazard starting point', () => {
    expect(
      contributionCoordinateForItem({
        id: '019c9c80-2896-7593-bd02-509894b90101',
        kind: 'place',
        type: 'workshop',
        name: 'Workshop',
        description: 'Public marker.',
        address: 'Bandung',
        bicycleTypes: ['mtb_hardtail'],
        beginnerFriendly: true,
        verificationStatus: 'staff_verified',
        freshness: 'fresh',
        lastConfirmedAt: '2026-08-28T00:00:00.000Z',
        coordinate: { longitude: 107.6191, latitude: -6.9175 },
        distanceMeters: 100,
      }),
    ).toEqual({ longitude: 107.6191, latitude: -6.9175 });
  });

  it('uses the route geometry rather than a rider location', () => {
    const coordinate = contributionCoordinateForItem({
      id: '019c9c80-2896-7593-bd02-509894b90102',
      kind: 'route',
      routeType: 'gravel',
      name: 'Route',
      description: 'Public line.',
      bicycleTypes: ['gravel'],
      beginnerFriendly: true,
      verificationStatus: 'community_verified',
      freshness: 'fresh',
      lastConfirmedAt: '2026-08-28T00:00:00.000Z',
      geometry: {
        type: 'LineString',
        coordinates: [
          [107.61, -6.91],
          [107.62, -6.92],
        ],
      },
      distanceMeters: 1_000,
      elevationGainMeters: 50,
      difficulty: 'easy',
      surface: 'mixed',
      distanceFromUserMeters: 200,
    });
    expect(coordinate).toEqual({ longitude: 107.61, latitude: -6.91 });
    expect(coordinate).not.toHaveProperty('userLocation');
    expect(contributionLabel('trail_obstruction')).toBe('trail obstruction');
  });
});
