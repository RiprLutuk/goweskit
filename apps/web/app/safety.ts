import { safetyShareTokenSchema } from '@goweskit/contracts/safety';

export const SOS_HOLD_DURATION_MS = 1_600;

export function buildSafetyShareUrl(origin: string, token: string): string {
  const parsedToken = safetyShareTokenSchema.parse(token);
  const normalizedOrigin = origin.replace(/\/$/u, '');
  return `${normalizedOrigin}/safety/share#${parsedToken}`;
}

export function readSafetyShareToken(hash: string): string | null {
  const candidate = hash.startsWith('#') ? hash.slice(1) : hash;
  const result = safetyShareTokenSchema.safeParse(candidate);
  return result.success ? result.data : null;
}

export function formatAccuracy(accuracyMeters: number): string {
  return `±${Math.round(accuracyMeters)} m`;
}
