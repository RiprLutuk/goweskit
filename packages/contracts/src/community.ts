import { z } from 'zod';

import {
  coordinateSchema,
  ROUTE_DIFFICULTIES,
  VERIFICATION_STATUSES,
} from './explore.js';

const communityVerificationStatusSchema = z.enum(VERIFICATION_STATUSES);
const eventDifficultySchema = z.enum(ROUTE_DIFFICULTIES);

export const COMMUNITY_NEARBY_MAX_RADIUS_KM = 50;
export const COMMUNITY_NEARBY_MAX_RESULTS = 100;

export const COMMUNITY_VISIBILITIES = ['public', 'private'] as const;
export const communityVisibilitySchema = z.enum(COMMUNITY_VISIBILITIES);
export type CommunityVisibility = z.infer<typeof communityVisibilitySchema>;

export const COMMUNITY_JOIN_MODES = ['open', 'request'] as const;
export const communityJoinModeSchema = z.enum(COMMUNITY_JOIN_MODES);
export type CommunityJoinMode = z.infer<typeof communityJoinModeSchema>;

export const COMMUNITY_ROLES = ['owner', 'admin', 'member'] as const;
export const communityRoleSchema = z.enum(COMMUNITY_ROLES);
export type CommunityRole = z.infer<typeof communityRoleSchema>;

export const COMMUNITY_MEMBERSHIP_STATUSES = [
  'requested',
  'active',
  'rejected',
  'left',
] as const;
export const communityMembershipStatusSchema = z.enum(
  COMMUNITY_MEMBERSHIP_STATUSES,
);
export type CommunityMembershipStatus = z.infer<
  typeof communityMembershipStatusSchema
>;

export const COMMUNITY_JOIN_OUTCOMES = [
  'joined',
  'requested',
  'already_joined',
  'already_requested',
  'request_denied',
] as const;
export const communityJoinOutcomeSchema = z.enum(COMMUNITY_JOIN_OUTCOMES);
export type CommunityJoinOutcome = z.infer<typeof communityJoinOutcomeSchema>;

const bicycleTypeSlugSchema = z.string().trim().min(1).max(80);

export const nearbyCommunitiesRequestSchema = z
  .object({
    center: coordinateSchema,
    radiusKm: z
      .number()
      .positive()
      .max(COMMUNITY_NEARBY_MAX_RADIUS_KM)
      .default(10),
    bicycleTypes: z.array(bicycleTypeSlugSchema).max(12).optional(),
    verificationStatus: communityVerificationStatusSchema.optional(),
  })
  .strict();

export type NearbyCommunitiesRequest = z.infer<
  typeof nearbyCommunitiesRequestSchema
>;

export const publicCommunitySchema = z
  .object({
    id: z.uuid(),
    slug: z.string().trim().min(1).max(80),
    name: z.string().trim().min(1).max(160),
    description: z.string().max(4000),
    locality: z.string().trim().min(1).max(160),
    bicycleTypes: z.array(bicycleTypeSlugSchema).max(12),
    visibility: communityVisibilitySchema,
    joinMode: communityJoinModeSchema,
    verificationStatus: communityVerificationStatusSchema,
    memberCount: z.number().int().nonnegative(),
  })
  .strict();

export type PublicCommunity = z.infer<typeof publicCommunitySchema>;

export const nearbyCommunitySchema = publicCommunitySchema
  .extend({
    distanceMeters: z.number().int().nonnegative(),
  })
  .strict();

export type NearbyCommunity = z.infer<typeof nearbyCommunitySchema>;

export const nearbyCommunitiesResponseSchema = z
  .object({
    radiusKm: z.number().positive().max(COMMUNITY_NEARBY_MAX_RADIUS_KM),
    communities: z
      .array(nearbyCommunitySchema)
      .max(COMMUNITY_NEARBY_MAX_RESULTS),
  })
  .strict();

export type NearbyCommunitiesResponse = z.infer<
  typeof nearbyCommunitiesResponseSchema
>;

