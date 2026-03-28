import {
  filterActivityByStatus,
  ActivityStatusFilter,
} from '../../../src/application/coach/ClientUseCases';
import { RecentAthleteSession } from '../../../src/domain/repositories/ICoachRepository';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<RecentAthleteSession> = {}): RecentAthleteSession {
  return {
    sessionId:   'sess-0001-0000-0000-000000000001',
    athleteId:   'athl-0001-0000-0000-000000000001',
    athleteName: 'Ana García',
    startedAt:   new Date('2026-03-25T10:00:00Z'),
    status:      'completed',
    ...overrides,
  };
}

const SESSION_COMPLETED  = makeSession({ sessionId: 's1', status: 'completed' });
const SESSION_ACTIVE     = makeSession({ sessionId: 's2', status: 'active' });
const SESSION_ABANDONED  = makeSession({ sessionId: 's3', status: 'abandoned' });

// ── filterActivityByStatus — 'all' ────────────────────────────────────────────

describe("filterActivityByStatus — 'all'", () => {
  it('returns all sessions when filter is all', () => {
    const sessions = [SESSION_COMPLETED, SESSION_ACTIVE, SESSION_ABANDONED];
    expect(filterActivityByStatus(sessions, 'all')).toHaveLength(3);
  });

  it('returns empty array when input is empty and filter is all', () => {
    expect(filterActivityByStatus([], 'all')).toEqual([]);
  });

  it('returns the same array reference when filter is all', () => {
    const sessions = [SESSION_COMPLETED];
    expect(filterActivityByStatus(sessions, 'all')).toBe(sessions);
  });
});

// ── filterActivityByStatus — 'completed' ─────────────────────────────────────

describe("filterActivityByStatus — 'completed'", () => {
  it('returns only completed sessions', () => {
    const sessions = [SESSION_COMPLETED, SESSION_ACTIVE, SESSION_ABANDONED];
    const result = filterActivityByStatus(sessions, 'completed');
    expect(result).toHaveLength(1);
    expect(result[0].sessionId).toBe('s1');
  });

  it('returns empty array when no session is completed', () => {
    const sessions = [SESSION_ACTIVE, SESSION_ABANDONED];
    expect(filterActivityByStatus(sessions, 'completed')).toEqual([]);
  });

  it('returns empty array when input is empty', () => {
    expect(filterActivityByStatus([], 'completed')).toEqual([]);
  });

  it('returns all when all sessions are completed', () => {
    const sessions = [
      makeSession({ sessionId: 'a', status: 'completed' }),
      makeSession({ sessionId: 'b', status: 'completed' }),
    ];
    expect(filterActivityByStatus(sessions, 'completed')).toHaveLength(2);
  });
});

// ── filterActivityByStatus — 'in_progress' ───────────────────────────────────

describe("filterActivityByStatus — 'in_progress'", () => {
  it('returns only non-completed sessions', () => {
    const sessions = [SESSION_COMPLETED, SESSION_ACTIVE, SESSION_ABANDONED];
    const result = filterActivityByStatus(sessions, 'in_progress');
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.sessionId)).toEqual(['s2', 's3']);
  });

  it('includes active sessions', () => {
    const sessions = [SESSION_ACTIVE];
    const result = filterActivityByStatus(sessions, 'in_progress');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('active');
  });

  it('includes abandoned sessions', () => {
    const sessions = [SESSION_ABANDONED];
    const result = filterActivityByStatus(sessions, 'in_progress');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('abandoned');
  });

  it('returns empty array when all sessions are completed', () => {
    const sessions = [SESSION_COMPLETED, makeSession({ sessionId: 's4', status: 'completed' })];
    expect(filterActivityByStatus(sessions, 'in_progress')).toEqual([]);
  });

  it('returns empty array when input is empty', () => {
    expect(filterActivityByStatus([], 'in_progress')).toEqual([]);
  });
});

// ── filterActivityByStatus — order preservation ───────────────────────────────

describe('filterActivityByStatus — order preservation', () => {
  it('preserves the original order of sessions', () => {
    const sessions = [
      makeSession({ sessionId: 'x1', status: 'completed' }),
      makeSession({ sessionId: 'x2', status: 'completed' }),
      makeSession({ sessionId: 'x3', status: 'completed' }),
    ];
    const result = filterActivityByStatus(sessions, 'completed');
    expect(result.map((s) => s.sessionId)).toEqual(['x1', 'x2', 'x3']);
  });
});
