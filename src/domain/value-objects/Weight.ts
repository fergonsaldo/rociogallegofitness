import { z } from 'zod';

const KG_TO_LB = 2.20462;
const LB_TO_KG = 1 / KG_TO_LB;
const MIN_WEIGHT_KG = 0;
const MAX_WEIGHT_KG = 500;

export const WeightSchema = z.object({
  valueKg: z
    .number()
    .min(MIN_WEIGHT_KG, 'Weight cannot be negative')
    .max(MAX_WEIGHT_KG, `Weight cannot exceed ${MAX_WEIGHT_KG} kg`),
});

export type WeightProps = z.infer<typeof WeightSchema>;

/**
 * Value object representing a weight measurement.
 * Internally stores the value in kg; converts on demand.
 */
export class Weight {
  private readonly valueKg: number;

  private constructor(valueKg: number) {
    this.valueKg = valueKg;
  }

  static fromKg(kg: number): Weight {
    WeightSchema.parse({ valueKg: kg });
    return new Weight(kg);
  }

  static fromLb(lb: number): Weight {
    const kg = lb * LB_TO_KG;
    WeightSchema.parse({ valueKg: kg });
    return new Weight(kg);
  }

  toKg(): number {
    return Math.round(this.valueKg * 100) / 100;
  }

  toLb(): number {
    return Math.round(this.valueKg * KG_TO_LB * 100) / 100;
  }

  isZero(): boolean {
    return this.valueKg === 0;
  }

  add(other: Weight): Weight {
    return Weight.fromKg(this.valueKg + other.valueKg);
  }

  equals(other: Weight): boolean {
    return this.valueKg === other.valueKg;
  }
}
