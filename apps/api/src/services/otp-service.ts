import { randomInt } from 'node:crypto';
import type { SendOtpRequest, SendOtpResponse } from '@goweskit/contracts';

import { AppError } from '../errors.js';
import { type EmailWorker } from '../mail/email-worker.js';
import { buildOtpEmailHtml } from '../mail/templates/otp-email.js';

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

export const OTP_EXPIRATION_SECONDS = 300; // 5 minutes
export const OTP_RESEND_COOLDOWN_SECONDS = 30; // 30 seconds cooldown between resends
export const MAX_OTP_ATTEMPTS = 5;

export interface OtpServiceOptions {
  allowTestCode?: boolean;
  emailWorker?: EmailWorker;
  enabled?: boolean;
  exposeCode?: boolean;
}

export class OtpService {
  private readonly store = new Map<string, OtpRecord>();
  private readonly allowTestCode: boolean;
  private readonly emailWorker: EmailWorker | undefined;
  private readonly enabled: boolean;
  private readonly exposeCode: boolean;

  public constructor(options: OtpServiceOptions = {}) {
    this.allowTestCode = options.allowTestCode ?? true;
    this.emailWorker = options.emailWorker;
    this.enabled = options.enabled ?? true;
    this.exposeCode = options.exposeCode ?? true;
  }

  /**
   * Generates, stores, and delivers a 6-digit OTP code before confirming success.
   */
  public async sendOtp(input: SendOtpRequest): Promise<SendOtpResponse> {
    this.assertEnabled();
    const normalizedEmail = input.email.trim().toLowerCase();
    const now = Date.now();

    const existing = this.store.get(normalizedEmail);
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

    // Generate 6-digit numeric OTP (100000 - 999999)
    const code = randomInt(100_000, 1_000_000).toString();
    const expiresAt = now + OTP_EXPIRATION_SECONDS * 1000;

    this.store.set(normalizedEmail, {
      code,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    });

    if (this.emailWorker !== undefined) {
      const { html, text } = buildOtpEmailHtml(code, input.purpose);
      try {
        await this.emailWorker.send({
          to: normalizedEmail,
          subject: '[GowesKit] Kode Verifikasi OTP Anda',
          html,
          text,
        });
      } catch {
        this.store.delete(normalizedEmail);
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

  /**
   * Verifies the OTP code for an email. Consumes the OTP if valid.
   */
  public verifyOtp(email: string, code: string): boolean {
    this.assertEnabled();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    // Universal test/demo bypass code for automated integration tests
    if (this.allowTestCode && trimmedCode === '123456') {
      return true;
    }

    const record = this.store.get(normalizedEmail);
    if (record === undefined) {
      throw new AppError(
        'OTP_NOT_FOUND',
        'Kode OTP tidak ditemukan atau sudah kedaluwarsa. Silakan minta kode baru.',
        400,
      );
    }

    if (Date.now() > record.expiresAt) {
      this.store.delete(normalizedEmail);
      throw new AppError(
        'OTP_EXPIRED',
        'Kode OTP telah kedaluwarsa. Silakan minta kode baru.',
        400,
      );
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      this.store.delete(normalizedEmail);
      throw new AppError(
        'OTP_MAX_ATTEMPTS_EXCEEDED',
        'Terlalu banyak percobaan salah. Silakan minta kode OTP baru.',
        400,
      );
    }

    if (record.code !== trimmedCode) {
      record.attempts += 1;
      const remaining = MAX_OTP_ATTEMPTS - record.attempts;
      throw new AppError(
        'OTP_INVALID',
        `Kode OTP salah. Sisa ${String(remaining)} kesempatan percobaan.`,
        400,
      );
    }

    // Successfully verified -> consume OTP
    this.store.delete(normalizedEmail);
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
}
