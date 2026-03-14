import { CreateCustomExerciseSchema } from '../../../src/domain/entities/CustomExercise';

const COACH_ID = '00000000-0000-4000-a000-000000000001';

const VALID = {
  coachId:          COACH_ID,
  name:             'Press banca agarre estrecho',
  category:         'strength' as const,
  primaryMuscles:   ['triceps'] as const,
  secondaryMuscles: [],
  isIsometric:      false,
};

describe('CreateCustomExerciseSchema — validación', () => {
  it('acepta input mínimo válido', () => {
    expect(() => CreateCustomExerciseSchema.parse(VALID)).not.toThrow();
  });

  it('acepta input completo con videoUrl de YouTube', () => {
    expect(() => CreateCustomExerciseSchema.parse({
      ...VALID,
      description: 'Descripción',
      videoUrl:    'https://www.youtube.com/watch?v=rT7DgCr-3pg',
    })).not.toThrow();
  });

  it('acepta videoUrl de youtu.be', () => {
    expect(() => CreateCustomExerciseSchema.parse({
      ...VALID,
      videoUrl: 'https://youtu.be/rT7DgCr-3pg',
    })).not.toThrow();
  });

  it('rechaza nombre vacío', () => {
    expect(() => CreateCustomExerciseSchema.parse({ ...VALID, name: '' })).toThrow();
  });

  it('rechaza nombre de más de 100 caracteres', () => {
    expect(() => CreateCustomExerciseSchema.parse({ ...VALID, name: 'a'.repeat(101) })).toThrow();
  });

  it('rechaza primaryMuscles vacío', () => {
    expect(() => CreateCustomExerciseSchema.parse({ ...VALID, primaryMuscles: [] })).toThrow();
  });

  it('rechaza coachId que no es UUID', () => {
    expect(() => CreateCustomExerciseSchema.parse({ ...VALID, coachId: 'not-a-uuid' })).toThrow();
  });

  it('rechaza videoUrl de Vimeo', () => {
    expect(() => CreateCustomExerciseSchema.parse({
      ...VALID,
      videoUrl: 'https://vimeo.com/123456789',
    })).toThrow();
  });

  it('rechaza URL genérica no de YouTube', () => {
    expect(() => CreateCustomExerciseSchema.parse({
      ...VALID,
      videoUrl: 'https://example.com/video',
    })).toThrow();
  });

  it('acepta videoUrl undefined (campo opcional)', () => {
    expect(() => CreateCustomExerciseSchema.parse({ ...VALID, videoUrl: undefined })).not.toThrow();
  });

  it('acepta descripción undefined (campo opcional)', () => {
    expect(() => CreateCustomExerciseSchema.parse({ ...VALID, description: undefined })).not.toThrow();
  });

  it('rechaza descripción de más de 500 caracteres', () => {
    expect(() => CreateCustomExerciseSchema.parse({ ...VALID, description: 'a'.repeat(501) })).toThrow();
  });

  it('categoría isometric implica isIsometric true', () => {
    const result = CreateCustomExerciseSchema.parse({ ...VALID, category: 'isometric', isIsometric: true });
    expect(result.isIsometric).toBe(true);
  });
});
