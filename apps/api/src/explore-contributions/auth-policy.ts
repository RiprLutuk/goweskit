import type { FastifyRequest } from 'fastify';

import { SESSION_COOKIE_NAME } from '../auth/session.js';
import type { AuthService } from '../services/auth-service.js';
import type { DrizzleExploreContributionRepository } from './drizzle-repository.js';
import type {
  ExploreContributionActor,
  ExploreContributionAuthPolicy,
} from './routes.js';

export class SessionExploreContributionAuthPolicy implements ExploreContributionAuthPolicy {
  public constructor(
    private readonly authService: AuthService,
    private readonly repository: Pick<
      DrizzleExploreContributionRepository,
      'hasModeratorAccess'
    >,
  ) {}

  public async authenticate(
    request: FastifyRequest,
  ): Promise<ExploreContributionActor> {
    const user = await this.authService.authenticate(
      request.cookies[SESSION_COOKIE_NAME],
    );
    const moderator = await this.repository.hasModeratorAccess(user.id);
    return { id: user.id, role: moderator ? 'moderator' : 'member' };
  }
}
