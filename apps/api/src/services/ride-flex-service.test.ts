import { describe, expect, it } from 'vitest';
import { RideFlexService } from './ride-flex-service.js';

describe('RideFlexService', () => {
  const service = new RideFlexService();

  it('generates an epic story for long climbing rides', () => {
    const res = service.generateStory({
      distanceKm: 85,
      elevationGainMeters: 1100,
      durationMinutes: 240,
      bikeName: 'Canyon Ultimate CF SLX',
      routeName: 'Km 0 Sentul to Rainbow Hills',
      weatherTempC: 28,
    });

    expect(res.effortRating).toBe('epic');
    expect(res.averageSpeedKmh).toBe(21.3);
    expect(res.estimatedCaloriesKcal).toBeGreaterThan(1000);
    expect(res.captions.athlete).toContain('Canyon Ultimate');
    expect(res.captions.humor).toContain('sarapan');
    expect(res.mechanicTip).toContain('cassette');
    expect(res.suggestedHashtags).toContain('#CanyonUltimateCFSLX');
  });

  it('generates recovery ride story for light short rides', () => {
    const res = service.generateStory({
      distanceKm: 8,
      elevationGainMeters: 20,
      durationMinutes: 45,
      bikeName: 'Brompton M6R',
    });

    expect(res.effortRating).toBe('recovery');
    expect(res.title).toContain('Recovery');
    expect(res.foodEquivalency).toContain('Pisang');
  });
});
