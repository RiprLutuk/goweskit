import { describe, expect, it } from 'vitest';
import { RideFlexService } from './ride-flex-service.js';

describe('RideFlexService', () => {
  const service = new RideFlexService();

  it('generates an epic story for long climbing rides deterministically', async () => {
    const res = await service.generateStory({
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

  it('generates recovery ride story for light short rides', async () => {
    const res = await service.generateStory({
      distanceKm: 8,
      elevationGainMeters: 20,
      durationMinutes: 45,
      bikeName: 'Brompton M6R',
    });

    expect(res.effortRating).toBe('recovery');
    expect(res.title).toContain('Recovery');
    expect(res.foodEquivalency).toContain('Pisang');
  });

  it('enhances captions using Gemini API when configured and available', async () => {
    const mockFetch = (async () => ({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    title: '🚀 Sentul Beast Climb 2026',
                    highlight: 'Menembus batas kecepatan di tanjakan terjal!',
                    captions: {
                      athlete: 'Solid 45k ride with unstoppable cadence. #UltraGowes',
                      humor: 'Gowes tipis cari nasi uduk, dapet bonus betis kram. #GowesSeru',
                      technical: 'Shimano Ultegra Di2 shifting without lag.',
                    },
                  }),
                },
              ],
            },
          },
        ],
      }),
    })) as unknown as typeof fetch;

    const aiService = new RideFlexService({
      geminiApiKey: 'test-gemini-key',
      fetchFn: mockFetch,
    });

    const res = await aiService.generateStory({
      distanceKm: 45,
      elevationGainMeters: 550,
      durationMinutes: 100,
      bikeName: 'Trek Emonda',
    });

    expect(res.title).toBe('🚀 Sentul Beast Climb 2026');
    expect(res.captions.athlete).toContain('#UltraGowes');
    expect(res.captions.humor).toContain('nasi uduk');
    expect(res.captions.technical).toContain('Shimano Ultegra Di2');
    expect(res.estimatedCaloriesKcal).toBeGreaterThan(600);
  });
});
