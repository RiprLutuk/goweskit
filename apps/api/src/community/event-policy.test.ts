import { describe, expect, it } from 'vitest';

import { decideEventJoin, type EventJoinPolicyInput } from './event-policy.js';

const future = new Date('2026-09-06T00:00:00.000Z');
const now = new Date('2026-08-27T00:00:00.000Z');

function input(
  overrides: Partial<EventJoinPolicyInput> = {},
): EventJoinPolicyInput {
  return {
    status: 'scheduled',
    visibility: 'public',
    startsAt: future,
    now,
    capacity: 30,
    participantCount: 12,
    existingParticipation: null,
    communityMembership: null,
    ...overrides,
  };
}

describe('ride event join policy', () => {
  it('joins an available future event and requests atomic capacity reservation', () => {
    expect(decideEventJoin(input())).toEqual({
      action: 'create',
      outcome: 'joined',
      requiresCapacityReservation: true,
    });
  });

  it('keeps repeat joining idempotent', () => {
    expect(decideEventJoin(input({ existingParticipation: 'joined' }))).toEqual(
      {
        action: 'none',
        outcome: 'already_joined',
        requiresCapacityReservation: false,
      },
    );
  });

  it('reactivates a cancelled participation without creating a duplicate', () => {
    expect(
      decideEventJoin(
        input({ capacity: null, existingParticipation: 'cancelled' }),
      ),
    ).toEqual({
      action: 'reactivate',
      outcome: 'joined',
      requiresCapacityReservation: false,
    });
  });

  it('rejects joins at capacity', () => {
    expect(
      decideEventJoin(input({ capacity: 12, participantCount: 12 })),
    ).toMatchObject({ action: 'none', outcome: 'event_full' });
  });

  it('rejects cancelled, completed, and already-started events', () => {
    expect(decideEventJoin(input({ status: 'cancelled' })).outcome).toBe(
      'event_unavailable',
    );
    expect(decideEventJoin(input({ status: 'completed' })).outcome).toBe(
      'event_unavailable',
    );
    expect(decideEventJoin(input({ startsAt: now })).outcome).toBe(
      'event_started',
    );
  });

  it('requires active membership for members-only events', () => {
    expect(
      decideEventJoin(
        input({
          visibility: 'members_only',
          communityMembership: { role: 'member', status: 'requested' },
        }),
      ).outcome,
    ).toBe('membership_required');
    expect(
      decideEventJoin(
        input({
          visibility: 'members_only',
          communityMembership: { role: 'member', status: 'active' },
        }),
      ).outcome,
    ).toBe('joined');
  });
});
