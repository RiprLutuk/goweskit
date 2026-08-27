export const SAFETY_SESSION_STATUSES = [
  'active',
  'sos',
  'ended',
  'revoked',
  'expired',
] as const;

export type SafetySessionStatus = (typeof SAFETY_SESSION_STATUSES)[number];

export interface SafetySessionState {
  status: SafetySessionStatus;
  sosTriggeredAt: Date | null;
  endedAt: Date | null;
}

const LEGAL_TRANSITIONS: Readonly<
  Record<SafetySessionStatus, readonly SafetySessionStatus[]>
> = {
  active: ['sos', 'ended', 'revoked', 'expired'],
  sos: ['ended', 'revoked', 'expired'],
  ended: [],
  revoked: [],
  expired: [],
};

export class SafetySessionTransitionError extends Error {
  public readonly code = 'INVALID_SAFETY_SESSION_TRANSITION';

  public constructor(
    public readonly from: SafetySessionStatus,
    public readonly to: SafetySessionStatus,
  ) {
    super(`Safety session cannot transition from ${from} to ${to}.`);
    this.name = 'SafetySessionTransitionError';
  }
}

export function canTransitionSafetySession(
  from: SafetySessionStatus,
  to: SafetySessionStatus,
): boolean {
  return LEGAL_TRANSITIONS[from].includes(to);
}

export function transitionSafetySession(
  state: SafetySessionState,
  target: SafetySessionStatus,
  occurredAt: Date,
): SafetySessionState {
  if (Number.isNaN(occurredAt.getTime())) {
    throw new Error('Safety session transition time must be a valid date.');
  }
  if (!canTransitionSafetySession(state.status, target)) {
    throw new SafetySessionTransitionError(state.status, target);
  }

  return {
    status: target,
    sosTriggeredAt: target === 'sos' ? occurredAt : state.sosTriggeredAt,
    endedAt:
      target === 'ended' || target === 'revoked' ? occurredAt : state.endedAt,
  };
}

export function expireSafetySession(
  state: SafetySessionState,
  shareExpiresAt: Date,
  now: Date,
): SafetySessionState {
  if (Number.isNaN(shareExpiresAt.getTime()) || Number.isNaN(now.getTime())) {
    throw new Error('Safety session expiry requires valid dates.');
  }
  if (
    now.getTime() < shareExpiresAt.getTime() ||
    state.status === 'ended' ||
    state.status === 'revoked' ||
    state.status === 'expired'
  ) {
    return state;
  }
  return transitionSafetySession(state, 'expired', now);
}
