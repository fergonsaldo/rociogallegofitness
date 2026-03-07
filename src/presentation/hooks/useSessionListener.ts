import { useEffect } from 'react';
import { supabase } from '../../infrastructure/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { User } from '../../domain/entities/User';

/**
 * Listens to Supabase auth state changes and keeps the Zustand
 * authStore in sync. Mount this once at the root layout.
 *
 * Handles three scenarios:
 *   1. App cold start  → restores existing session from storage
 *   2. Login / Register → Supabase fires SIGNED_IN event
 *   3. Logout / token expiry → Supabase fires SIGNED_OUT event
 */
export function useSessionListener() {
  const { setUser } = useAuthStore();

  useEffect(() => {
    // Restore session on mount (handles app restarts)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        setUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
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
        setUser(user);
      } else {
        setUser(null);
      }
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
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
            setUser(user);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser]);
}
