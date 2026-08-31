import { randomUUID } from 'node:crypto';

import type {
  CreateTrustedContactRequest,
  SafetyLocation,
} from '@goweskit/contracts/safety';
import { safetyShareResponseSchema } from '@goweskit/contracts/safety';
import { describe, expect, it } from 'vitest';

import type {
  CreateStoredSafetySessionInput,
  SafetyAuditEntry,
  SafetyRepository,
  StoredSafetySession,
  StoredTrustedContact,
} from './repository.js';
import { SafetyPublicRateLimiter } from './rate-limiter.js';
import { SafetyService } from './service.js';

class MemorySafetyRepository implements SafetyRepository {
  public readonly contacts: StoredTrustedContact[] = [];
  public readonly sessions: StoredSafetySession[] = [];
  public readonly audits: SafetyAuditEntry[] = [];
  public locationCutoff: Date | null = null;
  public sessionCutoff: Date | null = null;
  public auditCutoff: Date | null = null;

  public listTrustedContacts(userId: string): Promise<StoredTrustedContact[]> {
    return Promise.resolve(
      this.contacts.filter((item) => item.userId === userId),
    );
  }

  public findTrustedContact(
    userId: string,
    contactId: string,
  ): Promise<StoredTrustedContact | null> {
    return Promise.resolve(
      this.contacts.find(
        (item) => item.userId === userId && item.id === contactId,
      ) ?? null,
    );
  }

