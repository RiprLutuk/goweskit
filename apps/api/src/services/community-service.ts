import type {
  CommunityDetailResponse,
  CommunityEventsResponse,
  CommunityModerationQueueResponse,
  ContributorReputation,
  CreateCommunityEventRequest,
  CreateCommunityEventResponse,
  EventDetailResponse,
  JoinCommunityResponse,
  JoinEventResponse,
  ModerateCommunityMembershipRequest,
  ModerateCommunityMembershipResponse,
  NearbyCommunitiesRequest,
  NearbyCommunitiesResponse,
  NearbyEventsRequest,
  NearbyEventsResponse,
  User,
  ViewerCommunityMembership,
  ViewerEventParticipation,
} from '@goweskit/contracts';

import { decideEventJoin } from '../community/event-policy.js';
import {
  canManageCommunity,
  decideCommunityJoin,
} from '../community/membership.js';
import { AppError } from '../errors.js';
import type {
  CommunityRepository,
  StoredCommunityMembership,
  StoredEventParticipation,
} from '../repositories/community-repository.js';

function mapMembership(
  membership: StoredCommunityMembership | null,
): ViewerCommunityMembership | null {
  return membership === null
    ? null
    : {
        id: membership.id,
        role: membership.role,
        status: membership.status,
        createdAt: membership.createdAt.toISOString(),
        updatedAt: membership.updatedAt.toISOString(),
      };
}

function mapParticipation(
  participation: StoredEventParticipation | null,
): ViewerEventParticipation | null {
  return participation === null
    ? null
    : {
        id: participation.id,
        status: participation.status,
        joinedAt: participation.joinedAt.toISOString(),
      };
}

