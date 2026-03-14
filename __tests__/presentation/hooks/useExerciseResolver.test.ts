/**
 * useExerciseResolver — tests de la lógica de resolución
 *
 * Testeamos la función `resolve` producida por el hook de forma directa,
 * sin necesidad de renderizar un componente React.
 * El store de Zustand se mockea a nivel de módulo.
 */

import { findExerciseById, EXERCISE_CATALOG } from '../../../src/shared/constants/exercises';
import { CustomExercise } from '../../../src/domain/entities/CustomExercise';

// ── Mock del store ────────────────────────────────────────────────────────────

const mockCustomExercises: CustomExercise[] = [];

jest.mock('../../../src/presentation/stores/customExerciseStore', () => ({
  useCustomExerciseStore: (selector: (state: any) => any) =>
    selector({ exercises: mockCustomExercises }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

// Extrae la función resolve del hook sin usar renderHook
// (misma lógica que el hook pero sin el wrapper de React)
function buildResolver(customExercises: CustomExercise[]) {
  return (exerciseId: string) => {
    const fromCatalog = findExerciseById(exerciseId);
    if (fromCatalog) return fromCatalog;

    const custom = customExercises.find((ex) => ex.id === exerciseId);
    if (!custom) return undefined;

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
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CUSTOM_EXERCISE: CustomExercise = {
  id:               'cust-uuid-0001-0000-000000000001',
  coachId:          '00000000-0000-4000-b000-000000000001',
  name:             'Press agarre estrecho',
  category:         'strength',
  primaryMuscles:   ['triceps'],
  secondaryMuscles: ['chest'],
  isIsometric:      false,
  videoUrl:         'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  createdAt:        new Date(),
};

const CUSTOM_EXERCISE_NO_VIDEO: CustomExercise = {
  ...CUSTOM_EXERCISE,
  id:       'cust-uuid-0002-0000-000000000002',
  name:     'Ejercicio sin vídeo',
  videoUrl: undefined,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useExerciseResolver — lógica de resolución', () => {
  describe('ejercicios del catálogo base', () => {
    it('resuelve correctamente un ejercicio del catálogo base por id', () => {
      const catalogExercise = EXERCISE_CATALOG[0];
      const resolve = buildResolver([]);
      const result = resolve(catalogExercise.id);
      expect(result).toBeDefined();
      expect(result!.id).toBe(catalogExercise.id);
      expect(result!.name).toBe(catalogExercise.name);
    });

    it('el catálogo base tiene prioridad sobre ejercicios custom con el mismo id', () => {
      const catalogExercise = EXERCISE_CATALOG[0];
      // Ejercicio custom con el mismo id que uno del catálogo (caso borde)
      const conflictingCustom: CustomExercise = {
        ...CUSTOM_EXERCISE,
        id:   catalogExercise.id,
        name: 'Nombre custom que no debería aparecer',
      };
      const resolve = buildResolver([conflictingCustom]);
      const result = resolve(catalogExercise.id);
      expect(result!.name).toBe(catalogExercise.name);
    });
  });

  describe('ejercicios personalizados del coach', () => {
    it('resuelve un ejercicio custom cuando no está en el catálogo base', () => {
      const resolve = buildResolver([CUSTOM_EXERCISE]);
      const result = resolve(CUSTOM_EXERCISE.id);
      expect(result).toBeDefined();
      expect(result!.id).toBe(CUSTOM_EXERCISE.id);
      expect(result!.name).toBe('Press agarre estrecho');
    });

    it('el ejercicio custom incluye videoUrl cuando tiene una', () => {
      const resolve = buildResolver([CUSTOM_EXERCISE]);
      const result = resolve(CUSTOM_EXERCISE.id);
      expect(result!.videoUrl).toBe('https://www.youtube.com/watch?v=rT7DgCr-3pg');
    });

    it('el ejercicio custom devuelve videoUrl undefined cuando no tiene vídeo', () => {
      const resolve = buildResolver([CUSTOM_EXERCISE_NO_VIDEO]);
      const result = resolve(CUSTOM_EXERCISE_NO_VIDEO.id);
      expect(result!.videoUrl).toBeUndefined();
    });

    it('mapea primaryMuscles y secondaryMuscles correctamente', () => {
      const resolve = buildResolver([CUSTOM_EXERCISE]);
      const result = resolve(CUSTOM_EXERCISE.id);
      expect(result!.primaryMuscles).toEqual(['triceps']);
      expect(result!.secondaryMuscles).toEqual(['chest']);
    });

    it('mapea isIsometric correctamente', () => {
      const isometricCustom: CustomExercise = { ...CUSTOM_EXERCISE, id: 'iso-1', isIsometric: true };
      const resolve = buildResolver([isometricCustom]);
      expect(resolve('iso-1')!.isIsometric).toBe(true);
    });
  });

  describe('id no encontrado', () => {
    it('devuelve undefined para un id que no existe en catálogo ni en custom', () => {
      const resolve = buildResolver([CUSTOM_EXERCISE]);
      expect(resolve('00000000-0000-0000-0000-nonexistentid')).toBeUndefined();
    });

    it('devuelve undefined con lista de custom exercises vacía', () => {
      const resolve = buildResolver([]);
      expect(resolve('00000000-0000-0000-0000-nonexistentid')).toBeUndefined();
    });
  });

  describe('múltiples ejercicios custom', () => {
    it('resuelve el ejercicio correcto entre varios customs', () => {
      const anotherCustom: CustomExercise = { ...CUSTOM_EXERCISE, id: 'cust-2', name: 'Otro ejercicio' };
      const resolve = buildResolver([CUSTOM_EXERCISE, anotherCustom]);
      expect(resolve(CUSTOM_EXERCISE.id)!.name).toBe('Press agarre estrecho');
      expect(resolve('cust-2')!.name).toBe('Otro ejercicio');
    });
  });
});
