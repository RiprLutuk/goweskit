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
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.email().trim().toLowerCase().max(320),
  password: z.string().min(1).max(128),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const authUserResponseSchema = z.object({ user: userSchema });
export type AuthUserResponse = z.infer<typeof authUserResponseSchema>;