export class CommunityService {
  public constructor(
    private readonly repository: CommunityRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async findNearbyCommunities(
    input: NearbyCommunitiesRequest,
  ): Promise<NearbyCommunitiesResponse> {
    return {
      radiusKm: input.radiusKm,
      communities: await this.repository.findNearbyCommunities(input),
    };
  }

  public async getCommunityDetail(
    communityId: string,
    viewer: User | null,
  ): Promise<CommunityDetailResponse> {
    const community = await this.getCommunity(communityId);
    const viewerMembership =
      viewer === null
        ? null
        : await this.repository.findMembership(communityId, viewer.id);
    return { community, viewerMembership: mapMembership(viewerMembership) };
  }

  public async joinCommunity(
    communityId: string,
    user: User,
  ): Promise<JoinCommunityResponse> {
    const community = await this.getCommunity(communityId);
    const existing = await this.repository.findMembership(communityId, user.id);
    const decision = decideCommunityJoin({
      visibility: community.visibility,
      joinMode: community.joinMode,
      existingMembership: existing,
    });
    if (decision.action === 'none') {
      return { outcome: decision.outcome, membership: mapMembership(existing) };
    }
    const membership = await this.repository.saveMembership(
      communityId,
      user.id,
      decision.nextRole,
      decision.nextStatus,
    );
    return {
      outcome: decision.outcome,
      membership: mapMembership(membership),
    };
  }

  public async findNearbyEvents(
    input: NearbyEventsRequest,
  ): Promise<NearbyEventsResponse> {
    return {
      radiusKm: input.radiusKm,
      events: await this.repository.findNearbyEvents(input),
    };
  }

  public async createEvent(
    communityId: string,
    user: User,
    input: CreateCommunityEventRequest,
  ): Promise<CreateCommunityEventResponse> {
    await this.getCommunity(communityId);
    const membership = await this.repository.findMembership(
      communityId,
      user.id,
    );
    if (membership?.status !== 'active') {
      throw new AppError(
        'COMMUNITY_MEMBERSHIP_REQUIRED',
        'Active community membership is required to create an event.',
        403,
      );
    }

    const startsAt = new Date(input.startsAt);
    if (startsAt <= this.now()) {
      throw new AppError(
        'RIDE_EVENT_START_INVALID',
        'Ride event start time must be in the future.',
        400,
      );
    }
    if (
      input.routeId !== undefined &&
      input.routeId !== null &&
      !(await this.repository.routeExists(input.routeId))
    ) {
      throw new AppError('ROUTE_NOT_FOUND', 'Route not found.', 404);
    }
    if (!(await this.repository.bicycleTypesExist(input.bicycleTypes))) {
      throw new AppError(
        'INVALID_BICYCLE_TYPES',
        'One or more bicycle types are not recognized.',
        400,
        { bicycleTypes: input.bicycleTypes },
      );
    }

    return {
      event: await this.repository.createEvent(communityId, user.id, input),
    };
  }

  public async listCommunityEvents(
    communityId: string,
    viewer: User | null,
  ): Promise<CommunityEventsResponse> {
    await this.getCommunity(communityId);
    const membership =
      viewer === null
        ? null
        : await this.repository.findMembership(communityId, viewer.id);
    return {
      events: await this.repository.listCommunityEvents(
        communityId,
        membership?.status === 'active',
      ),
    };
  }

  public async getEventDetail(
    eventId: string,
    viewer: User | null,
  ): Promise<EventDetailResponse> {
    const stored = await this.repository.findEventById(eventId);
    if (stored === null) throw this.eventNotFound();
    const membership =
      viewer === null
        ? null
        : await this.repository.findMembership(stored.communityId, viewer.id);
    if (
      stored.event.visibility === 'members_only' &&
      membership?.status !== 'active'
    ) {
      throw this.eventNotFound();
    }
    const participation =
      viewer === null
        ? null
        : await this.repository.findParticipation(eventId, viewer.id);
    return {
      event: stored.event,
      viewerParticipation: mapParticipation(participation),
    };
  }

  public async joinEvent(
    eventId: string,
    user: User,
  ): Promise<JoinEventResponse> {
    const stored = await this.repository.findEventById(eventId);
    if (stored === null) throw this.eventNotFound();
    const [membership, participation] = await Promise.all([
      this.repository.findMembership(stored.communityId, user.id),
      this.repository.findParticipation(eventId, user.id),
    ]);
    const decision = decideEventJoin({
      status: stored.event.status,
      visibility: stored.event.visibility,
      startsAt: new Date(stored.event.startsAt),
      now: this.now(),
      capacity: stored.event.capacity,
      participantCount: stored.event.participantCount,
      existingParticipation: participation?.status ?? null,
      communityMembership: membership,
    });
    if (decision.action === 'none') {
      return {
        outcome: decision.outcome,
        participation: mapParticipation(participation),
      };
    }
    const joined = await this.repository.joinEventAtomically(
      eventId,
      user.id,
      stored.event.capacity,
    );
    return joined === null
      ? { outcome: 'event_full', participation: null }
      : { outcome: 'joined', participation: mapParticipation(joined) };
  }

  public async getModerationQueue(
    communityId: string,
    user: User,
  ): Promise<CommunityModerationQueueResponse> {
    await this.assertManager(communityId, user);
    return {
      requests: (await this.repository.listPendingMemberships(communityId)).map(
        (request) => ({
          membershipId: request.membershipId,
          communityId: request.communityId,
          requester: {
            id: request.requesterId,
            displayName: request.requesterDisplayName,
          },
          requestedAt: request.requestedAt.toISOString(),
        }),
      ),
    };
  }

  public async moderateMembership(
    communityId: string,
    membershipId: string,
    user: User,
    input: ModerateCommunityMembershipRequest,
  ): Promise<ModerateCommunityMembershipResponse> {
    await this.assertManager(communityId, user);
    const result = await this.repository.moderateMembership(
      communityId,
      membershipId,
      user.id,
      input.decision,
      input.note ?? null,
    );
    if (result === null) {
      throw new AppError(
        'COMMUNITY_MEMBERSHIP_NOT_FOUND',
        'Pending membership request not found.',
        404,
      );
    }
    return {
      ...result,
      status: input.decision === 'approve' ? 'active' : 'rejected',
    };
  }

  public async getMyReputation(user: User): Promise<ContributorReputation> {
    const counts = await this.repository.getReputationCounts(user.id);
    const score =
      counts.hostedEvents * 2 +
      counts.completedEvents * 5 +
      counts.moderationDecisions;
    return {
      userId: user.id,
      score,
      level:
        score >= 25
          ? 'trusted_contributor'
          : score >= 5
            ? 'contributor'
            : 'new_contributor',
      ...counts,
    };
  }

  private async getCommunity(communityId: string) {
    const community = await this.repository.findCommunityById(communityId);
    if (community === null) {
      throw new AppError('COMMUNITY_NOT_FOUND', 'Community not found.', 404);
    }
    return community;
  }

  private async assertManager(communityId: string, user: User): Promise<void> {
    await this.getCommunity(communityId);
    const membership = await this.repository.findMembership(
      communityId,
      user.id,
    );
    if (!canManageCommunity(membership)) {
      throw new AppError(
        'COMMUNITY_FORBIDDEN',
        'Community owner or admin access is required.',
        403,
      );
    }
  }

  private eventNotFound(): AppError {
    return new AppError('RIDE_EVENT_NOT_FOUND', 'Ride event not found.', 404);
  }
}
