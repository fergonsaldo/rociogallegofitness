import { z } from 'zod';

/**
 * A set tracked by reps and weight (e.g. bench press, squat).
 */
const RepsSetSchema = z.object({
  type: z.literal('reps'),
  reps: z.number().int().min(1, 'Reps must be at least 1').max(999),
  weightKg: z.number().min(0, 'Weight cannot be negative').max(500),
});

/**
 * A set tracked by duration in seconds (e.g. plank, wall sit).
 */
const IsometricSetSchema = z.object({
  type: z.literal('isometric'),
  durationSeconds: z.number().int().min(1, 'Duration must be at least 1 second').max(3600),
});

const SetPerformanceSchema = z.discriminatedUnion('type', [
  RepsSetSchema,
  IsometricSetSchema,
]);

export const ExerciseSetSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  setNumber: z.number().int().min(1),
  performance: SetPerformanceSchema,
  restAfterSeconds: z.number().int().min(0).max(3600).default(0),
  completedAt: z.date(),
});

export type RepsSet = z.infer<typeof RepsSetSchema>;
export type IsometricSet = z.infer<typeof IsometricSetSchema>;
export type SetPerformance = z.infer<typeof SetPerformanceSchema>;
export type ExerciseSet = z.infer<typeof ExerciseSetSchema>;

export const CreateExerciseSetSchema = ExerciseSetSchema.omit({ id: true, completedAt: true });
export type CreateExerciseSetInput = z.infer<typeof CreateExerciseSetSchema>;
