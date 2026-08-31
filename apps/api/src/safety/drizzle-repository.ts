import {
  safetySessionStatusSchema,
  type CreateTrustedContactRequest,
  type SafetyLocation,
  type SafetySessionStatus,
} from '@goweskit/contracts/safety';
import { and, asc, desc, eq, inArray, lt, sql } from 'drizzle-orm';

import type { Database } from '../db/client.js';
import {
  safetyAudits,
  safetyLocations,
  safetySessions,
  trustedContacts,
} from '../db/schema.js';
import { decryptNullable, encryptNullable } from '../crypto/encryption.js';
import { AppError } from '../errors.js';
import type {
  CreateStoredSafetySessionInput,
  SafetyAuditEntry,
  SafetyRepository,
  StoredSafetySession,
  StoredTrustedContact,
} from './repository.js';

interface SafetySessionRow {
  id: string;
  user_id: string;
  rider_display_name: string;
  trusted_contact_id: string | null;
  status: string;
  started_at: Date | string;
  expected_end_at: Date | string | null;
  ended_at: Date | string | null;
  share_token_hash: string;
  share_expires_at: Date | string;
  sos_triggered_at: Date | string | null;
  note: string | null;
  last_longitude: number | string | null;
  last_latitude: number | string | null;
  last_accuracy_meters: number | string | null;
  last_battery_percent: number | string | null;
  last_recorded_at: Date | string | null;
}

const sessionColumns = sql`
  s.id, s.user_id, s.rider_display_name, s.trusted_contact_id, s.status,
  s.started_at, s.expected_end_at, s.ended_at, s.share_token_hash,
  s.share_expires_at, s.sos_triggered_at, s.note,
  ST_X(latest.location::geometry) AS last_longitude,
  ST_Y(latest.location::geometry) AS last_latitude,
  latest.accuracy_meters AS last_accuracy_meters,
  latest.battery_percent AS last_battery_percent,
  latest.recorded_at AS last_recorded_at
`;

const latestLocationJoin = sql`
  LEFT JOIN LATERAL (
    SELECT location, accuracy_meters, battery_percent, recorded_at
    FROM safety_locations
    WHERE session_id = s.id
    ORDER BY recorded_at DESC
    LIMIT 1
  ) latest ON TRUE
`;

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function nullableDate(value: Date | string | null): Date | null {
  return value === null ? null : toDate(value);
}

function requiredDate(value: Date | string | null): Date {
  if (value === null) throw new Error('Safety location timestamp is missing.');
  return toDate(value);
}

function mapSession(row: SafetySessionRow): StoredSafetySession {
  const hasLocation =
    row.last_longitude !== null &&
    row.last_latitude !== null &&
    row.last_accuracy_meters !== null &&
    row.last_recorded_at !== null;
  return {
    id: row.id,
    userId: row.user_id,
    riderDisplayName: row.rider_display_name,
    trustedContactId: row.trusted_contact_id,
    status: safetySessionStatusSchema.parse(row.status),
    startedAt: toDate(row.started_at),
    expectedEndAt: nullableDate(row.expected_end_at),
    endedAt: nullableDate(row.ended_at),
    shareTokenHash: row.share_token_hash,
    shareExpiresAt: toDate(row.share_expires_at),
    sosTriggeredAt: nullableDate(row.sos_triggered_at),
    note: decryptNullable(row.note),
    lastLocation: hasLocation
      ? {
          coordinate: {
            longitude: Number(row.last_longitude),
            latitude: Number(row.last_latitude),
          },
          accuracyMeters: Number(row.last_accuracy_meters),
          batteryPercent:
            row.last_battery_percent === null
              ? null
              : Number(row.last_battery_percent),
          recordedAt: requiredDate(row.last_recorded_at).toISOString(),
        }
      : null,
  };
}

