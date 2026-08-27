import 'dotenv/config';

import { buildApp } from './app.js';
import { readConfig } from './config.js';
import { createDatabase } from './db/client.js';
import { DrizzleAuthRepository } from './repositories/auth-repository.js';
import { DrizzleCatalogRepository } from './repositories/catalog-repository.js';
import { DrizzleExploreRepository } from './repositories/explore-repository.js';
import { DrizzleGarageRepository } from './repositories/garage-repository.js';
import { DrizzleInstalledComponentRepository } from './repositories/installed-component-repository.js';
import { DrizzleMaintenanceRepository } from './repositories/maintenance-repository.js';
import { AuthService } from './services/auth-service.js';
import { CatalogService } from './services/catalog-service.js';
import { CompatibilityService } from './services/compatibility-service.js';
import { ExploreService } from './services/explore-service.js';
import { GarageService } from './services/garage-service.js';
import { InstalledComponentService } from './services/installed-component-service.js';
import { MaintenanceService } from './services/maintenance-service.js';

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
    explore: new ExploreService(
      new DrizzleExploreRepository(databaseClient.database),
    ),
    garage: garageService,
    installedComponents: new InstalledComponentService(
      new DrizzleInstalledComponentRepository(databaseClient.database),
      garageService,
    ),
    maintenance: new MaintenanceService(
      new DrizzleMaintenanceRepository(databaseClient.database),
      garageService,
    ),
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
