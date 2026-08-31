import type { User } from '@goweskit/contracts';
import {
  SAFETY_AUDIT_RETENTION_DAYS,
  SAFETY_DISCLAIMER,
  SAFETY_LOCATION_RETENTION_HOURS,
  SAFETY_TERMINAL_SESSION_RETENTION_DAYS,
  type CreateSafetySessionResponse,
  type CreateTrustedContactRequest,
  type SafetyLocation,
  type SafetyLocationUpdateRequest,
  type SafetySession,
  type SafetySessionResponse,
  type SafetyShareResponse,
  type StartSafetySessionRequest,
  type TrustedContact,
} from '@goweskit/contracts/safety';

import { AppError } from '../errors.js';
import type {
  SafetyAuditAction,
  SafetyRepository,
  SafetyRetentionResult,
  StoredSafetySession,
  StoredTrustedContact,
} from './repository.js';
import { SafetyPublicRateLimiter } from './rate-limiter.js';
import {
  expireSafetySession,
  transitionSafetySession,
} from './state-machine.js';
import {
  hashSafetyShareToken,
  isSafetyShareExpired,
  isSafetyShareToken,
  issueSafetyShareToken,
} from './token.js';

const HOURS_TO_MILLISECONDS = 60 * 60 * 1000;
const DAYS_TO_MILLISECONDS = 24 * HOURS_TO_MILLISECONDS;

export type SafetyClock = () => Date;

function toIso(value: Date): string {
  return value.toISOString();
}

function toTrustedContact(record: StoredTrustedContact): TrustedContact {
  return {
    id: record.id,
    name: record.name,
    phone: record.phone,
    email: record.email,
    note: record.note,
    createdAt: toIso(record.createdAt),
    updatedAt: toIso(record.updatedAt),
  };
}

function toSafetySession(record: StoredSafetySession): SafetySession {
  return {
    id: record.id,
    status: record.status,
    startedAt: toIso(record.startedAt),
    expectedEndAt:
      record.expectedEndAt === null ? null : toIso(record.expectedEndAt),
    endedAt: record.endedAt === null ? null : toIso(record.endedAt),
    shareExpiresAt: toIso(record.shareExpiresAt),
    sosTriggeredAt:
      record.sosTriggeredAt === null ? null : toIso(record.sosTriggeredAt),
    note: record.note,
    lastLocation: record.lastLocation,
  };
}

function unavailable(message = 'Safety session is unavailable.'): AppError {
  return new AppError('INVALID_REQUEST', message, 404);
}

export class SafetyService {
  public constructor(
    private readonly repository: SafetyRepository,
    private readonly publicRateLimiter: SafetyPublicRateLimiter,
    private readonly clock: SafetyClock = () => new Date(),
  ) {}

  public async listTrustedContacts(userId: string): Promise<TrustedContact[]> {
    return (await this.repository.listTrustedContacts(userId)).map(
      toTrustedContact,
    );
  }

  public async createTrustedContact(
    userId: string,
    input: CreateTrustedContactRequest,
  ): Promise<TrustedContact> {
    const now = this.clock();
    const contact = await this.repository.createTrustedContact(
      userId,
      input,
      now,
    );
    await this.audit('trusted_contact_created', null, userId, now, {
      contactId: contact.id,
    });
    return toTrustedContact(contact);
  }

  public async deleteTrustedContact(
    userId: string,
    contactId: string,
  ): Promise<void> {
    if (!(await this.repository.deleteTrustedContact(userId, contactId))) {
      throw unavailable('Trusted contact not found.');
    }
    const now = this.clock();
    await this.audit('trusted_contact_deleted', null, userId, now, {
      contactId,
    });
  }

  public async listSessions(userId: string): Promise<SafetySession[]> {
    return (await this.repository.listSessions(userId)).map(toSafetySession);
  }

