import { z } from 'zod';

export const userSchema = z.object({
  id: z.uuid(),
  displayName: z.string(),
  email: z.email(),
  createdAt: z.iso.datetime(),
});

export type User = z.infer<typeof userSchema>;

export const registerRequestSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase().max(320),
  password: z.string().min(8).max(128),
  otp: z.string().trim().regex(/^\d{6}$/u, 'Kode OTP harus 6 digit angka').optional(),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const sendOtpRequestSchema = z.object({
  email: z.email().trim().toLowerCase().max(320),
  purpose: z.enum(['register', 'reset_password']).default('register'),
});

export type SendOtpRequest = z.infer<typeof sendOtpRequestSchema>;

export const sendOtpResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  expiresInSeconds: z.number(),
  demoOtp: z.string().optional(),
});

export type SendOtpResponse = z.infer<typeof sendOtpResponseSchema>;

export const loginRequestSchema = z.object({
  email: z.email().trim().toLowerCase().max(320),
  password: z.string().min(1).max(128),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const googleAuthRequestSchema = z
  .object({
    idToken: z.string().min(1).optional(),
    email: z.string().email().optional(),
    displayName: z.string().min(1).max(80).optional(),
    photoUrl: z.string().url().optional(),
  })
  .refine((data) => data.idToken !== undefined || data.email !== undefined, {
    message: 'idToken or email is required for Google authentication',
  });

export type GoogleAuthRequest = z.infer<typeof googleAuthRequestSchema>;

export const authUserResponseSchema = z.object({ user: userSchema });
export type AuthUserResponse = z.infer<typeof authUserResponseSchema>;
