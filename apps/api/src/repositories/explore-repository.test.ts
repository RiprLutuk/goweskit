import { describe, expect, it } from 'vitest';

import { validateRouteElevationProfile } from './explore-repository.js';

describe('explore repository elevation validation', () => {
  it('requires the terminal profile point to match the route distance', () => {
    const profile = [
      { distanceMeters: 0, elevationMeters: 768 },
      { distanceMeters: 7200, elevationMeters: 1078 },
    ];

    expect(validateRouteElevationProfile(profile, 7200)).toEqual(profile);
    expect(() => validateRouteElevationProfile(profile, 7500)).toThrow(
      'Elevation profile must end at the route distance.',
    );
  });
});
