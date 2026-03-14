/**
 * WorkoutLocalRepository tests
 *
 * Mocks drizzle's db object at the module level so we test the repository
 * mapping/branching logic without touching a real SQLite file.
 */

// ── drizzle mock ──────────────────────────────────────────────────────────────

const mockValues   = jest.fn().mockResolvedValue(undefined);
const mockSet      = jest.fn();
const mockWhere    = jest.fn();
const mockLimit    = jest.fn();
const mockOrderBy  = jest.fn();
const mockFrom     = jest.fn();

// update chain: db.update().set().where()
const whereResult  = { then: (r: any) => Promise.resolve(undefined).then(r) };
mockWhere.mockReturnValue(whereResult);
mockSet.mockReturnValue({ where: mockWhere });

// select chain: db.select().from().where().limit() | .orderBy().limit()
mockLimit.mockResolvedValue([]);
mockOrderBy.mockReturnValue({ limit: mockLimit });
const whereChain = { limit: mockLimit, orderBy: mockOrderBy };
mockWhere.mockReturnValue(whereResult); // update
const fromChain  = { where: jest.fn().mockReturnValue(whereChain) };
mockFrom.mockReturnValue(fromChain);

jest.mock('../../../src/infrastructure/database/client', () => ({
  db: {
    insert: jest.fn(() => ({ values: mockValues })),
    update: jest.fn(() => ({ set: mockSet })),
    select: jest.fn(() => ({ from: mockFrom })),
  },
}));

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'fixed-uuid-0000-0000-000000000001') }));

