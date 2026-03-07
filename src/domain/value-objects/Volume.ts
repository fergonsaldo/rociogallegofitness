import { z } from 'zod';

export const VolumeInputSchema = z.object({
  sets: z.number().int().min(0, 'Sets cannot be negative'),
  reps: z.number().int().min(0, 'Reps cannot be negative'),
  weightKg: z.number().min(0, 'Weight cannot be negative'),
});

export type VolumeInput = z.infer<typeof VolumeInputSchema>;

/**
 * Total volume = sets × reps × weight (kg)
 * Standard metric for quantifying training load.
 */
export function calculateVolume(input: VolumeInput): number {
  VolumeInputSchema.parse(input);
  return input.sets * input.reps * input.weightKg;
}

/**
 * Aggregates total volume across multiple sets.
 */
export function calculateTotalVolume(
  sets: Array<{ reps: number; weightKg: number }>
): number {
  return sets.reduce((total, set) => total + set.reps * set.weightKg, 0);
}