  public async startSession(
    rider: Pick<User, 'id' | 'displayName'>,
    input: StartSafetySessionRequest,
  ): Promise<CreateSafetySessionResponse> {
    const now = this.clock();
    const contact = await this.repository.findTrustedContact(
      rider.id,
      input.trustedContactId,
    );
    if (contact === null) throw unavailable('Trusted contact not found.');

    const issued = issueSafetyShareToken(now, input.shareDurationMinutes);
    const expectedEndAt =
      input.expectedEndAt == null ? null : new Date(input.expectedEndAt);
    if (
      expectedEndAt !== null &&
      (expectedEndAt.getTime() <= now.getTime() ||
        expectedEndAt.getTime() > issued.storage.shareExpiresAt.getTime())
    ) {
      throw new AppError(
        'INVALID_REQUEST',
        'Expected return must be after start and no later than share expiry.',
        400,
      );
    }

    const session = await this.repository.createSession({
      userId: rider.id,
      riderDisplayName: rider.displayName,
      trustedContactId: contact.id,
      startedAt: now,
      expectedEndAt,
      shareTokenHash: issued.storage.shareTokenHash,
      shareExpiresAt: issued.storage.shareExpiresAt,
      note: input.note ?? null,
    });
    await this.audit('session_started', session.id, rider.id, now, {
      shareDurationMinutes: input.shareDurationMinutes,
      expectedReturnProvided: expectedEndAt !== null,
    });
    return {
      session: toSafetySession(session),
      shareToken: issued.token,
      disclaimer: SAFETY_DISCLAIMER,
    };
  }

  public async updateLocation(
    userId: string,
    sessionId: string,
    input: SafetyLocationUpdateRequest,
  ): Promise<SafetySessionResponse> {
    const now = this.clock();
    const session = await this.getActiveOwnedSession(userId, sessionId, now);
    const location: SafetyLocation = {
      coordinate: input.coordinate,
      accuracyMeters: input.accuracyMeters,
      ...(input.batteryPercent === undefined
        ? {}
        : { batteryPercent: input.batteryPercent }),
      recordedAt: toIso(now),
    };
    const updated = await this.repository.appendLocation(session.id, location);
    await this.audit('location_updated', session.id, userId, now, {
      accuracyMeters: Math.round(input.accuracyMeters),
      batteryProvided: input.batteryPercent != null,
    });
    return { session: toSafetySession(updated), disclaimer: SAFETY_DISCLAIMER };
  }

  public async triggerSos(
    userId: string,
    sessionId: string,
  ): Promise<SafetySessionResponse> {
    const now = this.clock();
    const session = await this.getActiveOwnedSession(userId, sessionId, now);
    if (session.status === 'sos') {
      return {
        session: toSafetySession(session),
        disclaimer: SAFETY_DISCLAIMER,
      };
    }
    const updated = await this.transition(session, 'sos', now);
    await this.audit('sos_triggered', session.id, userId, now, {});
    return { session: toSafetySession(updated), disclaimer: SAFETY_DISCLAIMER };
  }

  public endSession(
    userId: string,
    sessionId: string,
  ): Promise<SafetySessionResponse> {
    return this.finishSession(userId, sessionId, 'ended');
  }

  public revokeSession(
    userId: string,
    sessionId: string,
  ): Promise<SafetySessionResponse> {
    return this.finishSession(userId, sessionId, 'revoked');
  }

  public async listSessionLocations(
    userId: string,
    sessionId: string,
  ): Promise<{ locations: SafetyLocation[] }> {
    const session = await this.repository.findSession(userId, sessionId);
    if (session === null) {
      throw new AppError('INVALID_REQUEST', 'Safety session was not found.', 404);
    }
    const locations = await this.repository.listSessionLocations(sessionId);
    return { locations };
  }

  public async getPublicShare(
    rawToken: string,
    requesterKey: string,
  ): Promise<SafetyShareResponse> {
    const now = this.clock();
    const limit = this.publicRateLimiter.consume(requesterKey, now);
    if (!limit.allowed) {
      await this.audit('public_share_denied', null, null, now, {
        reason: 'rate_limited',
        retryAfterSeconds: limit.retryAfterSeconds,
      });
      throw new AppError(
        'INVALID_REQUEST',
        'Too many safety-share requests. Try again later.',
        429,
        { retryAfterSeconds: limit.retryAfterSeconds },
      );
    }
    if (!isSafetyShareToken(rawToken)) {
      await this.audit('public_share_denied', null, null, now, {
        reason: 'unavailable',
      });
      throw unavailable('This safety share is unavailable.');
    }

    const session = await this.repository.findSessionByTokenHash(
      hashSafetyShareToken(rawToken),
    );
    if (
      session === null ||
      session.status === 'revoked' ||
      session.status === 'expired' ||
      isSafetyShareExpired(session.shareExpiresAt, now)
    ) {
      await this.audit('public_share_denied', session?.id ?? null, null, now, {
        reason: 'unavailable',
      });
      throw unavailable('This safety share is unavailable.');
    }

    await this.audit('public_share_read', session.id, null, now, {
      hasLastLocation: session.lastLocation !== null,
    });
    return {
      riderDisplayName: session.riderDisplayName,
      status: session.status,
      startedAt: toIso(session.startedAt),
      expectedEndAt:
        session.expectedEndAt === null ? null : toIso(session.expectedEndAt),
      endedAt: session.endedAt === null ? null : toIso(session.endedAt),
      shareExpiresAt: toIso(session.shareExpiresAt),
      sosTriggeredAt:
        session.sosTriggeredAt === null ? null : toIso(session.sosTriggeredAt),
      lastLocation: session.lastLocation,
      locationIsLive: false,
      disclaimer: SAFETY_DISCLAIMER,
    };
  }

