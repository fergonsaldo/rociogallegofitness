/**
 * NutritionRemoteRepository tests
 */

import { NutritionRemoteRepository } from '../../../src/infrastructure/supabase/remote/NutritionRemoteRepository';

const { supabase } = require('../../../src/infrastructure/supabase/client');

const PLAN_ID    = 'plan-uuid-0001-0000-000000000001';
const COACH_ID   = 'coac-uuid-0001-0000-000000000001';
const ATHLETE_ID = 'athl-uuid-0001-0000-000000000001';
const MEAL_ID    = 'meal-uuid-0001-0000-000000000001';
const NOW        = new Date().toISOString();

const RAW_PLAN_ROW = {
  id: PLAN_ID, coach_id: COACH_ID, name: 'Plan de volumen',
  description: 'Desc', calories: 2800, protein_g: 180, carbs_g: 320, fat_g: 80,
  created_at: NOW, updated_at: NOW,
  meals: [
    {
      id: MEAL_ID, nutrition_plan_id: PLAN_ID, name: 'Desayuno', order: 1,
      calories: 600, protein_g: 40, carbs_g: 70, fat_g: 15, notes: null,
    },
  ],
};

const RAW_LOG_ROW = {
  id: 'log-001', meal_id: MEAL_ID, athlete_id: ATHLETE_ID,
  logged_at: NOW, calories: 580, protein_g: 38, carbs_g: 68, fat_g: 14, notes: null,
};

function mockChain(finalResult: object) {
  const chain: any = {};
  ['select','insert','update','upsert','delete','eq','gte','lte','order','limit']
    .forEach((m) => { chain[m] = jest.fn(() => chain); });
  chain.single      = jest.fn().mockResolvedValue(finalResult);
  chain.maybeSingle = jest.fn().mockResolvedValue(finalResult);
  chain.then        = (resolve: any) => Promise.resolve(finalResult).then(resolve);
  return chain;
}

