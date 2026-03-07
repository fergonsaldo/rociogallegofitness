import { Weight } from '../../../src/domain/value-objects/Weight';

describe('Weight', () => {
  describe('fromKg', () => {
    it('creates a weight from a valid kg value', () => {
      const weight = Weight.fromKg(100);
      expect(weight.toKg()).toBe(100);
    });

    it('creates a zero weight', () => {
      const weight = Weight.fromKg(0);
      expect(weight.isZero()).toBe(true);
    });

    it('throws when weight is negative', () => {
      expect(() => Weight.fromKg(-1)).toThrow('Weight cannot be negative');
    });

    it('throws when weight exceeds maximum', () => {
      expect(() => Weight.fromKg(501)).toThrow();
    });
  });

  describe('fromLb', () => {
    it('creates a weight from lb and converts to kg correctly', () => {
      const weight = Weight.fromLb(220.462);
      expect(weight.toKg()).toBeCloseTo(100, 1);
    });

    it('throws when lb value converts to a negative kg', () => {
      expect(() => Weight.fromLb(-10)).toThrow();
    });
  });

  describe('toLb', () => {
    it('converts kg to lb correctly', () => {
      const weight = Weight.fromKg(100);
      expect(weight.toLb()).toBeCloseTo(220.46, 1);
    });
  });

  describe('add', () => {
    it('adds two weights correctly', () => {
      const a = Weight.fromKg(50);
      const b = Weight.fromKg(25);
      expect(a.add(b).toKg()).toBe(75);
    });
  });

  describe('equals', () => {
    it('returns true for weights with the same kg value', () => {
      expect(Weight.fromKg(60).equals(Weight.fromKg(60))).toBe(true);
    });

    it('returns false for weights with different kg values', () => {
      expect(Weight.fromKg(60).equals(Weight.fromKg(61))).toBe(false);
    });
  });
});
