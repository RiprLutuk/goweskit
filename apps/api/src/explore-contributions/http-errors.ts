import { AppError } from '../errors.js';
import { ExploreContributionError } from './domain.js';
import { GpxImportError } from './gpx.js';

export type ExploreContributionHttpErrorCode =
  | 'AUTH_REQUIRED'
  | 'CONTRIBUTION_NOT_FOUND'
  | 'GPX_IMPORT_INVALID'
  | 'GPX_IMPORT_TOO_LARGE'
  | 'INVALID_EXPLORE_CONTRIBUTION'
  | 'INVALID_MODERATION_TRANSITION'
  | 'MODERATOR_REQUIRED'
  | 'PLACE_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'ROUTE_NOT_FOUND';

export class ExploreContributionHttpError extends AppError {
  public constructor(
    code: ExploreContributionHttpErrorCode,
    message: string,
    statusCode: number,
    details: Record<string, unknown> = {},
  ) {
    super(code, message, statusCode, details);
    this.name = 'ExploreContributionHttpError';
  }
}

export function toExploreContributionHttpError(
  error: ExploreContributionError | GpxImportError,
): ExploreContributionHttpError {
  if (error instanceof ExploreContributionError) {
    return new ExploreContributionHttpError(
      error.code,
      error.message,
      error.statusCode,
    );
  }
  return new ExploreContributionHttpError(
    error.code === 'GPX_TOO_LARGE'
      ? 'GPX_IMPORT_TOO_LARGE'
      : 'GPX_IMPORT_INVALID',
    error.message,
    error.code === 'GPX_TOO_LARGE' ? 413 : 400,
    { parserCode: error.code },
  );
}
