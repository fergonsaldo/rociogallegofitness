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
  ['select','eq','order','limit','delete','in','gte'].forEach((m) => { chain[m] = jest.fn(() => chain); });
  chain.then = (resolve: any) => Promise.resolve(finalResult).then(resolve);
  return chain;
}

describe('CoachRemoteRepository', () => {
  let repo: CoachRemoteRepository;

  beforeEach(() => {
    repo = new CoachRemoteRepository();
    jest.resetAllMocks();
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

  // ── null data branch coverage ─────────────────────────────────────────────

  describe('getAthletes (branch coverage)', () => {
    it('handles null data gracefully', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: null }));
      expect(await repo.getAthletes(COACH_ID)).toEqual([]);
    });
  });

  describe('getAthleteAssignments (branch coverage)', () => {
    it('handles null data gracefully', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: null }));
      expect(await repo.getAthleteAssignments(ATHLETE_ID)).toEqual([]);
    });
  });

  describe('getAthleteSessions (branch coverage)', () => {
    it('handles null data gracefully', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: null }));
      expect(await repo.getAthleteSessions(ATHLETE_ID, 10)).toEqual([]);
    });
  });

  // ── updateAthleteStatus ──────────────────────────────────────────────────

  describe('updateAthleteStatus', () => {
    function mockUpdateChain(finalResult: object) {
      const chain: any = {};
      ['update', 'eq'].forEach((m) => { chain[m] = jest.fn(() => chain); });
      chain.then = (resolve: any) => Promise.resolve(finalResult).then(resolve);
      return chain;
    }

    it('resolves without error when archiving an athlete', async () => {
      supabase.from.mockReturnValue(mockUpdateChain({ error: null }));
      await expect(repo.updateAthleteStatus(COACH_ID, ATHLETE_ID, 'archived')).resolves.toBeUndefined();
    });

    it('resolves without error when restoring an athlete', async () => {
      supabase.from.mockReturnValue(mockUpdateChain({ error: null }));
      await expect(repo.updateAthleteStatus(COACH_ID, ATHLETE_ID, 'active')).resolves.toBeUndefined();
    });

    it('throws when supabase returns an error', async () => {
      supabase.from.mockReturnValue(mockUpdateChain({ error: { message: 'RLS error' } }));
      await expect(repo.updateAthleteStatus(COACH_ID, ATHLETE_ID, 'archived'))
        .rejects.toMatchObject({ message: 'RLS error' });
    });
  });

  // ── getDashboardSummary ───────────────────────────────────────────────────

  describe('getDashboardSummary', () => {
    const SINCE = new Date('2024-01-01T00:00:00.000Z');

    const RAW_ATHLETE_ROWS = [
      { users: { id: ATHLETE_ID, full_name: 'Ana García' } },
    ];

    const RAW_SESSION_ROWS = [
      { id: 'sess-001', athlete_id: ATHLETE_ID, started_at: NOW, status: 'completed' },
    ];

    const RAW_ACTIVE_ROWS = [
      { athlete_id: ATHLETE_ID },
    ];

    it('returns correct summary when coach has athletes and sessions', async () => {
      supabase.from
        .mockReturnValueOnce(mockChain({ data: RAW_ATHLETE_ROWS, error: null }))
        .mockReturnValueOnce(mockChain({ data: RAW_SESSION_ROWS, error: null }))
        .mockReturnValueOnce(mockChain({ data: RAW_ACTIVE_ROWS, error: null }));

      const result = await repo.getDashboardSummary(COACH_ID, SINCE, 5);

      expect(result.totalAthletes).toBe(1);
      expect(result.activeAthletesThisWeek).toBe(1);
      expect(result.recentSessions).toHaveLength(1);
      expect(result.recentSessions[0].sessionId).toBe('sess-001');
      expect(result.recentSessions[0].athleteId).toBe(ATHLETE_ID);
      expect(result.recentSessions[0].athleteName).toBe('Ana García');
      expect(result.recentSessions[0].startedAt).toBeInstanceOf(Date);
      expect(result.recentSessions[0].status).toBe('completed');
    });

    it('returns zero summary when coach has no athletes', async () => {
      supabase.from.mockReturnValueOnce(mockChain({ data: [], error: null }));

      const result = await repo.getDashboardSummary(COACH_ID, SINCE, 5);

      expect(result.totalAthletes).toBe(0);
      expect(result.activeAthletesThisWeek).toBe(0);
      expect(result.recentSessions).toEqual([]);
    });

    it('returns zero active athletes when none trained this week', async () => {
      supabase.from
        .mockReturnValueOnce(mockChain({ data: RAW_ATHLETE_ROWS, error: null }))
        .mockReturnValueOnce(mockChain({ data: [], error: null }))
        .mockReturnValueOnce(mockChain({ data: [], error: null }));

      const result = await repo.getDashboardSummary(COACH_ID, SINCE, 5);

      expect(result.totalAthletes).toBe(1);
      expect(result.activeAthletesThisWeek).toBe(0);
      expect(result.recentSessions).toEqual([]);
    });

    it('deduplicates athletes that trained multiple times this week', async () => {
      const twoSessionsSameAthlete = [
        { athlete_id: ATHLETE_ID },
        { athlete_id: ATHLETE_ID },
      ];
      supabase.from
        .mockReturnValueOnce(mockChain({ data: RAW_ATHLETE_ROWS, error: null }))
        .mockReturnValueOnce(mockChain({ data: RAW_SESSION_ROWS, error: null }))
        .mockReturnValueOnce(mockChain({ data: twoSessionsSameAthlete, error: null }));

      const result = await repo.getDashboardSummary(COACH_ID, SINCE, 5);

      expect(result.activeAthletesThisWeek).toBe(1);
    });

    it('uses fallback name when athlete not found in map', async () => {
      const unknownAthleteSession = [
        { id: 'sess-002', athlete_id: 'unknown-id', started_at: NOW, status: 'completed' },
      ];
      supabase.from
        .mockReturnValueOnce(mockChain({ data: RAW_ATHLETE_ROWS, error: null }))
        .mockReturnValueOnce(mockChain({ data: unknownAthleteSession, error: null }))
        .mockReturnValueOnce(mockChain({ data: [], error: null }));

      const result = await repo.getDashboardSummary(COACH_ID, SINCE, 5);

      expect(result.recentSessions[0].athleteName).toBe('Atleta');
    });

    it('throws when athlete query fails', async () => {
      supabase.from.mockReturnValueOnce(
        mockChain({ data: null, error: { message: 'RLS error' } })
      );

      await expect(repo.getDashboardSummary(COACH_ID, SINCE, 5))
        .rejects.toMatchObject({ message: 'RLS error' });
    });

    it('throws when session query fails', async () => {
      supabase.from
        .mockReturnValueOnce(mockChain({ data: RAW_ATHLETE_ROWS, error: null }))
        .mockReturnValueOnce(mockChain({ data: null, error: { message: 'Session error' } }));

      await expect(repo.getDashboardSummary(COACH_ID, SINCE, 5))
        .rejects.toMatchObject({ message: 'Session error' });
    });

    it('throws when active athletes query fails', async () => {
      supabase.from
        .mockReturnValueOnce(mockChain({ data: RAW_ATHLETE_ROWS, error: null }))
        .mockReturnValueOnce(mockChain({ data: RAW_SESSION_ROWS, error: null }))
        .mockReturnValueOnce(mockChain({ data: null, error: { message: 'Active error' } }));

      await expect(repo.getDashboardSummary(COACH_ID, SINCE, 5))
        .rejects.toMatchObject({ message: 'Active error' });
    });

    it('handles null data from supabase gracefully', async () => {
      supabase.from
        .mockReturnValueOnce(mockChain({ data: null, error: null }));

      const result = await repo.getDashboardSummary(COACH_ID, SINCE, 5);

      expect(result.totalAthletes).toBe(0);
      expect(result.recentSessions).toEqual([]);
    });
  });
});
