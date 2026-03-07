import {
  findExerciseById,
  findExercisesByMuscle,
  findIsometricExercises,
  EXERCISE_CATALOG,
} from '../../../src/shared/constants/exercises';

describe('EXERCISE_CATALOG', () => {
  it('contains exercises', () => {
    expect(EXERCISE_CATALOG.length).toBeGreaterThan(0);
  });

  it('has no duplicate IDs', () => {
    const ids = EXERCISE_CATALOG.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('marks isometric exercises with isIsometric true and category isometric', () => {
    const isometricExercises = EXERCISE_CATALOG.filter((e) => e.isIsometric);
    isometricExercises.forEach((e) => {
      expect(e.category).toBe('isometric');
    });
  });

  it('has at least one primary muscle for every exercise', () => {
    EXERCISE_CATALOG.forEach((e) => {
      expect(e.primaryMuscles.length).toBeGreaterThan(0);
    });
  });
});

describe('findExerciseById', () => {
  it('returns the exercise when the ID exists', () => {
    const exercise = EXERCISE_CATALOG[0];
    const found = findExerciseById(exercise.id);
    expect(found).toEqual(exercise);
  });

  it('returns undefined when the ID does not exist', () => {
    expect(findExerciseById('non-existent-id')).toBeUndefined();
  });
});

describe('findExercisesByMuscle', () => {
  it('returns exercises that target the given primary muscle', () => {
    const chestExercises = findExercisesByMuscle('chest');
    expect(chestExercises.length).toBeGreaterThan(0);
    chestExercises.forEach((e) => {
      expect(e.primaryMuscles).toContain('chest');
    });
  });

  it('returns an empty array when no exercises target the given muscle as primary', () => {
    // No exercises have 'forearms' as a primary muscle in the catalog
    const result = findExercisesByMuscle('forearms');
    expect(result).toEqual([]);
  });
});

describe('findIsometricExercises', () => {
  it('returns only exercises marked as isometric', () => {
    const result = findIsometricExercises();
    expect(result.length).toBeGreaterThan(0);
    result.forEach((e) => {
      expect(e.isIsometric).toBe(true);
    });
  });
});