function mapTrustedContact(
  row: typeof trustedContacts.$inferSelect,
): StoredTrustedContact {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    phone: decryptNullable(row.phone),
    email: decryptNullable(row.email),
    note: decryptNullable(row.note),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSafetyRepository implements SafetyRepository {
  public constructor(private readonly database: Database) {}

  public async listTrustedContacts(
    userId: string,
  ): Promise<StoredTrustedContact[]> {
    const rows = await this.database
      .select()
      .from(trustedContacts)
      .where(eq(trustedContacts.userId, userId))
      .orderBy(asc(trustedContacts.name), desc(trustedContacts.createdAt))
      .limit(100);
    return rows.map(mapTrustedContact);
  }

  public async findTrustedContact(
    userId: string,
    contactId: string,
  ): Promise<StoredTrustedContact | null> {
    const [contact] = await this.database
      .select()
      .from(trustedContacts)
      .where(
        and(
          eq(trustedContacts.userId, userId),
          eq(trustedContacts.id, contactId),
        ),
      )
      .limit(1);
    return contact ? mapTrustedContact(contact) : null;
  }

  public async createTrustedContact(
    userId: string,
    input: CreateTrustedContactRequest,
    now: Date,
  ): Promise<StoredTrustedContact> {
    const [contact] = await this.database
      .insert(trustedContacts)
      .values({
        userId,
        name: input.name,
        phone: encryptNullable(input.phone) ?? null,
        email: encryptNullable(input.email) ?? null,
        note: encryptNullable(input.note) ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (contact === undefined)
      throw new Error('Trusted contact insert returned no row.');
    return mapTrustedContact(contact);
  }

  public async deleteTrustedContact(
    userId: string,
    contactId: string,
  ): Promise<boolean> {
    const deleted = await this.database
      .delete(trustedContacts)
      .where(
        and(
          eq(trustedContacts.userId, userId),
          eq(trustedContacts.id, contactId),
        ),
      )
      .returning({ id: trustedContacts.id });
    return deleted.length > 0;
  }

  public async listSessions(userId: string): Promise<StoredSafetySession[]> {
    const result = await this.database.execute(sql`
      SELECT ${sessionColumns}
      FROM safety_sessions s
      ${latestLocationJoin}
      WHERE s.user_id = ${userId}
      ORDER BY s.started_at DESC
      LIMIT 100
    `);
    return (result.rows as unknown as SafetySessionRow[]).map(mapSession);
  }

  public async findSession(
    userId: string,
    sessionId: string,
  ): Promise<StoredSafetySession | null> {
    return this.findOne(sql`s.user_id = ${userId} AND s.id = ${sessionId}`);
  }

  public async findSessionByTokenHash(
    tokenHash: string,
  ): Promise<StoredSafetySession | null> {
    return this.findOne(sql`s.share_token_hash = ${tokenHash}`);
  }

  public async createSession(
    input: CreateStoredSafetySessionInput,
  ): Promise<StoredSafetySession> {
    const [session] = await this.database
      .insert(safetySessions)
      .values({
        userId: input.userId,
        riderDisplayName: input.riderDisplayName,
        trustedContactId: input.trustedContactId,
        status: 'active',
        startedAt: input.startedAt,
        expectedEndAt: input.expectedEndAt,
        endedAt: null,
        shareTokenHash: input.shareTokenHash,
        shareExpiresAt: input.shareExpiresAt,
        sosTriggeredAt: null,
        note: encryptNullable(input.note) ?? null,
      })
      .returning();
    if (session === undefined)
      throw new Error('Safety session insert returned no row.');
    return {
      ...session,
      note: decryptNullable(session.note),
      lastLocation: null,
    };
  }

  public async updateSessionState(
    sessionId: string,
    state: {
      status: SafetySessionStatus;
      sosTriggeredAt: Date | null;
      endedAt: Date | null;
    },
  ): Promise<StoredSafetySession> {
    const [updated] = await this.database
      .update(safetySessions)
      .set(state)
      .where(eq(safetySessions.id, sessionId))
      .returning({ id: safetySessions.id });
    if (updated === undefined)
      throw new Error('Safety session update returned no row.');
    return this.requiredSession(updated.id);
  }

  public async appendLocation(
    sessionId: string,
    location: SafetyLocation,
  ): Promise<StoredSafetySession> {
    const result = await this.database.execute(sql`
      INSERT INTO safety_locations (
        session_id, location, accuracy_meters, battery_percent, recorded_at
      )
      SELECT
        s.id,
        ST_SetSRID(ST_MakePoint(
          ${location.coordinate.longitude}, ${location.coordinate.latitude}
        ), 4326)::geography,
        ${location.accuracyMeters}, ${location.batteryPercent ?? null},
        ${new Date(location.recordedAt)}
      FROM safety_sessions s
      WHERE s.id = ${sessionId}
        AND s.status IN ('active', 'sos')
        AND s.share_expires_at > ${new Date(location.recordedAt)}
      RETURNING id
    `);
    if (result.rows.length === 0) {
      throw new AppError(
        'INVALID_REQUEST',
        'Safety session is no longer active.',
        404,
      );
    }
    return this.requiredSession(sessionId);
  }

  public async listSessionLocations(
    sessionId: string,
  ): Promise<SafetyLocation[]> {
    const result = await this.database.execute(sql`
      SELECT 
        ST_X(location::geometry) AS longitude,
        ST_Y(location::geometry) AS latitude,
        accuracy_meters,
        battery_percent,
        recorded_at
      FROM safety_locations
      WHERE session_id = ${sessionId}
      ORDER BY recorded_at ASC
    `);
    return (
      result.rows as {
        longitude: number | string;
        latitude: number | string;
        accuracy_meters: number | string;
        battery_percent: number | string | null;
        recorded_at: Date | string;
      }[]
    ).map((row) => ({
      coordinate: {
        longitude: Number(row.longitude),
        latitude: Number(row.latitude),
      },
      accuracyMeters: Number(row.accuracy_meters),
      batteryPercent:
        row.battery_percent === null ? null : Number(row.battery_percent),
      recordedAt: new Date(row.recorded_at).toISOString(),
    }));
  }

  public async findSessionsExpiringBefore(
    now: Date,
  ): Promise<StoredSafetySession[]> {
    const result = await this.database.execute(sql`
      SELECT ${sessionColumns}
      FROM safety_sessions s
      ${latestLocationJoin}
      WHERE s.status IN ('active', 'sos') AND s.share_expires_at <= ${now}
      ORDER BY s.share_expires_at
      LIMIT 500
    `);
    return (result.rows as unknown as SafetySessionRow[]).map(mapSession);
  }

  public async appendAudit(entry: SafetyAuditEntry): Promise<void> {
    await this.database.insert(safetyAudits).values(entry);
  }

  public async deleteLocationsRecordedBefore(cutoff: Date): Promise<number> {
    const deleted = await this.database
      .delete(safetyLocations)
      .where(lt(safetyLocations.recordedAt, cutoff))
      .returning({ id: safetyLocations.id });
    return deleted.length;
  }

  public async deleteTerminalSessionsEndedBefore(
    cutoff: Date,
  ): Promise<number> {
    const deleted = await this.database
      .delete(safetySessions)
      .where(
        and(
          inArray(safetySessions.status, ['ended', 'revoked', 'expired']),
          sql`COALESCE(${safetySessions.endedAt}, ${safetySessions.shareExpiresAt}) < ${cutoff}`,
        ),
      )
      .returning({ id: safetySessions.id });
    return deleted.length;
  }

  public async deleteAuditEntriesBefore(cutoff: Date): Promise<number> {
    const deleted = await this.database
      .delete(safetyAudits)
      .where(lt(safetyAudits.occurredAt, cutoff))
      .returning({ id: safetyAudits.id });
    return deleted.length;
  }

  private async findOne(
    condition: ReturnType<typeof sql>,
  ): Promise<StoredSafetySession | null> {
    const result = await this.database.execute(sql`
      SELECT ${sessionColumns}
      FROM safety_sessions s
      ${latestLocationJoin}
      WHERE ${condition}
      LIMIT 1
    `);
    const [row] = result.rows as unknown as SafetySessionRow[];
    return row === undefined ? null : mapSession(row);
  }

  private async requiredSession(
    sessionId: string,
  ): Promise<StoredSafetySession> {
    const session = await this.findOne(sql`s.id = ${sessionId}`);
    if (session === null) throw new Error('Safety session row is missing.');
    return session;
  }
}
