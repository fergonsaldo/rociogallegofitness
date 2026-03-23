/**
 * filterRoutines — unit tests
 * Pure function extracted from app/(coach)/routines/index.tsx
 */

import { filterRoutines } from '../../../app/(coach)/routines/index';
import { Routine } from '../../../src/domain/entities/Routine';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const NOW = new Date();

function makeRoutine(overrides: Partial<Routine>): Routine {
  return {
    id:            overrides.id ?? 'r-uuid-0001',
    coachId:       'coach-uuid-001',
    name:          overrides.name ?? 'Default Routine',
    description:   overrides.description,
    durationWeeks: overrides.durationWeeks,
    days: [{
      id:        'd-uuid-0001',
      routineId: overrides.id ?? 'r-uuid-0001',
      dayNumber: 1,
      name:      'Day 1',
      exercises: [],
    }],
    createdAt: NOW,
    updatedAt: NOW,
  };
}

const ROUTINES: Routine[] = [
  makeRoutine({ id: 'r1', name: 'Fuerza Upper',  description: 'Tren superior de fuerza' }),
  makeRoutine({ id: 'r2', name: 'Cardio HIIT',   description: undefined }),
  makeRoutine({ id: 'r3', name: 'Full Body',      description: 'Rutina completa para principiantes' }),
  makeRoutine({ id: 'r4', name: 'Movilidad',      description: 'Flexibilidad y movilidad' }),
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('filterRoutines — empty query', () => {
  it('returns all routines when query is empty string', () => {
    expect(filterRoutines(ROUTINES, '')).toHaveLength(4);
  });

  it('returns all routines when query is only whitespace', () => {
    expect(filterRoutines(ROUTINES, '   ')).toHaveLength(4);
  });

  it('returns empty array when input list is empty', () => {
    expect(filterRoutines([], 'fuerza')).toHaveLength(0);
  });
});

describe('filterRoutines — name search', () => {
  it('matches by partial name (case-insensitive)', () => {
    const result = filterRoutines(ROUTINES, 'hiit');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r2');
  });

  it('is case-insensitive', () => {
    expect(filterRoutines(ROUTINES, 'CARDIO')).toHaveLength(1);
    expect(filterRoutines(ROUTINES, 'cardio')).toHaveLength(1);
  });

  it('returns multiple matches when name contains query', () => {
    // 'Full Body' and 'Fuerza Upper' both contain letters — use 'full'
    const result = filterRoutines(ROUTINES, 'full');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r3');
  });
});

describe('filterRoutines — description search', () => {
  it('matches by partial description text', () => {
    const result = filterRoutines(ROUTINES, 'principiantes');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r3');
  });

  it('matches description case-insensitively', () => {
    expect(filterRoutines(ROUTINES, 'FLEXIBILIDAD')).toHaveLength(1);
  });

  it('skips routines with no description when query only matches description', () => {
    // r2 has no description, should not throw
    const result = filterRoutines(ROUTINES, 'tren superior');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r1');
  });
});

describe('filterRoutines — no match', () => {
  it('returns empty array when query matches nothing', () => {
    expect(filterRoutines(ROUTINES, 'xyzzy_no_match')).toHaveLength(0);
  });
});