import { WorkoutLocalRepository } from '../../../src/infrastructure/database/local/WorkoutLocalRepository';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ATHLETE_ID  = '223e4567-e89b-12d3-a456-426614174001';
const SESSION_ID  = 'fixed-uuid-0000-0000-000000000001';
const EXERCISE_ID = '11111111-0001-0000-0000-000000000001';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WorkoutLocalRepository', () => {
  let repo: WorkoutLocalRepository;

  beforeEach(() => {
    repo = new WorkoutLocalRepository();
    jest.clearAllMocks();
    mockValues.mockResolvedValue(undefined);
    mockLimit.mockResolvedValue([]);
    mockWhere.mockReturnValue(whereResult);
    mockSet.mockReturnValue({ where: mockWhere });
    mockFrom.mockReturnValue({ where: jest.fn().mockReturnValue(whereChain) });
  });

  // ── startSession ────────────────────────────────────────────────────────────

  describe('startSession', () => {
    it('returns a new active session with a generated UUID', async () => {
      const result = await repo.startSession({ athleteId: ATHLETE_ID });
      expect(result.id).toBe(SESSION_ID);
      expect(result.status).toBe('active');
      expect(result.athleteId).toBe(ATHLETE_ID);
      expect(result.sets).toEqual([]);
    });

    it('includes routineId and routineDayId when provided', async () => {
      const result = await repo.startSession({
        athleteId: ATHLETE_ID, routineId: 'r-id', routineDayId: 'd-id',
      });
      expect(result.routineId).toBe('r-id');
      expect(result.routineDayId).toBe('d-id');
    });

    it('sets optional fields to undefined when not provided', async () => {
      const result = await repo.startSession({ athleteId: ATHLETE_ID });
      expect(result.routineId).toBeUndefined();
      expect(result.routineDayId).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });
  });

  // ── getActiveSession ────────────────────────────────────────────────────────

  describe('getActiveSession', () => {
    it('returns null when no active session exists', async () => {
      mockLimit.mockResolvedValue([]);
      const result = await repo.getActiveSession(ATHLETE_ID);
      expect(result).toBeNull();
    });
  });

  // ── logSet — reps ───────────────────────────────────────────────────────────

  describe('logSet', () => {
    it('returns a reps set with correct performance data', async () => {
      const result = await repo.logSet({
        sessionId: SESSION_ID, exerciseId: EXERCISE_ID, setNumber: 1,
        performance: { type: 'reps', reps: 10, weightKg: 80 },
        restAfterSeconds: 90,
      });
      expect(result.performance.type).toBe('reps');
      expect((result.performance as any).reps).toBe(10);
      expect((result.performance as any).weightKg).toBe(80);
      expect(result.restAfterSeconds).toBe(90);
    });

    it('returns an isometric set with correct performance data', async () => {
      const result = await repo.logSet({
        sessionId: SESSION_ID, exerciseId: EXERCISE_ID, setNumber: 1,
        performance: { type: 'isometric', durationSeconds: 45 },
        restAfterSeconds: 0,
      });
      expect(result.performance.type).toBe('isometric');
      expect((result.performance as any).durationSeconds).toBe(45);
    });

    it('assigns completedAt as a Date', async () => {
      const result = await repo.logSet({
        sessionId: SESSION_ID, exerciseId: EXERCISE_ID, setNumber: 1,
        performance: { type: 'reps', reps: 5, weightKg: 100 },
        restAfterSeconds: 0,
      });
      expect(result.completedAt).toBeInstanceOf(Date);
    });
  });

  // ── finishSession ───────────────────────────────────────────────────────────

  describe('finishSession', () => {
    it('throws when session is not found after update', async () => {
      mockLimit.mockResolvedValue([]);
      await expect(repo.finishSession(SESSION_ID)).rejects.toThrow('not found after finishing');
    });
  });

  // ── abandonSession ──────────────────────────────────────────────────────────

  describe('abandonSession', () => {
    it('throws when session is not found after update', async () => {
      mockLimit.mockResolvedValue([]);
      await expect(repo.abandonSession(SESSION_ID)).rejects.toThrow('not found after abandoning');
    });
  });

  // ── markSynced ──────────────────────────────────────────────────────────────

  describe('markSynced', () => {
    it('resolves without throwing', async () => {
      await expect(repo.markSynced(SESSION_ID)).resolves.toBeUndefined();
    });
  });

  // ── getUnsyncedSessions ─────────────────────────────────────────────────────

  describe('getUnsyncedSessions', () => {
    it('returns empty array when no unsynced sessions', async () => {
      // mockWhere at the end of the select chain resolves to []
      const whereEnd = { then: (r: any) => Promise.resolve([]).then(r) };
      mockFrom.mockReturnValue({ where: jest.fn().mockReturnValue(whereEnd) });

      const result = await repo.getUnsyncedSessions(ATHLETE_ID);
      expect(result).toEqual([]);
    });
  });

  describe('getActiveSession', () => {
    it('returns a mapped session when an active session exists', async () => {
      const sessionRow = {
        id: SESSION_ID, athleteId: ATHLETE_ID, routineId: null,
        routineDayId: null, status: 'active', startedAt: new Date().toISOString(),
        finishedAt: null, syncedAt: null,
      };
      const setRow = {
        id: 'set-0001', sessionId: SESSION_ID, exerciseId: EXERCISE_ID,
        setNumber: 1, performanceType: 'reps', reps: 10, weightKg: 50,
        durationSeconds: null, completedAt: new Date().toISOString(),
      };
      mockLimit
        .mockResolvedValueOnce([sessionRow])
        .mockResolvedValueOnce([setRow]);

      const repo = new WorkoutLocalRepository();
      const session = await repo.getActiveSession(ATHLETE_ID);
      expect(session).not.toBeNull();
      expect(session!.id).toBe(SESSION_ID);
      expect(session!.sets).toHaveLength(1);
    });
  });

  describe('getSessionHistory', () => {
    it('returns empty array when no sessions exist', async () => {
      mockLimit.mockResolvedValue([]);
      const repo = new WorkoutLocalRepository();
      const history = await repo.getSessionHistory(ATHLETE_ID);
      expect(history).toEqual([]);
    });

    it('returns mapped sessions with their sets', async () => {
      const sessionRow = {
        id: SESSION_ID, athleteId: ATHLETE_ID, routineId: null,
        routineDayId: null, status: 'completed', startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(), syncedAt: null,
      };
      mockLimit
        .mockResolvedValueOnce([sessionRow])
        .mockResolvedValueOnce([]);
      const repo = new WorkoutLocalRepository();
      const history = await repo.getSessionHistory(ATHLETE_ID, 10);
      expect(history).toHaveLength(1);
      expect(history[0].status).toBe('completed');
    });
  });

  describe('getUnsyncedSessions (with data)', () => {
    it('returns sessions that are completed and not synced', async () => {
      const sessionRow = {
        id: SESSION_ID, athleteId: ATHLETE_ID, routineId: null,
        routineDayId: null, status: 'completed', startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(), syncedAt: null,
      };
      mockLimit
        .mockResolvedValueOnce([sessionRow])
        .mockResolvedValueOnce([]);
      const repo = new WorkoutLocalRepository();
      const unsynced = await repo.getUnsyncedSessions(ATHLETE_ID);
      expect(unsynced).toHaveLength(1);
    });
  });

  describe('finishSession', () => {
    it('returns the finished session when found', async () => {
      const sessionRow = {
        id: SESSION_ID, athleteId: ATHLETE_ID, routineId: null,
        routineDayId: null, status: 'completed', startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(), syncedAt: null,
      };
      mockLimit
        .mockResolvedValueOnce([sessionRow])
        .mockResolvedValueOnce([]);
      const repo = new WorkoutLocalRepository();
      const session = await repo.finishSession(SESSION_ID);
      expect(session.status).toBe('completed');
    });
  });

  describe('abandonSession', () => {
    it('returns the abandoned session when found', async () => {
      const sessionRow = {
        id: SESSION_ID, athleteId: ATHLETE_ID, routineId: null,
        routineDayId: null, status: 'abandoned', startedAt: new Date().toISOString(),
        finishedAt: null, syncedAt: null,
      };
      mockLimit
        .mockResolvedValueOnce([sessionRow])
        .mockResolvedValueOnce([]);
      const repo = new WorkoutLocalRepository();
      const session = await repo.abandonSession(SESSION_ID);
      expect(session.status).toBe('abandoned');
    });
  });
});
