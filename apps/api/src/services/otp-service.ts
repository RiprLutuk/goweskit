import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import type { SendOtpRequest, SendOtpResponse } from '@goweskit/contracts';

import { AppError } from '../errors.js';
import { type EmailWorker } from '../mail/email-worker.js';
import { buildOtpEmailHtml } from '../mail/templates/otp-email.js';

interface OtpRecord {
  codeHash: Buffer;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

interface RecipientRateLimit {
  count: number;
  resetsAt: number;
}

export const OTP_EXPIRATION_SECONDS = 300;
export const OTP_RESEND_COOLDOWN_SECONDS = 30;
export const MAX_OTP_ATTEMPTS = 5;
export const MAX_OTP_RECORDS = 10_000;
export const MAX_RECIPIENT_SENDS_PER_HOUR = 5;
const RECIPIENT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
type OtpPurpose = 'register' | 'reset_password';

export interface OtpServiceOptions {
  allowTestCode?: boolean;
  emailWorker?: EmailWorker;
  enabled?: boolean;
  exposeCode?: boolean;
  hashSecret?: string;
  maxRecords?: number;
}

export class OtpService {
  private readonly store = new Map<string, OtpRecord>();
  private readonly recipientRateLimits = new Map<string, RecipientRateLimit>();
  private readonly allowTestCode: boolean;
  private readonly emailWorker: EmailWorker | undefined;
  private readonly enabled: boolean;
  private readonly exposeCode: boolean;
  private readonly hashSecret: string | undefined;
  private readonly maxRecords: number;

