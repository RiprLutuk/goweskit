import { apiErrorResponseSchema, type User } from '@goweskit/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp, type AppServices } from '../app.js';
import { AppError } from '../errors.js';

const user: User = {
  id: '10000000-0000-4000-8000-000000000010',
  displayName: 'Demo Rider',
  email: 'rider@example.com',
  createdAt: '2026-08-01T00:00:00.000Z',
};
const communityId = '10000000-0000-4000-8000-000000000020';
const openApps: ReturnType<typeof buildApp>[] = [];

function buildCommunityApp() {
  const community = {
    findNearbyCommunities: (input: { radiusKm: number }) =>
      Promise.resolve({ radiusKm: input.radiusKm, communities: [] }),
    getCommunityDetail: () =>
      Promise.resolve({
        community: {
          id: communityId,
          slug: 'demo-community',
          name: 'Demo Community',
          description: 'Demo.',
          locality: 'Bandung',
          bicycleTypes: ['folding'],
          visibility: 'public',
          joinMode: 'open',
          verificationStatus: 'community_verified',
          memberCount: 4,
        },
        viewerMembership: null,
      }),
    joinCommunity: () =>
      Promise.resolve({ outcome: 'joined', membership: null }),
    listCommunityEvents: () => Promise.resolve({ events: [] }),
    findNearbyEvents: (input: { radiusKm: number }) =>
      Promise.resolve({ radiusKm: input.radiusKm, events: [] }),
    getEventDetail: () =>
      Promise.reject(
        new AppError('RIDE_EVENT_NOT_FOUND', 'Ride event not found.', 404),
      ),
    joinEvent: () =>
      Promise.resolve({ outcome: 'event_unavailable', participation: null }),
    getModerationQueue: () =>
      Promise.reject(
        new AppError(
          'COMMUNITY_FORBIDDEN',
          'Community owner or admin access is required.',
          403,
        ),
      ),
    moderateMembership: () =>
      Promise.reject(
        new AppError(
          'COMMUNITY_FORBIDDEN',
          'Community owner or admin access is required.',
          403,
        ),
      ),
    getMyReputation: () =>
      Promise.resolve({
        userId: user.id,
        score: 0,
        level: 'new_contributor',
        hostedEvents: 0,
        completedEvents: 0,
        moderationDecisions: 0,
      }),
  } as unknown as AppServices['community'];
  const app = buildApp({
    logger: false,
    services: {
      auth: {
        authenticate: () => Promise.resolve(user),
      } as unknown as AppServices['auth'],
      catalog: {} as AppServices['catalog'],
      compatibility: {} as AppServices['compatibility'],
      community,
      explore: {} as AppServices['explore'],
      garage: {} as AppServices['garage'],
      installedComponents: {} as AppServices['installedComponents'],
      maintenance: {} as AppServices['maintenance'],
    },
  });
  openApps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(openApps.splice(0).map(async (app) => app.close()));
});

describe('Community routes', () => {
  it('keeps exact nearby coordinates in a validated POST body and out of the response', async () => {
    const response = await buildCommunityApp().inject({
      method: 'POST',
      url: '/api/v1/communities/nearby',
      payload: {
        center: { longitude: 107.6191, latitude: -6.9175 },
        radiusKm: 15,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ radiusKm: 15, communities: [] });
    expect(response.json()).not.toHaveProperty('center');
  });

  it('returns stable validation errors for oversized nearby requests', async () => {
    const response = await buildCommunityApp().inject({
      method: 'POST',
      url: '/api/v1/events/nearby',
      payload: {
        center: { longitude: 107.6191, latitude: -6.9175 },
        radiusKm: 51,
      },
    });
    const body = apiErrorResponseSchema.parse(response.json());

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe('INVALID_REQUEST');
  });

  it('enforces role checks on the moderation queue', async () => {
    const response = await buildCommunityApp().inject({
      method: 'GET',
      url: `/api/v1/communities/${communityId}/moderation/requests`,
    });
    const body = apiErrorResponseSchema.parse(response.json());

    expect(response.statusCode).toBe(403);
    expect(body.error.code).toBe('COMMUNITY_FORBIDDEN');
  });
});
