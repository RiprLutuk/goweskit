import { describe, expect, it } from 'vitest';
import {
  GenerateRideStoryRequestSchema,
  GenerateRideStoryResponseSchema,
} from './ride-flex.js';

describe('Ride Flex Contracts', () => {
  it('validates a valid ride flex story request', () => {
    const valid = GenerateRideStoryRequestSchema.parse({
      distanceKm: 42.5,
      elevationGainMeters: 520,
      durationMinutes: 110,
      bikeName: 'Polygon Helios A8',
      routeName: 'Dago Pakar Loop',
      weatherTempC: 24,
    });

    expect(valid.distanceKm).toBe(42.5);
    expect(valid.cyclistPersona).toBe('balanced');
  });

  it('rejects negative distance and elevation', () => {
    expect(() =>
      GenerateRideStoryRequestSchema.parse({
        distanceKm: -5,
        elevationGainMeters: -100,
        durationMinutes: 60,
      }),
    ).toThrow();
  });

  it('validates a complete AI ride story response', () => {
    const res = GenerateRideStoryResponseSchema.parse({
      title: 'Dago Pakar Morning Assault 🏔️⚡',
      highlight: 'Top climb endurance dengan +520m gain.',
      effortRating: 'epic',
      estimatedCaloriesKcal: 850,
      foodEquivalency: '2 porsi Nasi Uduk Komplit',
      averageSpeedKmh: 23.2,
      climbGradeScore: 'Cat 3 Climb',
      captions: {
        athlete: 'Solid 42.5km tempo ride.',
        humor: 'Niatnya gowes santai, pulangnya paha menjerit.',
        technical: 'Cadence stabil di 85 rpm.',
      },
      mechanicTip: 'Cek rantai dan bersihkan cassette setelah tanjakan.',
      suggestedHashtags: ['#GowesKit', '#DagoPakar', '#MorningRide'],
      generatedAt: '2026-08-30T09:00:00.000Z',
    });

    expect(res.effortRating).toBe('epic');
    expect(res.estimatedCaloriesKcal).toBe(850);
  });
});
