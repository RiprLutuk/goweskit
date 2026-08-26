import { randomUUID } from 'node:crypto';

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import type { ApiErrorResponse } from '@goweskit/contracts';
import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';

import { AppError } from './errors.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerCompatibilityRoutes } from './routes/compatibility.js';
import { registerGarageRoutes } from './routes/garage.js';
import { registerLearnRoutes } from './routes/learn.js';
import type { AuthService } from './services/auth-service.js';
import type { CatalogService } from './services/catalog-service.js';
import type { CompatibilityService } from './services/compatibility-service.js';
import type { GarageService } from './services/garage-service.js';

export interface HealthResponse {
  status: 'ok';
}

export interface AppServices {
  auth: AuthService;
  catalog: CatalogService;
  compatibility: CompatibilityService;
  garage: GarageService;
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
      request.log.error({ error }, 'Unhandled request error');
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
    registerCompatibilityRoutes(
      app,
      options.services.auth,
      options.services.compatibility,
    );
  }

  return app;
}
