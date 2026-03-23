import { create } from 'zustand';
import { CoachSession, CreateCoachSessionInput } from '@/domain/entities/CoachSession';
import { CoachSessionRemoteRepository } from '@/infrastructure/supabase/remote/CoachSessionRemoteRepository';
import {
  getSessionsForMonthUseCase,
  getSessionsForRangeUseCase,
  createSessionUseCase,
  deleteSessionUseCase,
} from '@/application/coach/CoachSessionUseCases';
import { Strings } from '@/shared/constants/strings';

const repo = new CoachSessionRemoteRepository();

export interface ListFilters {
  sessionTypes: string[];
  modalities:   ('online' | 'in_person')[];
}

function defaultListFrom(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function defaultListTo(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface CoachCalendarState {
  // ── Calendar view ────────────────────────────────────────────────────────
  sessions:     CoachSession[];
  selectedDate: Date;
  isLoading:    boolean;

  // ── List view ────────────────────────────────────────────────────────────
  rangeSessions:  CoachSession[];
  listFrom:       Date;
  listTo:         Date;
  listFilters:    ListFilters;
  isLoadingRange: boolean;

  // ── Shared ───────────────────────────────────────────────────────────────
  error: string | null;

  // ── Actions ───────────────────────────────────────────────────────────────
  fetchMonth:     (coachId: string, year: number, month: number) => Promise<void>;
  fetchRange:     (coachId: string, from: Date, to: Date) => Promise<void>;
  addSession:     (input: CreateCoachSessionInput) => Promise<CoachSession>;
  removeSession:  (id: string) => Promise<void>;
  setSelectedDate:(date: Date) => void;
  setListFrom:    (date: Date) => void;
  setListTo:      (date: Date) => void;
  setListFilters: (filters: ListFilters) => void;
  clearError:     () => void;
}

export const useCoachCalendarStore = create<CoachCalendarState>((set, get) => ({
  sessions:       [],
  selectedDate:   new Date(),
  isLoading:      false,
  rangeSessions:  [],
  listFrom:       defaultListFrom(),
  listTo:         defaultListTo(),
  listFilters:    { sessionTypes: [], modalities: [] },
  isLoadingRange: false,
  error:          null,

  fetchMonth: async (coachId, year, month) => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await getSessionsForMonthUseCase(coachId, year, month, repo);
      set({ sessions, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : Strings.errorFailedLoadSessions,
        isLoading: false,
      });
    }
  },

  fetchRange: async (coachId, from, to) => {
    set({ isLoadingRange: true, error: null });
    try {
      const rangeSessions = await getSessionsForRangeUseCase(coachId, from, to, repo);
      set({ rangeSessions, isLoadingRange: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : Strings.errorFailedLoadSessions,
        isLoadingRange: false,
      });
    }
  },

  addSession: async (input) => {
    try {
      const session = await createSessionUseCase(input, repo);
      set({ sessions: [...get().sessions, session].sort(
        (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime(),
      )});
      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : Strings.errorFailedCreateSession;
      set({ error: message });
      throw err;
    }
  },

  removeSession: async (id) => {
    try {
      await deleteSessionUseCase(id, repo);
      set({
        sessions:      get().sessions.filter((s) => s.id !== id),
        rangeSessions: get().rangeSessions.filter((s) => s.id !== id),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : Strings.errorFailedDeleteSession;
      set({ error: message });
      throw err;
    }
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
  setListFrom:     (date) => set({ listFrom: date }),
  setListTo:       (date) => set({ listTo: date }),
  setListFilters:  (filters) => set({ listFilters: filters }),
  clearError:      () => set({ error: null }),
}));
