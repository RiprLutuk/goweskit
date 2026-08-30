import type {
  CreateCommunityEventRequest,
  CreatedCommunityEvent,
  NearbyCommunity,
  NearbyEvent,
  PublicCommunity,
  PublicEvent,
  User,
} from '@goweskit/contracts';
import { describe, expect, it } from 'vitest';

import type {
  CommunityRepository,
  CommunityReputationCounts,
  PendingMembershipRow,
  StoredCommunityMembership,
  StoredEventParticipation,
  StoredPublicEvent,
} from '../repositories/community-repository.js';
import { CommunityService } from './community-service.js';

const user: User = {
  id: '10000000-0000-4000-8000-000000000010',
  displayName: 'Demo Rider',
  email: 'rider@example.com',
  createdAt: '2026-08-01T00:00:00.000Z',
};
const communityId = '10000000-0000-4000-8000-000000000020';
const eventId = '10000000-0000-4000-8000-000000000030';

const community: PublicCommunity = {
  id: communityId,
  slug: 'gowes-santai-demo',
  name: 'Gowes Santai Demo',
  description: 'A demo community.',
  locality: 'Bandung Utara',
  bicycleTypes: ['folding'],
  visibility: 'private',
  joinMode: 'request',
  verificationStatus: 'community_verified',
  memberCount: 4,
};

const event: PublicEvent = {
  id: eventId,
  slug: 'sunday-loop',
  community: {
    id: community.id,
    slug: community.slug,
    name: community.name,
    verificationStatus: community.verificationStatus,
  },
  title: 'Sunday loop',
  description: 'A relaxed Sunday loop.',
  startsAt: '2026-09-06T00:00:00.000Z',
  meetingArea: 'Dago, Bandung',
  routeId: null,
  difficulty: 'easy',
  bicycleTypes: ['folding'],
  capacity: 10,
  participantCount: 4,
  requirements: 'Helmet and water.',
  visibility: 'members_only',
  status: 'scheduled',
  createdAt: '2026-08-28T00:00:00.000Z',
};

class MemoryCommunityRepository implements CommunityRepository {
  public membership: StoredCommunityMembership | null = null;
  public participation: StoredEventParticipation | null = null;
  public lastMembershipCommunityId: string | null = null;
  public lastCreatedEventCommunityId: string | null = null;
  public atomicJoinReturnsNull = false;
  public knownRoute = true;
  public knownBicycleTypes = true;
  public pending: PendingMembershipRow[] = [];
  public counts: CommunityReputationCounts = {
    hostedEvents: 3,
    completedEvents: 2,
    moderationDecisions: 1,
  };

  public findNearbyCommunities(): Promise<NearbyCommunity[]> {
    return Promise.resolve([{ ...community, distanceMeters: 2000 }]);
  }

  public findCommunityById(identifier: string): Promise<PublicCommunity | null> {
    return Promise.resolve(
      identifier === communityId || identifier === community.slug
        ? community
        : null,
    );
  }

  public findMembership(
    requestedCommunityId: string,
  ): Promise<StoredCommunityMembership | null> {
    this.lastMembershipCommunityId = requestedCommunityId;
    return Promise.resolve(this.membership);
  }

  public saveMembership(
    savedCommunityId: string,
    savedUserId: string,
    role: 'owner' | 'admin' | 'member',
    status: 'requested' | 'active' | 'rejected' | 'left',
  ): Promise<StoredCommunityMembership> {
    const now = new Date('2026-08-28T00:00:00.000Z');
    this.membership = {
      id: '10000000-0000-4000-8000-000000000040',
      communityId: savedCommunityId,
      userId: savedUserId,
      role,
      status,
      createdAt: now,
      updatedAt: now,
    };
    return Promise.resolve(this.membership);
  }

  public findNearbyEvents(): Promise<NearbyEvent[]> {
    return Promise.resolve([
      { ...event, visibility: 'public', distanceMeters: 500 },
    ]);
  }

  public routeExists(): Promise<boolean> {
    return Promise.resolve(this.knownRoute);
  }

  public bicycleTypesExist(): Promise<boolean> {
    return Promise.resolve(this.knownBicycleTypes);
  }

