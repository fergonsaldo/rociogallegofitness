import {
  getCoachCustomExercisesUseCase,
  createCustomExerciseUseCase,
} from '../../../src/application/coach/CustomExerciseUseCases';
import { ICustomExerciseRepository } from '../../../src/domain/repositories/ICustomExerciseRepository';
import { CustomExercise, CreateCustomExerciseInput } from '../../../src/domain/entities/CustomExercise';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID = 'coac-uuid-0001-0000-000000000001';
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
