import {
  updateCustomExerciseUseCase,
  deleteCustomExerciseUseCase,
} from '../../../src/application/coach/CustomExerciseUseCases';
import { ICustomExerciseRepository } from '../../../src/domain/repositories/ICustomExerciseRepository';
import { CustomExercise } from '../../../src/domain/entities/CustomExercise';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const EXERCISE_ID = 'exer-uuid-0001-0000-000000000001';

const UPDATED_EXERCISE: CustomExercise = {
  id:               EXERCISE_ID,
  coachId:          'coac-uuid-0001-0000-000000000001',
  name:             'Press banca modificado',
  category:         'strength',
  primaryMuscles:   ['chest'],
  secondaryMuscles: [],
  isIsometric:      false,
  createdAt:        new Date(),
};

const mockRepo: jest.Mocked<ICustomExerciseRepository> = {
  getByCoachId: jest.fn(),
  create:       jest.fn(),
  update:       jest.fn(),
  delete:       jest.fn(),
  isInUse:      jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── updateCustomExerciseUseCase ───────────────────────────────────────────────

describe('updateCustomExerciseUseCase', () => {
  it('actualiza un ejercicio con campos válidos', async () => {
    mockRepo.update.mockResolvedValue(UPDATED_EXERCISE);
    const result = await updateCustomExerciseUseCase(
      EXERCISE_ID, { name: 'Press banca modificado' }, mockRepo,
    );
    expect(result.name).toBe('Press banca modificado');
    expect(mockRepo.update).toHaveBeenCalledWith(EXERCISE_ID, { name: 'Press banca modificado' });
  });

  it('actualiza múltiples campos a la vez', async () => {
    mockRepo.update.mockResolvedValue(UPDATED_EXERCISE);
    await updateCustomExerciseUseCase(
      EXERCISE_ID,
      { name: 'Nuevo nombre', primaryMuscles: ['chest'], category: 'strength' },
      mockRepo,
    );
    expect(mockRepo.update).toHaveBeenCalled();
  });

  it('lanza error si id está vacío', async () => {
    await expect(updateCustomExerciseUseCase('', { name: 'Nombre' }, mockRepo))
      .rejects.toThrow('id is required');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('lanza ZodError si el nombre supera 100 caracteres', async () => {
    await expect(updateCustomExerciseUseCase(
      EXERCISE_ID, { name: 'a'.repeat(101) }, mockRepo,
    )).rejects.toThrow();
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('lanza ZodError si primaryMuscles es array vacío', async () => {
    await expect(updateCustomExerciseUseCase(
      EXERCISE_ID, { primaryMuscles: [] }, mockRepo,
    )).rejects.toThrow();
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('lanza ZodError si videoUrl no es de YouTube', async () => {
    await expect(updateCustomExerciseUseCase(
      EXERCISE_ID, { videoUrl: 'https://vimeo.com/123456' }, mockRepo,
    )).rejects.toThrow();
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('acepta videoUrl de youtu.be como válida', async () => {
    mockRepo.update.mockResolvedValue(UPDATED_EXERCISE);
    await expect(updateCustomExerciseUseCase(
      EXERCISE_ID, { videoUrl: 'https://youtu.be/rT7DgCr-3pg' }, mockRepo,
    )).resolves.toBeDefined();
  });

  it('propaga errores del repositorio', async () => {
    mockRepo.update.mockRejectedValue(new Error('DB error'));
    await expect(updateCustomExerciseUseCase(EXERCISE_ID, { name: 'Nombre' }, mockRepo))
      .rejects.toThrow('DB error');
  });
});

// ── deleteCustomExerciseUseCase ───────────────────────────────────────────────

describe('deleteCustomExerciseUseCase', () => {
  it('elimina un ejercicio que no está en uso', async () => {
    mockRepo.isInUse.mockResolvedValue(false);
    mockRepo.delete.mockResolvedValue(undefined);
    await expect(deleteCustomExerciseUseCase(EXERCISE_ID, mockRepo)).resolves.toBeUndefined();
    expect(mockRepo.delete).toHaveBeenCalledWith(EXERCISE_ID);
  });

  it('lanza error si el ejercicio está en uso en una rutina', async () => {
    mockRepo.isInUse.mockResolvedValue(true);
    await expect(deleteCustomExerciseUseCase(EXERCISE_ID, mockRepo))
      .rejects.toThrow('No se puede eliminar un ejercicio que está en uso');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('lanza error si id está vacío', async () => {
    await expect(deleteCustomExerciseUseCase('', mockRepo))
      .rejects.toThrow('id is required');
    expect(mockRepo.isInUse).not.toHaveBeenCalled();
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('verifica isInUse antes de llamar a delete', async () => {
    mockRepo.isInUse.mockResolvedValue(false);
    mockRepo.delete.mockResolvedValue(undefined);
    await deleteCustomExerciseUseCase(EXERCISE_ID, mockRepo);
    expect(mockRepo.isInUse).toHaveBeenCalledWith(EXERCISE_ID);
    expect(mockRepo.isInUse.mock.invocationCallOrder[0])
      .toBeLessThan(mockRepo.delete.mock.invocationCallOrder[0]);
  });

  it('propaga errores del repositorio en delete', async () => {
    mockRepo.isInUse.mockResolvedValue(false);
    mockRepo.delete.mockRejectedValue(new Error('Delete failed'));
    await expect(deleteCustomExerciseUseCase(EXERCISE_ID, mockRepo)).rejects.toThrow('Delete failed');
  });

  it('propaga errores del repositorio en isInUse', async () => {
    mockRepo.isInUse.mockRejectedValue(new Error('Check failed'));
    await expect(deleteCustomExerciseUseCase(EXERCISE_ID, mockRepo)).rejects.toThrow('Check failed');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });
});
