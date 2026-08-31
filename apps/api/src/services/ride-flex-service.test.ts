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
      cyclistPersona: 'balanced',
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
      cyclistPersona: 'balanced',
    });

    expect(res.effortRating).toBe('recovery');
    expect(res.title).toContain('Recovery');
    expect(res.foodEquivalency).toContain('Pisang');
  });

  it('enhances captions using Gemini API when configured and available', async () => {
    const mockFetch: typeof fetch = () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        title: '🚀 Sentul Beast Climb 2026',
                        highlight:
                          'Menembus batas kecepatan di tanjakan terjal!',
                        captions: {
                          athlete:
                            'Solid 45k ride with unstoppable cadence. #UltraGowes',
                          humor:
                            'Gowes tipis cari nasi uduk, dapet bonus betis kram. #GowesSeru',
                          technical:
                            'Shimano Ultegra Di2 shifting without lag.',
                        },
                      }),
                    },
                  ],
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      );

    const aiService = new RideFlexService({
      geminiApiKey: 'test-gemini-key',
      fetchFn: mockFetch,
    });

    const res = await aiService.generateStory({
      distanceKm: 45,
      elevationGainMeters: 550,
      durationMinutes: 100,
      bikeName: 'Trek Emonda',
      cyclistPersona: 'balanced',
    });

    expect(res.title).toBe('🚀 Sentul Beast Climb 2026');
    expect(res.captions.athlete).toContain('#UltraGowes');
    expect(res.captions.humor).toContain('nasi uduk');
    expect(res.captions.technical).toContain('Shimano Ultegra Di2');
    expect(res.estimatedCaloriesKcal).toBeGreaterThan(600);
  });

  it('supports multimodal photo vision and telemetry coaching', async () => {
    const mockFetch: typeof fetch = (_input, init) => {
      const rawBody = typeof init?.body === 'string' ? init.body : '{}';
      const body = JSON.parse(rawBody) as {
        contents: {
          parts: {
            inline_data?: { mime_type: string; data: string };
          }[];
        }[];
      };
      expect(body.contents[0]?.parts[0]?.inline_data).toBeDefined();
      expect(body.contents[0]?.parts[0]?.inline_data?.mime_type).toBe(
        'image/jpeg',
      );

      return Promise.resolve(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        title: '🌲 Gravel Adventure Kopi Tubing',
                        highlight: 'Jalur offroad sejuk ditemani kabut pagi.',
                        captions: {
                          athlete: '180W average power with strong endurance.',
                          humor: 'Sepeda kotor, senyum lebar!',
                          technical: 'Gravel 40c tires at 32 psi.',
                          gravel:
                            'Kabut tipis di kebun teh Sentul sangat epik.',
                        },
                        photoVisualInsight:
                          'Pemandangan kebun teh berkabut dengan rute tanah berbatu.',
                        recommendedTheme: 'gravel',
                        trainingInsight:
                          'Zona 3 Aerobic dominan, hidrasi 750ml cukup.',
                        mechanicTip: 'Cuci sisa lumpur pada disc brake rotor.',
                      }),
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
    };

    const aiService = new RideFlexService({
      geminiApiKey: 'test-gemini-key',
      fetchFn: mockFetch,
    });

    const res = await aiService.generateStory({
      distanceKm: 32,
      elevationGainMeters: 450,
      durationMinutes: 90,
      bikeName: 'Polygon Bend R5',
      cyclistPersona: 'gravel',
      heartRateBpm: 154,
      cadenceRpm: 84,
      powerWatts: 180,
      photoBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD',
      photoMimeType: 'image/jpeg',
    });

    expect(res.title).toBe('🌲 Gravel Adventure Kopi Tubing');
    expect(res.photoVisualInsight).toContain('kebun teh');
    expect(res.recommendedTheme).toBe('gravel');
    expect(res.trainingInsight).toContain('Aerobic');
    expect(res.captions.gravel).toContain('Kabut tipis');
  });
});
