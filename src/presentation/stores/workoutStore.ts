import { create } from 'zustand';
import { WorkoutSession } from '@/domain/entities/WorkoutSession';
import { ExerciseSet } from '@/domain/entities/ExerciseSet';
import { WorkoutLocalRepository } from '@/infrastructure/database/local/WorkoutLocalRepository';
import { syncService } from '@/infrastructure/sync/SyncService';
import {
  startWorkoutSessionUseCase,
  logExerciseSetUseCase,
  finishWorkoutSessionUseCase,
  abandonWorkoutSessionUseCase,
  SessionSummary,
  LogSetInput,
} from '@/application/athlete/WorkoutUseCases';
import { Strings } from '@/shared/constants/strings';

const repo = new WorkoutLocalRepository();

interface WorkoutState {
  // Active session
  session: WorkoutSession | null;
  lastSummary: SessionSummary | null;

  // UI
  isLoading: boolean;
  error: string | null;

  // Restimer state (drives the RestTimer component)
  restTimerSeconds: number;
  restTimerActive: boolean;

  // Actions
  startSession: (athleteId: string, routineId?: string, routineDayId?: string) => Promise<void>;
  logSet: (input: Omit<LogSetInput, 'sessionId'>) => Promise<ExerciseSet | null>;
  finishSession: () => Promise<SessionSummary | null>;
  abandonSession: () => Promise<void>;
  restoreActiveSession: (athleteId: string) => Promise<void>;

  // Rest timer
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  tickRestTimer: () => void;

  clearError: () => void;
  clearSummary: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  session: null,
  lastSummary: null,
  isLoading: false,
  error: null,
  restTimerSeconds: 0,
  restTimerActive: false,

  startSession: async (athleteId, routineId, routineDayId) => {
    set({ isLoading: true, error: null });
    try {
      const session = await startWorkoutSessionUseCase({ athleteId, routineId, routineDayId }, repo);
      set({ session, isLoading: false });
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedStartSession, isLoading: false });
    }
  },

  logSet: async (input) => {
    const { session } = get();
    if (!session) { set({ error: Strings.errorNoActiveSession }); return null; }

    try {
      const newSet = await logExerciseSetUseCase({ ...input, sessionId: session.id }, repo);

      // Optimistic update: append set to local state immediately
      set((state) => ({
        session: state.session
          ? { ...state.session, sets: [...state.session.sets, newSet] }
          : null,
      }));

      return newSet;
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedLogSet });
      return null;
    }
  },

  finishSession: async () => {
    const { session } = get();
    if (!session) return null;
    set({ isLoading: true });
    try {
      const summary = await finishWorkoutSessionUseCase(session.id, repo);
      set({ session: null, lastSummary: summary, isLoading: false, restTimerActive: false });

      // Trigger background sync — don't await, don't block UI
      syncService.syncPendingSessions(session.athleteId).catch(console.warn);

      return summary;
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedFinishSession, isLoading: false });
      return null;
    }
  },

  abandonSession: async () => {
    const { session } = get();
    if (!session) return;
    try {
      await abandonWorkoutSessionUseCase(session.id, repo);
      set({ session: null, restTimerActive: false, restTimerSeconds: 0 });
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedAbandonSession });
    }
  },

  restoreActiveSession: async (athleteId) => {
    try {
      const session = await repo.getActiveSession(athleteId);
      if (session) set({ session });
    } catch (err) {
      console.warn('[workoutStore] Failed to restore session:', err);
    }
  },

  // ── Rest timer ─────────────────────────────────────────────────────────────
  startRestTimer: (seconds) => set({ restTimerSeconds: seconds, restTimerActive: true }),
  stopRestTimer: () => set({ restTimerActive: false, restTimerSeconds: 0 }),
  tickRestTimer: () => {
    const { restTimerSeconds } = get();
    if (restTimerSeconds <= 1) {
      set({ restTimerSeconds: 0, restTimerActive: false });
    } else {
      set({ restTimerSeconds: restTimerSeconds - 1 });
    }
  },

  clearError: () => set({ error: null }),
  clearSummary: () => set({ lastSummary: null }),
}));
