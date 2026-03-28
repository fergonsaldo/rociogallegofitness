import { create } from 'zustand';
import { SessionActivityLog } from '@/domain/entities/SessionActivityLog';
import { SessionActivityLogRemoteRepository } from '@/infrastructure/supabase/remote/SessionActivityLogRemoteRepository';
import { getSessionActivityUseCase } from '@/application/coach/SessionActivityLogUseCases';
import { Strings } from '@/shared/constants/strings';

const repo = new SessionActivityLogRemoteRepository();

function defaultFrom(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function defaultTo(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

interface SessionActivityState {
  logs:      SessionActivityLog[];
  from:      Date;
  to:        Date;
  isLoading: boolean;
  error:     string | null;

  fetchLogs:  (coachId: string) => Promise<void>;
  setFrom:    (date: Date) => void;
  setTo:      (date: Date) => void;
  clearError: () => void;
}

export const useSessionActivityStore = create<SessionActivityState>((set, get) => ({
  logs:      [],
  from:      defaultFrom(),
  to:        defaultTo(),
  isLoading: false,
  error:     null,

  fetchLogs: async (coachId) => {
    set({ isLoading: true, error: null });
    try {
      const logs = await getSessionActivityUseCase(coachId, get().from, get().to, repo);
      set({ logs, isLoading: false });
    } catch (err) {
      set({
        error: (err as any)?.message ?? Strings.errorFailedLoadActivityLog,
        isLoading: false,
      });
    }
  },

  setFrom:    (date) => set({ from: date }),
  setTo:      (date) => set({ to: date }),
  clearError: () => set({ error: null }),
}));
