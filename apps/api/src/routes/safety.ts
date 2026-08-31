import {
  createTrustedContactRequestSchema,
  resolveSafetyShareRequestSchema,
  safetyLocationUpdateRequestSchema,
  startSafetySessionRequestSchema,
  type CreateSafetySessionResponse,
  type SafetyLocation,
  type SafetyMutationSuccess,
  type SafetySessionListResponse,
  type SafetySessionResponse,
  type SafetyShareResponse,
  type TrustedContactListResponse,
  type TrustedContactResponse,
} from '@goweskit/contracts/safety';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { SESSION_COOKIE_NAME } from '../auth/session.js';
import { parseInput } from '../http/validation.js';
import type { SafetyService } from '../safety/service.js';
import type { AuthService } from '../services/auth-service.js';

const contactParamsSchema = z.object({ contactId: z.uuid() }).strict();
const sessionParamsSchema = z.object({ sessionId: z.uuid() }).strict();

async function authenticate(request: FastifyRequest, authService: AuthService) {
  return authService.authenticate(request.cookies[SESSION_COOKIE_NAME]);
}

export function registerSafetyRoutes(
  app: FastifyInstance,
  authService: AuthService,
  safetyService: SafetyService,
): void {
  app.get<{ Reply: TrustedContactListResponse }>(
    '/api/v1/trusted-contacts',
    async (request) => {
      const user = await authenticate(request, authService);
      return { contacts: await safetyService.listTrustedContacts(user.id) };
    },
  );

  app.post<{ Reply: TrustedContactResponse }>(
    '/api/v1/trusted-contacts',
    async (request, reply) => {
      const input = parseInput(createTrustedContactRequestSchema, request.body);
      const user = await authenticate(request, authService);
      const contact = await safetyService.createTrustedContact(user.id, input);
      return reply.status(201).send({ contact });
    },
  );

  app.delete<{ Reply: SafetyMutationSuccess }>(
    '/api/v1/trusted-contacts/:contactId',
    async (request) => {
      const { contactId } = parseInput(contactParamsSchema, request.params);
      const user = await authenticate(request, authService);
      await safetyService.deleteTrustedContact(user.id, contactId);
      return { success: true };
    },
  );

  app.get<{ Reply: SafetySessionListResponse }>(
    '/api/v1/safety/sessions',
    async (request) => {
      const user = await authenticate(request, authService);
      return { sessions: await safetyService.listSessions(user.id) };
    },
  );

  app.post<{ Reply: CreateSafetySessionResponse }>(
    '/api/v1/safety/sessions',
    async (request, reply) => {
      const input = parseInput(startSafetySessionRequestSchema, request.body);
      const user = await authenticate(request, authService);
      return reply
        .status(201)
        .send(await safetyService.startSession(user, input));
    },
  );

  app.put<{ Reply: SafetySessionResponse }>(
    '/api/v1/safety/sessions/:sessionId/location',
    async (request) => {
      const { sessionId } = parseInput(sessionParamsSchema, request.params);
      const input = parseInput(safetyLocationUpdateRequestSchema, request.body);
      const user = await authenticate(request, authService);
      return safetyService.updateLocation(user.id, sessionId, input);
    },
  );

  app.get<{ Reply: { locations: SafetyLocation[] } }>(
    '/api/v1/safety/sessions/:sessionId/locations',
    async (request) => {
      const { sessionId } = parseInput(sessionParamsSchema, request.params);
      const user = await authenticate(request, authService);
      return safetyService.listSessionLocations(user.id, sessionId);
    },
  );

  app.post<{ Reply: SafetySessionResponse }>(
    '/api/v1/safety/sessions/:sessionId/sos',
    async (request) => {
      const { sessionId } = parseInput(sessionParamsSchema, request.params);
      const user = await authenticate(request, authService);
      return safetyService.triggerSos(user.id, sessionId);
    },
  );

  app.post<{ Reply: SafetySessionResponse }>(
    '/api/v1/safety/sessions/:sessionId/end',
    async (request) => {
      const { sessionId } = parseInput(sessionParamsSchema, request.params);
      const user = await authenticate(request, authService);
      return safetyService.endSession(user.id, sessionId);
    },
  );

  app.post<{ Reply: SafetySessionResponse }>(
    '/api/v1/safety/sessions/:sessionId/revoke',
    async (request) => {
      const { sessionId } = parseInput(sessionParamsSchema, request.params);
      const user = await authenticate(request, authService);
      return safetyService.revokeSession(user.id, sessionId);
    },
  );

  // The raw share token is sent in the body so request URLs and access logs do
  // not capture it. The browser-facing share URL may keep it client-side.
  app.post<{ Reply: SafetyShareResponse }>(
    '/api/v1/safety/share',
    async (request) => {
      const { token } = parseInput(
        resolveSafetyShareRequestSchema,
        request.body,
      );
      return safetyService.getPublicShare(token, request.ip);
    },
  );
}
