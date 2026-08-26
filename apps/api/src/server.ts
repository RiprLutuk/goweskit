import 'dotenv/config';

import { buildApp } from './app.js';
import { readConfig } from './config.js';
import { createDatabase } from './db/client.js';
import { DrizzleAuthRepository } from './repositories/auth-repository.js';
import { DrizzleCatalogRepository } from './repositories/catalog-repository.js';
import { DrizzleGarageRepository } from './repositories/garage-repository.js';
import { AuthService } from './services/auth-service.js';
import { CatalogService } from './services/catalog-service.js';
import { CompatibilityService } from './services/compatibility-service.js';
import { GarageService } from './services/garage-service.js';

const config = readConfig();
const databaseClient = createDatabase(config.databaseUrl);
const garageService = new GarageService(
  new DrizzleGarageRepository(databaseClient.database),
);
const app = buildApp({
  webOrigin: config.webOrigin,
  cookieSecure: config.sessionCookieSecure,
  services: {
    auth: new AuthService(new DrizzleAuthRepository(databaseClient.database)),
    catalog: new CatalogService(
      new DrizzleCatalogRepository(databaseClient.database),
    ),
    compatibility: new CompatibilityService(garageService),
    garage: garageService,
  },
});

app.addHook('onClose', async () => databaseClient.close());

try {
  await app.listen({
    host: '0.0.0.0',
    port: config.apiPort,
  });
} catch (error: unknown) {
  app.log.error(error);
  process.exitCode = 1;
}
