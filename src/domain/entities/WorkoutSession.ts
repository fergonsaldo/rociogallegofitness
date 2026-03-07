import { z } from 'zod';
import { ExerciseSetSchema } from './ExerciseSet';

const WorkoutSessionStatusSchema = z.enum(['active', 'completed', 'abandoned']);
export type WorkoutSessionStatus = z.infer<typeof WorkoutSessionStatusSchema>;

export const WorkoutSessionSchema = z.object({
  id: z.string().uuid(),
  athleteId: z.string().uuid(),
  routineId: z.string().uuid().optional(),
  routineDayId: z.string().uuid().optional(),
  status: WorkoutSessionStatusSchema.default('active'),
  sets: z.array(ExerciseSetSchema).default([]),
  startedAt: z.date(),
  finishedAt: z.date().optional(),
  notes: z.string().max(500).optional(),
  /**
   * Persisted locally until sync succeeds.
   * Guarantees no data loss on connectivity issues.
   */
  syncedAt: z.date().optional(),
});

export type WorkoutSession = z.infer<typeof WorkoutSessionSchema>;

export const StartWorkoutSessionSchema = WorkoutSessionSchema.pick({
  athleteId: true,
  routineId: true,
  routineDayId: true,
  notes: true,
});

export type StartWorkoutSessionInput = z.infer<typeof StartWorkoutSessionSchema>;
