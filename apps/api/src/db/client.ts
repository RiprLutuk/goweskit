import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema.js';

export function createDatabase(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  const database = drizzle({ client: pool, schema });

  return {
    database,
    close: async () => pool.end(),
  };
}

export type Database = ReturnType<typeof createDatabase>['database'];
