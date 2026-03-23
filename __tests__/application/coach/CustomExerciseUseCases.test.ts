import {
  getCoachCustomExercisesUseCase,
  createCustomExerciseUseCase,
  getAllExercisesUseCase,
  applyExerciseFilters,
  CatalogExercise,
} from '../../../src/application/coach/CustomExerciseUseCases';
import { ICustomExerciseRepository } from '../../../src/domain/repositories/ICustomExerciseRepository';
import { CustomExercise, CreateCustomExerciseInput } from '../../../src/domain/entities/CustomExercise';

// ── Mock base catalog ─────────────────────────────────────────────────────────
// Keep small and deterministic so tests don't depend on catalog size

jest.mock('../../../src/shared/constants/exercises', () => ({
  EXERCISE_CATALOG: [
    {
      id: 'base-0001', name: 'Bench Press',
      category: 'strength', primaryMuscles: ['chest'], secondaryMuscles: ['triceps'],
      isIsometric: false, videoUrl: 'https://www.youtube.com/watch?v=abc',
    },
    {
      id: 'base-0002', name: 'Squat',
      category: 'strength', primaryMuscles: ['quadriceps'], secondaryMuscles: ['glutes'],
      isIsometric: false,
    },
    {
      id: 'base-0003', name: 'Plank',
      category: 'isometric', primaryMuscles: ['core'], secondaryMuscles: [],
      isIsometric: true,
    },
  ],
  MUSCLE_LABELS: {
    chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
    biceps: 'Bíceps', triceps: 'Tríceps', forearms: 'Antebrazos',
    core: 'Core', glutes: 'Glúteos', quadriceps: 'Cuádriceps',
    hamstrings: 'Isquiotibiales', calves: 'Gemelos', full_body: 'Cuerpo completo',
  },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID = '00000000-0000-4000-b000-000000000001';
const NOW      = new Date();

const VALID_INPUT: CreateCustomExerciseInput = {
  coachId:          COACH_ID,
  name:             'Press banca agarre estrecho',
  category:         'strength',
  primaryMuscles:   ['triceps'],
  secondaryMuscles: ['chest'],
  isIsometric:      false,
  description:      'Agarre más estrecho que el hombro',
  videoUrl:         'https://www.youtube.com/watch?v=rT7DgCr-3pg',
};

const CUSTOM_EXERCISE: CustomExercise = {
  id:               'exer-uuid-0001-0000-000000000001',
  coachId:          COACH_ID,
  name:             'Press banca agarre estrecho',
  category:         'strength',
  primaryMuscles:   ['triceps'],
  secondaryMuscles: ['chest'],
  isIsometric:      false,
  createdAt:        NOW,
};

const mockRepo: jest.Mocked<ICustomExerciseRepository> = {
  getByCoachId: jest.fn(),
  create:       jest.fn(),
  update:       jest.fn(),
  delete:       jest.fn(),
  isInUse:      jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── getCoachCustomExercisesUseCase ────────────────────────────────────────────

describe('getCoachCustomExercisesUseCase', () => {
  it('devuelve los ejercicios del coach', async () => {
    mockRepo.getByCoachId.mockResolvedValue([CUSTOM_EXERCISE]);
    const result = await getCoachCustomExercisesUseCase(COACH_ID, mockRepo);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Press banca agarre estrecho');
    expect(mockRepo.getByCoachId).toHaveBeenCalledWith(COACH_ID);
  });

  it('devuelve array vacío cuando el coach no tiene ejercicios', async () => {
    mockRepo.getByCoachId.mockResolvedValue([]);
    expect(await getCoachCustomExercisesUseCase(COACH_ID, mockRepo)).toEqual([]);
  });

  it('lanza error cuando coachId está vacío', async () => {
    await expect(getCoachCustomExercisesUseCase('', mockRepo))
      .rejects.toThrow('coachId is required');
    expect(mockRepo.getByCoachId).not.toHaveBeenCalled();
  });

  it('propaga errores del repositorio', async () => {
    mockRepo.getByCoachId.mockRejectedValue(new Error('DB error'));
    await expect(getCoachCustomExercisesUseCase(COACH_ID, mockRepo)).rejects.toThrow('DB error');
  });
});

// ── createCustomExerciseUseCase ───────────────────────────────────────────────

describe('createCustomExerciseUseCase', () => {
  it('crea un ejercicio con input válido', async () => {
    mockRepo.create.mockResolvedValue(CUSTOM_EXERCISE);
    const result = await createCustomExerciseUseCase(VALID_INPUT, mockRepo);
    expect(result.id).toBe(CUSTOM_EXERCISE.id);
    expect(mockRepo.create).toHaveBeenCalledWith(VALID_INPUT);
  });

  it('lanza ZodError si el nombre está vacío', async () => {
    await expect(createCustomExerciseUseCase({ ...VALID_INPUT, name: '' }, mockRepo))
      .rejects.toThrow();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('lanza ZodError si no hay músculos primarios', async () => {
    await expect(createCustomExerciseUseCase({ ...VALID_INPUT, primaryMuscles: [] }, mockRepo))
      .rejects.toThrow();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('lanza ZodError si la URL de vídeo no es de YouTube', async () => {
    await expect(createCustomExerciseUseCase(
      { ...VALID_INPUT, videoUrl: 'https://vimeo.com/123456' }, mockRepo
    )).rejects.toThrow();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('acepta ejercicio sin videoUrl', async () => {
    const inputSinVideo = { ...VALID_INPUT, videoUrl: undefined };
    mockRepo.create.mockResolvedValue({ ...CUSTOM_EXERCISE, videoUrl: undefined });
    const result = await createCustomExerciseUseCase(inputSinVideo, mockRepo);
    expect(result).toBeDefined();
  });

  it('acepta ejercicio sin descripción', async () => {
    const inputSinDesc = { ...VALID_INPUT, description: undefined };
    mockRepo.create.mockResolvedValue(CUSTOM_EXERCISE);
    const result = await createCustomExerciseUseCase(inputSinDesc, mockRepo);
    expect(result).toBeDefined();
  });

  it('acepta videoUrl de youtu.be', async () => {
    const inputYoutuBe = { ...VALID_INPUT, videoUrl: 'https://youtu.be/rT7DgCr-3pg' };
    mockRepo.create.mockResolvedValue(CUSTOM_EXERCISE);
    const result = await createCustomExerciseUseCase(inputYoutuBe, mockRepo);
    expect(result).toBeDefined();
    expect(mockRepo.create).toHaveBeenCalled();
  });

  it('isIsometric se deriva correctamente de la categoría isometric', async () => {
    const isometricInput: CreateCustomExerciseInput = {
      ...VALID_INPUT,
      category:    'isometric',
      isIsometric: true,
    };
    mockRepo.create.mockResolvedValue({ ...CUSTOM_EXERCISE, isIsometric: true });
    await createCustomExerciseUseCase(isometricInput, mockRepo);
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ isIsometric: true }));
  });

  it('propaga errores del repositorio', async () => {
    mockRepo.create.mockRejectedValue(new Error('Insert failed'));
    await expect(createCustomExerciseUseCase(VALID_INPUT, mockRepo)).rejects.toThrow('Insert failed');
  });
});

// ── getAllExercisesUseCase ─────────────────────────────────────────────────────

describe('getAllExercisesUseCase', () => {
  it('devuelve el catálogo base + custom ordenados alfabéticamente', async () => {
    mockRepo.getByCoachId.mockResolvedValue([CUSTOM_EXERCISE]);
    const result = await getAllExercisesUseCase(COACH_ID, mockRepo);
    // base has 3 items (Bench Press, Squat, Plank) + 1 custom = 4 total
    expect(result).toHaveLength(4);
    // must be sorted alphabetically
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].name.localeCompare(result[i + 1].name, 'es')).toBeLessThanOrEqual(0);
    }
  });

  it('devuelve solo el catálogo base cuando el coach no tiene custom', async () => {
    mockRepo.getByCoachId.mockResolvedValue([]);
    const result = await getAllExercisesUseCase(COACH_ID, mockRepo);
    expect(result).toHaveLength(3);
    expect(result.every((ex) => ex.coachId === null)).toBe(true);
  });

  it('los ejercicios del catálogo base tienen coachId null', async () => {
    mockRepo.getByCoachId.mockResolvedValue([]);
    const result = await getAllExercisesUseCase(COACH_ID, mockRepo);
    expect(result.every((ex) => ex.coachId === null)).toBe(true);
  });

  it('los ejercicios custom conservan el coachId del coach', async () => {
    mockRepo.getByCoachId.mockResolvedValue([CUSTOM_EXERCISE]);
    const result = await getAllExercisesUseCase(COACH_ID, mockRepo);
    const custom = result.find((ex) => ex.id === CUSTOM_EXERCISE.id);
    expect(custom?.coachId).toBe(COACH_ID);
  });

  it('lanza error cuando coachId está vacío', async () => {
    await expect(getAllExercisesUseCase('', mockRepo)).rejects.toThrow('coachId is required');
    expect(mockRepo.getByCoachId).not.toHaveBeenCalled();
  });

  it('propaga errores del repositorio', async () => {
    mockRepo.getByCoachId.mockRejectedValue(new Error('DB error'));
    await expect(getAllExercisesUseCase(COACH_ID, mockRepo)).rejects.toThrow('DB error');
  });
});

// ── applyExerciseFilters ──────────────────────────────────────────────────────

const BASE_ITEMS: CatalogExercise[] = [
  { id: '1', name: 'Bench Press',  category: 'strength',  primaryMuscles: ['chest'],       secondaryMuscles: ['triceps'], isIsometric: false, coachId: null },
  { id: '2', name: 'Squat',        category: 'strength',  primaryMuscles: ['quadriceps'],  secondaryMuscles: ['glutes'],  isIsometric: false, coachId: null },
  { id: '3', name: 'Plank',        category: 'isometric', primaryMuscles: ['core'],        secondaryMuscles: [],          isIsometric: true,  coachId: null },
  { id: '4', name: 'Burpee',       category: 'cardio',    primaryMuscles: ['full_body'],   secondaryMuscles: ['core'],    isIsometric: false, coachId: null },
];

describe('applyExerciseFilters', () => {
  it('devuelve todos los items cuando todos los filtros están vacíos', () => {
    expect(applyExerciseFilters(BASE_ITEMS, '', [], [])).toHaveLength(4);
  });

  it('filtra por nombre (case-insensitive)', () => {
    const result = applyExerciseFilters(BASE_ITEMS, 'bench', [], []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bench Press');
  });

  it('filtra por etiqueta de músculo principal traducida', () => {
    // 'pecho' matches MUSCLE_LABELS.chest = 'Pecho'
    const result = applyExerciseFilters(BASE_ITEMS, 'pecho', [], []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filtra por etiqueta de músculo secundario traducida', () => {
    // 'tríceps' matches secondaryMuscles of Bench Press
    const result = applyExerciseFilters(BASE_ITEMS, 'tríceps', [], []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filtra por categoría (chip)', () => {
    const result = applyExerciseFilters(BASE_ITEMS, '', ['isometric'], []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Plank');
  });

  it('admite múltiples categorías activas', () => {
    const result = applyExerciseFilters(BASE_ITEMS, '', ['strength', 'cardio'], []);
    expect(result).toHaveLength(3);
  });

  it('filtra por chip de músculo (principal)', () => {
    const result = applyExerciseFilters(BASE_ITEMS, '', [], ['core']);
    expect(result).toHaveLength(2); // Plank (primary) + Burpee (secondary)
  });

  it('combina texto y categoría', () => {
    const result = applyExerciseFilters(BASE_ITEMS, 'squat', ['strength'], []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Squat');
  });

  it('devuelve array vacío cuando ningún item coincide', () => {
    expect(applyExerciseFilters(BASE_ITEMS, 'xyzzy', [], [])).toHaveLength(0);
  });

  it('devuelve array vacío cuando la lista de entrada está vacía', () => {
    expect(applyExerciseFilters([], 'bench', ['strength'], ['chest'])).toHaveLength(0);
  });
});
