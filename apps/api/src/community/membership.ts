export type CommunityVisibility = 'public' | 'private';
export type CommunityJoinMode = 'open' | 'request';
export type CommunityRole = 'owner' | 'admin' | 'member';
export type CommunityMembershipStatus =
  'requested' | 'active' | 'rejected' | 'left';

export interface ExistingCommunityMembership {
  role: CommunityRole;
  status: CommunityMembershipStatus;
}

export interface CommunityJoinPolicyInput {
  visibility: CommunityVisibility;
  joinMode: CommunityJoinMode;
  existingMembership: ExistingCommunityMembership | null;
}

export type CommunityJoinDecision =
  | {
      action: 'create' | 'reactivate';
      outcome: 'joined';
      nextRole: 'member';
      nextStatus: 'active';
    }
  | {
      action: 'create' | 'reactivate';
      outcome: 'requested';
      nextRole: 'member';
      nextStatus: 'requested';
    }
  | {
      action: 'none';
      outcome: 'already_joined';
      nextRole: CommunityRole;
      nextStatus: 'active';
    }
  | {
      action: 'none';
      outcome: 'already_requested';
      nextRole: CommunityRole;
      nextStatus: 'requested';
    }
  | {
      action: 'none';
      outcome: 'request_denied';
      nextRole: CommunityRole;
      nextStatus: 'rejected';
    };

export function decideCommunityJoin(
  input: CommunityJoinPolicyInput,
): CommunityJoinDecision {
  const existing = input.existingMembership;
  if (existing?.status === 'active') {
    return {
      action: 'none',
      outcome: 'already_joined',
      nextRole: existing.role,
      nextStatus: 'active',
    };
  }
  if (existing?.status === 'requested') {
    return {
      action: 'none',
      outcome: 'already_requested',
      nextRole: existing.role,
      nextStatus: 'requested',
    };
  }
  if (existing?.status === 'rejected') {
    return {
      action: 'none',
      outcome: 'request_denied',
      nextRole: existing.role,
      nextStatus: 'rejected',
    };
  }

  const action = existing?.status === 'left' ? 'reactivate' : 'create';
  const requiresApproval =
    input.visibility === 'private' || input.joinMode === 'request';
  if (requiresApproval) {
    return {
      action,
      outcome: 'requested',
      nextRole: 'member',
      nextStatus: 'requested',
    };
  }

  return {
    action,
    outcome: 'joined',
    nextRole: 'member',
    nextStatus: 'active',
  };
}

export function canManageCommunity(
  membership: ExistingCommunityMembership | null,
): boolean {
  return (
    membership?.status === 'active' &&
    (membership.role === 'owner' || membership.role === 'admin')
  );
}