  public createTrustedContact(
    userId: string,
    input: CreateTrustedContactRequest,
    now: Date,
  ): Promise<StoredTrustedContact> {
    const contact: StoredTrustedContact = {
      id: randomUUID(),
      userId,
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      note: input.note ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.contacts.push(contact);
    return Promise.resolve(contact);
  }

  public deleteTrustedContact(
    userId: string,
    contactId: string,
  ): Promise<boolean> {
    const index = this.contacts.findIndex(
      (item) => item.userId === userId && item.id === contactId,
    );
    if (index === -1) return Promise.resolve(false);
    this.contacts.splice(index, 1);
    return Promise.resolve(true);
  }

  public listSessions(userId: string): Promise<StoredSafetySession[]> {
    return Promise.resolve(
      this.sessions.filter((item) => item.userId === userId),
    );
  }

  public findSession(
    userId: string,
    sessionId: string,
  ): Promise<StoredSafetySession | null> {
    return Promise.resolve(
      this.sessions.find(
        (item) => item.userId === userId && item.id === sessionId,
      ) ?? null,
    );
  }

  public findSessionByTokenHash(
    tokenHash: string,
  ): Promise<StoredSafetySession | null> {
    return Promise.resolve(
      this.sessions.find((item) => item.shareTokenHash === tokenHash) ?? null,
    );
  }

  public createSession(
    input: CreateStoredSafetySessionInput,
  ): Promise<StoredSafetySession> {
    const session: StoredSafetySession = {
      id: randomUUID(),
      ...input,
      status: 'active',
      endedAt: null,
      sosTriggeredAt: null,
      lastLocation: null,
    };
    this.sessions.push(session);
    return Promise.resolve(session);
  }

  public updateSessionState(
    sessionId: string,
    state: Pick<StoredSafetySession, 'status' | 'sosTriggeredAt' | 'endedAt'>,
  ): Promise<StoredSafetySession> {
    const session = this.requiredSession(sessionId);
    Object.assign(session, state);
    return Promise.resolve(session);
  }

  public appendLocation(
    sessionId: string,
    location: SafetyLocation,
  ): Promise<StoredSafetySession> {
    const session = this.requiredSession(sessionId);
    session.lastLocation = location;
    return Promise.resolve(session);
  }

  public listSessionLocations(sessionId: string): Promise<SafetyLocation[]> {
    const session = this.sessions.find((s) => s.id === sessionId);
    return Promise.resolve(session?.lastLocation ? [session.lastLocation] : []);
  }

  public findSessionsExpiringBefore(now: Date): Promise<StoredSafetySession[]> {
    return Promise.resolve(
      this.sessions.filter(
        (item) => item.shareExpiresAt.getTime() <= now.getTime(),
      ),
    );
  }

  public appendAudit(entry: SafetyAuditEntry): Promise<void> {
    this.audits.push(entry);
    return Promise.resolve();
  }

  public deleteLocationsRecordedBefore(cutoff: Date): Promise<number> {
    this.locationCutoff = cutoff;
    return Promise.resolve(2);
  }

  public deleteTerminalSessionsEndedBefore(cutoff: Date): Promise<number> {
    this.sessionCutoff = cutoff;
    return Promise.resolve(3);
  }

  public deleteAuditEntriesBefore(cutoff: Date): Promise<number> {
    this.auditCutoff = cutoff;
    return Promise.resolve(4);
  }

  private requiredSession(sessionId: string): StoredSafetySession {
    const session = this.sessions.find((item) => item.id === sessionId);
    if (session === undefined) throw new Error('Missing memory session.');
    return session;
  }
}

const rider = {
  id: '10000000-0000-4000-8000-000000000001',
  displayName: 'Ayu',
};
const otherUserId = '10000000-0000-4000-8000-000000000002';
const startAt = new Date('2026-08-27T10:00:00.000Z');

async function setup(maxPublicRequests = 30) {
  let now = startAt;
  const repository = new MemorySafetyRepository();
  const service = new SafetyService(
    repository,
    new SafetyPublicRateLimiter(maxPublicRequests, 60),
    () => now,
  );
  const contact = await service.createTrustedContact(rider.id, {
    name: 'Bima',
    phone: '+628123456789',
    email: null,
    note: 'Call if the private link shows SOS.',
  });
  const started = await service.startSession(rider, {
    trustedContactId: contact.id,
    expectedEndAt: '2026-08-27T10:45:00.000Z',
    shareDurationMinutes: 60,
    note: 'Morning loop.',
    explicitLocationConsent: true,
    disclaimerAcknowledged: true,
  });
  return {
    repository,
    service,
    contact,
    started,
    setNow(value: Date) {
      now = value;
    },
  };
}

describe('SafetyService', () => {
  it('keeps contacts owner-scoped and stores only a share-token hash', async () => {
    const context = await setup();

    expect(await context.service.listTrustedContacts(rider.id)).toHaveLength(1);
    expect(await context.service.listTrustedContacts(otherUserId)).toEqual([]);
    const stored = context.repository.sessions[0];
    expect(stored?.shareTokenHash).toHaveLength(64);
    expect(stored?.shareTokenHash).not.toBe(context.started.shareToken);
    expect(JSON.stringify(context.repository.audits)).not.toContain(
      context.started.shareToken,
    );
  });

  it('accepts location only during active/SOS states without auditing coordinates', async () => {
    const context = await setup();
    const sessionId = context.started.session.id;
    const updated = await context.service.updateLocation(rider.id, sessionId, {
      coordinate: { longitude: 107.6191, latitude: -6.9175 },
      accuracyMeters: 12.4,
      batteryPercent: 78,
    });
    expect(updated.session.lastLocation).toMatchObject({
      coordinate: { longitude: 107.6191, latitude: -6.9175 },
    });
    expect(updated.session.lastLocation).not.toHaveProperty('locationIsLive');
    expect(JSON.stringify(context.repository.audits)).not.toContain('107.6191');

    await context.service.endSession(rider.id, sessionId);
    await expect(
      context.service.updateLocation(rider.id, sessionId, {
        coordinate: { longitude: 107.62, latitude: -6.91 },
        accuracyMeters: 20,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('makes SOS deliberate at the service boundary and idempotent', async () => {
    const context = await setup();
    const sessionId = context.started.session.id;

    const first = await context.service.triggerSos(rider.id, sessionId);
    const second = await context.service.triggerSos(rider.id, sessionId);

    expect(first.session.status).toBe('sos');
    expect(second.session.sosTriggeredAt).toBe(first.session.sosTriggeredAt);
    expect(
      context.repository.audits.filter(
        ({ action }) => action === 'sos_triggered',
      ),
    ).toHaveLength(1);
    expect(first.disclaimer.emergencyDispatchProvided).toBe(false);
  });

  it('returns a privacy-safe last-known public share and revokes immediately', async () => {
    const context = await setup();
    await context.service.updateLocation(rider.id, context.started.session.id, {
      coordinate: { longitude: 107.6191, latitude: -6.9175 },
      accuracyMeters: 15,
    });

    const share = await context.service.getPublicShare(
      context.started.shareToken,
      'ip-1',
    );
    expect(safetyShareResponseSchema.parse(share)).toEqual(share);
    expect(share.locationIsLive).toBe(false);
    expect(share).not.toHaveProperty('trustedContact');
    expect(share).not.toHaveProperty('userId');

    await context.service.revokeSession(rider.id, context.started.session.id);
    await expect(
      context.service.getPublicShare(context.started.shareToken, 'ip-2'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects expired, invalid, and abused share access neutrally', async () => {
    const context = await setup(2);
    await expect(
      context.service.getPublicShare('A'.repeat(43), 'attacker'),
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      context.service.getPublicShare('B'.repeat(43), 'attacker'),
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      context.service.getPublicShare('C'.repeat(43), 'attacker'),
    ).rejects.toMatchObject({ statusCode: 429 });

    context.setNow(new Date('2026-08-27T11:00:00.000Z'));
    await expect(
      context.service.getPublicShare(context.started.shareToken, 'fresh-ip'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('expires sessions and applies all bounded retention cutoffs', async () => {
    const context = await setup();
    context.setNow(new Date('2026-08-28T10:00:00.000Z'));

    await expect(context.service.runRetentionCleanup()).resolves.toEqual({
      locationsDeleted: 2,
      sessionsDeleted: 3,
      auditEntriesDeleted: 4,
    });
    expect(context.repository.sessions[0]?.status).toBe('expired');
    expect(context.repository.locationCutoff?.toISOString()).toBe(
      '2026-08-27T10:00:00.000Z',
    );
    expect(context.repository.sessionCutoff?.toISOString()).toBe(
      '2026-07-29T10:00:00.000Z',
    );
    expect(context.repository.auditCutoff?.toISOString()).toBe(
      '2026-05-30T10:00:00.000Z',
    );
  });
});
