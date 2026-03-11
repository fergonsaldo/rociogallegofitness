/**
 * CoachRemoteRepository tests
 */

import { CoachRemoteRepository } from '../../../src/infrastructure/supabase/remote/CoachRemoteRepository';

const { supabase } = require('../../../src/infrastructure/supabase/client');

const COACH_ID   = 'coac-uuid-0001-0000-000000000001';
const ATHLETE_ID = 'athl-uuid-0001-0000-000000000001';
const ROUTINE_ID = 'rout-uuid-0001-0000-000000000001';
const NOW        = new Date().toISOString();

const RAW_ATHLETE_ROW = {
  users: { id: ATHLETE_ID, full_name: 'Ana García', email: 'ana@test.com' },
};

const RAW_ASSIGNMENT_ROW = {
  assigned_at: NOW,
  routines: { id: ROUTINE_ID, name: 'Push A' },
};

const RAW_SESSION_ROW = {
  id: 'sess-001', started_at: NOW, finished_at: NOW, status: 'completed',
};

function mockChain(finalResult: object) {
  const chain: any = {};
  ['select','eq','order','limit','delete'].forEach((m) => { chain[m] = jest.fn(() => chain); });
  chain.then = (resolve: any) => Promise.resolve(finalResult).then(resolve);
  return chain;
}

describe('CoachRemoteRepository', () => {
  let repo: CoachRemoteRepository;

  beforeEach(() => {
    repo = new CoachRemoteRepository();
    jest.clearAllMocks();
  });

  // ── getAthletes ─────────────────────────────────────────────────────────────

  describe('getAthletes', () => {
    it('maps raw rows to CoachAthlete domain objects', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [RAW_ATHLETE_ROW], error: null }));

      const result = await repo.getAthletes(COACH_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(ATHLETE_ID);
      expect(result[0].fullName).toBe('Ana García');
      expect(result[0].email).toBe('ana@test.com');
    });

    it('filters out null users from join', async () => {
      supabase.from.mockReturnValue(
        mockChain({ data: [{ users: null }, RAW_ATHLETE_ROW], error: null })
      );
      const result = await repo.getAthletes(COACH_ID);
      expect(result).toHaveLength(1);
    });

    it('returns empty array when coach has no athletes', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [], error: null }));
      expect(await repo.getAthletes(COACH_ID)).toEqual([]);
    });

    it('throws when supabase returns an error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'RLS error' } }));
      await expect(repo.getAthletes(COACH_ID)).rejects.toMatchObject({ message: 'RLS error' });
    });
  });

  // ── getAthleteAssignments ───────────────────────────────────────────────────

  describe('getAthleteAssignments', () => {
    it('maps raw rows to AthleteRoutineAssignment domain objects', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [RAW_ASSIGNMENT_ROW], error: null }));

      const result = await repo.getAthleteAssignments(ATHLETE_ID);

      expect(result).toHaveLength(1);
      expect(result[0].routineId).toBe(ROUTINE_ID);
      expect(result[0].routineName).toBe('Push A');
      expect(result[0].assignedAt).toBeInstanceOf(Date);
    });

    it('filters out rows with null routines', async () => {
      supabase.from.mockReturnValue(
        mockChain({ data: [{ assigned_at: NOW, routines: null }, RAW_ASSIGNMENT_ROW], error: null })
      );
      const result = await repo.getAthleteAssignments(ATHLETE_ID);
      expect(result).toHaveLength(1);
    });

    it('returns empty array when no assignments', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [], error: null }));
      expect(await repo.getAthleteAssignments(ATHLETE_ID)).toEqual([]);
    });

    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'DB error' } }));
      await expect(repo.getAthleteAssignments(ATHLETE_ID)).rejects.toMatchObject({ message: 'DB error' });
    });
  });

  // ── getAthleteSessions ──────────────────────────────────────────────────────

  describe('getAthleteSessions', () => {
    it('maps raw rows to AthleteSession domain objects', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [RAW_SESSION_ROW], error: null }));

      const result = await repo.getAthleteSessions(ATHLETE_ID, 10);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('sess-001');
      expect(result[0].status).toBe('completed');
      expect(result[0].startedAt).toBeInstanceOf(Date);
      expect(result[0].finishedAt).toBeInstanceOf(Date);
    });

    it('maps null finished_at to null finishedAt', async () => {
      const activeRow = { ...RAW_SESSION_ROW, finished_at: null, status: 'active' };
      supabase.from.mockReturnValue(mockChain({ data: [activeRow], error: null }));

      const result = await repo.getAthleteSessions(ATHLETE_ID, 10);
      expect(result[0].finishedAt).toBeNull();
    });

    it('returns empty array when no sessions', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [], error: null }));
      expect(await repo.getAthleteSessions(ATHLETE_ID, 10)).toEqual([]);
    });

    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'DB error' } }));
      await expect(repo.getAthleteSessions(ATHLETE_ID, 10)).rejects.toMatchObject({ message: 'DB error' });
    });
  });

  // ── unassignRoutine ─────────────────────────────────────────────────────────

  describe('unassignRoutine', () => {
    it('resolves without error on success', async () => {
      supabase.from.mockReturnValue(mockChain({ error: null }));
      await expect(repo.unassignRoutine(ROUTINE_ID, ATHLETE_ID)).resolves.toBeUndefined();
    });

    it('throws when supabase returns an error', async () => {
      supabase.from.mockReturnValue(mockChain({ error: { message: 'Delete failed' } }));
      await expect(repo.unassignRoutine(ROUTINE_ID, ATHLETE_ID))
        .rejects.toMatchObject({ message: 'Delete failed' });
    });
  });
});
