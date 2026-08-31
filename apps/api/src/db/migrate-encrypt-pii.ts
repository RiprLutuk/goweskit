import { eq } from 'drizzle-orm';

import {
  decryptNullable,
  decryptText,
  encryptNullable,
  encryptText,
} from '../crypto/encryption.js';
import type { Database } from './client.js';
import { safetySessions, trustedContacts, userBikes, users } from './schema.js';

export interface PiiMigrationSummary {
  usersMigrated: number;
  contactsMigrated: number;
  sessionsMigrated: number;
  bikesMigrated: number;
}

/**
 * Idempotently scans and encrypts legacy plaintext PII fields across all database tables.
 * Safe to run multiple times. Skips fields already prefixed with enc:v1:cbc:.
 */
export async function migrateEncryptPii(
  database: Database,
): Promise<PiiMigrationSummary> {
  let usersMigrated = 0;
  let contactsMigrated = 0;
  let sessionsMigrated = 0;
  let bikesMigrated = 0;

  // 1. Migrate users.displayName
  const allUsers = await database.select().from(users);
  for (const u of allUsers) {
    if (u.displayName && !u.displayName.startsWith('enc:v1:cbc:')) {
      const plaintext = decryptText(u.displayName);
      const encrypted = encryptText(plaintext);
      await database
        .update(users)
        .set({ displayName: encrypted })
        .where(eq(users.id, u.id));
      usersMigrated += 1;
    }
  }

  // 2. Migrate trusted_contacts (phone, email, note)
  const allContacts = await database.select().from(trustedContacts);
  for (const c of allContacts) {
    const patch: Partial<typeof trustedContacts.$inferInsert> = {};
    let needsUpdate = false;

    if (c.phone && !c.phone.startsWith('enc:v1:cbc:')) {
      const plaintext = decryptNullable(c.phone);
      patch.phone = encryptNullable(plaintext);
      needsUpdate = true;
    }
    if (c.email && !c.email.startsWith('enc:v1:cbc:')) {
      const plaintext = decryptNullable(c.email);
      patch.email = encryptNullable(plaintext);
      needsUpdate = true;
    }
    if (c.note && !c.note.startsWith('enc:v1:cbc:')) {
      const plaintext = decryptNullable(c.note);
      patch.note = encryptNullable(plaintext);
      needsUpdate = true;
    }

    if (needsUpdate) {
      await database
        .update(trustedContacts)
        .set(patch)
        .where(eq(trustedContacts.id, c.id));
      contactsMigrated += 1;
    }
  }

  // 3. Migrate safety_sessions.note
  const allSessions = await database.select().from(safetySessions);
  for (const s of allSessions) {
    if (s.note && !s.note.startsWith('enc:v1:cbc:')) {
      const plaintext = decryptNullable(s.note);
      const encrypted = encryptNullable(plaintext);
      await database
        .update(safetySessions)
        .set({ note: encrypted })
        .where(eq(safetySessions.id, s.id));
      sessionsMigrated += 1;
    }
  }

  // 4. Migrate user_bikes.notes
  const allBikes = await database.select().from(userBikes);
  for (const b of allBikes) {
    if (b.notes && !b.notes.startsWith('enc:v1:cbc:')) {
      const plaintext = decryptNullable(b.notes);
      const encrypted = encryptNullable(plaintext);
      await database
        .update(userBikes)
        .set({ notes: encrypted })
        .where(eq(userBikes.id, b.id));
      bikesMigrated += 1;
    }
  }

  return {
    usersMigrated,
    contactsMigrated,
    sessionsMigrated,
    bikesMigrated,
  };
}
