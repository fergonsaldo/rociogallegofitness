/**
 * ProgressRemoteRepository tests
 */

import { ProgressRemoteRepository } from '../../../src/infrastructure/supabase/remote/ProgressRemoteRepository';

const { supabase } = require('../../../src/infrastructure/supabase/client');

const ATHLETE_ID  = 'athl-uuid-0001-0000-000000000001';
const EXERCISE_ID = '11111111-0001-0000-0000-000000000001';
const SESSION_ID  = 'sess-uuid-0001-0000-000000000001';
const NOW         = new Date().toISOString();

const RAW_RECORD = {
  id: 'rec-001', athlete_id: ATHLETE_ID, exercise_id: EXERCISE_ID,
  session_id: SESSION_ID, recorded_at: NOW,
  best_weight_kg: 100, best_reps: 5, estimated_one_rep_max_kg: 112, total_volume_kg: 1500,
};

function mockChain(finalResult: object) {
  const chain: any = {};
  ['select','insert','eq','order','limit']
    .forEach((m) => { chain[m] = jest.fn(() => chain); });
  chain.single      = jest.fn().mockResolvedValue(finalResult);
  chain.maybeSingle = jest.fn().mockResolvedValue(finalResult);
  chain.then        = (resolve: any) => Promise.resolve(finalResult).then(resolve);
  return chain;
}

describe('ProgressRemoteRepository', () => {
  let repo: ProgressRemoteRepository;

  beforeEach(() => {
    repo = new ProgressRemoteRepository();
    jest.clearAllMocks();
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('inserts and returns a mapped ProgressRecord', async () => {
      supabase.from.mockReturnValue(mockChain({ data: RAW_RECORD, error: null }));

      const result = await repo.create({
        athleteId: ATHLETE_ID, exerciseId: EXERCISE_ID, sessionId: SESSION_ID,
        recordedAt: new Date(), bestWeightKg: 100, bestReps: 5,
        estimatedOneRepMaxKg: 112, totalVolumeKg: 1500,
      });

      expect(result.athleteId).toBe(ATHLETE_ID);
      expect(result.totalVolumeKg).toBe(1500);
      expect(result.estimatedOneRepMaxKg).toBe(112);
    });

    it('throws when insert fails', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'Insert failed' } }));

      await expect(repo.create({
        athleteId: ATHLETE_ID, exerciseId: EXERCISE_ID, sessionId: SESSION_ID,
        recordedAt: new Date(), totalVolumeKg: 0,
      })).rejects.toMatchObject({ message: 'Insert failed' });
    });
  });

  // ── getByAthleteAndExercise ─────────────────────────────────────────────────

  describe('getByAthleteAndExercise', () => {
    it('returns mapped records in ascending order', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [RAW_RECORD], error: null }));

      const result = await repo.getByAthleteAndExercise(ATHLETE_ID, EXERCISE_ID);
      expect(result).toHaveLength(1);
      expect(result[0].exerciseId).toBe(EXERCISE_ID);
    });

    it('returns empty array when no records exist', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [], error: null }));
      expect(await repo.getByAthleteAndExercise(ATHLETE_ID, EXERCISE_ID)).toEqual([]);
    });

    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'DB error' } }));
      await expect(repo.getByAthleteAndExercise(ATHLETE_ID, EXERCISE_ID))
        .rejects.toMatchObject({ message: 'DB error' });
    });
  });

  // ── getLatestPerExercise ────────────────────────────────────────────────────

  describe('getLatestPerExercise', () => {
    it('deduplicates by exerciseId keeping the first (most recent) record', async () => {
      const olderRecord = { ...RAW_RECORD, id: 'rec-002', recorded_at: '2026-01-01T00:00:00Z' };
      supabase.from.mockReturnValue(
        mockChain({ data: [RAW_RECORD, olderRecord], error: null })
      );

      const result = await repo.getLatestPerExercise(ATHLETE_ID);
      // Should deduplicate: both have same exercise_id, only the first is kept
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rec-001');
    });

    it('returns one record per exercise when multiple exercises exist', async () => {
      const anotherExercise = { ...RAW_RECORD, id: 'rec-003', exercise_id: '11111111-0002-0000-0000-000000000001' };
      supabase.from.mockReturnValue(
        mockChain({ data: [RAW_RECORD, anotherExercise], error: null })
      );

      const result = await repo.getLatestPerExercise(ATHLETE_ID);
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no records', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [], error: null }));
      expect(await repo.getLatestPerExercise(ATHLETE_ID)).toEqual([]);
    });
  });

  // ── getPersonalBest ─────────────────────────────────────────────────────────

  describe('getPersonalBest', () => {
    it('returns the record with the highest 1RM', async () => {
      supabase.from.mockReturnValue(mockChain({ data: RAW_RECORD, error: null }));

      const result = await repo.getPersonalBest(ATHLETE_ID, EXERCISE_ID);
      expect(result?.estimatedOneRepMaxKg).toBe(112);
    });

    it('returns null when no personal best exists', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: null }));
      expect(await repo.getPersonalBest(ATHLETE_ID, EXERCISE_ID)).toBeNull();
    });

    it('maps optional fields correctly when they are null', async () => {
      const minRecord = { ...RAW_RECORD, best_weight_kg: null, best_reps: null, estimated_one_rep_max_kg: null };
      supabase.from.mockReturnValue(mockChain({ data: minRecord, error: null }));

      const result = await repo.getPersonalBest(ATHLETE_ID, EXERCISE_ID);
      expect(result?.bestWeightKg).toBeUndefined();
      expect(result?.estimatedOneRepMaxKg).toBeUndefined();
    });
  });
});
