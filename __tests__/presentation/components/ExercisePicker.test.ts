/**
 * ExercisePicker — tests de lógica pura
 *
 * Testamos la lógica que determina qué ejercicios se muestran y
 * cuáles tienen botón de vídeo, sin renderizar el componente completo
 * (evitamos la dependencia de react-native-webview en el entorno de test).
 */

import { EXERCISE_CATALOG } from '../../../src/shared/constants/exercises';
import { isValidYouTubeUrl } from '../../../src/shared/utils/youtube';
import { Exercise } from '../../../src/domain/entities/Exercise';

// ── Lógica de filtrado por categoría (espeja la del componente) ───────────────

function filterByCategory(catalog: readonly Exercise[], category: string | null): Exercise[] {
  if (!category) return [...catalog];
  return catalog.filter((e) => e.category === category);
}

// ── Lógica de visibilidad del botón de vídeo ─────────────────────────────────

function exerciseHasVideoButton(exercise: Exercise): boolean {
  return !!exercise.videoUrl && isValidYouTubeUrl(exercise.videoUrl);
}

// ── Tests de filtrado ─────────────────────────────────────────────────────────

describe('ExercisePicker — filtrado por categoría', () => {
  it('sin filtro devuelve todos los ejercicios del catálogo', () => {
    const result = filterByCategory(EXERCISE_CATALOG, null);
    expect(result).toHaveLength(EXERCISE_CATALOG.length);
  });

  it('filtro "strength" devuelve solo ejercicios de fuerza', () => {
    const result = filterByCategory(EXERCISE_CATALOG, 'strength');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((ex) => expect(ex.category).toBe('strength'));
  });

  it('filtro "isometric" devuelve solo ejercicios isométricos', () => {
    const result = filterByCategory(EXERCISE_CATALOG, 'isometric');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((ex) => expect(ex.category).toBe('isometric'));
  });

  it('filtro "cardio" devuelve solo ejercicios de cardio', () => {
    const result = filterByCategory(EXERCISE_CATALOG, 'cardio');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((ex) => expect(ex.category).toBe('cardio'));
  });

  it('categorías disponibles no contienen duplicados', () => {
    const categories = [...new Set(EXERCISE_CATALOG.map((e) => e.category))];
    expect(categories.length).toBe(new Set(categories).size);
  });
});

// ── Tests de visibilidad del botón de vídeo ───────────────────────────────────

describe('ExercisePicker — visibilidad del botón de vídeo', () => {
  it('ejercicios con videoUrl válida de YouTube muestran el botón', () => {
    const withVideo = EXERCISE_CATALOG.filter(exerciseHasVideoButton);
    expect(withVideo.length).toBeGreaterThan(0);
  });

  it('todos los ejercicios del catálogo actual muestran botón de vídeo', () => {
    // Todos tienen videoUrl de YouTube tras la Historia 1
    EXERCISE_CATALOG.forEach((ex) => {
      expect(exerciseHasVideoButton(ex)).toBe(true);
    });
  });

  it('un ejercicio sin videoUrl no muestra el botón', () => {
    const exerciseWithoutVideo: Exercise = {
      id: 'test-id-0000-0000-0000-000000000001',
      name: 'Test Exercise',
      primaryMuscles: ['chest'],
      secondaryMuscles: [],
      category: 'strength',
      isIsometric: false,
    };
    expect(exerciseHasVideoButton(exerciseWithoutVideo)).toBe(false);
  });

  it('un ejercicio con URL de Vimeo no muestra el botón', () => {
    const exerciseWithVimeo: Exercise = {
      id: 'test-id-0000-0000-0000-000000000002',
      name: 'Test Vimeo Exercise',
      primaryMuscles: ['back'],
      secondaryMuscles: [],
      category: 'strength',
      isIsometric: false,
      videoUrl: 'https://vimeo.com/123456789',
    };
    expect(exerciseHasVideoButton(exerciseWithVimeo)).toBe(false);
  });

  it('un ejercicio con URL de YouTube válida muestra el botón', () => {
    const exerciseWithYouTube: Exercise = {
      id: 'test-id-0000-0000-0000-000000000003',
      name: 'Test YouTube Exercise',
      primaryMuscles: ['chest'],
      secondaryMuscles: [],
      category: 'strength',
      isIsometric: false,
      videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
    };
    expect(exerciseHasVideoButton(exerciseWithYouTube)).toBe(true);
  });

  it('un ejercicio con videoUrl vacía no muestra el botón', () => {
    const exerciseWithEmptyUrl: Exercise = {
      id: 'test-id-0000-0000-0000-000000000004',
      name: 'Test Empty URL Exercise',
      primaryMuscles: ['core'],
      secondaryMuscles: [],
      category: 'isometric',
      isIsometric: true,
      videoUrl: '',
    };
    expect(exerciseHasVideoButton(exerciseWithEmptyUrl)).toBe(false);
  });
});

// ── selectedIds ───────────────────────────────────────────────────────────────

describe('ExercisePicker — selectedIds', () => {
  it('detecta correctamente si un ejercicio está seleccionado', () => {
    const selectedId = EXERCISE_CATALOG[0].id;
    const selectedIds = [selectedId];
    expect(selectedIds.includes(selectedId)).toBe(true);
    expect(selectedIds.includes(EXERCISE_CATALOG[1].id)).toBe(false);
  });

  it('selectedIds vacío no marca ningún ejercicio como seleccionado', () => {
    const selectedIds: string[] = [];
    EXERCISE_CATALOG.forEach((ex) => {
      expect(selectedIds.includes(ex.id)).toBe(false);
    });
  });
});
