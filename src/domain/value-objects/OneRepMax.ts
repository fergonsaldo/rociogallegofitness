import { z } from 'zod';
import { Weight } from './Weight';

const MIN_REPS = 1;
const MAX_REPS_FOR_1RM = 36; // Epley formula loses reliability beyond this

export const OneRepMaxInputSchema = z.object({
  weightKg: z.number().positive('Weight must be positive'),
  reps: z
    .number()
    .int()
    .min(MIN_REPS, 'Reps must be at least 1')
    .max(MAX_REPS_FOR_1RM, `Reps must be ${MAX_REPS_FOR_1RM} or fewer for 1RM estimation`),
});

export type OneRepMaxInput = z.infer<typeof OneRepMaxInputSchema>;

/**
 * Estimates the one-rep max using the Epley formula:
 * 1RM = weight × (1 + reps / 30)
 *
 * Returns null for 1 rep (the set IS the 1RM) and returns
 * the weight directly in that case.
 */
export function estimateOneRepMax(input: OneRepMaxInput): Weight {
  OneRepMaxInputSchema.parse(input);

  const { weightKg, reps } = input;

  if (reps === 1) {
    return Weight.fromKg(weightKg);
  }

  const estimated1RMKg = weightKg * (1 + reps / 30);
  return Weight.fromKg(Math.round(estimated1RMKg * 100) / 100);
}

/**
 * Calculates the recommended weight for a target number of reps
 * based on a known 1RM, using the Epley formula in reverse.
 */
export function weightForReps(oneRepMaxKg: number, targetReps: number): Weight {
  if (targetReps === 1) {
    return Weight.fromKg(oneRepMaxKg);
  }

  const recommendedKg = oneRepMaxKg / (1 + targetReps / 30);
  return Weight.fromKg(Math.round(recommendedKg * 100) / 100);
}
