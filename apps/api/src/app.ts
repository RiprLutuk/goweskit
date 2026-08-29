import { randomUUID } from 'node:crypto';

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import type { ApiErrorResponse } from '@goweskit/contracts';
import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';

import { AppError } from './errors.js';
import type { ExploreContributionService } from './explore-contributions/service.js';
import {
  registerExploreContributionRoutes,
  type ExploreContributionAuthPolicy,
  type ExploreContributionRateLimitPolicy,
} from './explore-contributions/routes.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerCompatibilityRoutes } from './routes/compatibility.js';
import { registerCommunityRoutes } from './routes/community.js';
import { registerExploreRoutes } from './routes/explore.js';
import { registerGarageRoutes } from './routes/garage.js';
import { registerInstalledComponentRoutes } from './routes/installed-components.js';
import { registerLearnRoutes } from './routes/learn.js';
import { registerMaintenanceRoutes } from './routes/maintenance.js';
import { registerSafetyRoutes } from './routes/safety.js';
import { registerSavedItemRoutes } from './routes/saved-items.js';
import type { SafetyService } from './safety/service.js';
import type { AuthService } from './services/auth-service.js';
import type { CatalogService } from './services/catalog-service.js';
import type { CompatibilityService } from './services/compatibility-service.js';
import type { CommunityService } from './services/community-service.js';
import type { ExploreService } from './services/explore-service.js';
import type { GarageService } from './services/garage-service.js';
import type { InstalledComponentService } from './services/installed-component-service.js';
import type { MaintenanceService } from './services/maintenance-service.js';
import type { SavedItemService } from './services/saved-item-service.js';

export interface HealthResponse {
  status: 'ok';
}

export interface AppServices {
  auth: AuthService;
  catalog: CatalogService;
  compatibility: CompatibilityService;
  community: CommunityService;
  explore: ExploreService;
  garage: GarageService;
  installedComponents: InstalledComponentService;
  maintenance: MaintenanceService;
  safety?: SafetyService;
  savedItems?: SavedItemService;
  exploreContributions?: {
    service: ExploreContributionService;
    authPolicy: ExploreContributionAuthPolicy;
    rateLimitPolicy: ExploreContributionRateLimitPolicy;
  };
}

export interface BuildAppOptions {
  services?: AppServices;
  cookieSecure?: boolean;
  logger?: FastifyServerOptions['logger'];
  webOrigin?: string;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? true,
    genReqId: () => randomUUID(),
  });

  void app.register(cookie);
  void app.register(cors, {
    origin: options.webOrigin ?? 'http://localhost:3000',
    credentials: true,
  });

  app.addHook('onRequest', (request, reply, done) => {
    reply.header('x-request-id', request.id);
    done();
  });

  app.setErrorHandler((error, request, reply) => {
    const appError =
      error instanceof AppError
        ? error
        : new AppError('INTERNAL_ERROR', 'Something went wrong.', 500);

    if (!(error instanceof AppError)) {
      request.log.error({ err: error }, 'Unhandled request error');
    }

    const response: ApiErrorResponse = {
      error: {
        code: appError.code,
        message: appError.message,
        details: appError.details,
      },
      requestId: request.id,
    };
    return reply.status(appError.statusCode).send(response);
  });

  app.get<{ Reply: HealthResponse }>(
    '/health',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            additionalProperties: false,
            required: ['status'],
            properties: {
              status: { type: 'string', const: 'ok' },
            },
          },
        },
      },
    },
    () => ({ status: 'ok' }),
  );

  if (options.services !== undefined) {
    registerAuthRoutes(app, {
      authService: options.services.auth,
      cookieSecure: options.cookieSecure ?? false,
    });
    registerLearnRoutes(app, options.services.catalog);
    registerGarageRoutes(app, options.services.auth, options.services.garage);
    registerInstalledComponentRoutes(
      app,
      options.services.auth,
      options.services.installedComponents,
    );
    registerCompatibilityRoutes(
      app,
      options.services.auth,
      options.services.compatibility,
    );
    registerCommunityRoutes(
      app,
      options.services.auth,
      options.services.community,
    );
    registerExploreRoutes(app, options.services.explore);
    if (options.services.exploreContributions !== undefined) {
      registerExploreContributionRoutes(
        app,
        options.services.exploreContributions.service,
        {
          authPolicy: options.services.exploreContributions.authPolicy,
          rateLimitPolicy:
            options.services.exploreContributions.rateLimitPolicy,
        },
      );
    }
    registerMaintenanceRoutes(
      app,
      options.services.auth,
      options.services.maintenance,
    );
    if (options.services.safety !== undefined) {
      registerSafetyRoutes(app, options.services.auth, options.services.safety);
    }
    if (options.services.savedItems !== undefined) {
      registerSavedItemRoutes(
        app,
        options.services.auth,
        options.services.savedItems,
      );
    }
  }

  return app;
}
