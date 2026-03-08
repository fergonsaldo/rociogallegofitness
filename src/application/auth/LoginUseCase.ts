import { z } from 'zod';
import { User } from '@/domain/entities/User';
import { supabase } from '@/infrastructure/supabase/client';
import { mapSupabaseAuthError } from './AuthError';

export const LoginInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

export interface LoginResult {
  user: User;
}

export async function loginUseCase(input: LoginInput): Promise<LoginResult> {
  console.log('[LoginUseCase] Attempting login for:', input.email);
  LoginInputSchema.parse(input);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  console.log('[LoginUseCase] Auth result:', { user: authData?.user?.id, error: authError?.message });

  if (authError || !authData.user) {
    throw mapSupabaseAuthError(authError ?? { message: 'No user returned' });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')  // ← corregido de 'users' a 'profiles'
    .select('*')
    .eq('id', authData.user.id)
    .single();

  console.log('[LoginUseCase] Profile result:', { profile: profile?.id, error: profileError?.message });

  if (profileError || !profile) {
    throw mapSupabaseAuthError(profileError ?? { message: 'Profile not found' });
  }

  const user: User = {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    weightUnit: profile.weight_unit,
    avatarUrl: profile.avatar_url ?? undefined,
    createdAt: new Date(profile.created_at),
    updatedAt: new Date(profile.updated_at),
  };

  console.log('[LoginUseCase] Login successful, role:', user.role);
  return { user };
}
