import { z } from 'zod';

export const RoutineExerciseSchema = z.object({
  id: z.string().uuid(),
  routineDayId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  order: z.number().int().min(1),
  targetSets: z.number().int().min(1).max(20),
  targetReps: z.number().int().min(1).max(999).optional(),
  targetDurationSeconds: z.number().int().min(1).optional(),
  restBetweenSetsSeconds: z.number().int().min(0).max(600).default(90),
  notes: z.string().max(300).optional(),
});

export const RoutineDaySchema = z.object({
  id: z.string().uuid(),
  routineId: z.string().uuid(),
  dayNumber: z.number().int().min(1).max(7),
  name: z.string().min(1).max(100),
  exercises: z.array(RoutineExerciseSchema).default([]),
});

export const RoutineSchema = z.object({
  id: z.string().uuid(),
  coachId: z.string().uuid(),
  name: z.string().min(1, 'Routine name is required').max(100),
  description: z.string().max(500).optional(),
  durationWeeks: z.number().int().min(1).max(52).optional(),
  days: z.array(RoutineDaySchema).min(1, 'A routine must have at least one day'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type RoutineExercise = z.infer<typeof RoutineExerciseSchema>;
export type RoutineDay = z.infer<typeof RoutineDaySchema>;
export type Routine = z.infer<typeof RoutineSchema>;

export const CreateRoutineSchema = RoutineSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type CreateRoutineInput = z.infer<typeof CreateRoutineSchema>;
