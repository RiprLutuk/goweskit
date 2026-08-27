import type {
  NearbyExploreRequest,
  NearbyExploreResponse,
} from '@goweskit/contracts';

import type { ExploreRepository } from '../repositories/explore-repository.js';

export class ExploreService {
  public constructor(private readonly repository: ExploreRepository) {}

  public async findNearby(
    input: NearbyExploreRequest,
  ): Promise<NearbyExploreResponse> {
    const [places, routes] = await Promise.all([
      this.repository.findNearbyPlaces(input),
      this.repository.findNearbyRoutes(input),
    ]);

    return {
      center: input.center,
      radiusKm: input.radiusKm,
      places,
      routes,
    };
  }
}
