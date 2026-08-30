import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { RideFlexService } from '../services/ride-flex-service.js';

const openApps: ReturnType<typeof buildApp>[] = [];

function buildRideFlexApp() {
  const app = buildApp({
    logger: false,
    services: {
      auth: {} as any,
      catalog: {} as any,
      compatibility: {} as any,
      community: {} as any,
      explore: {} as any,
      garage: {} as any,
      installedComponents: {} as any,
      maintenance: {} as any,
      rideFlex: new RideFlexService(),
    },
  });
  openApps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(openApps.splice(0).map(async (app) => app.close()));
});

describe('Ride Flex routes', () => {
  it('generates an AI story and telemetry analysis from ride parameters', async () => {
    const response = await buildRideFlexApp().inject({
      method: 'POST',
      url: '/api/v1/ride-flex/generate-story',
      payload: {
        distanceKm: 52.4,
        elevationGainMeters: 620,
        durationMinutes: 135,
        bikeName: 'Specialized Tarmac SL7',
        routeName: 'Lembang Peak Challenge',
        weatherTempC: 22,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.effortRating).toBe('hard');
    expect(body.averageSpeedKmh).toBe(23.3);
    expect(body.title).toContain('Lembang Peak');
    expect(body.captions.athlete).toContain('Specialized Tarmac SL7');
    expect(body.captions.humor).toBeDefined();
    expect(body.captions.technical).toContain('Lembang Peak Challenge');
    expect(body.mechanicTip).toContain('cassette');
  });

  it('rejects invalid inputs with 400 bad request', async () => {
    const response = await buildRideFlexApp().inject({
      method: 'POST',
      url: '/api/v1/ride-flex/generate-story',
      payload: {
        distanceKm: -10,
        durationMinutes: 0,
      },
    });

    expect(response.statusCode).toBe(400);
  });
});
