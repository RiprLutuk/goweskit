import type {
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
  community: {
    id: community.id,
    slug: community.slug,
    name: community.name,
    verificationStatus: community.verificationStatus,
  },
  title: 'Sunday loop',
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
};

class MemoryCommunityRepository implements CommunityRepository {
  public membership: StoredCommunityMembership | null = null;
  public participation: StoredEventParticipation | null = null;
  public atomicJoinReturnsNull = false;
  public pending: PendingMembershipRow[] = [];
  public counts: CommunityReputationCounts = {
    hostedEvents: 3,
    completedEvents: 2,
    moderationDecisions: 1,
  };

  public findNearbyCommunities(): Promise<NearbyCommunity[]> {
    return Promise.resolve([{ ...community, distanceMeters: 2000 }]);
  }

  public findCommunityById(id: string): Promise<PublicCommunity | null> {
    return Promise.resolve(id === communityId ? community : null);
  }

  public findMembership(): Promise<StoredCommunityMembership | null> {
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
});
