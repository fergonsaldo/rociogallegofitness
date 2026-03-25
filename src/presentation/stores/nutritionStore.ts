import { Strings } from '@/shared/constants/strings';
import { create } from 'zustand';
import { NutritionPlan, CreateNutritionPlanInput, DailyNutritionSummary, CreateMealLogEntryInput, MealLogEntry } from '@/domain/entities/NutritionPlan';
import { NutritionRemoteRepository } from '@/infrastructure/supabase/remote/NutritionRemoteRepository';
import { createNutritionPlanUseCase, getCoachNutritionPlansUseCase, assignNutritionPlanUseCase, deleteNutritionPlanUseCase } from '@/application/coach/NutritionUseCases';
import { getAssignedNutritionPlanUseCase, logMealUseCase, getDailyNutritionSummaryUseCase, getWeeklyAdherenceUseCase, WeeklyAdherenceDay } from '@/application/athlete/NutritionUseCases';

const repo = new NutritionRemoteRepository();

interface NutritionState {
  // Coach
  coachPlans: NutritionPlan[];
  coachPlansLoading: boolean;

  // Athlete
  assignedPlan: NutritionPlan | null;
  assignedPlanLoading: boolean;
  dailySummary: DailyNutritionSummary | null;
  dailySummaryLoading: boolean;
  weeklyAdherence: WeeklyAdherenceDay[];

  // Shared
  isSubmitting: boolean;
  error: string | null;

  // Coach actions
  fetchCoachPlans: (coachId: string) => Promise<void>;
  createPlan: (input: CreateNutritionPlanInput) => Promise<NutritionPlan | null>;
  assignPlan: (planId: string, athleteId: string) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;

  // Athlete actions
  fetchAssignedPlan: (athleteId: string) => Promise<void>;
  fetchDailySummary: (athleteId: string, date: Date) => Promise<void>;
  fetchWeeklyAdherence: (athleteId: string) => Promise<void>;
  logMeal: (input: CreateMealLogEntryInput) => Promise<MealLogEntry | null>;

  clearError: () => void;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  coachPlans: [],
  coachPlansLoading: false,
  assignedPlan: null,
  assignedPlanLoading: false,
  dailySummary: null,
  dailySummaryLoading: false,
  weeklyAdherence: [],
  isSubmitting: false,
  error: null,

  // ── Coach ──────────────────────────────────────────────────────────────────

  fetchCoachPlans: async (coachId) => {
    set({ coachPlansLoading: true, error: null });
    try {
      const plans = await getCoachNutritionPlansUseCase(coachId, repo);
      set({ coachPlans: plans, coachPlansLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFailedLoadPlans, coachPlansLoading: false });
    }
  },

  createPlan: async (input) => {
    set({ isSubmitting: true, error: null });
    try {
      const plan = await createNutritionPlanUseCase(input, repo);
      set((s) => ({ coachPlans: [plan, ...s.coachPlans], isSubmitting: false }));
      return plan;
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : err?.message ?? Strings.errorFailedCreatePlan;
      set({ error: msg, isSubmitting: false });
      return null;
    }
  },

  assignPlan: async (planId, athleteId) => {
    try {
      await assignNutritionPlanUseCase({ planId, athleteId }, repo);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFailedAssignPlan });
    }
  },

  deletePlan: async (planId) => {
    try {
      await deleteNutritionPlanUseCase(planId, repo);
      set((s) => ({ coachPlans: s.coachPlans.filter((p) => p.id !== planId) }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFailedDeletePlan });
    }
  },

  // ── Athlete ────────────────────────────────────────────────────────────────

  fetchAssignedPlan: async (athleteId) => {
    set({ assignedPlanLoading: true, error: null });
    try {
      const plan = await getAssignedNutritionPlanUseCase(athleteId, repo);
      set({ assignedPlan: plan, assignedPlanLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFailedLoadPlan, assignedPlanLoading: false });
    }
  },

  fetchDailySummary: async (athleteId, date) => {
    const { assignedPlan } = get();
    if (!assignedPlan) return;
    set({ dailySummaryLoading: true });
    try {
      const summary = await getDailyNutritionSummaryUseCase(athleteId, date, assignedPlan, repo);
      set({ dailySummary: summary, dailySummaryLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFailedLoadDailySummary, dailySummaryLoading: false });
    }
  },

  fetchWeeklyAdherence: async (athleteId) => {
    const { assignedPlan } = get();
    if (!assignedPlan) return;
    try {
      const adherence = await getWeeklyAdherenceUseCase(athleteId, assignedPlan, repo);
      set({ weeklyAdherence: adherence });
    } catch (err) {
      console.warn('Failed to load weekly adherence:', err);
    }
  },

  logMeal: async (input) => {
    set({ isSubmitting: true, error: null });
    try {
      const entry = await logMealUseCase(input, repo);
      // Refresh daily summary optimistically
      set((s) => {
        if (!s.dailySummary) return { isSubmitting: false };
        const newEntries = [...s.dailySummary.logEntries, entry];
        const totalConsumed = newEntries.reduce(
          (acc, e) => ({
            calories: acc.calories + e.actualMacros.calories,
            proteinG: acc.proteinG + e.actualMacros.proteinG,
            carbsG: acc.carbsG + e.actualMacros.carbsG,
            fatG: acc.fatG + e.actualMacros.fatG,
          }),
          { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
        );
        const target = s.dailySummary.dailyTarget;
        const clamp = (v: number) => Math.min(1, v);
        return {
          isSubmitting: false,
          dailySummary: {
            ...s.dailySummary,
            logEntries: newEntries,
            totalConsumed,
            progress: {
              calories: clamp(totalConsumed.calories / (target.calories || 1)),
              protein:  clamp(totalConsumed.proteinG / (target.proteinG || 1)),
              carbs:    clamp(totalConsumed.carbsG   / (target.carbsG   || 1)),
              fat:      clamp(totalConsumed.fatG     / (target.fatG     || 1)),
            },
          },
        };
      });
      return entry;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFailedLogMeal, isSubmitting: false });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
