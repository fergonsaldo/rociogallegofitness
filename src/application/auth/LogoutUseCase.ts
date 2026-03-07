import { supabase } from '../../infrastructure/supabase/client';
import { mapSupabaseAuthError } from './AuthError';

/**
 * Signs the current user out and invalidates the local session.
 * Throws AuthError on unexpected failure.
 */
export async function logoutUseCase(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw mapSupabaseAuthError(error);
  }
}
