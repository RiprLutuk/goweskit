import { describe, expect, it } from 'vitest';

import {
  SAFETY_SESSION_STATUSES,
  SafetySessionTransitionError,
  canTransitionSafetySession,
  expireSafetySession,
  transitionSafetySession,
  type SafetySessionState,
  type SafetySessionStatus,
} from './state-machine.js';

const activeState: SafetySessionState = {
  status: 'active',
  sosTriggeredAt: null,
  endedAt: null,
};

const legalPairs = new Set([
  'active:sos',
  'active:ended',
  'active:revoked',
  'active:expired',
  'sos:ended',
  'sos:revoked',
  'sos:expired',
]);

describe('Ride Safety session state machine', () => {
  it('allows only the explicit transition matrix', () => {
    expect(SAFETY_SESSION_STATUSES).toEqual([
      'active',
      'sos',
      'ended',
      'revoked',
      'expired',
    ]);
    for (const from of SAFETY_SESSION_STATUSES) {
      for (const to of SAFETY_SESSION_STATUSES) {
        expect(canTransitionSafetySession(from, to)).toBe(
          legalPairs.has(`${from}:${to}`),
        );
      }
    }
  });

  it('records SOS and preserves its timestamp when the ride ends', () => {
    const sosAt = new Date('2026-08-27T11:00:00.000Z');
    const endedAt = new Date('2026-08-27T11:20:00.000Z');
    const sos = transitionSafetySession(activeState, 'sos', sosAt);
    expect(sos).toEqual({
      status: 'sos',
      sosTriggeredAt: sosAt,
      endedAt: null,
    });
    expect(transitionSafetySession(sos, 'ended', endedAt)).toEqual({
      status: 'ended',
      sosTriggeredAt: sosAt,
      endedAt,
    });
  });

  it.each(['ended', 'revoked'] as const)(
    'records an explicit %s terminal action',
    (target) => {
      const occurredAt = new Date('2026-08-27T11:00:00.000Z');
      expect(transitionSafetySession(activeState, target, occurredAt)).toEqual({
        status: target,
        sosTriggeredAt: null,
        endedAt: occurredAt,
      });
    },
  );

  it.each(['ended', 'revoked', 'expired'] as const)(
    'keeps %s terminal',
    (status) => {
      const terminal: SafetySessionState = {
        status,
        sosTriggeredAt: null,
        endedAt:
          status === 'expired' ? null : new Date('2026-08-27T11:00:00.000Z'),
      };
      for (const target of SAFETY_SESSION_STATUSES) {
        expect(() =>
          transitionSafetySession(
            terminal,
            target,
            new Date('2026-08-27T12:00:00.000Z'),
          ),
        ).toThrow(SafetySessionTransitionError);
      }
    },
  );

  it('returns a stable error code for an illegal transition', () => {
    try {
      transitionSafetySession(
        activeState,
        'active',
        new Date('2026-08-27T12:00:00.000Z'),
      );
      throw new Error('Expected transition to fail.');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(SafetySessionTransitionError);
      expect(error).toMatchObject({
        code: 'INVALID_SAFETY_SESSION_TRANSITION',
        from: 'active',
        to: 'active',
      });
    }
  });

  it('expires active and SOS sessions at the exact expiry instant', () => {
    const expiry = new Date('2026-08-27T13:00:00.000Z');
    expect(
      expireSafetySession(
        activeState,
        expiry,
        new Date('2026-08-27T12:59:59.999Z'),
      ),
    ).toBe(activeState);
    expect(expireSafetySession(activeState, expiry, expiry)).toEqual({
      status: 'expired',
      sosTriggeredAt: null,
      endedAt: null,
    });

    const sosState: SafetySessionState = {
      status: 'sos',
      sosTriggeredAt: new Date('2026-08-27T12:30:00.000Z'),
      endedAt: null,
    };
    expect(expireSafetySession(sosState, expiry, expiry)).toEqual({
      ...sosState,
      status: 'expired',
    });
  });

  it.each(['ended', 'revoked', 'expired'] as const)(
    'does not overwrite terminal %s state during expiry cleanup',
    (status) => {
      const terminal: SafetySessionState = {
        status,
        sosTriggeredAt: null,
        endedAt:
          status === 'expired' ? null : new Date('2026-08-27T11:00:00.000Z'),
      };
      expect(
        expireSafetySession(
          terminal,
          new Date('2026-08-27T12:00:00.000Z'),
          new Date('2026-08-27T13:00:00.000Z'),
        ),
      ).toBe(terminal);
    },
  );

  it('rejects invalid transition and expiry timestamps', () => {
    expect(() =>
      transitionSafetySession(activeState, 'sos', new Date('invalid')),
    ).toThrow('Safety session transition time must be a valid date.');
    expect(() =>
      expireSafetySession(
        activeState,
        new Date('invalid'),
        new Date('2026-08-27T13:00:00.000Z'),
      ),
    ).toThrow('Safety session expiry requires valid dates.');
  });

  it('does not accept states outside the status union at compile time', () => {
    const status: SafetySessionStatus = 'active';
    expect(status).toBe('active');
  });
});
