import {
  createCommunityEventRequestSchema,
  joinCommunityRequestSchema,
  joinEventRequestSchema,
  moderateCommunityMembershipRequestSchema,
  nearbyCommunitiesRequestSchema,
  nearbyEventsRequestSchema,
  type CommunityDetailResponse,
  type CommunityEventsResponse,
  type CommunityModerationQueueResponse,
  type ContributorReputationResponse,
  type CreateCommunityEventResponse,
  type EventDetailResponse,
  type JoinCommunityResponse,
  type JoinEventResponse,
  type ModerateCommunityMembershipResponse,
  type NearbyCommunitiesResponse,
  type NearbyEventsResponse,
  type User,
} from '@goweskit/contracts';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { SESSION_COOKIE_NAME } from '../auth/session.js';
import { parseInput } from '../http/validation.js';
import type { AuthService } from '../services/auth-service.js';
import type { CommunityService } from '../services/community-service.js';

const communityParamsSchema = z.object({
  communityId: z.string().trim().min(1).max(80),
});
const eventParamsSchema = z.object({ eventId: z.uuid() });
const moderationParamsSchema = z.object({
  communityId: z.string().trim().min(1).max(80),
  membershipId: z.uuid(),
});

async function authenticate(request: FastifyRequest, authService: AuthService) {
  return authService.authenticate(request.cookies[SESSION_COOKIE_NAME]);
}

async function optionalViewer(
  request: FastifyRequest,
  authService: AuthService,
): Promise<User | null> {
  const token = request.cookies[SESSION_COOKIE_NAME];
  if (token === undefined || token.length === 0) return null;
  try {
    return await authService.authenticate(token);
  } catch {
    return null;
  }
}

export function registerCommunityRoutes(
  app: FastifyInstance,
  authService: AuthService,
  service: CommunityService,
): void {
  app.post<{ Reply: NearbyCommunitiesResponse }>(
    '/api/v1/communities/nearby',
    async (request) =>
      service.findNearbyCommunities(
        parseInput(nearbyCommunitiesRequestSchema, request.body),
      ),
  );

  app.get<{ Reply: CommunityDetailResponse }>(
    '/api/v1/communities/:communityId',
    async (request) => {
      const { communityId } = parseInput(communityParamsSchema, request.params);
      return service.getCommunityDetail(
        communityId,
        await optionalViewer(request, authService),
      );
    },
  );

  app.post<{ Reply: JoinCommunityResponse }>(
    '/api/v1/communities/:communityId/join',
    async (request) => {
      const { communityId } = parseInput(communityParamsSchema, request.params);
      parseInput(joinCommunityRequestSchema, request.body ?? {});
      return service.joinCommunity(
        communityId,
        await authenticate(request, authService),
      );
    },
  );

  app.get<{ Reply: CommunityEventsResponse }>(
    '/api/v1/communities/:communityId/events',
    async (request) => {
      const { communityId } = parseInput(communityParamsSchema, request.params);
      return service.listCommunityEvents(
        communityId,
        await optionalViewer(request, authService),
      );
    },
  );

  app.post<{ Reply: CreateCommunityEventResponse }>(
    '/api/v1/communities/:communityId/events',
    async (request, reply) => {
      const { communityId } = parseInput(communityParamsSchema, request.params);
      const input = parseInput(createCommunityEventRequestSchema, request.body);
      const user = await authenticate(request, authService);
      const response = await service.createEvent(communityId, user, input);
      reply.status(201);
      return response;
    },
  );

  app.post<{ Reply: NearbyEventsResponse }>(
    '/api/v1/events/nearby',
    async (request) =>
      service.findNearbyEvents(
        parseInput(nearbyEventsRequestSchema, request.body),
      ),
  );

  app.get<{ Reply: EventDetailResponse }>(
    '/api/v1/events/:eventId',
    async (request) => {
      const { eventId } = parseInput(eventParamsSchema, request.params);
      return service.getEventDetail(
        eventId,
        await optionalViewer(request, authService),
      );
    },
  );

  app.post<{ Reply: JoinEventResponse }>(
    '/api/v1/events/:eventId/join',
    async (request) => {
      const { eventId } = parseInput(eventParamsSchema, request.params);
      parseInput(joinEventRequestSchema, request.body ?? {});
      return service.joinEvent(
        eventId,
        await authenticate(request, authService),
      );
    },
  );

  app.get<{ Reply: CommunityModerationQueueResponse }>(
    '/api/v1/communities/:communityId/moderation/requests',
    async (request) => {
      const { communityId } = parseInput(communityParamsSchema, request.params);
      return service.getModerationQueue(
        communityId,
        await authenticate(request, authService),
      );
    },
  );

  app.post<{ Reply: ModerateCommunityMembershipResponse }>(
    '/api/v1/communities/:communityId/moderation/requests/:membershipId',
    async (request) => {
      const { communityId, membershipId } = parseInput(
        moderationParamsSchema,
        request.params,
      );
      return service.moderateMembership(
        communityId,
        membershipId,
        await authenticate(request, authService),
        parseInput(moderateCommunityMembershipRequestSchema, request.body),
      );
    },
  );

  app.get<{ Reply: ContributorReputationResponse }>(
    '/api/v1/community/reputation/me',
    async (request) => ({
      reputation: await service.getMyReputation(
        await authenticate(request, authService),
      ),
    }),
  );
}
