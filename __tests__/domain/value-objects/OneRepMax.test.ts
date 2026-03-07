import { estimateOneRepMax, weightForReps } from '../../../src/domain/value-objects/OneRepMax';

describe('estimateOneRepMax', () => {
  it('returns the weight itself when reps is 1', () => {
    const result = estimateOneRepMax({ weightKg: 100, reps: 1 });
    expect(result.toKg()).toBe(100);
  });

  it('estimates 1RM correctly using Epley formula for 5 reps', () => {
    // 100kg × (1 + 5/30) = 116.67 kg
    const result = estimateOneRepMax({ weightKg: 100, reps: 5 });
    expect(result.toKg()).toBeCloseTo(116.67, 1);
  });

  it('estimates 1RM correctly using Epley formula for 10 reps', () => {
    // 80kg × (1 + 10/30) = 106.67 kg
    const result = estimateOneRepMax({ weightKg: 80, reps: 10 });
    expect(result.toKg()).toBeCloseTo(106.67, 1);
  });

  it('throws when reps is 0', () => {
    expect(() => estimateOneRepMax({ weightKg: 100, reps: 0 })).toThrow();
  });

  it('throws when weight is negative', () => {
    expect(() => estimateOneRepMax({ weightKg: -10, reps: 5 })).toThrow();
  });

  it('throws when reps exceeds maximum for reliable estimation', () => {
    expect(() => estimateOneRepMax({ weightKg: 50, reps: 37 })).toThrow();
  });
});

describe('weightForReps', () => {
  it('returns the 1RM itself when target reps is 1', () => {
    const result = weightForReps(100, 1);
    expect(result.toKg()).toBe(100);
  });

  it('calculates recommended weight for target reps using Epley in reverse', () => {
    // For 5 reps from a 100kg 1RM: 100 / (1 + 5/30) ≈ 85.71 kg
    const result = weightForReps(100, 5);
    expect(result.toKg()).toBeCloseTo(85.71, 1);
  });
});