  public async runRetentionCleanup(): Promise<SafetyRetentionResult> {
    const now = this.clock();
    const expiring = await this.repository.findSessionsExpiringBefore(now);
    for (const session of expiring) {
      if (session.status !== 'active' && session.status !== 'sos') continue;
      const expired = expireSafetySession(session, session.shareExpiresAt, now);
      await this.repository.updateSessionState(session.id, expired);
      await this.audit('session_expired', session.id, null, now, {});
    }
    const locationsDeleted =
      await this.repository.deleteLocationsRecordedBefore(
        new Date(
          now.getTime() -
            SAFETY_LOCATION_RETENTION_HOURS * HOURS_TO_MILLISECONDS,
        ),
      );
    const sessionsDeleted =
      await this.repository.deleteTerminalSessionsEndedBefore(
        new Date(
          now.getTime() -
            SAFETY_TERMINAL_SESSION_RETENTION_DAYS * DAYS_TO_MILLISECONDS,
        ),
      );
    const auditEntriesDeleted = await this.repository.deleteAuditEntriesBefore(
      new Date(
        now.getTime() - SAFETY_AUDIT_RETENTION_DAYS * DAYS_TO_MILLISECONDS,
      ),
    );
    this.publicRateLimiter.clearExpired(now);
    await this.audit('retention_cleanup', null, null, now, {
      locationsDeleted,
      sessionsDeleted,
      auditEntriesDeleted,
      sessionsExpired: expiring.length,
    });
    return { locationsDeleted, sessionsDeleted, auditEntriesDeleted };
  }

  private async getActiveOwnedSession(
    userId: string,
    sessionId: string,
    now: Date,
  ): Promise<StoredSafetySession> {
    const session = await this.repository.findSession(userId, sessionId);
    if (session === null) throw unavailable();
    if (
      (session.status === 'active' || session.status === 'sos') &&
      isSafetyShareExpired(session.shareExpiresAt, now)
    ) {
      const expired = expireSafetySession(session, session.shareExpiresAt, now);
      await this.repository.updateSessionState(session.id, expired);
      await this.audit('session_expired', session.id, userId, now, {});
      throw unavailable('Safety session has expired.');
    }
    if (session.status !== 'active' && session.status !== 'sos') {
      throw unavailable('Safety session is no longer active.');
    }
    return session;
  }

  private async finishSession(
    userId: string,
    sessionId: string,
    target: 'ended' | 'revoked',
  ): Promise<SafetySessionResponse> {
    const now = this.clock();
    const session = await this.repository.findSession(userId, sessionId);
    if (session === null) throw unavailable();
    if (session.status === target) {
      return {
        session: toSafetySession(session),
        disclaimer: SAFETY_DISCLAIMER,
      };
    }
    if (session.status !== 'active' && session.status !== 'sos') {
      throw unavailable('Safety session is already closed.');
    }
    const updated = await this.transition(session, target, now);
    await this.audit(
      target === 'ended' ? 'session_ended' : 'session_revoked',
      session.id,
      userId,
      now,
      {},
    );
    return { session: toSafetySession(updated), disclaimer: SAFETY_DISCLAIMER };
  }

  private async transition(
    session: StoredSafetySession,
    target: 'sos' | 'ended' | 'revoked',
    now: Date,
  ): Promise<StoredSafetySession> {
    const state = transitionSafetySession(session, target, now);
    return this.repository.updateSessionState(session.id, state);
  }

  private audit(
    action: SafetyAuditAction,
    sessionId: string | null,
    actorUserId: string | null,
    occurredAt: Date,
    metadata: Record<string, string | number | boolean | null>,
  ): Promise<void> {
    return this.repository.appendAudit({
      action,
      sessionId,
      actorUserId,
      occurredAt,
      metadata,
    });
  }
}
