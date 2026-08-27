import type { NearbyPlace, NearbyRoute } from '@goweskit/contracts';
import { apiErrorResponseSchema } from '@goweskit/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp, type AppServices } from '../app.js';
import type { ExploreRepository } from '../repositories/explore-repository.js';
import { ExploreService } from '../services/explore-service.js';

class EmptyExploreRepository implements ExploreRepository {
  public findNearbyPlaces(): Promise<NearbyPlace[]> {
    return Promise.resolve([]);
  }

  public findNearbyRoutes(): Promise<NearbyRoute[]> {
    return Promise.resolve([]);
  }
}

const openApps: ReturnType<typeof buildApp>[] = [];

function buildExploreApp(): ReturnType<typeof buildApp> {
  const app = buildApp({
    logger: false,
    services: {
      auth: {} as AppServices['auth'],
      catalog: {} as AppServices['catalog'],
      compatibility: {} as AppServices['compatibility'],
      explore: new ExploreService(new EmptyExploreRepository()),
      garage: {} as AppServices['garage'],
    },
  });
  openApps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(openApps.splice(0).map(async (app) => app.close()));
});

describe('POST /api/v1/explore/nearby', () => {
  it('returns a bounded nearby response for a valid private body', async () => {
    const response = await buildExploreApp().inject({
      method: 'POST',
      url: '/api/v1/explore/nearby',
      payload: {
        center: { longitude: 107.6191, latitude: -6.9175 },
        radiusKm: 15,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      center: { longitude: 107.6191, latitude: -6.9175 },
      radiusKm: 15,
      places: [],
      routes: [],
    });
  });

  it('returns the stable INVALID_REQUEST envelope for oversized radii', async () => {
    const response = await buildExploreApp().inject({
      method: 'POST',
      url: '/api/v1/explore/nearby',
      payload: {
        center: { longitude: 107.6191, latitude: -6.9175 },
        radiusKm: 51,
      },
    });
    const body = apiErrorResponseSchema.parse(response.json());

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe('INVALID_REQUEST');
    expect(body.requestId).toEqual(expect.any(String));
  });
});
