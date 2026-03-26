import { create } from 'zustand';
import { CoachDashboardSummary } from '@/domain/repositories/ICoachRepository';
import { CoachRemoteRepository } from '@/infrastructure/supabase/remote/CoachRemoteRepository';
import { getCoachDashboardSummaryUseCase } from '@/application/coach/ClientUseCases';
import { Strings } from '@/shared/constants/strings';

const repo = new CoachRemoteRepository();

interface CoachDashboardState {
  summary: CoachDashboardSummary | null;
  isLoading: boolean;
  error: string | null;

  fetchDashboardSummary: (coachId: string) => Promise<void>;
  clearError: () => void;
}

export const useCoachDashboardStore = create<CoachDashboardState>((set) => ({
  summary:   null,
  isLoading: false,
  error:     null,

  fetchDashboardSummary: async (coachId) => {
    set({ isLoading: true, error: null });
    try {
      const summary = await getCoachDashboardSummaryUseCase(coachId, repo);
      set({ summary, isLoading: false });
    } catch (err) {
      set({
        error: (err as any)?.message ?? Strings.errorFailedLoadDashboard,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
