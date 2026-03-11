import { CustomExerciseRemoteRepository } from '../../../src/infrastructure/supabase/remote/CustomExerciseRemoteRepository';
import { CreateCustomExerciseInput } from '../../../src/domain/entities/CustomExercise';

const { supabase } = require('../../../src/infrastructure/supabase/client');

const COACH_ID = 'coac-uuid-0001-0000-000000000001';
const NOW      = new Date().toISOString();

const RAW_ROW = {
  id:                'exer-uuid-0001-0000-000000000001',
  coach_id:          COACH_ID,
  name:              'Press banca agarre estrecho',
  category:          'strength',
  primary_muscles:   ['triceps'],
  secondary_muscles: ['chest'],
  is_isometric:      false,
  description:       'Agarre más estrecho que el hombro',
  video_url:         'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  created_at:        NOW,
};

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

function mockChain(finalResult: object) {
  const chain: any = {};
  ['select', 'insert', 'eq', 'order'].forEach((m) => { chain[m] = jest.fn(() => chain); });
  chain.single = jest.fn().mockResolvedValue(finalResult);
  chain.then   = (resolve: any) => Promise.resolve(finalResult).then(resolve);
  return chain;
}

describe('CustomExerciseRemoteRepository', () => {
  let repo: CustomExerciseRemoteRepository;

  beforeEach(() => {
    repo = new CustomExerciseRemoteRepository();
    jest.clearAllMocks();
  });

  // ── getByCoachId ────────────────────────────────────────────────────────────

  describe('getByCoachId', () => {
    it('mapea correctamente las filas al dominio', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [RAW_ROW], error: null }));

      const result = await repo.getByCoachId(COACH_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(RAW_ROW.id);
      expect(result[0].coachId).toBe(COACH_ID);
      expect(result[0].name).toBe('Press banca agarre estrecho');
      expect(result[0].primaryMuscles).toEqual(['triceps']);
      expect(result[0].isIsometric).toBe(false);
      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('mapea null description a undefined', async () => {
      supabase.from.mockReturnValue(
        mockChain({ data: [{ ...RAW_ROW, description: null }], error: null })
      );
      const result = await repo.getByCoachId(COACH_ID);
      expect(result[0].description).toBeUndefined();
    });

    it('mapea null video_url a undefined', async () => {
      supabase.from.mockReturnValue(
        mockChain({ data: [{ ...RAW_ROW, video_url: null }], error: null })
      );
      const result = await repo.getByCoachId(COACH_ID);
      expect(result[0].videoUrl).toBeUndefined();
    });

    it('devuelve array vacío cuando no hay resultados', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [], error: null }));
      expect(await repo.getByCoachId(COACH_ID)).toEqual([]);
    });

    it('lanza error cuando Supabase devuelve error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'RLS error' } }));
      await expect(repo.getByCoachId(COACH_ID)).rejects.toMatchObject({ message: 'RLS error' });
    });
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('inserta con los campos correctos y devuelve el ejercicio creado', async () => {
      supabase.from.mockReturnValue(mockChain({ data: RAW_ROW, error: null }));

      const result = await repo.create(VALID_INPUT);

      expect(result.id).toBe(RAW_ROW.id);
      expect(result.name).toBe(VALID_INPUT.name);
      expect(result.coachId).toBe(COACH_ID);
    });

    it('lanza error cuando Supabase devuelve error en insert', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'Insert failed' } }));
      await expect(repo.create(VALID_INPUT)).rejects.toBeTruthy();
    });

    it('lanza error cuando data es null sin error de Supabase', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: null }));
      await expect(repo.create(VALID_INPUT)).rejects.toThrow('No data returned after insert');
    });
  });
});
