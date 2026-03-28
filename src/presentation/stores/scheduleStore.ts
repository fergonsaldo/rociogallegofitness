import { create } from 'zustand';
import { Schedule, CreateScheduleInput } from '@/domain/entities/Schedule';
import { ScheduleRemoteRepository } from '@/infrastructure/supabase/remote/ScheduleRemoteRepository';
import {
  getSchedulesUseCase,
  createScheduleUseCase,
  toggleScheduleActiveUseCase,
  deleteScheduleUseCase,
} from '@/application/coach/ScheduleUseCases';
import { Strings } from '@/shared/constants/strings';

const repo = new ScheduleRemoteRepository();

interface ScheduleState {
  schedules:  Schedule[];
  isLoading:  boolean;
  error:      string | null;

  fetchSchedules:       (coachId: string) => Promise<void>;
  createSchedule:       (input: CreateScheduleInput) => Promise<Schedule>;
  toggleActive:         (id: string, isActive: boolean) => Promise<void>;
  deleteSchedule:       (id: string) => Promise<void>;
  clearError:           () => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules:  [],
  isLoading:  false,
  error:      null,

  fetchSchedules: async (coachId) => {
    set({ isLoading: true, error: null });
    try {
      const schedules = await getSchedulesUseCase(coachId, repo);
      set({ schedules, isLoading: false });
    } catch (err) {
      set({
        error: (err as any)?.message ?? Strings.errorFailedLoadSchedules,
        isLoading: false,
      });
    }
  },

  createSchedule: async (input) => {
    try {
      const schedule = await createScheduleUseCase(input, repo);
      set({
        schedules: [...get().schedules, schedule].sort(
          (a, b) => a.startDate.getTime() - b.startDate.getTime(),
        ),
      });
      return schedule;
    } catch (err) {
      const message = (err as any)?.message ?? Strings.errorFailedCreateSchedule;
      set({ error: message });
      throw err;
    }
  },

  toggleActive: async (id, isActive) => {
    try {
      const updated = await toggleScheduleActiveUseCase(id, isActive, repo);
      set({ schedules: get().schedules.map((s) => (s.id === id ? updated : s)) });
    } catch (err) {
      const message = (err as any)?.message ?? Strings.errorFailedUpdateSchedule;
      set({ error: message });
      throw err;
    }
  },

  deleteSchedule: async (id) => {
    try {
      await deleteScheduleUseCase(id, repo);
      set({ schedules: get().schedules.filter((s) => s.id !== id) });
    } catch (err) {
      const message = (err as any)?.message ?? Strings.errorFailedDeleteSchedule;
      set({ error: message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
