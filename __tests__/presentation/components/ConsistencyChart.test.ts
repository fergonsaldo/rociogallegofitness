/**
 * Tests para la lógica de consistencia del ConsistencyChart.
 * Extraemos las funciones puras a un módulo testeable.
 */

import { WorkoutHistoryEntry } from '../../../src/application/athlete/ProgressUseCases';
import { WorkoutSession } from '../../../src/domain/entities/WorkoutSession';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSession(isoDate: string): WorkoutHistoryEntry {
  return {
    session: {
      id:        `session-${isoDate}`,
      athleteId: 'ath-001',
      startedAt: new Date(isoDate),
      status:    'completed',
    } as WorkoutSession,
    exercises: [],
  };
}

// Inline de las funciones puras extraídas de ConsistencyChart
function computeStreak(history: WorkoutHistoryEntry[]): number {
  if (history.length === 0) return 0;
  const days = [...new Set(
    history.map((e) => e.session.startedAt.toISOString().split('T')[0]),
  )].sort().reverse();

  const today     = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (days[0] !== today && days[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev    = new Date(days[i - 1]);
    const curr    = new Date(days[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('computeStreak', () => {
  it('devuelve 0 si no hay historial', () => {
    expect(computeStreak([])).toBe(0);
  });

  it('devuelve 0 si el último entreno fue hace más de un día', () => {
    const old = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(computeStreak([makeSession(old)])).toBe(0);
  });

  it('devuelve 1 si entrené solo hoy', () => {
    const today = new Date().toISOString();
    expect(computeStreak([makeSession(today)])).toBe(1);
  });

  it('devuelve 1 si entrené solo ayer', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(computeStreak([makeSession(yesterday)])).toBe(1);
  });

  it('acumula racha de días consecutivos', () => {
    const sessions = [0, 1, 2].map((d) =>
      makeSession(new Date(Date.now() - d * 86400000).toISOString()),
    );
    expect(computeStreak(sessions)).toBe(3);
  });

  it('corta la racha ante un día de descanso', () => {
    const sessions = [0, 1, 3].map((d) =>
      makeSession(new Date(Date.now() - d * 86400000).toISOString()),
    );
    expect(computeStreak(sessions)).toBe(2);
  });

  it('no cuenta días duplicados como días distintos', () => {
    const today = new Date().toISOString();
    // Dos sesiones el mismo día
    const sessions = [makeSession(today), makeSession(today)];
    expect(computeStreak(sessions)).toBe(1);
  });
});
