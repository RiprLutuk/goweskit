import type { ExistingCommunityMembership } from './membership.js';

export type RideEventStatus = 'scheduled' | 'cancelled' | 'completed';
export type RideEventVisibility = 'public' | 'members_only';
export type ExistingEventParticipationStatus = 'joined' | 'cancelled';

export interface EventJoinPolicyInput {
  status: RideEventStatus;
  visibility: RideEventVisibility;
  startsAt: Date;
  now: Date;
  capacity: number | null;
  participantCount: number;
  existingParticipation: ExistingEventParticipationStatus | null;
  communityMembership: ExistingCommunityMembership | null;
}

export type EventJoinDecision =
  | {
      action: 'create' | 'reactivate';
      outcome: 'joined';
      requiresCapacityReservation: boolean;
    }
  | {
      action: 'none';
      outcome:
        | 'already_joined'
        | 'event_full'
        | 'event_unavailable'
        | 'event_started'
        | 'membership_required';
      requiresCapacityReservation: false;
    };

export function decideEventJoin(
  input: EventJoinPolicyInput,
): EventJoinDecision {
  if (input.status !== 'scheduled') {
    return noMutation('event_unavailable');
  }
  if (input.startsAt.getTime() <= input.now.getTime()) {
    return noMutation('event_started');
  }
  if (
    input.visibility === 'members_only' &&
    input.communityMembership?.status !== 'active'
  ) {
    return noMutation('membership_required');
  }
  if (input.existingParticipation === 'joined') {
    return noMutation('already_joined');
  }
  if (input.capacity !== null && input.participantCount >= input.capacity) {
    return noMutation('event_full');
  }

  return {
    action:
      input.existingParticipation === 'cancelled' ? 'reactivate' : 'create',
    outcome: 'joined',
    requiresCapacityReservation: input.capacity !== null,
  };
}

function noMutation(
  outcome: Exclude<EventJoinDecision['outcome'], 'joined'>,
): EventJoinDecision {
  return { action: 'none', outcome, requiresCapacityReservation: false };
}
