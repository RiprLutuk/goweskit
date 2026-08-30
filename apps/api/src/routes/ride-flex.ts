import {
  GenerateRideStoryRequestSchema,
  type GenerateRideStoryResponse,
} from '@goweskit/contracts';
import type { FastifyInstance } from 'fastify';

import { parseInput } from '../http/validation.js';
import type { RideFlexService } from '../services/ride-flex-service.js';

export function registerRideFlexRoutes(
  app: FastifyInstance,
  service: RideFlexService,
): void {
  app.post<{ Reply: GenerateRideStoryResponse }>(
    '/api/v1/ride-flex/generate-story',
    async (request) => {
      const input = parseInput(GenerateRideStoryRequestSchema, request.body);
      return service.generateStory(input);
    },
  );
}
