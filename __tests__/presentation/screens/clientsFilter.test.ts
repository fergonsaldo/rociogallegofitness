/**
 * filterAthletes — unit tests
 * Pure function extracted from clients/index.tsx
 */

import { filterAthletes, Athlete } from '../../../app/(coach)/clients/index';

const active = (overrides: Partial<Athlete> = {}): Athlete => ({
  id: 'a1', email: 'ana@test.com', full_name: 'Ana García',
  assigned_at: '2026-01-01', status: 'active', ...overrides,
});

const archived = (overrides: Partial<Athlete> = {}): Athlete => ({
  id: 'a2', email: 'bob@test.com', full_name: 'Bob Martín',
  assigned_at: '2026-01-02', status: 'archived', ...overrides,
});

const ATHLETES: Athlete[] = [
  active({ id: 'a1', full_name: 'Ana García',  email: 'ana@test.com' }),
  active({ id: 'a2', full_name: 'Carlos López', email: 'carlos@test.com' }),
  archived({ id: 'a3', full_name: 'Bob Martín', email: 'bob@test.com' }),
];

describe('filterAthletes — tab filtering', () => {
  it('returns only active athletes when tab is active', () => {
    const result = filterAthletes(ATHLETES, 'active', '');
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.status === 'active')).toBe(true);
  });

  it('returns only archived athletes when tab is archived', () => {
    const result = filterAthletes(ATHLETES, 'archived', '');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a3');
  });

  it('returns empty array when no athletes match the tab', () => {
    expect(filterAthletes([], 'active', '')).toEqual([]);
  });
});

describe('filterAthletes — search query', () => {
  it('returns all tab athletes when query is empty', () => {
    expect(filterAthletes(ATHLETES, 'active', '')).toHaveLength(2);
  });

  it('returns all tab athletes when query is only whitespace', () => {
    expect(filterAthletes(ATHLETES, 'active', '   ')).toHaveLength(2);
  });

  it('filters by partial name match', () => {
    const result = filterAthletes(ATHLETES, 'active', 'ana');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1');
  });

  it('filters by partial email match', () => {
    const result = filterAthletes(ATHLETES, 'active', 'carlos@');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a2');
  });

  it('is case-insensitive on name', () => {
    expect(filterAthletes(ATHLETES, 'active', 'ANA')).toHaveLength(1);
    expect(filterAthletes(ATHLETES, 'active', 'ana')).toHaveLength(1);
    expect(filterAthletes(ATHLETES, 'active', 'AnA')).toHaveLength(1);
  });

  it('is case-insensitive on email', () => {
    expect(filterAthletes(ATHLETES, 'active', 'CARLOS@TEST')).toHaveLength(1);
  });

  it('returns empty array when query matches nothing in the tab', () => {
    expect(filterAthletes(ATHLETES, 'active', 'zzznomatch')).toHaveLength(0);
  });

  it('does not return archived athletes when searching in active tab', () => {
    const result = filterAthletes(ATHLETES, 'active', 'bob');
    expect(result).toHaveLength(0);
  });

  it('finds archived athlete by name in archived tab', () => {
    const result = filterAthletes(ATHLETES, 'archived', 'bob');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a3');
  });

  it('matches athletes whose name contains the query anywhere', () => {
    // 'arc' is contained in 'García' (Ana García)
    const result = filterAthletes(ATHLETES, 'active', 'arc');
    expect(result).toHaveLength(1);
    expect(result[0].full_name).toBe('Ana García');
  });
});
