import { z } from 'zod';
import { UserRole, WeightUnit } from '@/shared/types';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(1, 'Full name is required').max(100),
  role: z.enum(['coach', 'athlete'] satisfies [UserRole, UserRole]),
  weightUnit: z.enum(['kg', 'lb'] satisfies [WeightUnit, WeightUnit]).default('kg'),
  avatarUrl: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
