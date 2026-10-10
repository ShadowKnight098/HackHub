import { z } from 'zod';
import { UserRole } from '../enums';
import type { UserId } from '../ids';

export const ProfileSchema = z.object({
  id: z.string().transform((val) => val as UserId),
  email: z.string().email(),
  fullName: z.string().min(1, 'Full name is required'),
  avatarUrl: z.string().url().nullable().optional(),
  bio: z.string().nullable().optional(),
  skills: z.array(z.string()).default([]),
  role: z.nativeEnum(UserRole).default(UserRole.STUDENT),
  departmentId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const SignInCredentialsSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
  rollNumber: z.string().optional(),
});

export type SignInCredentials = z.infer<typeof SignInCredentialsSchema>;

export const SignUpCredentialsSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  fullName: z.string().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.STUDENT),
});

export type SignUpCredentials = z.infer<typeof SignUpCredentialsSchema>;
