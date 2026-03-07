import { Exercise } from '../../domain/entities/Exercise';

/**
 * Predefined exercise catalog.
 * IDs are stable UUIDs — do not change them as they are
 * referenced by routines and workout sessions.
 */
export const EXERCISE_CATALOG: Readonly<Exercise[]> = [
  // ── CHEST ────────────────────────────────────────────────────────────
  {
    id: '11111111-0001-0000-0000-000000000001',
    name: 'Bench Press',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    category: 'strength',
    isIsometric: false,
  },
  {
    id: '11111111-0001-0000-0000-000000000002',
    name: 'Incline Bench Press',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    category: 'strength',
    isIsometric: false,
  },
  {
    id: '11111111-0001-0000-0000-000000000003',
    name: 'Push-up',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'core'],
    category: 'strength',
    isIsometric: false,
  },
  // ── BACK ─────────────────────────────────────────────────────────────
  {
    id: '11111111-0002-0000-0000-000000000001',
    name: 'Deadlift',
    primaryMuscles: ['back'],
    secondaryMuscles: ['hamstrings', 'glutes', 'core'],
    category: 'strength',
    isIsometric: false,
  },
  {
    id: '11111111-0002-0000-0000-000000000002',
    name: 'Pull-up',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    category: 'strength',
    isIsometric: false,
  },
  {
    id: '11111111-0002-0000-0000-000000000003',
    name: 'Barbell Row',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'core'],
    category: 'strength',
    isIsometric: false,
  },
  // ── SHOULDERS ────────────────────────────────────────────────────────
  {
    id: '11111111-0003-0000-0000-000000000001',
    name: 'Overhead Press',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps', 'core'],
    category: 'strength',
    isIsometric: false,
  },
  {
    id: '11111111-0003-0000-0000-000000000002',
    name: 'Lateral Raise',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: [],
    category: 'strength',
    isIsometric: false,
  },
  // ── ARMS ─────────────────────────────────────────────────────────────
  {
    id: '11111111-0004-0000-0000-000000000001',
    name: 'Barbell Curl',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    category: 'strength',
    isIsometric: false,
  },
  {
    id: '11111111-0004-0000-0000-000000000002',
    name: 'Tricep Pushdown',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    category: 'strength',
    isIsometric: false,
  },
  // ── LEGS ─────────────────────────────────────────────────────────────
  {
    id: '11111111-0005-0000-0000-000000000001',
    name: 'Squat',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: ['glutes', 'hamstrings', 'core'],
    category: 'strength',
    isIsometric: false,
  },
  {
    id: '11111111-0005-0000-0000-000000000002',
    name: 'Romanian Deadlift',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['glutes', 'back'],
    category: 'strength',
    isIsometric: false,
  },
  {
    id: '11111111-0005-0000-0000-000000000003',
    name: 'Leg Press',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: ['glutes', 'hamstrings'],
    category: 'strength',
    isIsometric: false,
  },
  {
    id: '11111111-0005-0000-0000-000000000004',
    name: 'Calf Raise',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    category: 'strength',
    isIsometric: false,
  },
  // ── CORE ─────────────────────────────────────────────────────────────
  {
    id: '11111111-0006-0000-0000-000000000001',
    name: 'Plank',
    primaryMuscles: ['core'],
    secondaryMuscles: ['shoulders'],
    category: 'isometric',
    isIsometric: true,
    description: 'Hold position for the target duration',
  },
  {
    id: '11111111-0006-0000-0000-000000000002',
    name: 'Side Plank',
    primaryMuscles: ['core'],
    secondaryMuscles: ['shoulders'],
    category: 'isometric',
    isIsometric: true,
  },
  {
    id: '11111111-0006-0000-0000-000000000003',
    name: 'Crunch',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    category: 'strength',
    isIsometric: false,
  },
  // ── FULL BODY ─────────────────────────────────────────────────────────
  {
    id: '11111111-0007-0000-0000-000000000001',
    name: 'Burpee',
    primaryMuscles: ['full_body'],
    secondaryMuscles: ['core', 'chest'],
    category: 'cardio',
    isIsometric: false,
  },
  {
    id: '11111111-0007-0000-0000-000000000002',
    name: 'Wall Sit',
    primaryMuscles: ['quadriceps'],
    secondaryMuscles: ['glutes', 'calves'],
    category: 'isometric',
    isIsometric: true,
    description: 'Hold the seated position against the wall for the target duration',
  },
] as const;

export function findExerciseById(id: string): Exercise | undefined {
  return EXERCISE_CATALOG.find((exercise) => exercise.id === id);
}

export function findExercisesByMuscle(muscle: Exercise['primaryMuscles'][number]): Exercise[] {
  return EXERCISE_CATALOG.filter((exercise) =>
    exercise.primaryMuscles.includes(muscle)
  );
}

export function findIsometricExercises(): Exercise[] {
  return EXERCISE_CATALOG.filter((exercise) => exercise.isIsometric);
}
