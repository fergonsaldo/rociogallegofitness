import { create } from 'zustand';
import { User } from '@/domain/entities/User';
import { loginUseCase, LoginInput } from '@/application/auth/LoginUseCase';
import { registerUseCase, RegisterInput } from '@/application/auth/RegisterUseCase';
import { logoutUseCase } from '@/application/auth/LogoutUseCase';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;

  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

/**
 * Global auth store.
 * Holds the authenticated user and exposes login/register/logout actions.
 * The status field drives navigation guards (idle → check session,
 * authenticated → main app, unauthenticated → auth screens).
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  error: null,

  login: async (input) => {
    set({ status: 'loading', error: null });
    try {
      const { user } = await loginUseCase(input);
      set({ user, status: 'authenticated', error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ status: 'unauthenticated', error: message });
    }
  },

  register: async (input) => {
    set({ status: 'loading', error: null });
    try {
      const { user } = await registerUseCase(input);
      set({ user, status: 'authenticated', error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      set({ status: 'unauthenticated', error: message });
    }
  },

  logout: async () => {
    set({ status: 'loading', error: null });
    try {
      await logoutUseCase();
      set({ user: null, status: 'unauthenticated', error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      set({ error: message, status: 'authenticated' });
    }
  },

  setUser: (user) =>
    set({ user, status: user ? 'authenticated' : 'unauthenticated' }),

  clearError: () => set({ error: null }),
}));
