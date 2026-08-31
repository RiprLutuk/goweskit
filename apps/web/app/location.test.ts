import { describe, expect, it } from 'vitest';

import { reverseGeocodeCity } from './composables/useUserLocation.js';

describe('useUserLocation', () => {
  it('has a robust reverse geocoder fallback', async () => {
    // When offline or mocked coordinates, returns a valid string name
    const city = await reverseGeocodeCity(-6.9175, 107.6191);
    expect(typeof city).toBe('string');
    expect(city.length).toBeGreaterThan(0);
  });
});
