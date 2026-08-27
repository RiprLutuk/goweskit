import { describe, expect, it } from 'vitest';

import {
  COMMUNITY_NEARBY_MAX_RADIUS_KM,
  communityDetailResponseSchema,
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
