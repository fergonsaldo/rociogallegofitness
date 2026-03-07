import { z } from 'zod';
import { MuscleGroup, ExerciseCategory } from '../../shared/types';

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'core', 'glutes', 'quadriceps', 'hamstrings',
  'calves', 'full_body',
] as const satisfies MuscleGroup[];

const EXERCISE_CATEGORIES = [
  'strength', 'cardio', 'flexibility', 'isometric',
] as const satisfies ExerciseCategory[];

export const ExerciseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  primaryMuscles: z.array(z.enum(MUSCLE_GROUPS)).min(1, 'At least one primary muscle is required'),
  secondaryMuscles: z.array(z.enum(MUSCLE_GROUPS)).default([]),
  category: z.enum(EXERCISE_CATEGORIES),
  /**
   * isometric = true  → set is tracked by duration (seconds)
   * isometric = false → set is tracked by reps + weight
   */
  isIsometric: z.boolean().default(false),
  description: z.string().max(500).optional(),
  videoUrl: z.string().url().optional(),
});

export type Exercise = z.infer<typeof ExerciseSchema>;
