import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const rootEnvPath = resolve(import.meta.dirname, '../../../../.env');
if (existsSync(rootEnvPath)) process.loadEnvFile(rootEnvPath);

import { readConfig } from '../config.js';
import { createDatabase } from './client.js';
import { users, trustedContacts, userBikes } from './schema.js';
import { decryptNullable, decryptText } from '../crypto/encryption.js';

async function main() {
  const config = readConfig();
  const dbClient = createDatabase(config.databaseUrl);
  const db = dbClient.database;

  console.log('\n======================================================');
  console.log('  🔍 GOWESKIT DATABASE ENCRYPTION INSPECTION');
  console.log('======================================================');

  console.log('\n--- 1. USERS TABLE (display_name Encrypted) ---');
  const userRows = await db.select().from(users).limit(5);
  console.table(
    userRows.map((u) => ({
      email: u.email,
      raw_in_db: u.displayName,
      decrypted: decryptText(u.displayName),
    })),
  );

  console.log(
    '\n--- 2. TRUSTED CONTACTS TABLE (phone, email, note Encrypted) ---',
  );
  const contactRows = await db.select().from(trustedContacts).limit(5);
  console.table(
    contactRows.map((c) => ({
      name: c.name,
      phone_in_db: c.phone,
      phone_decrypted: decryptNullable(c.phone),
      note_in_db: c.note,
      note_decrypted: decryptNullable(c.note),
    })),
  );

  console.log('\n--- 3. USER BIKES TABLE (notes Encrypted) ---');
  const bikeRows = await db.select().from(userBikes).limit(5);
  console.table(
    bikeRows.map((b) => ({
      nickname: b.nickname,
      notes_in_db: b.notes,
      notes_decrypted: decryptNullable(b.notes),
    })),
  );

  await dbClient.close();
}

void main().catch(console.error);