export const viewerCommunityMembershipSchema = z
  .object({
    id: z.uuid(),
    role: communityRoleSchema,
    status: communityMembershipStatusSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();

export type ViewerCommunityMembership = z.infer<
  typeof viewerCommunityMembershipSchema
>;

export const communityDetailResponseSchema = z
  .object({
    community: publicCommunitySchema,
    viewerMembership: viewerCommunityMembershipSchema.nullable(),
  })
  .strict();

export type CommunityDetailResponse = z.infer<
  typeof communityDetailResponseSchema
>;

export const joinCommunityRequestSchema = z.object({}).strict();

export const joinCommunityResponseSchema = z
  .object({
    outcome: communityJoinOutcomeSchema,
    membership: viewerCommunityMembershipSchema.nullable(),
  })
  .strict();

export type JoinCommunityResponse = z.infer<typeof joinCommunityResponseSchema>;

export const EVENT_VISIBILITIES = ['public', 'members_only'] as const;
export const eventVisibilitySchema = z.enum(EVENT_VISIBILITIES);
export type EventVisibility = z.infer<typeof eventVisibilitySchema>;

export const EVENT_STATUSES = ['scheduled', 'cancelled', 'completed'] as const;
export const eventStatusSchema = z.enum(EVENT_STATUSES);
export type EventStatus = z.infer<typeof eventStatusSchema>;

export const EVENT_PARTICIPATION_STATUSES = ['joined', 'cancelled'] as const;
export const eventParticipationStatusSchema = z.enum(
  EVENT_PARTICIPATION_STATUSES,
);
export type EventParticipationStatus = z.infer<
  typeof eventParticipationStatusSchema
>;

export const EVENT_JOIN_OUTCOMES = [
  'joined',
  'already_joined',
  'event_full',
  'event_unavailable',
  'event_started',
  'membership_required',
] as const;
export const eventJoinOutcomeSchema = z.enum(EVENT_JOIN_OUTCOMES);
export type EventJoinOutcome = z.infer<typeof eventJoinOutcomeSchema>;

export const nearbyEventsRequestSchema = z
  .object({
    center: coordinateSchema,
    radiusKm: z
      .number()
      .positive()
      .max(COMMUNITY_NEARBY_MAX_RADIUS_KM)
      .default(10),
    bicycleTypes: z.array(bicycleTypeSlugSchema).max(12).optional(),
    difficulty: eventDifficultySchema.optional(),
    startsAfter: z.iso.datetime().optional(),
    startsBefore: z.iso.datetime().optional(),
  })
  .strict()
  .refine(
    ({ startsAfter, startsBefore }) =>
      startsAfter === undefined ||
      startsBefore === undefined ||
      Date.parse(startsAfter) < Date.parse(startsBefore),
    {
      message: 'startsAfter must be earlier than startsBefore.',
      path: ['startsBefore'],
    },
  );

export type NearbyEventsRequest = z.infer<typeof nearbyEventsRequestSchema>;

export const publicEventSchema = z
  .object({
    id: z.uuid(),
    community: publicCommunitySchema.pick({
      id: true,
      slug: true,
      name: true,
      verificationStatus: true,
    }),
    title: z.string().trim().min(1).max(180),
    startsAt: z.iso.datetime(),
    meetingArea: z.string().trim().min(1).max(200),
    routeId: z.uuid().nullable(),
    difficulty: eventDifficultySchema,
    bicycleTypes: z.array(bicycleTypeSlugSchema).min(1).max(12),
    capacity: z.number().int().positive().max(10_000).nullable(),
    participantCount: z.number().int().nonnegative(),
    requirements: z.string().max(4000),
    visibility: eventVisibilitySchema,
    status: eventStatusSchema,
  })
  .strict()
  .refine(
    ({ capacity, participantCount }) =>
      capacity === null || participantCount <= capacity,
    {
      message: 'participantCount cannot exceed capacity.',
      path: ['participantCount'],
    },
  );

export type PublicEvent = z.infer<typeof publicEventSchema>;

export const nearbyEventSchema = publicEventSchema
  .safeExtend({
    distanceMeters: z.number().int().nonnegative(),
  })
  .strict();

export type NearbyEvent = z.infer<typeof nearbyEventSchema>;

export const nearbyEventsResponseSchema = z
  .object({
    radiusKm: z.number().positive().max(COMMUNITY_NEARBY_MAX_RADIUS_KM),
    events: z.array(nearbyEventSchema).max(COMMUNITY_NEARBY_MAX_RESULTS),
  })
  .strict();

export type NearbyEventsResponse = z.infer<typeof nearbyEventsResponseSchema>;

export const viewerEventParticipationSchema = z
  .object({
    id: z.uuid(),
    status: eventParticipationStatusSchema,
    joinedAt: z.iso.datetime(),
  })
  .strict();

export type ViewerEventParticipation = z.infer<
  typeof viewerEventParticipationSchema
>;

export const eventDetailResponseSchema = z
  .object({
    event: publicEventSchema,
    viewerParticipation: viewerEventParticipationSchema.nullable(),
  })
  .strict();

export type EventDetailResponse = z.infer<typeof eventDetailResponseSchema>;

export const joinEventRequestSchema = z.object({}).strict();

export const joinEventResponseSchema = z
  .object({
    outcome: eventJoinOutcomeSchema,
    participation: viewerEventParticipationSchema.nullable(),
  })
  .strict();

export type JoinEventResponse = z.infer<typeof joinEventResponseSchema>;
