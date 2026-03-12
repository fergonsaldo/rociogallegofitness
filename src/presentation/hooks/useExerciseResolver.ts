import { useMemo } from 'react';
import { Exercise } from '@/domain/entities/Exercise';
import { findExerciseById } from '@/shared/constants/exercises';
import { useCustomExerciseStore } from '@/presentation/stores/customExerciseStore';

/**
 * Resolves an exercise by id, checking both the static catalog and the coach's
 * custom exercises loaded in the store.
 *
 * Returns a unified Exercise-shaped object so the caller doesn't need to
 * distinguish between catalog and custom exercises.
 */
export function useExerciseResolver() {
  const customExercises = useCustomExerciseStore((state) => state.exercises);

  const resolve = useMemo(() => {
    return (exerciseId: string): Exercise | undefined => {
      // Catalog first (O(n) but catalog is static and small)
      const fromCatalog = findExerciseById(exerciseId);
      if (fromCatalog) return fromCatalog;

      // Fall back to custom exercises
      const custom = customExercises.find((ex) => ex.id === exerciseId);
      if (!custom) return undefined;

      // Map CustomExercise to Exercise shape (compatible subset)
      return {
        id:               custom.id,
        name:             custom.name,
        category:         custom.category,
        primaryMuscles:   custom.primaryMuscles,
        secondaryMuscles: custom.secondaryMuscles,
        isIsometric:      custom.isIsometric,
        description:      custom.description,
        videoUrl:         custom.videoUrl,
      };
    };
  }, [customExercises]);

  return resolve;
}
