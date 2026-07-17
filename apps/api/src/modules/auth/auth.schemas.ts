import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z.string(),
    email: z.string(),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string(),
    password: z.string(),
  })
  .strict();

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
