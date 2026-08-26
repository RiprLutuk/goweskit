import {
  bikeSpecCodeSchema,
  bikeSpecInputSchema,
  createBikeRequestSchema,
  updateBikeRequestSchema,
  type BikeListResponse,
  type BikeResponse,
  type BikeSpecListResponse,
  type BikeSpecResponse,
  type SuccessResponse,
} from '@goweskit/contracts';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { SESSION_COOKIE_NAME } from '../auth/session.js';
import { parseInput } from '../http/validation.js';
import type { AuthService } from '../services/auth-service.js';
import type { GarageService } from '../services/garage-service.js';

const bikeParamsSchema = z.object({ bikeId: z.uuid() });
const bikeSpecParamsSchema = z.object({
  bikeId: z.uuid(),
  standardCode: bikeSpecCodeSchema,
});

async function authenticate(request: FastifyRequest, authService: AuthService) {
  return authService.authenticate(request.cookies[SESSION_COOKIE_NAME]);
}

export function registerGarageRoutes(
  app: FastifyInstance,
  authService: AuthService,
  garageService: GarageService,
): void {
  app.get<{ Reply: BikeListResponse }>('/api/v1/bikes', async (request) => ({
    bikes: await garageService.listBikes(
      await authenticate(request, authService),
    ),
  }));

  app.post<{ Reply: BikeResponse }>('/api/v1/bikes', async (request, reply) => {
    const input = parseInput(createBikeRequestSchema, request.body);
    const bike = await garageService.createBike(
      await authenticate(request, authService),
      input,
    );
    return reply.status(201).send({ bike });
  });

  app.get<{ Reply: BikeResponse }>('/api/v1/bikes/:bikeId', async (request) => {
    const { bikeId } = parseInput(bikeParamsSchema, request.params);
    return {
      bike: await garageService.getBike(
        await authenticate(request, authService),
        bikeId,
      ),
    };
  });

  app.patch<{ Reply: BikeResponse }>(
    '/api/v1/bikes/:bikeId',
    async (request) => {
      const { bikeId } = parseInput(bikeParamsSchema, request.params);
      const input = parseInput(updateBikeRequestSchema, request.body);
      return {
        bike: await garageService.updateBike(
          await authenticate(request, authService),
          bikeId,
          input,
        ),
      };
    },
  );

  app.delete<{ Reply: SuccessResponse }>(
    '/api/v1/bikes/:bikeId',
    async (request) => {
      const { bikeId } = parseInput(bikeParamsSchema, request.params);
      await garageService.deleteBike(
        await authenticate(request, authService),
        bikeId,
      );
      return { success: true };
    },
  );

  app.get<{ Reply: BikeSpecListResponse }>(
    '/api/v1/bikes/:bikeId/specs',
    async (request) => {
      const { bikeId } = parseInput(bikeParamsSchema, request.params);
      const bike = await garageService.getBike(
        await authenticate(request, authService),
        bikeId,
      );
      return { specs: bike.specs };
    },
  );

  app.put<{ Reply: BikeSpecResponse }>(
    '/api/v1/bikes/:bikeId/specs/:standardCode',
    async (request) => {
      const { bikeId, standardCode } = parseInput(
        bikeSpecParamsSchema,
        request.params,
      );
      const input = parseInput(bikeSpecInputSchema, request.body);
      return {
        spec: await garageService.putSpec(
          await authenticate(request, authService),
          bikeId,
          standardCode,
          input,
        ),
      };
    },
  );
}
