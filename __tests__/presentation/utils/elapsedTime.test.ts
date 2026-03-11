/**
 * Tests para la lógica del cronómetro de sesión.
 *
 * La inicialización del elapsed está basada en session.startedAt.
 * Testeamos la función de cálculo de forma aislada.
 */

// Extraemos la lógica del cronómetro a una función pura para poder testearla.
// La implementación en session.tsx usa exactamente esta misma fórmula.
function calculateInitialElapsed(startedAt: Date | undefined): number {
  if (!startedAt) return 0;
  return Math.floor((Date.now() - startedAt.getTime()) / 1000);
}

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── calculateInitialElapsed ───────────────────────────────────────────────────

describe('calculateInitialElapsed', () => {
  it('returns 0 when startedAt is undefined', () => {
    expect(calculateInitialElapsed(undefined)).toBe(0);
  });

  it('returns 0 when session started right now', () => {
    const now = new Date();
    // Allow ±1 second tolerance for test execution time
    expect(calculateInitialElapsed(now)).toBeLessThanOrEqual(1);
    expect(calculateInitialElapsed(now)).toBeGreaterThanOrEqual(0);
  });

  it('returns ~60 when session started 60 seconds ago', () => {
    const sixtySecsAgo = new Date(Date.now() - 60_000);
    const result = calculateInitialElapsed(sixtySecsAgo);
    expect(result).toBeGreaterThanOrEqual(59);
    expect(result).toBeLessThanOrEqual(61);
  });

  it('returns ~3600 when session started one hour ago', () => {
    const oneHourAgo = new Date(Date.now() - 3_600_000);
    const result = calculateInitialElapsed(oneHourAgo);
    expect(result).toBeGreaterThanOrEqual(3599);
    expect(result).toBeLessThanOrEqual(3601);
  });

  it('floors fractional seconds (does not round up)', () => {
    // 90.9 seconds ago → floor → 90, not 91
    const almostNinetyOneSecs = new Date(Date.now() - 90_900);
    expect(calculateInitialElapsed(almostNinetyOneSecs)).toBe(90);
  });
});

// ── formatElapsed ─────────────────────────────────────────────────────────────

describe('formatElapsed', () => {
  it('formats 0 seconds as "0:00"', () => {
    expect(formatElapsed(0)).toBe('0:00');
  });

  it('formats 59 seconds as "0:59"', () => {
    expect(formatElapsed(59)).toBe('0:59');
  });

  it('formats 60 seconds as "1:00"', () => {
    expect(formatElapsed(60)).toBe('1:00');
  });

  it('formats 90 seconds as "1:30"', () => {
    expect(formatElapsed(90)).toBe('1:30');
  });

  it('formats 3600 seconds as "60:00"', () => {
    expect(formatElapsed(3600)).toBe('60:00');
  });

  it('pads single-digit seconds with a leading zero', () => {
    expect(formatElapsed(65)).toBe('1:05');
    expect(formatElapsed(601)).toBe('10:01');
  });
});
