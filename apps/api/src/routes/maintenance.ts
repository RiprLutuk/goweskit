import {
  createMaintenanceEventRequestSchema,
  type MaintenanceEventListResponse,
  type MaintenanceEventResponse,
} from '@goweskit/contracts';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { SESSION_COOKIE_NAME } from '../auth/session.js';
import { parseInput } from '../http/validation.js';
import type { AuthService } from '../services/auth-service.js';
import type { MaintenanceService } from '../services/maintenance-service.js';

const bikeParamsSchema = z.object({ bikeId: z.uuid() });

async function authenticate(request: FastifyRequest, authService: AuthService) {
  return authService.authenticate(request.cookies[SESSION_COOKIE_NAME]);
}

export function registerMaintenanceRoutes(
  app: FastifyInstance,
  authService: AuthService,
  maintenanceService: MaintenanceService,
): void {
  app.get<{ Reply: MaintenanceEventListResponse }>(
    '/api/v1/bikes/:bikeId/maintenance',
    async (request) => {
      const { bikeId } = parseInput(bikeParamsSchema, request.params);
      return {
        events: await maintenanceService.listEvents(
          await authenticate(request, authService),
          bikeId,
        ),
      };
    },
  );

  app.post<{ Reply: MaintenanceEventResponse }>(
    '/api/v1/bikes/:bikeId/maintenance',
    async (request, reply) => {
      const { bikeId } = parseInput(bikeParamsSchema, request.params);
      const input = parseInput(
        createMaintenanceEventRequestSchema,
        request.body,
      );
      const event = await maintenanceService.createEvent(
        await authenticate(request, authService),
        bikeId,
        input,
      );
      return reply.status(201).send({ event });
    },
  );
}
