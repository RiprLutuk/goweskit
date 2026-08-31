import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const rootEnvPath = resolve(import.meta.dirname, '../../../../.env');
if (existsSync(rootEnvPath)) process.loadEnvFile(rootEnvPath);

import { readConfig } from '../config.js';
import { createDatabase } from './client.js';
import { migrateEncryptPii } from './migrate-encrypt-pii.js';

async function run(): Promise<void> {
  const config = readConfig();
  const dbClient = createDatabase(config.databaseUrl);

  console.log('🔄 Starting PII Database Encryption Migration...');
  const summary = await migrateEncryptPii(dbClient.database);

  console.log('✅ PII Database Encryption Migration Complete:');
  console.log(`   - Users migrated: ${String(summary.usersMigrated)}`);
  console.log(
    `   - Trusted contacts migrated: ${String(summary.contactsMigrated)}`,
  );
  console.log(
    `   - Safety sessions migrated: ${String(summary.sessionsMigrated)}`,
  );
  console.log(`   - User bikes migrated: ${String(summary.bikesMigrated)}`);

  await dbClient.close();
}

void run().catch((err: unknown) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
