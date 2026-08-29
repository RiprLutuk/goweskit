import {
  saveItemRequestSchema,
  type SaveItemResponse,
} from '@goweskit/contracts';
import type { FastifyInstance, FastifyRequest } from 'fastify';

import { SESSION_COOKIE_NAME } from '../auth/session.js';
import { parseInput } from '../http/validation.js';
import type { AuthService } from '../services/auth-service.js';
import type { SavedItemService } from '../services/saved-item-service.js';

async function authenticate(request: FastifyRequest, authService: AuthService) {
  return authService.authenticate(request.cookies[SESSION_COOKIE_NAME]);
}

export function registerSavedItemRoutes(
  app: FastifyInstance,
  authService: AuthService,
  service: SavedItemService,
): void {
  app.post<{ Reply: SaveItemResponse }>(
    '/api/v1/user/saved-items',
    async (request) =>
      service.save(
        await authenticate(request, authService),
        parseInput(saveItemRequestSchema, request.body),
      ),
  );
}
