import {
  nearbyExploreRequestSchema,
  type NearbyExploreResponse,
} from '@goweskit/contracts';
import type { FastifyInstance } from 'fastify';

import { parseInput } from '../http/validation.js';
import type { ExploreService } from '../services/explore-service.js';

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
}
