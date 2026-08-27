import { describe, expect, it } from 'vitest';

import {
  SAFETY_DISCLAIMER,
  SAFETY_LOCATION_MAX_ACCURACY_METERS,
  SAFETY_SESSION_STATUSES,
  SAFETY_SHARE_MAX_DURATION_MINUTES,
  SAFETY_SHARE_MIN_DURATION_MINUTES,
  SAFETY_SHARE_TOKEN_LENGTH,
  safetyLocationUpdateRequestSchema,
  safetyShareResponseSchema,
  safetyShareTokenSchema,
  startSafetySessionRequestSchema,
} from './safety.js';

const validStartRequest = {
  trustedContactId: '019c9c80-2896-7593-bd02-509894b90005',
  expectedEndAt: '2026-08-27T13:00:00.000Z',
  shareDurationMinutes: 180,
  note: 'Morning loop; call me if this link shows SOS.',
  explicitLocationConsent: true,
  disclaimerAcknowledged: true,
} as const;

const validPublicShare = {
  riderDisplayName: 'Ayu',
  status: 'active',
  startedAt: '2026-08-27T10:00:00.000Z',
  expectedEndAt: '2026-08-27T13:00:00.000Z',
  endedAt: null,
  shareExpiresAt: '2026-08-27T14:00:00.000Z',
  sosTriggeredAt: null,
  lastLocation: {
    coordinate: { longitude: 107.6191, latitude: -6.9175 },
    accuracyMeters: 12.5,
    batteryPercent: 74,
    recordedAt: '2026-08-27T10:30:00.000Z',
  },
  locationIsLive: false,
  disclaimer: SAFETY_DISCLAIMER,
} as const;

describe('Ride Safety contracts', () => {
  it('requires explicit tracking consent and disclaimer acknowledgement', () => {
    expect(
      startSafetySessionRequestSchema.safeParse(validStartRequest).success,
    ).toBe(true);
    expect(
      startSafetySessionRequestSchema.safeParse({
        ...validStartRequest,
        explicitLocationConsent: false,
      }).success,
    ).toBe(false);
    expect(
      startSafetySessionRequestSchema.safeParse({
        ...validStartRequest,
        disclaimerAcknowledged: false,
      }).success,
    ).toBe(false);
  });

  it('requires a bounded mandatory share duration', () => {
    expect(
      startSafetySessionRequestSchema.safeParse({
        ...validStartRequest,
        shareDurationMinutes: SAFETY_SHARE_MIN_DURATION_MINUTES,
      }).success,
    ).toBe(true);
    expect(
      startSafetySessionRequestSchema.safeParse({
        ...validStartRequest,
        shareDurationMinutes: SAFETY_SHARE_MAX_DURATION_MINUTES,
      }).success,
    ).toBe(true);

    for (const shareDurationMinutes of [
      undefined,
      SAFETY_SHARE_MIN_DURATION_MINUTES - 1,
      SAFETY_SHARE_MAX_DURATION_MINUTES + 1,
      15.5,
    ]) {
      expect(
        startSafetySessionRequestSchema.safeParse({
          ...validStartRequest,
          shareDurationMinutes,
        }).success,
      ).toBe(false);
    }
  });

  it('accepts all explicit session states', () => {
    expect(SAFETY_SESSION_STATUSES).toEqual([
      'active',
      'sos',
      'ended',
      'revoked',
      'expired',
    ]);
    for (const status of SAFETY_SESSION_STATUSES) {
      expect(
        safetyShareResponseSchema.safeParse({
          ...validPublicShare,
          status,
        }).success,
      ).toBe(true);
    }
  });

  it('bounds coordinates, accuracy, and battery percentage', () => {
    expect(
      safetyLocationUpdateRequestSchema.safeParse({
        coordinate: { longitude: -180, latitude: 90 },
        accuracyMeters: SAFETY_LOCATION_MAX_ACCURACY_METERS,
        batteryPercent: 0,
      }).success,
    ).toBe(true);
    expect(
      safetyLocationUpdateRequestSchema.safeParse({
        coordinate: { longitude: 180, latitude: -90 },
        accuracyMeters: 0,
        batteryPercent: 100,
      }).success,
    ).toBe(true);

    for (const input of [
      {
        coordinate: { longitude: 180.1, latitude: 0 },
        accuracyMeters: 10,
      },
      {
        coordinate: { longitude: 0, latitude: -90.1 },
        accuracyMeters: 10,
      },
      {
        coordinate: { longitude: 0, latitude: 0 },
        accuracyMeters: -1,
      },
      {
        coordinate: { longitude: 0, latitude: 0 },
        accuracyMeters: SAFETY_LOCATION_MAX_ACCURACY_METERS + 1,
      },
      {
        coordinate: { longitude: 0, latitude: 0 },
        accuracyMeters: 10,
        batteryPercent: 101,
      },
    ]) {
      expect(safetyLocationUpdateRequestSchema.safeParse(input).success).toBe(
        false,
      );
    }
  });

  it('accepts only an unpadded 32-byte base64url token shape', () => {
    const token = 'A'.repeat(SAFETY_SHARE_TOKEN_LENGTH);
    expect(safetyShareTokenSchema.safeParse(token).success).toBe(true);
    expect(safetyShareTokenSchema.safeParse(`${token}=`).success).toBe(false);
    expect(safetyShareTokenSchema.safeParse('A+/='.repeat(11)).success).toBe(
      false,
    );
  });

  it('keeps the public share response last-known and rejects secret fields', () => {
    expect(safetyShareResponseSchema.safeParse(validPublicShare).success).toBe(
      true,
    );
    expect(validPublicShare.locationIsLive).toBe(false);
    expect(validPublicShare.disclaimer.emergencyDispatchProvided).toBe(false);

    expect(
      safetyShareResponseSchema.safeParse({
        ...validPublicShare,
        userId: '019c9c80-2896-7593-bd02-509894b90003',
      }).success,
    ).toBe(false);
    expect(
      safetyShareResponseSchema.safeParse({
        ...validPublicShare,
        shareTokenHash: 'secret-hash',
      }).success,
    ).toBe(false);
    expect(
      safetyShareResponseSchema.safeParse({
        ...validPublicShare,
        trustedContact: { email: 'private@example.com' },
      }).success,
    ).toBe(false);
  });
});
