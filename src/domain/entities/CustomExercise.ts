import { z } from 'zod';
import { MuscleGroup, ExerciseCategory } from '@/shared/types';

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'core', 'glutes', 'quadriceps', 'hamstrings',
  'calves', 'full_body',
] as const satisfies MuscleGroup[];

const EXERCISE_CATEGORIES = [
  'strength', 'cardio', 'flexibility', 'isometric',
] as const satisfies ExerciseCategory[];

const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export const CreateCustomExerciseSchema = z.object({
  coachId:          z.string().uuid('Invalid coach ID'),
  name:             z.string().min(1, 'El nombre es obligatorio').max(100),
  category:         z.enum(EXERCISE_CATEGORIES),
  primaryMuscles:   z.array(z.enum(MUSCLE_GROUPS)).min(1, 'Selecciona al menos un músculo principal'),
  secondaryMuscles: z.array(z.enum(MUSCLE_GROUPS)).default([]),
  isIsometric:      z.boolean().default(false),
  description:      z.string().max(500).optional(),
  videoUrl:         z
    .string()
    .optional()
    .refine(
      (url) => !url || YOUTUBE_REGEX.test(url),
      'La URL debe ser de YouTube (youtube.com o youtu.be)',
    ),
});

export const CustomExerciseSchema = CreateCustomExerciseSchema.extend({
  id:        z.string().uuid(),
  createdAt: z.date(),
});

export type CreateCustomExerciseInput = z.infer<typeof CreateCustomExerciseSchema>;
export type CustomExercise            = z.infer<typeof CustomExerciseSchema>;
