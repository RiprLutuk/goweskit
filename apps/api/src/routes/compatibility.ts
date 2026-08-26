import {
  compatibilityEvaluateRequestSchema,
  compatibilityRuleCodeSchema,
  type CompatibilityEvaluationResponse,
  type CompatibilityRule,
  type CompatibilityRuleListResponse,
} from '@goweskit/contracts';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { SESSION_COOKIE_NAME } from '../auth/session.js';
import { parseInput } from '../http/validation.js';
import type { AuthService } from '../services/auth-service.js';
import type { CompatibilityService } from '../services/compatibility-service.js';

const ruleParamsSchema = z.object({ code: compatibilityRuleCodeSchema });

async function authenticate(request: FastifyRequest, authService: AuthService) {
  return authService.authenticate(request.cookies[SESSION_COOKIE_NAME]);
}

export function registerCompatibilityRoutes(
  app: FastifyInstance,
  authService: AuthService,
  compatibilityService: CompatibilityService,
): void {
  app.get<{ Reply: CompatibilityRuleListResponse }>(
    '/api/v1/compatibility/standards',
    () => ({ rules: compatibilityService.listRules() }),
  );

  app.get<{ Reply: CompatibilityRule }>(
    '/api/v1/compatibility/rules/:code',
    (request) => {
      const { code } = parseInput(ruleParamsSchema, request.params);
      return compatibilityService.getRule(code);
    },
  );

  app.post<{ Reply: CompatibilityEvaluationResponse }>(
    '/api/v1/compatibility/evaluate',
    async (request) => {
      const input = parseInput(
        compatibilityEvaluateRequestSchema,
        request.body,
      );
      return compatibilityService.evaluate(
        await authenticate(request, authService),
        input.bikeId,
        input.candidates,
      );
    },
  );
}
