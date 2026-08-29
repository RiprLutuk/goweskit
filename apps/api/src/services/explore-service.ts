import type {
  NearbyExploreRequest,
  NearbyExploreResponse,
  RouteElevationPoint,
  RouteElevationResponse,
} from '@goweskit/contracts';

import { AppError } from '../errors.js';
import type { ExploreRepository } from '../repositories/explore-repository.js';

function roundedTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function gradientPercent(
  start: RouteElevationPoint,
  end: RouteElevationPoint,
): number {
  return (
    ((end.elevationMeters - start.elevationMeters) /
      (end.distanceMeters - start.distanceMeters)) *
    100
  );
}

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

  public async getRouteElevation(
    routeId: string,
  ): Promise<RouteElevationResponse> {
    const stored = await this.repository.findRouteElevationProfile(routeId);
    if (stored === null) {
      throw new AppError('ROUTE_NOT_FOUND', 'Route not found.', 404);
    }
    if (stored.elevationProfile === null) {
      throw new AppError(
        'ROUTE_ELEVATION_NOT_AVAILABLE',
        'Elevation profile is not available for this route.',
        404,
      );
    }

    const profile = stored.elevationProfile;
    const first = profile[0];
    const last = profile.at(-1);
    if (first === undefined || last === undefined) {
      throw new Error('Validated elevation profile contains no points.');
    }
    const segmentGradients: number[] = [];
    let previous = first;
    for (const point of profile.slice(1)) {
      segmentGradients.push(gradientPercent(previous, point));
      previous = point;
    }
    return {
      routeId: stored.routeId,
      elevationProfile: profile,
      maxGradientPercent: roundedTenth(
        Math.max(...segmentGradients.map(Math.abs)),
      ),
      averageGradientPercent: roundedTenth(gradientPercent(first, last)),
    };
  }
}