  public createEvent(
    savedCommunityId: string,
    _createdByUserId: string,
    input: CreateCommunityEventRequest,
  ): Promise<CreatedCommunityEvent> {
    this.lastCreatedEventCommunityId = savedCommunityId;
    return Promise.resolve({
      id: eventId,
      communityId: savedCommunityId,
      title: input.title,
      description: input.description,
      status: 'scheduled',
      participantCount: 1,
      startsAt: input.startsAt,
      meetingArea: input.meetingArea,
      difficulty: input.difficulty,
      bicycleTypes: input.bicycleTypes,
      visibility: input.visibility,
      capacity: input.capacity ?? null,
      requirements: input.requirements,
      createdAt: '2026-08-28T00:00:00.000Z',
    });
  }

  public listCommunityEvents(): Promise<PublicEvent[]> {
    return Promise.resolve([event]);
  }

  public findEventById(id: string): Promise<StoredPublicEvent | null> {
    return Promise.resolve(
      id === eventId ? { event, communityId, createdBy: user.id } : null,
    );
  }

  public findParticipation(): Promise<StoredEventParticipation | null> {
    return Promise.resolve(this.participation);
  }

  public joinEventAtomically(): Promise<StoredEventParticipation | null> {
    if (this.atomicJoinReturnsNull) return Promise.resolve(null);
    const now = new Date('2026-08-28T00:00:00.000Z');
    this.participation = {
      id: '10000000-0000-4000-8000-000000000050',
      eventId,
      userId: user.id,
      status: 'joined',
      joinedAt: now,
      updatedAt: now,
    };
    return Promise.resolve(this.participation);
  }

  public listPendingMemberships(): Promise<PendingMembershipRow[]> {
    return Promise.resolve(this.pending);
  }

  public moderateMembership(): Promise<{
    membershipId: string;
    auditId: string;
  } | null> {
    return Promise.resolve({
      membershipId: '10000000-0000-4000-8000-000000000040',
      auditId: '10000000-0000-4000-8000-000000000060',
    });
  }

  public getReputationCounts(): Promise<CommunityReputationCounts> {
    return Promise.resolve(this.counts);
  }
}

