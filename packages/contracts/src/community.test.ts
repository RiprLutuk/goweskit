import { describe, expect, it } from 'vitest';

import {
  COMMUNITY_NEARBY_MAX_RADIUS_KM,
  createCommunityEventRequestSchema,
  createCommunityEventResponseSchema,
  communityDetailResponseSchema,
  communityModerationQueueResponseSchema,
  contributorReputationResponseSchema,
  joinCommunityResponseSchema,
  nearbyCommunitiesRequestSchema,
  nearbyCommunitiesResponseSchema,
  nearbyEventsRequestSchema,
  publicCommunitySchema,
  publicEventSchema,
} from './community.js';

const community = {
  id: '10000000-0000-4000-8000-000000000001',
  slug: 'gowes-santai-bandung',
  name: 'Gowes Santai Bandung',
  description: 'Beginner-friendly weekend rides.',
  locality: 'Bandung Utara',
  bicycleTypes: ['folding', 'city'],
  visibility: 'public' as const,
  joinMode: 'open' as const,
  verificationStatus: 'community_verified' as const,
  memberCount: 42,
};

const event = {
  id: '20000000-0000-4000-8000-000000000001',
  community: {
    id: community.id,
    slug: community.slug,
    name: community.name,
    verificationStatus: community.verificationStatus,
  },
  title: 'Sunday beginner loop',
  description: 'A relaxed beginner loop with regular regroup points.',
  startsAt: '2026-09-06T00:00:00.000Z',
  meetingArea: 'Dago, Bandung',
  routeId: null,
  difficulty: 'easy' as const,
  bicycleTypes: ['folding', 'city'],
  capacity: 30,
  participantCount: 12,
  requirements: 'Helmet, water, and a roadworthy bicycle.',
  visibility: 'public' as const,
  status: 'scheduled' as const,
  createdAt: '2026-08-28T00:00:00.000Z',
};

describe('Community contracts', () => {
  it('models a bounded POST nearby request with explicit coordinates', () => {
    const parsed = nearbyCommunitiesRequestSchema.parse({
      center: { longitude: 107.6191, latitude: -6.9175 },
      bicycleTypes: ['folding'],
    });

    expect(parsed.radiusKm).toBe(10);
    expect(
      nearbyCommunitiesRequestSchema.safeParse({
        center: { longitude: 107.6191, latitude: -6.9175 },
        radiusKm: COMMUNITY_NEARBY_MAX_RADIUS_KM + 1,
      }).success,
    ).toBe(false);
    expect(
      nearbyCommunitiesRequestSchema.safeParse({
        center: { longitude: -6.9175, latitude: 107.6191 },
      }).success,
    ).toBe(false);
  });

  it('supports public and private visibility with open or requested joining', () => {
    expect(publicCommunitySchema.parse(community).visibility).toBe('public');
    expect(
      publicCommunitySchema.parse({
        ...community,
        visibility: 'private',
        joinMode: 'request',
      }),
    ).toMatchObject({ visibility: 'private', joinMode: 'request' });
  });

  it('keeps exact home coordinates and social payloads out of public fields', () => {
    expect(
      publicCommunitySchema.safeParse({
        ...community,
        homeLocation: { longitude: 107.6191, latitude: -6.9175 },
      }).success,
    ).toBe(false);
    expect(
      nearbyCommunitiesResponseSchema.parse({
        radiusKm: 10,
        communities: [{ ...community, distanceMeters: 1200 }],
      }),
    ).not.toHaveProperty('center');
    expect(
      communityDetailResponseSchema.safeParse({
        community,
        viewerMembership: null,
        members: [],
        feed: [],
        chat: [],
      }).success,
    ).toBe(false);
  });

  it('returns only the viewer membership and supports every join outcome', () => {
    const membership = {
      id: '30000000-0000-4000-8000-000000000001',
      role: 'member' as const,
      status: 'requested' as const,
      createdAt: '2026-08-27T00:00:00.000Z',
      updatedAt: '2026-08-27T00:00:00.000Z',
    };

    for (const outcome of [
      'joined',
      'requested',
      'already_joined',
      'already_requested',
      'request_denied',
    ] as const) {
      expect(
        joinCommunityResponseSchema.parse({ outcome, membership }).outcome,
      ).toBe(outcome);
    }
  });
});

describe('Community ride event contracts', () => {
  it('validates a bounded event creation payload and response', () => {
    const request = createCommunityEventRequestSchema.parse({
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
    });

    expect(request.bicycleTypes).toEqual(['road', 'gravel']);
    expect(
      createCommunityEventRequestSchema.safeParse({
        ...request,
        bicycleTypes: ['road', 'road'],
      }).success,
    ).toBe(false);
    expect(
      createCommunityEventResponseSchema.parse({
        event: {
          id: event.id,
          communityId: community.id,
          title: request.title,
          description: request.description,
          status: 'scheduled',
          participantCount: 1,
          startsAt: request.startsAt,
          meetingArea: request.meetingArea,
          difficulty: request.difficulty,
          bicycleTypes: request.bicycleTypes,
          visibility: request.visibility,
          capacity: request.capacity,
          requirements: request.requirements,
          createdAt: '2026-08-28T21:40:00.000Z',
        },
      }).event.participantCount,
    ).toBe(1);
  });

  it('bounds nearby event filters and validates their time window', () => {
    expect(
      nearbyEventsRequestSchema.parse({
        center: { longitude: 107.6191, latitude: -6.9175 },
        startsAfter: '2026-09-01T00:00:00.000Z',
        startsBefore: '2026-10-01T00:00:00.000Z',
      }).radiusKm,
    ).toBe(10);
    expect(
      nearbyEventsRequestSchema.safeParse({
        center: { longitude: 107.6191, latitude: -6.9175 },
        startsAfter: '2026-10-01T00:00:00.000Z',
        startsBefore: '2026-09-01T00:00:00.000Z',
      }).success,
    ).toBe(false);
  });

  it('rejects invalid capacity counts', () => {
    expect(publicEventSchema.parse(event).participantCount).toBe(12);
    expect(
      publicEventSchema.safeParse({
        ...event,
        capacity: 10,
        participantCount: 11,
      }).success,
    ).toBe(false);
  });

  it('does not expose meeting coordinates or attendee/social collections', () => {
    expect(
      publicEventSchema.safeParse({
        ...event,
        meetingLocation: { longitude: 107.6191, latitude: -6.9175 },
      }).success,
    ).toBe(false);
    expect(
      publicEventSchema.safeParse({ ...event, attendees: [] }).success,
    ).toBe(false);
    expect(publicEventSchema.safeParse({ ...event, chat: [] }).success).toBe(
      false,
    );
  });
});

describe('Community moderation and reputation contracts', () => {
  it('keeps the moderation queue bounded and limited to requester identity', () => {
    expect(
      communityModerationQueueResponseSchema.parse({
        requests: [
          {
            membershipId: '30000000-0000-4000-8000-000000000001',
            communityId: community.id,
            requester: {
              id: '40000000-0000-4000-8000-000000000001',
              displayName: 'Ayu',
            },
            requestedAt: '2026-08-27T00:00:00.000Z',
          },
        ],
      }).requests,
    ).toHaveLength(1);
  });

  it('returns deterministic reputation inputs without social-feed metrics', () => {
    expect(
      contributorReputationResponseSchema.parse({
        reputation: {
          userId: '40000000-0000-4000-8000-000000000001',
          score: 19,
          level: 'contributor',
          hostedEvents: 4,
          completedEvents: 2,
          moderationDecisions: 1,
        },
      }).reputation,
    ).not.toHaveProperty('followers');
  });
});
