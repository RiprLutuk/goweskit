import type {
  NearbyExploreRequest,
  NearbyPlace,
  NearbyRoute,
} from '@goweskit/contracts';
import { describe, expect, it } from 'vitest';

import type {
  ExploreRepository,
  StoredRouteElevationProfile,
} from '../repositories/explore-repository.js';
import { ExploreService } from './explore-service.js';

const place: NearbyPlace = {
  id: '10000000-0000-4000-8000-000000000101',
  kind: 'place',
  type: 'workshop',
  name: 'Workshop Demo',
  description: 'A test workshop.',
  address: 'Bandung',
  coordinate: { longitude: 107.6191, latitude: -6.9175 },
  distanceMeters: 120,
  bicycleTypes: ['mtb_hardtail'],
  beginnerFriendly: true,
  verificationStatus: 'staff_verified',
  freshness: 'fresh',
  lastConfirmedAt: '2026-08-27T00:00:00.000Z',
};

const route: NearbyRoute = {
  id: '10000000-0000-4000-8000-000000000201',
  kind: 'route',
  routeType: 'road',
  name: 'Route Demo',
  description: 'A test route.',
  geometry: {
    type: 'LineString',
    coordinates: [
      [107.6191, -6.9175],
      [107.62, -6.91],
    ],
  },
  distanceMeters: 2500,
  elevationGainMeters: 80,
  difficulty: 'easy',
  surface: 'paved',
  distanceFromUserMeters: 0,
  bicycleTypes: ['road'],
  beginnerFriendly: true,
  verificationStatus: 'community_verified',
  freshness: 'fresh',
  lastConfirmedAt: '2026-08-27T00:00:00.000Z',
};

class RecordingExploreRepository implements ExploreRepository {
  public inputs: NearbyExploreRequest[] = [];
  public elevation: StoredRouteElevationProfile | null = {
    routeId: route.id,
    elevationProfile: [
      { distanceMeters: 0, elevationMeters: 768 },
      { distanceMeters: 1500, elevationMeters: 820 },
      { distanceMeters: 3500, elevationMeters: 910 },
    ],
  };

  public findNearbyPlaces(input: NearbyExploreRequest): Promise<NearbyPlace[]> {
    this.inputs.push(input);
    return Promise.resolve([place]);
  }

  public findNearbyRoutes(input: NearbyExploreRequest): Promise<NearbyRoute[]> {
    this.inputs.push(input);
    return Promise.resolve([route]);
  }

  public findRouteElevationProfile(): Promise<StoredRouteElevationProfile | null> {
    return Promise.resolve(this.elevation);
  }
}

describe('ExploreService', () => {
  it('queries places and routes with the same bounded request', async () => {
    const repository = new RecordingExploreRepository();
    const service = new ExploreService(repository);
    const input: NearbyExploreRequest = {
      center: { longitude: 107.6191, latitude: -6.9175 },
      radiusKm: 10,
      placeTypes: ['workshop'],
      routeTypes: ['road'],
      beginnerFriendly: true,
    };

    const response = await service.findNearby(input);

    expect(repository.inputs).toEqual([input, input]);
    expect(response).toEqual({
      center: input.center,
      radiusKm: 10,
      places: [place],
      routes: [route],
    });
  });

  it('computes deterministic segment and average gradients', async () => {
    const repository = new RecordingExploreRepository();
    const response = await new ExploreService(repository).getRouteElevation(
      route.id,
    );

    expect(response).toEqual({
      routeId: route.id,
      elevationProfile: repository.elevation?.elevationProfile,
      maxGradientPercent: 4.5,
      averageGradientPercent: 4.1,
    });
  });

  it('distinguishes a missing route from an unavailable profile', async () => {
    const repository = new RecordingExploreRepository();
    repository.elevation = null;
    const service = new ExploreService(repository);
    await expect(service.getRouteElevation(route.id)).rejects.toMatchObject({
      code: 'ROUTE_NOT_FOUND',
      statusCode: 404,
    });

    repository.elevation = { routeId: route.id, elevationProfile: null };
    await expect(service.getRouteElevation(route.id)).rejects.toMatchObject({
      code: 'ROUTE_ELEVATION_NOT_AVAILABLE',
      statusCode: 404,
    });
  });
});
