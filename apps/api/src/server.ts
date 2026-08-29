import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const rootEnvPath = resolve(import.meta.dirname, '../../../.env');
if (existsSync(rootEnvPath)) process.loadEnvFile(rootEnvPath);

import { buildApp } from './app.js';
import { readConfig } from './config.js';
import { createDatabase } from './db/client.js';
import { DrizzleAuthRepository } from './repositories/auth-repository.js';
import { DrizzleCatalogRepository } from './repositories/catalog-repository.js';
import { DrizzleCommunityRepository } from './repositories/community-repository.js';
import { DrizzleExploreRepository } from './repositories/explore-repository.js';
import { SessionExploreContributionAuthPolicy } from './explore-contributions/auth-policy.js';
import { DrizzleExploreContributionRepository } from './explore-contributions/drizzle-repository.js';
import { ExploreContributionRateLimiter } from './explore-contributions/rate-limiter.js';
import { ExploreContributionService } from './explore-contributions/service.js';
import { DrizzleGarageRepository } from './repositories/garage-repository.js';
import { DrizzleInstalledComponentRepository } from './repositories/installed-component-repository.js';
import { DrizzleMaintenanceRepository } from './repositories/maintenance-repository.js';
import { DrizzleSavedItemRepository } from './repositories/saved-item-repository.js';
import { DrizzleSafetyRepository } from './safety/drizzle-repository.js';
import { SafetyPublicRateLimiter } from './safety/rate-limiter.js';
import { SafetyService } from './safety/service.js';
import {
  SAFETY_PUBLIC_RATE_LIMIT_REQUESTS,
  SAFETY_PUBLIC_RATE_LIMIT_WINDOW_SECONDS,
} from '@goweskit/contracts/safety';
import { AuthService } from './services/auth-service.js';
import { CatalogService } from './services/catalog-service.js';
import { CompatibilityService } from './services/compatibility-service.js';
import { CommunityService } from './services/community-service.js';
import { ExploreService } from './services/explore-service.js';
import { GarageService } from './services/garage-service.js';
import { InstalledComponentService } from './services/installed-component-service.js';
import { MaintenanceService } from './services/maintenance-service.js';
import { SavedItemService } from './services/saved-item-service.js';

const config = readConfig();
const databaseClient = createDatabase(config.databaseUrl);
const authService = new AuthService(
  new DrizzleAuthRepository(databaseClient.database),
);
const garageService = new GarageService(
  new DrizzleGarageRepository(databaseClient.database),
);
const exploreContributionRepository = new DrizzleExploreContributionRepository(
  databaseClient.database,
);
const safetyService = new SafetyService(
  new DrizzleSafetyRepository(databaseClient.database),
  new SafetyPublicRateLimiter(
    SAFETY_PUBLIC_RATE_LIMIT_REQUESTS,
    SAFETY_PUBLIC_RATE_LIMIT_WINDOW_SECONDS,
  ),
);
const app = buildApp({
  webOrigin: config.webOrigin,
  cookieSecure: config.sessionCookieSecure,
  services: {
    auth: authService,
    catalog: new CatalogService(
      new DrizzleCatalogRepository(databaseClient.database),
    ),
    compatibility: new CompatibilityService(garageService),
    community: new CommunityService(
      new DrizzleCommunityRepository(databaseClient.database),
    ),
    explore: new ExploreService(
      new DrizzleExploreRepository(databaseClient.database),
    ),
    exploreContributions: {
      service: new ExploreContributionService(exploreContributionRepository),
      authPolicy: new SessionExploreContributionAuthPolicy(
        authService,
        exploreContributionRepository,
      ),
      rateLimitPolicy: new ExploreContributionRateLimiter(),
    },
    garage: garageService,
    installedComponents: new InstalledComponentService(
      new DrizzleInstalledComponentRepository(databaseClient.database),
      garageService,
    ),
    maintenance: new MaintenanceService(
      new DrizzleMaintenanceRepository(databaseClient.database),
      garageService,
    ),
    safety: safetyService,
    savedItems: new SavedItemService(
      new DrizzleSavedItemRepository(databaseClient.database),
    ),
  },
});

let safetyCleanupRunning = false;
const safetyCleanupInterval = setInterval(
  () => {
    if (safetyCleanupRunning) return;
    safetyCleanupRunning = true;
    void safetyService
      .runRetentionCleanup()
      .catch((error: unknown) => {
        app.log.error({ err: error }, 'Ride Safety retention cleanup failed');
      })
      .finally(() => {
        safetyCleanupRunning = false;
      });
  },
  60 * 60 * 1000,
);
safetyCleanupInterval.unref();

app.addHook('onClose', async () => {
  clearInterval(safetyCleanupInterval);
  await databaseClient.close();
});

try {
  await safetyService.runRetentionCleanup();
  await app.listen({
    host: '0.0.0.0',
    port: config.apiPort,
  });
} catch (error: unknown) {
  app.log.error(error);
  process.exitCode = 1;
}
