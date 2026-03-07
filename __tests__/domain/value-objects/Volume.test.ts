import { calculateVolume, calculateTotalVolume } from '../../../src/domain/value-objects/Volume';

describe('calculateVolume', () => {
  it('calculates volume correctly for a standard set', () => {
    // 3 sets × 10 reps × 100 kg = 3000
    expect(calculateVolume({ sets: 3, reps: 10, weightKg: 100 })).toBe(3000);
  });

  it('returns zero when sets is 0', () => {
    expect(calculateVolume({ sets: 0, reps: 10, weightKg: 100 })).toBe(0);
  });

  it('returns zero when reps is 0', () => {
    expect(calculateVolume({ sets: 3, reps: 0, weightKg: 100 })).toBe(0);
  });

  it('returns zero when weight is 0 (bodyweight exercise)', () => {
    expect(calculateVolume({ sets: 3, reps: 10, weightKg: 0 })).toBe(0);
  });

  it('throws when sets is negative', () => {
    expect(() => calculateVolume({ sets: -1, reps: 10, weightKg: 100 })).toThrow();
  });

  it('throws when weight is negative', () => {
    expect(() => calculateVolume({ sets: 3, reps: 10, weightKg: -5 })).toThrow();
  });
});

describe('calculateTotalVolume', () => {
  it('aggregates volume across multiple sets correctly', () => {
    const sets = [
      { reps: 10, weightKg: 100 }, // 1000
      { reps: 8, weightKg: 105 },  // 840
      { reps: 6, weightKg: 110 },  // 660
    ];
    expect(calculateTotalVolume(sets)).toBe(2500);
  });

  it('returns zero for an empty sets array', () => {
    expect(calculateTotalVolume([])).toBe(0);
  });

  it('handles a single set', () => {
    expect(calculateTotalVolume([{ reps: 5, weightKg: 80 }])).toBe(400);
  });
});
