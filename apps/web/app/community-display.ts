import type {
  CommunityJoinOutcome,
  ContributorReputationLevel,
  EventJoinOutcome,
} from '@goweskit/contracts';

export const COMMUNITY_JOIN_MESSAGES = {
  joined: 'You are now a member.',
  requested: 'Your request is waiting for an owner or admin to review it.',
  already_joined: 'You are already a member.',
  already_requested: 'Your join request is still waiting for review.',
  request_denied:
    'A previous request was declined. Contact the community owner if you need help.',
} as const satisfies Record<CommunityJoinOutcome, string>;

export const EVENT_JOIN_MESSAGES = {
  joined: 'Your place on this ride is saved.',
  already_joined: 'You already joined this ride.',
  event_full: 'This ride has reached its capacity.',
  event_unavailable: 'This ride is not open for joining.',
  event_started: 'This ride has already started.',
  membership_required:
    'Join the community before joining this members-only ride.',
} as const satisfies Record<EventJoinOutcome, string>;

export const REPUTATION_LEVEL_LABELS = {
  new_contributor: 'New contributor',
  contributor: 'Contributor',
  trusted_contributor: 'Trusted contributor',
} as const satisfies Record<ContributorReputationLevel, string>;

export function formatCommunityDistance(meters: number): string {
  return meters < 1000
    ? `${String(Math.round(meters))} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

export function formatCommunityDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
