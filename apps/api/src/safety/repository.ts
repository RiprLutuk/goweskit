import type {
  CreateTrustedContactRequest,
  SafetyLocation,
  SafetySessionStatus,
} from '@goweskit/contracts/safety';

export interface StoredTrustedContact {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
  email: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredSafetySession {
  id: string;
  userId: string;
  riderDisplayName: string;
  trustedContactId: string | null;
  status: SafetySessionStatus;
  startedAt: Date;
  expectedEndAt: Date | null;
  endedAt: Date | null;
  shareTokenHash: string;
  shareExpiresAt: Date;
  sosTriggeredAt: Date | null;
  note: string | null;
  lastLocation: SafetyLocation | null;
}

export type SafetyAuditAction =
  | 'trusted_contact_created'
  | 'trusted_contact_deleted'
  | 'session_started'
  | 'location_updated'
  | 'sos_triggered'
  | 'session_ended'
  | 'session_revoked'
  | 'public_share_read'
  | 'public_share_denied'
  | 'session_expired'
  | 'retention_cleanup';

export interface SafetyAuditEntry {
  action: SafetyAuditAction;
  sessionId: string | null;
  actorUserId: string | null;
  occurredAt: Date;
  metadata: Record<string, string | number | boolean | null>;
}

export interface CreateStoredSafetySessionInput {
  userId: string;
  riderDisplayName: string;
  trustedContactId: string;
  startedAt: Date;
  expectedEndAt: Date | null;
  shareTokenHash: string;
  shareExpiresAt: Date;
  note: string | null;
}

export interface SafetyRetentionResult {
  locationsDeleted: number;
  sessionsDeleted: number;
  auditEntriesDeleted: number;
}

export interface SafetyRepository {
  listTrustedContacts(userId: string): Promise<StoredTrustedContact[]>;
  findTrustedContact(
    userId: string,
    contactId: string,
  ): Promise<StoredTrustedContact | null>;
  createTrustedContact(
    userId: string,
    input: CreateTrustedContactRequest,
    now: Date,
  ): Promise<StoredTrustedContact>;
  deleteTrustedContact(userId: string, contactId: string): Promise<boolean>;

  listSessions(userId: string): Promise<StoredSafetySession[]>;
  findSession(
    userId: string,
    sessionId: string,
  ): Promise<StoredSafetySession | null>;
  findSessionByTokenHash(
    tokenHash: string,
  ): Promise<StoredSafetySession | null>;
  createSession(
    input: CreateStoredSafetySessionInput,
  ): Promise<StoredSafetySession>;
  updateSessionState(
    sessionId: string,
    state: {
      status: SafetySessionStatus;
      sosTriggeredAt: Date | null;
      endedAt: Date | null;
    },
  ): Promise<StoredSafetySession>;
  appendLocation(
    sessionId: string,
    location: SafetyLocation,
  ): Promise<StoredSafetySession>;
  findSessionsExpiringBefore(now: Date): Promise<StoredSafetySession[]>;

  appendAudit(entry: SafetyAuditEntry): Promise<void>;
  deleteLocationsRecordedBefore(cutoff: Date): Promise<number>;
  deleteTerminalSessionsEndedBefore(cutoff: Date): Promise<number>;
  deleteAuditEntriesBefore(cutoff: Date): Promise<number>;
}
