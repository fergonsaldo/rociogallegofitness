import { Strings } from '@/shared/constants/strings';
import { create } from 'zustand';
import { Routine, CreateRoutineInput } from '@/domain/entities/Routine';
import { RoutineRemoteRepository } from '@/infrastructure/supabase/remote/RoutineRemoteRepository';
import { createRoutineUseCase } from '@/application/coach/CreateRoutineUseCase';
import { getCoachRoutinesUseCase, getAthleteRoutinesUseCase, getRoutineByIdUseCase } from '@/application/coach/GetRoutinesUseCase';
import { assignRoutineUseCase, unassignRoutineUseCase } from '@/application/coach/AssignRoutineUseCase';
import { deleteRoutineUseCase } from '@/application/coach/DeleteRoutineUseCase';

const repo = new RoutineRemoteRepository();

interface RoutineState {
  // Data
  routines: Routine[];
  selectedRoutine: Routine | null;

  // UI state
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;

  // Coach actions
  fetchCoachRoutines: (coachId: string) => Promise<void>;
  createRoutine: (input: CreateRoutineInput) => Promise<Routine | null>;
  deleteRoutine: (routineId: string) => Promise<boolean>;
  assignToAthlete: (routineId: string, athleteId: string) => Promise<void>;
  unassignFromAthlete: (routineId: string, athleteId: string) => Promise<void>;

  // Athlete actions
  fetchAthleteRoutines: (athleteId: string) => Promise<void>;

  // Shared
  selectRoutine: (routine: Routine | null) => void;
  fetchRoutineById: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  routines: [],
  selectedRoutine: null,
  isLoading: false,
  isCreating: false,
  error: null,

  fetchCoachRoutines: async (coachId) => {
    set({ isLoading: true, error: null });
    try {
      const routines = await getCoachRoutinesUseCase(coachId, repo);
      set({ routines, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFailedLoadRoutines, isLoading: false });
    }
  },

  fetchAthleteRoutines: async (athleteId) => {
    set({ isLoading: true, error: null });
    try {
      const routines = await getAthleteRoutinesUseCase(athleteId, repo);
      set({ routines, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFailedLoadRoutines, isLoading: false });
    }
  },

  fetchRoutineById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const routine = await getRoutineByIdUseCase(id, repo);
      set({ selectedRoutine: routine, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFailedLoadRoutine, isLoading: false });
    }
  },

  createRoutine: async (input) => {
    set({ isCreating: true, error: null });
    try {
      const routine = await createRoutineUseCase(input, repo);
      set((state) => ({
        routines: [routine, ...state.routines],
        isCreating: false,
      }));
      return routine;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFailedCreateRoutine, isCreating: false });
      return null;
    }
  },

  deleteRoutine: async (routineId) => {
    set({ error: null });
    try {
      await deleteRoutineUseCase(routineId, repo);
      set((state) => ({
        routines: state.routines.filter((r) => r.id !== routineId),
        selectedRoutine: state.selectedRoutine?.id === routineId ? null : state.selectedRoutine,
      }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFailedDeleteRoutine });
      return false;
    }
  },

  assignToAthlete: async (routineId, athleteId) => {
    try {
      await assignRoutineUseCase({ routineId, athleteId }, repo);
      } catch (err) {
        set({ error: err instanceof Error ? err.message : Strings.errorFailedAssignRoutine });
    }
  },

  unassignFromAthlete: async (routineId, athleteId) => {
    try {
      await unassignRoutineUseCase({ routineId, athleteId }, repo);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFailedUnassignRoutine });
    }
  },

  selectRoutine: (routine) => set({ selectedRoutine: routine }),
  clearError: () => set({ error: null }),
}));
