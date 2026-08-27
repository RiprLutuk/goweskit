import { describe, expect, it } from 'vitest';

import { canManageCommunity, decideCommunityJoin } from './membership.js';

describe('community membership policy', () => {
  it('joins an open public community immediately', () => {
    expect(
      decideCommunityJoin({
        visibility: 'public',
        joinMode: 'open',
        existingMembership: null,
      }),
    ).toEqual({
      action: 'create',
      outcome: 'joined',
      nextRole: 'member',
      nextStatus: 'active',
    });
  });

  it('requests approval for a private or request-only community', () => {
    expect(
      decideCommunityJoin({
        visibility: 'private',
        joinMode: 'open',
        existingMembership: null,
      }).outcome,
    ).toBe('requested');
    expect(
      decideCommunityJoin({
        visibility: 'public',
        joinMode: 'request',
        existingMembership: null,
      }).outcome,
    ).toBe('requested');
  });

  it('is idempotent for active and requested memberships', () => {
    expect(
      decideCommunityJoin({
        visibility: 'public',
        joinMode: 'open',
        existingMembership: { role: 'member', status: 'active' },
      }),
    ).toMatchObject({ action: 'none', outcome: 'already_joined' });
    expect(
      decideCommunityJoin({
        visibility: 'private',
        joinMode: 'request',
        existingMembership: { role: 'member', status: 'requested' },
      }),
    ).toMatchObject({ action: 'none', outcome: 'already_requested' });
  });

  it('does not silently reopen a rejected request', () => {
    expect(
      decideCommunityJoin({
        visibility: 'public',
        joinMode: 'open',
        existingMembership: { role: 'member', status: 'rejected' },
      }),
    ).toMatchObject({ action: 'none', outcome: 'request_denied' });
  });

  it('reactivates a left membership using the current join policy', () => {
    expect(
      decideCommunityJoin({
        visibility: 'private',
        joinMode: 'request',
        existingMembership: { role: 'member', status: 'left' },
      }),
    ).toEqual({
      action: 'reactivate',
      outcome: 'requested',
      nextRole: 'member',
      nextStatus: 'requested',
    });
  });

  it('allows only active owners and admins to manage a community', () => {
    expect(canManageCommunity({ role: 'owner', status: 'active' })).toBe(true);
    expect(canManageCommunity({ role: 'admin', status: 'active' })).toBe(true);
    expect(canManageCommunity({ role: 'member', status: 'active' })).toBe(
      false,
    );
    expect(canManageCommunity({ role: 'admin', status: 'requested' })).toBe(
      false,
    );
  });
});
