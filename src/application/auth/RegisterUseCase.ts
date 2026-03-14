import { z } from 'zod';
import { User } from '@/domain/entities/User';
import { UserRole } from '@/shared/types';
import { supabase } from '@/infrastructure/supabase/client';
import { mapSupabaseAuthError } from './AuthError';

export const RegisterInputSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password is too long'),
  fullName: z.string().min(1, 'Full name is required').max(100),
  role:     z.enum(['coach', 'athlete'] satisfies [UserRole, UserRole]),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export interface RegisterResult { user: User; }

export async function registerUseCase(input: RegisterInput): Promise<RegisterResult> {
  RegisterInputSchema.parse(input);

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email:    input.email,
    password: input.password,
  });

  if (authError || !authData.user) {
    throw mapSupabaseAuthError(authError ?? { message: 'Registration failed' });
  }

  const authUserId = authData.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .insert({
      id:          authUserId,
      email:       input.email,
      full_name:   input.fullName,
      role:        input.role,
      weight_unit: 'kg',
    })
    .select()
    .single();

  if (profileError || !profile) {
    // Rollback: remove the auth user so the email is not left orphaned
    await supabase.auth.admin.deleteUser(authUserId);
    throw mapSupabaseAuthError(profileError ?? { message: 'Failed to create profile' });
  }

  return {
    user: {
      id:        profile.id,
      email:     profile.email,
      fullName:  profile.full_name,
      role:      profile.role,
      weightUnit: profile.weight_unit,
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at),
    },
  };
}
