import { Strings } from '@/shared/constants/strings';
import { create } from 'zustand';
import { WorkoutLocalRepository } from '@/infrastructure/database/local/WorkoutLocalRepository';
import { ProgressRemoteRepository } from '@/infrastructure/supabase/remote/ProgressRemoteRepository';
import {
  getWorkoutHistoryUseCase, WorkoutHistoryEntry,
  getExerciseProgressionUseCase, ExerciseProgressionPoint,
  getPersonalBestsUseCase, PersonalBestSnapshot,
} from '@/application/athlete/ProgressUseCases';

const workoutRepo = new WorkoutLocalRepository();
const progressRepo = new ProgressRemoteRepository();

interface ProgressState {
  // History
  history: WorkoutHistoryEntry[];
  historyLoading: boolean;

  // Per-exercise progression
  progression: Record<string, ExerciseProgressionPoint[]>; // keyed by exerciseId
  progressionLoading: boolean;

  // Personal bests
  personalBests: PersonalBestSnapshot[];
  personalBestsLoading: boolean;

  error: string | null;

  fetchHistory: (athleteId: string) => Promise<void>;
  fetchProgression: (athleteId: string, exerciseId: string) => Promise<void>;
  fetchPersonalBests: (athleteId: string) => Promise<void>;
  clearError: () => void;
}

export const useProgressStore = create<ProgressState>((set) => ({
  history: [],
  historyLoading: false,
  progression: {},
  progressionLoading: false,
  personalBests: [],
  personalBestsLoading: false,
  error: null,

  fetchHistory: async (athleteId) => {
    set({ historyLoading: true, error: null });
    try {
      const history = await getWorkoutHistoryUseCase(athleteId, workoutRepo);
      set({ history, historyLoading: false });
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedLoadHistory, historyLoading: false });
    }
  },

  fetchProgression: async (athleteId, exerciseId) => {
    set({ progressionLoading: true, error: null });
    try {
      const points = await getExerciseProgressionUseCase(athleteId, exerciseId, progressRepo);
      set((state) => ({
        progression: { ...state.progression, [exerciseId]: points },
        progressionLoading: false,
      }));
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedLoadProgression, progressionLoading: false });
    }
  },

  fetchPersonalBests: async (athleteId) => {
    set({ personalBestsLoading: true, error: null });
    try {
      const personalBests = await getPersonalBestsUseCase(athleteId, progressRepo);
      set({ personalBests, personalBestsLoading: false });
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedLoadPersonalBests, personalBestsLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
