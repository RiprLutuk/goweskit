import type {
  NearbyExploreRequest,
  NearbyPlace,
  NearbyRoute,
} from '@goweskit/contracts';
import { describe, expect, it } from 'vitest';

import type { ExploreRepository } from '../repositories/explore-repository.js';
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

  public findNearbyPlaces(input: NearbyExploreRequest): Promise<NearbyPlace[]> {
    this.inputs.push(input);
    return Promise.resolve([place]);
  }

  public findNearbyRoutes(input: NearbyExploreRequest): Promise<NearbyRoute[]> {
    this.inputs.push(input);
    return Promise.resolve([route]);
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
});