describe('CommunityService', () => {
  const createEventInput: CreateCommunityEventRequest = {
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
  };

  it('lets an active member create a future event with the creator joined', async () => {
    const repository = new MemoryCommunityRepository();
    repository.membership = {
      id: '10000000-0000-4000-8000-000000000040',
      communityId,
      userId: user.id,
      role: 'member',
      status: 'active',
      createdAt: new Date('2026-08-20T00:00:00.000Z'),
      updatedAt: new Date('2026-08-20T00:00:00.000Z'),
    };
    const response = await new CommunityService(
      repository,
      () => new Date('2026-08-28T00:00:00.000Z'),
    ).createEvent(communityId, user, createEventInput);

    expect(response.event).toMatchObject({
      communityId,
      participantCount: 1,
      status: 'scheduled',
    });
  });

  it('resolves a community slug before UUID-scoped membership and event writes', async () => {
    const repository = new MemoryCommunityRepository();
    repository.membership = {
      id: '10000000-0000-4000-8000-000000000040',
      communityId,
      userId: user.id,
      role: 'member',
      status: 'active',
      createdAt: new Date('2026-08-20T00:00:00.000Z'),
      updatedAt: new Date('2026-08-20T00:00:00.000Z'),
    };

    await new CommunityService(
      repository,
      () => new Date('2026-08-28T00:00:00.000Z'),
    ).createEvent(community.slug, user, createEventInput);

    expect(repository.lastMembershipCommunityId).toBe(communityId);
    expect(repository.lastCreatedEventCommunityId).toBe(communityId);
  });

  it('rejects event creation by a non-member and invalid references', async () => {
    const repository = new MemoryCommunityRepository();
    const service = new CommunityService(
      repository,
      () => new Date('2026-08-28T00:00:00.000Z'),
    );
    await expect(
      service.createEvent(communityId, user, createEventInput),
    ).rejects.toMatchObject({
      code: 'COMMUNITY_MEMBERSHIP_REQUIRED',
      statusCode: 403,
    });

    repository.membership = {
      id: '10000000-0000-4000-8000-000000000040',
      communityId,
      userId: user.id,
      role: 'member',
      status: 'active',
      createdAt: new Date('2026-08-20T00:00:00.000Z'),
      updatedAt: new Date('2026-08-20T00:00:00.000Z'),
    };
    repository.knownRoute = false;
    await expect(
      service.createEvent(communityId, user, createEventInput),
    ).rejects.toMatchObject({ code: 'ROUTE_NOT_FOUND', statusCode: 404 });
  });

  it('returns a request outcome for a private community and stays idempotent', async () => {
    const repository = new MemoryCommunityRepository();
    const service = new CommunityService(repository);

    expect((await service.joinCommunity(communityId, user)).outcome).toBe(
      'requested',
    );
    expect((await service.joinCommunity(communityId, user)).outcome).toBe(
      'already_requested',
    );
  });

  it('hides members-only event details from non-members', async () => {
    const service = new CommunityService(new MemoryCommunityRepository());
    await expect(service.getEventDetail(eventId, null)).rejects.toMatchObject({
      code: 'RIDE_EVENT_NOT_FOUND',
      statusCode: 404,
    });
  });

  it('rechecks capacity atomically when joining an event', async () => {
    const repository = new MemoryCommunityRepository();
    repository.membership = {
      id: '10000000-0000-4000-8000-000000000040',
      communityId,
      userId: user.id,
      role: 'member',
      status: 'active',
      createdAt: new Date('2026-08-20T00:00:00.000Z'),
      updatedAt: new Date('2026-08-20T00:00:00.000Z'),
    };
    repository.atomicJoinReturnsNull = true;
    const service = new CommunityService(
      repository,
      () => new Date('2026-08-28T00:00:00.000Z'),
    );

    expect((await service.joinEvent(eventId, user)).outcome).toBe('event_full');
  });

  it('requires an active owner or admin for moderation', async () => {
    const repository = new MemoryCommunityRepository();
    repository.membership = {
      id: '10000000-0000-4000-8000-000000000040',
      communityId,
      userId: user.id,
      role: 'member',
      status: 'active',
      createdAt: new Date('2026-08-20T00:00:00.000Z'),
      updatedAt: new Date('2026-08-20T00:00:00.000Z'),
    };
    const service = new CommunityService(repository);

    await expect(
      service.getModerationQueue(communityId, user),
    ).rejects.toMatchObject({ code: 'COMMUNITY_FORBIDDEN', statusCode: 403 });
  });

  it('calculates contributor reputation from bounded community actions', async () => {
    const reputation = await new CommunityService(
      new MemoryCommunityRepository(),
    ).getMyReputation(user);

    expect(reputation).toEqual({
      userId: user.id,
      score: 17,
      level: 'contributor',
      hostedEvents: 3,
      completedEvents: 2,
      moderationDecisions: 1,
    });
  });

  it('creates a community event when user is an active member', async () => {
    const repository = new MemoryCommunityRepository();
    repository.membership = {
      id: '10000000-0000-4000-8000-000000000040',
      communityId,
      userId: user.id,
      role: 'member',
      status: 'active',
      createdAt: new Date('2026-08-20T00:00:00.000Z'),
      updatedAt: new Date('2026-08-20T00:00:00.000Z'),
    };
    const service = new CommunityService(
      repository,
      () => new Date('2026-08-28T00:00:00.000Z'),
    );

    const result = await service.createEvent(communityId, user, {
      title: 'Dago Night Ride',
      description: 'Gowes santai malam Jumat keliling Dago.',
      startsAt: '2026-09-10T12:00:00.000Z',
      meetingArea: 'Simpang Dago',
      difficulty: 'easy',
      bicycleTypes: ['folding'],
      visibility: 'public',
      capacity: 15,
      requirements: 'Lampu depan belakang wajib.',
      meetingCoordinate: { longitude: 107.6191, latitude: -6.9175 },
    });

    expect(result.event.title).toBe('Dago Night Ride');
    expect(result.event.status).toBe('scheduled');
    expect(result.event.participantCount).toBe(1);
  });

  it('rejects event creation when user is not an active member', async () => {
    const repository = new MemoryCommunityRepository();
    repository.membership = null;
    const service = new CommunityService(repository);

    await expect(
      service.createEvent(communityId, user, {
        title: 'Unauthorized Ride',
        description: 'Should fail.',
        startsAt: '2026-09-10T12:00:00.000Z',
        meetingArea: 'Simpang Dago',
        difficulty: 'easy',
        bicycleTypes: ['folding'],
        visibility: 'public',
        requirements: '',
        meetingCoordinate: { longitude: 107.6191, latitude: -6.9175 },
      }),
    ).rejects.toMatchObject({
      code: 'COMMUNITY_MEMBERSHIP_REQUIRED',
      statusCode: 403,
    });
  });
});
