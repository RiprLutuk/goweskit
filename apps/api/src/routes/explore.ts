import {
  nearbyExploreRequestSchema,
  type NearbyExploreResponse,
  type RouteElevationResponse,
} from '@goweskit/contracts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { parseInput } from '../http/validation.js';
import type { ExploreService } from '../services/explore-service.js';

const routeParamsSchema = z.object({ routeId: z.uuid() }).strict();

export function registerExploreRoutes(
  app: FastifyInstance,
  exploreService: ExploreService,
): void {
  app.post<{ Reply: NearbyExploreResponse }>(
    '/api/v1/explore/nearby',
    async (request) => {
      const input = parseInput(nearbyExploreRequestSchema, request.body);
      return exploreService.findNearby(input);
    },
  );

  app.get<{ Reply: RouteElevationResponse }>(
    '/api/v1/explore/routes/:routeId/elevation',
    async (request) => {
      const { routeId } = parseInput(routeParamsSchema, request.params);
      return exploreService.getRouteElevation(routeId);
    },
  );
}
