/**
 * RoutineRemoteRepository tests
 */

import { RoutineRemoteRepository } from '../../../src/infrastructure/supabase/remote/RoutineRemoteRepository';

const { supabase } = require('../../../src/infrastructure/supabase/client');

const ROUTINE_ID  = 'rout-uuid-0001-0000-000000000001';
const COACH_ID    = 'coac-uuid-0001-0000-000000000001';
const ATHLETE_ID  = 'athl-uuid-0001-0000-000000000001';
const NOW         = new Date().toISOString();

const RAW_ROUTINE_ROW = {
  id: ROUTINE_ID, coach_id: COACH_ID, name: 'Push Day', description: 'Chest focus',
  duration_weeks: 4, created_at: NOW, updated_at: NOW,
  routine_days: [
    {
      id: 'day-0001', routine_id: ROUTINE_ID, day_number: 2, name: 'Day 2',
      routine_exercises: [],
    },
    {
      id: 'day-0002', routine_id: ROUTINE_ID, day_number: 1, name: 'Day 1',
      routine_exercises: [
        {
          id: 'ex-0001', routine_day_id: 'day-0002', exercise_id: '11111111-0001-0000-0000-000000000001',
          order: 1, target_sets: 3, target_reps: 10,
          target_duration_seconds: null, rest_between_sets_seconds: 90, notes: 'repsMax:12',
        },
      ],
    },
  ],
};

function mockChain(finalResult: object) {
  const chain: any = {};
  ['select','insert','update','upsert','delete','eq','neq','order','limit']
    .forEach((m) => { chain[m] = jest.fn(() => chain); });
  chain.single      = jest.fn().mockResolvedValue(finalResult);
  chain.maybeSingle = jest.fn().mockResolvedValue(finalResult);
  chain.then        = (resolve: any) => Promise.resolve(finalResult).then(resolve);
  return chain;
}

describe('RoutineRemoteRepository', () => {
  let repo: RoutineRemoteRepository;

  beforeEach(() => {
    repo = new RoutineRemoteRepository();
    jest.clearAllMocks();
  });

  // ── getByCoachId ────────────────────────────────────────────────────────────

  describe('getByCoachId', () => {
    it('maps raw rows and sorts days by day_number ascending', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [RAW_ROUTINE_ROW], error: null }));

      const result = await repo.getByCoachId(COACH_ID);

      expect(result).toHaveLength(1);
      expect(result[0].days[0].dayNumber).toBe(1);   // sorted
      expect(result[0].days[1].dayNumber).toBe(2);
      expect(result[0].days[0].exercises[0].targetSets).toBe(3);
      expect(result[0].days[0].exercises[0].notes).toBe('repsMax:12');
    });

    it('maps optional fields: description and durationWeeks', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [RAW_ROUTINE_ROW], error: null }));
      const result = await repo.getByCoachId(COACH_ID);
      expect(result[0].description).toBe('Chest focus');
      expect(result[0].durationWeeks).toBe(4);
    });

    it('returns empty array when no routines exist', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [], error: null }));
      expect(await repo.getByCoachId(COACH_ID)).toEqual([]);
    });

    it('throws when supabase returns an error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'DB error', code: '500' } }));
      await expect(repo.getByCoachId(COACH_ID)).rejects.toMatchObject({ message: 'DB error' });
    });
  });

  // ── getByAthleteId ──────────────────────────────────────────────────────────

  describe('getByAthleteId', () => {
    it('extracts routines from assignment join rows', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [{ routines: RAW_ROUTINE_ROW }], error: null }));
      const result = await repo.getByAthleteId(ATHLETE_ID);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(ROUTINE_ID);
    });

    it('filters out null routines in join result', async () => {
      supabase.from.mockReturnValue(
        mockChain({ data: [{ routines: null }, { routines: RAW_ROUTINE_ROW }], error: null })
      );
      const result = await repo.getByAthleteId(ATHLETE_ID);
      expect(result).toHaveLength(1);
    });

    it('returns empty array when no assignments', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [], error: null }));
      expect(await repo.getByAthleteId(ATHLETE_ID)).toEqual([]);
    });

    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'RLS error', code: '42501' } }));
      await expect(repo.getByAthleteId(ATHLETE_ID)).rejects.toMatchObject({ message: 'RLS error' });
    });
  });

  // ── getById ─────────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('returns the mapped routine', async () => {
      supabase.from.mockReturnValue(mockChain({ data: RAW_ROUTINE_ROW, error: null }));
      expect((await repo.getById(ROUTINE_ID))?.id).toBe(ROUTINE_ID);
    });

    it('returns null on PGRST116', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { code: 'PGRST116' } }));
      expect(await repo.getById(ROUTINE_ID)).toBeNull();
    });

    it('throws on other errors', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'Server error', code: '500' } }));
      await expect(repo.getById(ROUTINE_ID)).rejects.toMatchObject({ message: 'Server error' });
    });
  });

  // ── hasAssignments ──────────────────────────────────────────────────────────

  describe('hasAssignments', () => {
    it('returns true when count > 0', async () => {
      supabase.from.mockReturnValue(mockChain({ count: 3, error: null }));
      expect(await repo.hasAssignments(ROUTINE_ID)).toBe(true);
    });

    it('returns false when count is 0', async () => {
      supabase.from.mockReturnValue(mockChain({ count: 0, error: null }));
      expect(await repo.hasAssignments(ROUTINE_ID)).toBe(false);
    });

    it('returns false when count is null', async () => {
      supabase.from.mockReturnValue(mockChain({ count: null, error: null }));
      expect(await repo.hasAssignments(ROUTINE_ID)).toBe(false);
    });

    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockChain({ count: null, error: { message: 'DB error' } }));
      await expect(repo.hasAssignments(ROUTINE_ID)).rejects.toMatchObject({ message: 'DB error' });
    });
  });

  // ── delete ──────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('resolves on success', async () => {
      supabase.from.mockReturnValue(mockChain({ error: null }));
      await expect(repo.delete(ROUTINE_ID)).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockChain({ error: { message: 'Delete failed' } }));
      await expect(repo.delete(ROUTINE_ID)).rejects.toMatchObject({ message: 'Delete failed' });
    });
  });

  // ── assignToAthlete ─────────────────────────────────────────────────────────

  describe('assignToAthlete', () => {
    it('resolves on success', async () => {
      supabase.from.mockReturnValue(mockChain({ error: null }));
      await expect(repo.assignToAthlete(ROUTINE_ID, ATHLETE_ID)).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockChain({ error: { message: 'Upsert failed' } }));
      await expect(repo.assignToAthlete(ROUTINE_ID, ATHLETE_ID))
        .rejects.toMatchObject({ message: 'Upsert failed' });
    });
  });

  // ── unassignFromAthlete ─────────────────────────────────────────────────────

  describe('unassignFromAthlete', () => {
    it('resolves on success', async () => {
      supabase.from.mockReturnValue(mockChain({ error: null }));
      await expect(repo.unassignFromAthlete(ROUTINE_ID, ATHLETE_ID)).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockChain({ error: { message: 'Delete failed' } }));
      await expect(repo.unassignFromAthlete(ROUTINE_ID, ATHLETE_ID))
        .rejects.toMatchObject({ message: 'Delete failed' });
    });
  });
});
