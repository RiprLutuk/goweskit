import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema.js';

export function createDatabase(databaseUrl: string) {
  const pool = new Pool({
    application_name: 'goweskit-api',
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5_000,
  });
  const database = drizzle({ client: pool, schema });

  return {
    database,
    close: async () => pool.end(),
    ping: async () => {
      await pool.query('SELECT 1, PostGIS_Version()');
    },
  };
}

export type Database = ReturnType<typeof createDatabase>['database'];
