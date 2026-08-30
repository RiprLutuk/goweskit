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
    createEvent: (
      _communityId: string,
      _user: User,
      input: { title: string },
    ) =>
      Promise.resolve({
        event: {
          id: '10000000-0000-4000-8000-000000000030',
          communityId,
          title: input.title,
          description: 'Santai rolling ke arah atas.',
          status: 'scheduled',
          participantCount: 1,
          startsAt: '2026-09-05T06:30:00.000Z',
          meetingArea: 'Taman Cikapayang Dago',
          difficulty: 'moderate',
          bicycleTypes: ['road', 'gravel'],
          visibility: 'public',
          capacity: 20,
          requirements: 'Helm wajib.',
          createdAt: '2026-08-28T21:40:00.000Z',
        },
      }),
    findNearbyEvents: (input: { radiusKm: number }) =>
      Promise.resolve({ radiusKm: input.radiusKm, events: [] }),
    getEventDetail: (eventId: string) =>
      Promise.resolve({
        event: {
          id: '10000000-0000-4000-8000-000000000030',
          slug: eventId,
          community: { id: communityId, slug: 'demo-community', name: 'Demo Community', verificationStatus: 'verified' },
          title: 'Demo Sunday Loop',
          description: 'Santai rolling.',
          status: 'scheduled',
          participantCount: 1,
          startsAt: '2026-09-05T06:30:00.000Z',
          meetingArea: 'Taman Cikapayang Dago',
          difficulty: 'moderate',
          bicycleTypes: ['road'],
          visibility: 'public',
          capacity: 20,
          requirements: 'Helm wajib.',
          createdAt: '2026-08-28T21:40:00.000Z',
        },
        viewerParticipation: null,
      }),
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
  it('accepts a community slug as the public route identifier', async () => {
    const response = await buildCommunityApp().inject({
      method: 'GET',
      url: '/api/v1/communities/demo-community',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      community: { id: communityId, slug: 'demo-community' },
    });
  });

  it('accepts an event slug as the public event route identifier', async () => {
    const response = await buildCommunityApp().inject({
      method: 'GET',
      url: '/api/v1/events/demo-sunday-beginner-loop',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      event: { slug: 'demo-sunday-beginner-loop' },
    });
  });

  it('creates a validated ride event for an authenticated member', async () => {
    const response = await buildCommunityApp().inject({
      method: 'POST',
      url: `/api/v1/communities/${communityId}/events`,
      payload: {
        title: 'Sabtu Pagi Dago Ride',
        description: 'Santai rolling ke arah atas.',
        startsAt: '2026-09-05T06:30:00.000Z',
        meetingArea: 'Taman Cikapayang Dago',
        meetingCoordinate: { longitude: 107.6134, latitude: -6.8992 },
        routeId: '30000000-0000-4000-8000-000000000001',
        difficulty: 'moderate',
        bicycleTypes: ['road', 'gravel'],
        visibility: 'public',
        capacity: 20,
        requirements: 'Helm wajib.',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      event: { communityId, participantCount: 1, status: 'scheduled' },
    });
  });

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
