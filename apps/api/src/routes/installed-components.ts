import {
  createInstalledComponentRequestSchema,
  updateInstalledComponentRequestSchema,
  type InstalledComponentListResponse,
  type InstalledComponentResponse,
  type SuccessResponse,
} from '@goweskit/contracts';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { SESSION_COOKIE_NAME } from '../auth/session.js';
import { parseInput } from '../http/validation.js';
import type { AuthService } from '../services/auth-service.js';
import type { InstalledComponentService } from '../services/installed-component-service.js';

const bikeParamsSchema = z.object({ bikeId: z.uuid() });
const componentParamsSchema = z.object({
  bikeId: z.uuid(),
  installId: z.uuid(),
});

async function authenticate(request: FastifyRequest, authService: AuthService) {
  return authService.authenticate(request.cookies[SESSION_COOKIE_NAME]);
}

export function registerInstalledComponentRoutes(
  app: FastifyInstance,
  authService: AuthService,
  service: InstalledComponentService,
): void {
  app.get<{ Reply: InstalledComponentListResponse }>(
    '/api/v1/bikes/:bikeId/components',
    async (request) => {
      const { bikeId } = parseInput(bikeParamsSchema, request.params);
      return {
        components: await service.list(
          await authenticate(request, authService),
          bikeId,
        ),
      };
    },
  );

  app.post<{ Reply: InstalledComponentResponse }>(
    '/api/v1/bikes/:bikeId/components',
    async (request, reply) => {
      const { bikeId } = parseInput(bikeParamsSchema, request.params);
      const input = parseInput(
        createInstalledComponentRequestSchema,
        request.body,
      );
      const component = await service.create(
        await authenticate(request, authService),
        bikeId,
        input,
      );
      return reply.status(201).send({ component });
    },
  );

  app.patch<{ Reply: InstalledComponentResponse }>(
    '/api/v1/bikes/:bikeId/components/:installId',
    async (request) => {
      const { bikeId, installId } = parseInput(
        componentParamsSchema,
        request.params,
      );
      const input = parseInput(
        updateInstalledComponentRequestSchema,
        request.body,
      );
      return {
        component: await service.update(
          await authenticate(request, authService),
          bikeId,
          installId,
          input,
        ),
      };
    },
  );

  app.delete<{ Reply: SuccessResponse }>(
    '/api/v1/bikes/:bikeId/components/:installId',
    async (request) => {
      const { bikeId, installId } = parseInput(
        componentParamsSchema,
        request.params,
      );
      await service.delete(
        await authenticate(request, authService),
        bikeId,
        installId,
      );
      return { success: true };
    },
  );
}