  public constructor(options: OtpServiceOptions = {}) {
    this.allowTestCode = options.allowTestCode ?? false;
    this.emailWorker = options.emailWorker;
    this.enabled = options.enabled ?? false;
    this.exposeCode = options.exposeCode ?? false;
    this.hashSecret = options.hashSecret;
    this.maxRecords = options.maxRecords ?? MAX_OTP_RECORDS;

    if (this.maxRecords < 1 || !Number.isInteger(this.maxRecords)) {
      throw new Error('OTP max records must be a positive integer.');
    }
    if (this.enabled && this.hashSecret === undefined) {
      throw new Error('OTP hash secret is required when OTP is enabled.');
    }
    if (this.hashSecret !== undefined && this.hashSecret.length < 32) {
      throw new Error('OTP hash secret must contain at least 32 characters.');
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /** Generates, stores, and delivers a purpose-bound OTP before success. */
  public async sendOtp(input: SendOtpRequest): Promise<SendOtpResponse> {
    this.assertEnabled();
    const normalizedEmail = input.email.trim().toLowerCase();
    const recipientKey = this.recipientKey(normalizedEmail);
    const recordKey = this.recordKey(recipientKey, input.purpose);
    const now = Date.now();
    this.cleanupExpired(now);

    const existing = this.store.get(recordKey);
    if (existing !== undefined) {
      const elapsedSinceLastSend = Math.floor(
        (now - existing.lastSentAt) / 1000,
      );
      if (elapsedSinceLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
        const waitTime = OTP_RESEND_COOLDOWN_SECONDS - elapsedSinceLastSend;
        throw new AppError(
          'OTP_RATE_LIMITED',
          `Silakan tunggu ${String(waitTime)} detik sebelum meminta kode OTP baru.`,
          429,
        );
      }
    }

    this.consumeRecipientQuota(recipientKey, now);
    if (existing === undefined && this.store.size >= this.maxRecords) {
      throw new AppError(
        'OTP_RATE_LIMITED',
        'Terlalu banyak permintaan OTP. Silakan coba lagi nanti.',
        429,
      );
    }

    const code = randomInt(100_000, 1_000_000).toString();
    const expiresAt = now + OTP_EXPIRATION_SECONDS * 1000;

    this.store.set(recordKey, {
      codeHash: this.hashCode(recordKey, code),
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    });

    if (this.emailWorker !== undefined) {
      const { html, text } = buildOtpEmailHtml(code);
      try {
        await this.emailWorker.send({
          to: normalizedEmail,
          subject: '[GowesKit] Kode Verifikasi OTP Anda',
          html,
          text,
        });
      } catch {
        this.store.delete(recordKey);
        throw new AppError(
          'OTP_DELIVERY_FAILED',
          'Kode OTP tidak dapat dikirim. Silakan coba lagi nanti.',
          503,
        );
      }
    }

    return {
      success: true,
      message:
        this.emailWorker === undefined
          ? `Kode verifikasi OTP 6-digit tersedia untuk ${normalizedEmail}.`
          : `Kode verifikasi OTP 6-digit telah dikirim ke ${normalizedEmail}.`,
      expiresInSeconds: OTP_EXPIRATION_SECONDS,
      ...(this.exposeCode ? { demoOtp: code } : {}),
    };
  }

  /** Verifies and consumes an OTP only for the requested purpose. */
  public verifyOtp(email: string, code: string, purpose: OtpPurpose): boolean {
    this.assertEnabled();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();
    const recipientKey = this.recipientKey(normalizedEmail);
    const recordKey = this.recordKey(recipientKey, purpose);
    this.cleanupExpired(Date.now());

    if (this.allowTestCode && trimmedCode === '123456') {
      return true;
    }

    const record = this.store.get(recordKey);
    if (record === undefined) {
      throw new AppError(
        'OTP_NOT_FOUND',
        'Kode OTP tidak ditemukan atau sudah kedaluwarsa. Silakan minta kode baru.',
        400,
      );
    }

    if (Date.now() > record.expiresAt) {
      this.store.delete(recordKey);
      throw new AppError(
        'OTP_EXPIRED',
        'Kode OTP telah kedaluwarsa. Silakan minta kode baru.',
        400,
      );
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      this.store.delete(recordKey);
      throw new AppError(
        'OTP_MAX_ATTEMPTS_EXCEEDED',
        'Terlalu banyak percobaan salah. Silakan minta kode OTP baru.',
        400,
      );
    }

    const suppliedHash = this.hashCode(recordKey, trimmedCode);
    if (!timingSafeEqual(record.codeHash, suppliedHash)) {
      record.attempts += 1;
      const remaining = MAX_OTP_ATTEMPTS - record.attempts;
      if (remaining === 0) {
        this.store.delete(recordKey);
        throw new AppError(
          'OTP_MAX_ATTEMPTS_EXCEEDED',
          'Terlalu banyak percobaan salah. Silakan minta kode OTP baru.',
          400,
        );
      }
      throw new AppError(
        'OTP_INVALID',
        `Kode OTP salah. Sisa ${String(remaining)} kesempatan percobaan.`,
        400,
      );
    }

    this.store.delete(recordKey);
    return true;
  }

  private assertEnabled(): void {
    if (!this.enabled) {
      throw new AppError(
        'OTP_UNAVAILABLE',
        'Email OTP is not configured. Continue with Google or password sign-in.',
        503,
      );
    }
  }

  private cleanupExpired(now: number): void {
    for (const [key, record] of this.store) {
      if (now > record.expiresAt) this.store.delete(key);
    }
    for (const [email, rateLimit] of this.recipientRateLimits) {
      if (now >= rateLimit.resetsAt) this.recipientRateLimits.delete(email);
    }
  }

  private consumeRecipientQuota(recipientKey: string, now: number): void {
    const current = this.recipientRateLimits.get(recipientKey);
    if (current !== undefined && now < current.resetsAt) {
      if (current.count >= MAX_RECIPIENT_SENDS_PER_HOUR) {
        throw new AppError(
          'OTP_RATE_LIMITED',
          'Terlalu banyak kode OTP dikirim ke alamat ini. Silakan coba lagi nanti.',
          429,
        );
      }
      current.count += 1;
      return;
    }

    if (this.recipientRateLimits.size >= this.maxRecords) {
      throw new AppError(
        'OTP_RATE_LIMITED',
        'Terlalu banyak permintaan OTP. Silakan coba lagi nanti.',
        429,
      );
    }
    this.recipientRateLimits.set(recipientKey, {
      count: 1,
      resetsAt: now + RECIPIENT_RATE_LIMIT_WINDOW_MS,
    });
  }

  private hashCode(recordKey: string, code: string): Buffer {
    return createHmac('sha256', this.hashSecret ?? '')
      .update(recordKey)
      .update(':')
      .update(code)
      .digest();
  }

  private recipientKey(email: string): string {
    return createHmac('sha256', this.hashSecret ?? '')
      .update('recipient:')
      .update(email)
      .digest('base64url');
  }

  private recordKey(recipientKey: string, purpose: OtpPurpose): string {
    return `${purpose}:${recipientKey}`;
  }
}
