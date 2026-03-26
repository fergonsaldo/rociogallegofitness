import { Strings } from '@/shared/constants/strings';
import { create } from 'zustand';
import { NutritionPlan, CreateNutritionPlanInput, DailyNutritionSummary, CreateMealLogEntryInput, MealLogEntry, PlanGroup } from '@/domain/entities/NutritionPlan';
import { NutritionRemoteRepository } from '@/infrastructure/supabase/remote/NutritionRemoteRepository';
import { createNutritionPlanUseCase, getCoachNutritionPlansUseCase, assignNutritionPlanUseCase, deleteNutritionPlanUseCase, assignPlansToAthleteUseCase, duplicatePlanUseCase, linkRecipeToMealUseCase, unlinkRecipeFromMealUseCase, createPlanGroupUseCase, deletePlanGroupUseCase, getPlanGroupsUseCase, getPlanGroupDetailUseCase, addPlanToGroupUseCase, removePlanFromGroupUseCase } from '@/application/coach/NutritionUseCases';
import { getAssignedNutritionPlanUseCase, logMealUseCase, getDailyNutritionSummaryUseCase, getWeeklyAdherenceUseCase, WeeklyAdherenceDay } from '@/application/athlete/NutritionUseCases';

const repo = new NutritionRemoteRepository();

interface NutritionState {
  // Plan groups
  groups: PlanGroup[];
  groupsLoading: boolean;
  groupDetail: { group: PlanGroup; plans: NutritionPlan[] } | null;
  groupDetailLoading: boolean;

  fetchGroups: (coachId: string) => Promise<void>;
  createGroup: (coachId: string, name: string, description?: string) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  fetchGroupDetail: (groupId: string) => Promise<void>;
  addPlanToGroup: (groupId: string, planId: string) => Promise<boolean>;
  removePlanFromGroup: (groupId: string, planId: string) => Promise<boolean>;

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
  refreshPlan: (planId: string) => Promise<void>;
  createPlan: (input: CreateNutritionPlanInput) => Promise<NutritionPlan | null>;
  duplicatePlan: (plan: NutritionPlan, coachId: string) => Promise<boolean>;
  linkRecipe: (mealId: string, recipeId: string, planId: string) => Promise<boolean>;
  unlinkRecipe: (mealId: string, recipeId: string, planId: string) => Promise<boolean>;
  assignPlan: (planId: string, athleteId: string) => Promise<void>;
  assignMultipleToAthlete: (planIds: string[], athleteId: string) => Promise<boolean>;
  deletePlan: (planId: string) => Promise<void>;

  // Athlete actions
  fetchAssignedPlan: (athleteId: string) => Promise<void>;
  fetchDailySummary: (athleteId: string, date: Date) => Promise<void>;
  fetchWeeklyAdherence: (athleteId: string) => Promise<void>;
  logMeal: (input: CreateMealLogEntryInput) => Promise<MealLogEntry | null>;

  clearError: () => void;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  groups: [],
  groupsLoading: false,
  groupDetail: null,
  groupDetailLoading: false,

