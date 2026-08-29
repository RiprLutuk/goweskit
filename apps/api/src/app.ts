import { randomUUID } from 'node:crypto';

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import type { ApiErrorResponse } from '@goweskit/contracts';
import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';

import { AppError } from './errors.js';
import type {
  AuthRateLimiter,
  AuthRateLimitScope,
} from './auth/rate-limiter.js';
import type { GoogleIdentityVerifier } from './auth/google-identity.js';
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
import type { OtpService } from './services/otp-service.js';

export interface HealthResponse {
  status: 'ok';
}

export interface ReadinessResponse {
  status: 'degraded' | 'ok';
  checks: {
    database: 'ok' | 'unavailable';
  };
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
  authRateLimiter?: AuthRateLimiter;
  googleIdentityVerifier?: GoogleIdentityVerifier;
  otpService?: OtpService;
  services?: AppServices;
  cookieSecure?: boolean;
  logger?: FastifyServerOptions['logger'];
  readinessCheck?: () => Promise<void>;
  strictTransportSecurity?: boolean;
  trustProxy?: FastifyServerOptions['trustProxy'];
  webOrigin?: string;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? true,
    genReqId: () => randomUUID(),
    trustProxy: options.trustProxy ?? false,
  });

  void app.register(cookie);
  void app.register(cors, {
    origin: options.webOrigin ?? 'http://localhost:3000',
    credentials: true,
  });

  const authMutationScopes = new Map<string, AuthRateLimitScope>([
    ['/api/v1/auth/google', 'google'],
    ['/api/v1/auth/login', 'login'],
    ['/api/v1/auth/otp/send', 'otp'],
    ['/api/v1/auth/register', 'register'],
  ]);
  app.addHook('onRequest', async (request, reply) => {
    if (request.method !== 'POST' || options.authRateLimiter === undefined) {
      return;
    }
    const scope = authMutationScopes.get(request.url.split('?')[0] ?? '');
    if (scope === undefined) return;
    const decision = options.authRateLimiter.consume(
      scope,
      request.ip,
      new Date(),
    );
    if (decision.allowed) return;
    reply.header('retry-after', String(decision.retryAfterSeconds));
    throw new AppError(
      'RATE_LIMITED',
      'Too many authentication attempts. Try again later.',
      429,
      { retryAfterSeconds: decision.retryAfterSeconds },
    );
  });

  app.addHook('onRequest', (request, reply, done) => {
    reply.header('x-request-id', request.id);
    reply.header(
      'content-security-policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    );
    reply.header(
      'permissions-policy',
      'camera=(), microphone=(), geolocation=(self)',
    );
    reply.header('referrer-policy', 'no-referrer');
    reply.header('x-content-type-options', 'nosniff');
    reply.header('x-frame-options', 'DENY');
    reply.header('x-permitted-cross-domain-policies', 'none');
    if (options.strictTransportSecurity === true) {
      reply.header(
        'strict-transport-security',
        'max-age=31536000; includeSubDomains',
      );
    }
    done();
  });

  app.setErrorHandler((error, request, reply) => {
    const appError =
      error instanceof AppError
        ? error
        : new AppError('INTERNAL_ERROR', 'Something went wrong.', 500);

    const routePath =
      request.routeOptions.url ?? request.url.split('?')[0] ?? '';
    const moduleName = routePath.split('/').filter(Boolean)[2] ?? 'root';
    const logContext = {
      errorCode: appError.code,
      module: moduleName,
      statusCode: appError.statusCode,
    };
    if (error instanceof AppError) {
      request.log.warn(logContext, 'Request rejected');
    } else {
      request.log.error(
        { ...logContext, err: error },
        'Unhandled request error',
      );
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

  app.get<{ Reply: ReadinessResponse }>(
    '/health/ready',
    async (request, reply) => {
      try {
        await options.readinessCheck?.();
        return { status: 'ok', checks: { database: 'ok' } };
      } catch (error: unknown) {
        request.log.warn(
          {
            dependency: 'database',
            errorName:
              error instanceof Error ? error.name : 'UnknownReadinessError',
          },
          'Readiness dependency unavailable',
        );
        return reply.status(503).send({
          status: 'degraded',
          checks: { database: 'unavailable' },
        });
      }
    },
  );

  if (options.services !== undefined) {
    registerAuthRoutes(app, {
      authService: options.services.auth,
      cookieSecure: options.cookieSecure ?? false,
      ...(options.googleIdentityVerifier === undefined
        ? {}
        : { googleIdentityVerifier: options.googleIdentityVerifier }),
      ...(options.otpService === undefined
        ? {}
        : { otpService: options.otpService }),
    });
    registerLearnRoutes(app, options.services.catalog, options.services.auth);
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
