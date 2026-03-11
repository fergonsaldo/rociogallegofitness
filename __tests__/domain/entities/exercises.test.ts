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

// ── Tests de videoUrl (Historia 1 — Librería de ejercicios) ───────────────────

import { isValidYouTubeUrl } from '../../../src/shared/utils/youtube';

describe('EXERCISE_CATALOG — videoUrl', () => {
  it('todos los ejercicios tienen videoUrl definida', () => {
    const withoutVideo = EXERCISE_CATALOG.filter((ex) => !ex.videoUrl);
    expect(withoutVideo).toHaveLength(0);
  });

  it('todas las videoUrl son URLs válidas de YouTube', () => {
    const invalidUrls = EXERCISE_CATALOG.filter(
      (ex) => ex.videoUrl && !isValidYouTubeUrl(ex.videoUrl)
    );
    expect(invalidUrls).toHaveLength(0);
  });

  it('ninguna URL es de Vimeo', () => {
    const vimeoUrls = EXERCISE_CATALOG.filter((ex) => ex.videoUrl?.includes('vimeo.com'));
    expect(vimeoUrls).toHaveLength(0);
  });

  it('el ejercicio Bench Press tiene videoUrl de YouTube', () => {
    const ex = findExerciseById('11111111-0001-0000-0000-000000000001');
    expect(ex?.videoUrl).toBeTruthy();
    expect(isValidYouTubeUrl(ex!.videoUrl!)).toBe(true);
  });
});