  fetchGroups: async (coachId) => {
    set({ groupsLoading: true, error: null });
    try {
      const groups = await getPlanGroupsUseCase(coachId, repo);
      set({ groups, groupsLoading: false });
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedLoadGroups, groupsLoading: false });
    }
  },

  createGroup: async (coachId, name, description) => {
    set({ isSubmitting: true, error: null });
    try {
      const group = await createPlanGroupUseCase({ coachId, name, description }, repo);
      set((s) => ({ groups: [group, ...s.groups], isSubmitting: false }));
      return true;
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedCreateGroup, isSubmitting: false });
      return false;
    }
  },

  deleteGroup: async (groupId) => {
    set({ error: null });
    try {
      await deletePlanGroupUseCase(groupId, repo);
      set((s) => ({ groups: s.groups.filter((g) => g.id !== groupId) }));
      return true;
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedDeleteGroup });
      return false;
    }
  },

  fetchGroupDetail: async (groupId) => {
    set({ groupDetailLoading: true, error: null });
    try {
      const detail = await getPlanGroupDetailUseCase(groupId, repo);
      set({ groupDetail: detail, groupDetailLoading: false });
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedLoadGroup, groupDetailLoading: false });
    }
  },

  addPlanToGroup: async (groupId, planId) => {
    set({ error: null });
    try {
      await addPlanToGroupUseCase(groupId, planId, repo);
      const detail = await getPlanGroupDetailUseCase(groupId, repo);
      set({ groupDetail: detail });
      set((s) => ({
        groups: s.groups.map((g) =>
          g.id === groupId ? { ...g, planCount: detail.plans.length } : g
        ),
      }));
      return true;
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFallback });
      return false;
    }
  },

  removePlanFromGroup: async (groupId, planId) => {
    set({ error: null });
    try {
      await removePlanFromGroupUseCase(groupId, planId, repo);
      set((s) => {
        if (!s.groupDetail || s.groupDetail.group.id !== groupId) return {};
        const plans = s.groupDetail.plans.filter((p) => p.id !== planId);
        return {
          groupDetail: { ...s.groupDetail, plans },
          groups: s.groups.map((g) =>
            g.id === groupId ? { ...g, planCount: plans.length } : g
          ),
        };
      });
      return true;
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFallback });
      return false;
    }
  },

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
      set({ error: (err as any)?.message ?? Strings.errorFailedLoadPlans, coachPlansLoading: false });
    }
  },

  refreshPlan: async (planId) => {
    try {
      const updated = await repo.getPlanById(planId);
      if (!updated) return;
      set((s) => ({
        coachPlans: s.coachPlans.map((p) => (p.id === planId ? updated : p)),
      }));
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFallback });
    }
  },

  createPlan: async (input) => {
    set({ isSubmitting: true, error: null });
    try {
      const plan = await createNutritionPlanUseCase(input, repo);
      set((s) => ({ coachPlans: [plan, ...s.coachPlans], isSubmitting: false }));
      return plan;
    } catch (err: any) {
      const msg = (err as any)?.message ?? Strings.errorFailedCreatePlan;
      set({ error: msg, isSubmitting: false });
      return null;
    }
  },

  linkRecipe: async (mealId, recipeId, planId) => {
    set({ error: null });
    try {
      await linkRecipeToMealUseCase(mealId, recipeId, repo);
      const updated = await repo.getPlanById(planId);
      if (updated) set((s) => ({ coachPlans: s.coachPlans.map((p) => (p.id === planId ? updated : p)) }));
      return true;
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFallback });
      return false;
    }
  },

  unlinkRecipe: async (mealId, recipeId, planId) => {
    set({ error: null });
    try {
      await unlinkRecipeFromMealUseCase(mealId, recipeId, repo);
      const updated = await repo.getPlanById(planId);
      if (updated) set((s) => ({ coachPlans: s.coachPlans.map((p) => (p.id === planId ? updated : p)) }));
      return true;
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFallback });
      return false;
    }
  },

  duplicatePlan: async (plan, coachId) => {
    set({ isSubmitting: true, error: null });
    try {
      const copy = await duplicatePlanUseCase(plan, coachId, repo);
      set((s) => ({ coachPlans: [copy, ...s.coachPlans], isSubmitting: false }));
      return true;
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFallback, isSubmitting: false });
      return false;
    }
  },

  assignPlan: async (planId, athleteId) => {
    try {
      await assignNutritionPlanUseCase({ planId, athleteId }, repo);
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedAssignPlan });
    }
  },

  assignMultipleToAthlete: async (planIds, athleteId) => {
    set({ error: null });
    try {
      await assignPlansToAthleteUseCase(planIds, athleteId, repo);
      return true;
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedAssignPlan });
      return false;
    }
  },

  deletePlan: async (planId) => {
    try {
      await deleteNutritionPlanUseCase(planId, repo);
      set((s) => ({ coachPlans: s.coachPlans.filter((p) => p.id !== planId) }));
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedDeletePlan });
    }
  },

  // ── Athlete ────────────────────────────────────────────────────────────────

  fetchAssignedPlan: async (athleteId) => {
    set({ assignedPlanLoading: true, error: null });
    try {
      const plan = await getAssignedNutritionPlanUseCase(athleteId, repo);
      set({ assignedPlan: plan, assignedPlanLoading: false });
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedLoadPlan, assignedPlanLoading: false });
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
      set({ error: (err as any)?.message ?? Strings.errorFailedLoadDailySummary, dailySummaryLoading: false });
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
      set({ error: (err as any)?.message ?? Strings.errorFailedLogMeal, isSubmitting: false });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
