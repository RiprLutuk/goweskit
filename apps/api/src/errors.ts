import type { ApiErrorCode } from '@goweskit/contracts';

export class AppError extends Error {
  public constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly statusCode: number,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'AppError';
  }
}
