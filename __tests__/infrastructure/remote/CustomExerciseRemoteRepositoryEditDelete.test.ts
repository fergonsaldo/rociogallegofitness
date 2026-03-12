import { CustomExerciseRemoteRepository } from '../../../src/infrastructure/supabase/remote/CustomExerciseRemoteRepository';

const { supabase } = require('../../../src/infrastructure/supabase/client');

const EXERCISE_ID = 'exer-uuid-0001-0000-000000000001';
const NOW         = new Date().toISOString();

const RAW_ROW = {
  id:                EXERCISE_ID,
  coach_id:          'coac-uuid-0001-0000-000000000001',
  name:              'Press banca actualizado',
  category:          'strength',
  primary_muscles:   ['chest'],
  secondary_muscles: [],
  is_isometric:      false,
  description:       null,
  video_url:         null,
  created_at:        NOW,
};

// Helper: crea una cadena de mock de Supabase
function mockChain(finalResult: object) {
  const chain: any = {};
  ['select', 'update', 'delete', 'insert', 'eq', 'order'].forEach(
    (m) => { chain[m] = jest.fn(() => chain); },
  );
  chain.single = jest.fn().mockResolvedValue(finalResult);
  // Para isInUse que usa head:true y no single()
  Object.defineProperty(chain, 'then', {
    get: () => (resolve: any) => Promise.resolve(finalResult).then(resolve),
  });
  return chain;
}

describe('CustomExerciseRemoteRepository — update / delete / isInUse', () => {
  let repo: CustomExerciseRemoteRepository;

  beforeEach(() => {
    repo = new CustomExerciseRemoteRepository();
    jest.clearAllMocks();
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('mapea la respuesta correctamente al dominio', async () => {
      supabase.from.mockReturnValue(mockChain({ data: RAW_ROW, error: null }));
      const result = await repo.update(EXERCISE_ID, { name: 'Press banca actualizado' });
      expect(result.id).toBe(EXERCISE_ID);
      expect(result.name).toBe('Press banca actualizado');
    });

    it('solo incluye en el patch los campos enviados', async () => {
      const chain = mockChain({ data: RAW_ROW, error: null });
      supabase.from.mockReturnValue(chain);
      await repo.update(EXERCISE_ID, { name: 'Nuevo nombre' });
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Nuevo nombre' }),
      );
      // description y video_url no deben estar en el patch
      const patchArg = chain.update.mock.calls[0][0];
      expect(patchArg).not.toHaveProperty('description');
      expect(patchArg).not.toHaveProperty('video_url');
    });

    it('convierte videoUrl undefined a video_url null en el patch', async () => {
      const chain = mockChain({ data: RAW_ROW, error: null });
      supabase.from.mockReturnValue(chain);
      await repo.update(EXERCISE_ID, { videoUrl: undefined });
      const patchArg = chain.update.mock.calls[0][0];
      expect(patchArg.video_url).toBeNull();
    });

    it('lanza error cuando Supabase devuelve error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'RLS denied' } }));
      await expect(repo.update(EXERCISE_ID, { name: 'X' })).rejects.toMatchObject({ message: 'RLS denied' });
    });

    it('lanza error cuando data es null sin error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: null }));
      await expect(repo.update(EXERCISE_ID, { name: 'X' })).rejects.toThrow('No data returned after update');
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('llama al método delete de Supabase con el id correcto', async () => {
      const chain = mockChain({ error: null });
      supabase.from.mockReturnValue(chain);
      await repo.delete(EXERCISE_ID);
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', EXERCISE_ID);
    });

    it('lanza error cuando Supabase devuelve error', async () => {
      supabase.from.mockReturnValue(mockChain({ error: { message: 'Foreign key violation' } }));
      await expect(repo.delete(EXERCISE_ID)).rejects.toMatchObject({ message: 'Foreign key violation' });
    });
  });

  // ── isInUse ───────────────────────────────────────────────────────────────

  describe('isInUse', () => {
    it('devuelve true cuando el ejercicio está en al menos una rutina', async () => {
      supabase.from.mockReturnValue(mockChain({ count: 3, error: null }));
      expect(await repo.isInUse(EXERCISE_ID)).toBe(true);
    });

    it('devuelve false cuando count es 0', async () => {
      supabase.from.mockReturnValue(mockChain({ count: 0, error: null }));
      expect(await repo.isInUse(EXERCISE_ID)).toBe(false);
    });

    it('devuelve false cuando count es null', async () => {
      supabase.from.mockReturnValue(mockChain({ count: null, error: null }));
      expect(await repo.isInUse(EXERCISE_ID)).toBe(false);
    });

    it('lanza error cuando Supabase devuelve error', async () => {
      supabase.from.mockReturnValue(mockChain({ count: null, error: { message: 'Query failed' } }));
      await expect(repo.isInUse(EXERCISE_ID)).rejects.toMatchObject({ message: 'Query failed' });
    });
  });
});