describe('NutritionRemoteRepository', () => {
  let repo: NutritionRemoteRepository;

  beforeEach(() => {
    repo = new NutritionRemoteRepository();
    jest.clearAllMocks();
  });

  describe('getPlansByCoach', () => {
    it('maps raw rows into NutritionPlan domain objects', async () => {
      const chain = mockChain({ data: [RAW_PLAN_ROW], error: null });
      supabase.from.mockReturnValue(chain);
      const result = await repo.getPlansByCoach(COACH_ID);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(PLAN_ID);
      expect(result[0].dailyTargetMacros.calories).toBe(2800);
      expect(result[0].meals[0].name).toBe('Desayuno');
    });

    it('sorts meals by order', async () => {
      const row = {
        ...RAW_PLAN_ROW,
        meals: [
          { ...RAW_PLAN_ROW.meals[0], id: 'meal-002', order: 2, name: 'Comida' },
          { ...RAW_PLAN_ROW.meals[0], id: 'meal-001', order: 1, name: 'Desayuno' },
        ],
      };
      const chain = mockChain({ data: [row], error: null });
      supabase.from.mockReturnValue(chain);
      const result = await repo.getPlansByCoach(COACH_ID);
      expect(result[0].meals[0].name).toBe('Desayuno');
    });

    it('returns empty array when no plans exist', async () => {
      const chain = mockChain({ data: [], error: null });
      supabase.from.mockReturnValue(chain);
      expect(await repo.getPlansByCoach(COACH_ID)).toEqual([]);
    });

    it('throws when supabase returns an error', async () => {
      const chain = mockChain({ data: null, error: { message: 'DB error' } });
      supabase.from.mockReturnValue(chain);
      await expect(repo.getPlansByCoach(COACH_ID)).rejects.toMatchObject({ message: 'DB error' });
    });
  });

  describe('getPlanById', () => {
    it('returns the mapped plan when found', async () => {
      const chain = mockChain({ data: RAW_PLAN_ROW, error: null });
      supabase.from.mockReturnValue(chain);
      expect((await repo.getPlanById(PLAN_ID))?.id).toBe(PLAN_ID);
    });

    it('returns null on PGRST116', async () => {
      const chain = mockChain({ data: null, error: { code: 'PGRST116' } });
      supabase.from.mockReturnValue(chain);
      expect(await repo.getPlanById(PLAN_ID)).toBeNull();
    });

    it('throws on other errors', async () => {
      const chain = mockChain({ data: null, error: { message: 'Server error', code: '500' } });
      supabase.from.mockReturnValue(chain);
      await expect(repo.getPlanById(PLAN_ID)).rejects.toMatchObject({ message: 'Server error' });
    });
  });

  describe('deletePlan', () => {
    it('resolves on success', async () => {
      supabase.from.mockReturnValue(mockChain({ error: null }));
      await expect(repo.deletePlan(PLAN_ID)).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockChain({ error: { message: 'Delete failed' } }));
      await expect(repo.deletePlan(PLAN_ID)).rejects.toMatchObject({ message: 'Delete failed' });
    });
  });

  describe('assignToAthlete', () => {
    it('resolves on success', async () => {
      supabase.from.mockReturnValue(mockChain({ error: null }));
      await expect(repo.assignToAthlete(PLAN_ID, ATHLETE_ID)).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockChain({ error: { message: 'Upsert failed' } }));
      await expect(repo.assignToAthlete(PLAN_ID, ATHLETE_ID)).rejects.toMatchObject({ message: 'Upsert failed' });
    });
  });

  describe('unassignFromAthlete', () => {
    it('resolves on success', async () => {
      supabase.from.mockReturnValue(mockChain({ error: null }));
      await expect(repo.unassignFromAthlete(PLAN_ID, ATHLETE_ID)).resolves.toBeUndefined();
    });
  });

  describe('getAssignedPlan', () => {
    it('returns null when no plan assigned', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: null }));
      expect(await repo.getAssignedPlan(ATHLETE_ID)).toBeNull();
    });

    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'RLS error' } }));
      await expect(repo.getAssignedPlan(ATHLETE_ID)).rejects.toMatchObject({ message: 'RLS error' });
    });
  });

  describe('logMeal', () => {
    const LOG_INPUT = {
      mealId: MEAL_ID, athleteId: ATHLETE_ID,
      actualMacros: { calories: 580, proteinG: 38, carbsG: 68, fatG: 14 },
    };

    it('inserts and returns the mapped log entry', async () => {
      supabase.from.mockReturnValue(mockChain({ data: RAW_LOG_ROW, error: null }));
      const result = await repo.logMeal(LOG_INPUT);
      expect(result.mealId).toBe(MEAL_ID);
      expect(result.actualMacros.calories).toBe(580);
    });

    it('throws when insert fails', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'Insert failed' } }));
      await expect(repo.logMeal(LOG_INPUT)).rejects.toMatchObject({ message: 'Insert failed' });
    });
  });

  describe('getLogEntriesForDay', () => {
    it('returns mapped entries', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [RAW_LOG_ROW], error: null }));
      const result = await repo.getLogEntriesForDay(ATHLETE_ID, new Date());
      expect(result).toHaveLength(1);
      expect(result[0].mealId).toBe(MEAL_ID);
    });

    it('returns empty array when no logs', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [], error: null }));
      expect(await repo.getLogEntriesForDay(ATHLETE_ID, new Date())).toEqual([]);
    });
  });

  describe('getLogEntriesForRange', () => {
    it('returns entries within the range', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [RAW_LOG_ROW], error: null }));
      const result = await repo.getLogEntriesForRange(ATHLETE_ID, new Date('2026-01-01'), new Date('2026-01-07'));
      expect(result).toHaveLength(1);
    });

    it('returns empty array when no entries in range', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [], error: null }));
      expect(await repo.getLogEntriesForRange(ATHLETE_ID, new Date('2026-01-01'), new Date('2026-01-07'))).toEqual([]);
    });

    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'Query failed' } }));
      await expect(repo.getLogEntriesForRange(ATHLETE_ID, new Date('2026-01-01'), new Date('2026-01-07')))
        .rejects.toMatchObject({ message: 'Query failed' });
    });
  });

  // ── createPlan ────────────────────────────────────────────────────────────

  describe('createPlan', () => {
    const PLAN_ROW = {
      id: PLAN_ID, coach_id: COACH_ID, name: 'Plan de volumen',
      description: 'Desc', calories: 2800, protein_g: 180, carbs_g: 320, fat_g: 80,
      created_at: NOW, updated_at: NOW,
    };

    const VALID_INPUT = {
      coachId: COACH_ID,
      name: 'Plan de volumen',
      description: 'Desc',
      dailyTargetMacros: { calories: 2800, proteinG: 180, carbsG: 320, fatG: 80 },
      meals: [{
        name: 'Desayuno', order: 1,
        targetMacros: { calories: 600, proteinG: 40, carbsG: 70, fatG: 15 },
      }],
    };

    it('creates plan with meals and returns the mapped plan', async () => {
      supabase.from
        .mockReturnValueOnce(mockChain({ data: PLAN_ROW, error: null }))
        .mockReturnValueOnce(mockChain({ error: null }))
        .mockReturnValueOnce(mockChain({ data: RAW_PLAN_ROW, error: null }));
      const result = await repo.createPlan(VALID_INPUT);
      expect(result.id).toBe(PLAN_ID);
      expect(result.meals).toHaveLength(1);
    });

    it('throws when plan insert fails', async () => {
      supabase.from.mockReturnValueOnce(mockChain({ data: null, error: { message: 'Insert failed', code: 'ERR' } }));
      await expect(repo.createPlan(VALID_INPUT)).rejects.toMatchObject({ message: 'nutrition_plans insert: Insert failed (ERR)' });
    });

    it('throws when meals insert fails', async () => {
      supabase.from
        .mockReturnValueOnce(mockChain({ data: PLAN_ROW, error: null }))
        .mockReturnValueOnce(mockChain({ error: { message: 'Meals failed', code: 'ERR' } }));
      await expect(repo.createPlan(VALID_INPUT)).rejects.toMatchObject({ message: 'meals insert: Meals failed (ERR)' });
    });

    it('throws when getPlanById returns null after creation', async () => {
      supabase.from
        .mockReturnValueOnce(mockChain({ data: PLAN_ROW, error: null }))
        .mockReturnValueOnce(mockChain({ error: null }))
        .mockReturnValueOnce(mockChain({ data: null, error: { code: 'PGRST116' } }));
      await expect(repo.createPlan(VALID_INPUT)).rejects.toThrow('Plan not found after creation');
    });
  });

  // ── getAssignedPlan with data ─────────────────────────────────────────────

  describe('getAssignedPlan (branch coverage)', () => {
    it('returns mapped plan when athlete has an assigned plan', async () => {
      const joinRow = { nutrition_plans: RAW_PLAN_ROW };
      supabase.from.mockReturnValue(mockChain({ data: joinRow, error: null }));
      const result = await repo.getAssignedPlan(ATHLETE_ID);
      expect(result?.id).toBe(PLAN_ID);
    });

    it('returns null when nutrition_plans is null in join', async () => {
      supabase.from.mockReturnValue(mockChain({ data: { nutrition_plans: null }, error: null }));
      expect(await repo.getAssignedPlan(ATHLETE_ID)).toBeNull();
    });
  });

  // ── unassignFromAthlete error ─────────────────────────────────────────────

  describe('unassignFromAthlete (branch coverage)', () => {
    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockChain({ error: { message: 'Delete failed' } }));
      await expect(repo.unassignFromAthlete(PLAN_ID, ATHLETE_ID)).rejects.toMatchObject({ message: 'Delete failed' });
    });
  });

  // ── getLogEntriesForDay null data ─────────────────────────────────────────

  describe('getLogEntriesForDay (branch coverage)', () => {
    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'Query failed' } }));
      await expect(repo.getLogEntriesForDay(ATHLETE_ID, new Date())).rejects.toMatchObject({ message: 'Query failed' });
    });

    it('handles null data gracefully', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: null }));
      expect(await repo.getLogEntriesForDay(ATHLETE_ID, new Date())).toEqual([]);
    });
  });

  // ── getPlansByCoach null data ─────────────────────────────────────────────

  describe('getPlansByCoach (branch coverage)', () => {
    it('handles null data gracefully', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: null }));
      expect(await repo.getPlansByCoach(COACH_ID)).toEqual([]);
    });

    it('handles plan with null meals array', async () => {
      const rowNoMeals = { ...RAW_PLAN_ROW, meals: null };
      supabase.from.mockReturnValue(mockChain({ data: [rowNoMeals], error: null }));
      const result = await repo.getPlansByCoach(COACH_ID);
      expect(result[0].meals).toEqual([]);
    });
  });
});
