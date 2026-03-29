/**
 * SessionTypeRemoteRepository tests (RF-E8-05)
 */

import { SessionTypeRemoteRepository } from '../../../src/infrastructure/supabase/remote/SessionTypeRemoteRepository';

const { supabase } = require('../../../src/infrastructure/supabase/client');

const COACH_ID = 'coac-uuid-0001-0000-000000000001';
const TYPE_ID  = 'type-uuid-0001-0000-000000000001';
const SUB_ID   = 'type-uuid-0002-0000-000000000002';
const NOW_ISO  = '2026-03-28T10:00:00.000Z';

const RAW_ROW = {
  id:         TYPE_ID,
  coach_id:   COACH_ID,
  name:       'Fuerza',
  color:      '#DC2626',
  created_at: NOW_ISO,
};

function mockChain(finalResult: object) {
  const chain: any = {};
  ['select', 'eq', 'order', 'insert', 'update', 'delete', 'single', 'head'].forEach((m) => {
    chain[m] = jest.fn(() => chain);
  });
  chain.then = (resolve: any) => Promise.resolve(finalResult).then(resolve);
  return chain;
}

describe('SessionTypeRemoteRepository', () => {
  let repo: SessionTypeRemoteRepository;

  beforeEach(() => {
    repo = new SessionTypeRemoteRepository();
    jest.resetAllMocks();
  });

  // ── getByCoachId ─────────────────────────────────────────────────────────────

  describe('getByCoachId', () => {
    it('maps rows to SessionType entities', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [RAW_ROW], error: null }));

      const result = await repo.getByCoachId(COACH_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(TYPE_ID);
      expect(result[0].coachId).toBe(COACH_ID);
      expect(result[0].name).toBe('Fuerza');
      expect(result[0].color).toBe('#DC2626');
      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('returns empty array when coach has no types', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [], error: null }));

      const result = await repo.getByCoachId(COACH_ID);

      expect(result).toEqual([]);
    });

    it('returns empty array when data is null', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: null }));

      const result = await repo.getByCoachId(COACH_ID);

      expect(result).toEqual([]);
    });

    it('throws on supabase error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'DB error' } }));

      await expect(repo.getByCoachId(COACH_ID)).rejects.toThrow('DB error');
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('returns the created SessionType', async () => {
      supabase.from.mockReturnValue(mockChain({ data: RAW_ROW, error: null }));

      const result = await repo.create({ coachId: COACH_ID, name: 'Fuerza', color: '#DC2626' });

      expect(result.id).toBe(TYPE_ID);
      expect(result.name).toBe('Fuerza');
    });

    it('throws when no data is returned', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: null }));

      await expect(repo.create({ coachId: COACH_ID, name: 'Fuerza', color: '#DC2626' }))
        .rejects.toThrow('No data returned after insert');
    });

    it('throws on supabase error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'Insert failed' } }));

      await expect(repo.create({ coachId: COACH_ID, name: 'Fuerza', color: '#DC2626' }))
        .rejects.toThrow('Insert failed');
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('returns the updated SessionType', async () => {
      const updatedRow = { ...RAW_ROW, name: 'Cardio' };
      supabase.from.mockReturnValue(mockChain({ data: updatedRow, error: null }));

      const result = await repo.update(TYPE_ID, { name: 'Cardio' });

      expect(result.name).toBe('Cardio');
    });

    it('throws when no data is returned', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: null }));

      await expect(repo.update(TYPE_ID, { name: 'Cardio' }))
        .rejects.toThrow('No data returned after update');
    });

    it('throws on supabase error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'RLS denied' } }));

      await expect(repo.update(TYPE_ID, { name: 'Cardio' }))
        .rejects.toThrow('RLS denied');
    });
  });

  // ── delete ───────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('resolves without error on success', async () => {
      supabase.from.mockReturnValue(mockChain({ error: null }));

      await expect(repo.delete(TYPE_ID)).resolves.toBeUndefined();
    });

    it('throws on supabase error', async () => {
      supabase.from.mockReturnValue(mockChain({ error: { message: 'Delete failed' } }));

      await expect(repo.delete(TYPE_ID)).rejects.toThrow('Delete failed');
    });
  });

  // ── countUsages ──────────────────────────────────────────────────────────────

  describe('countUsages', () => {
    it('returns the count of sessions using the type', async () => {
      supabase.from.mockReturnValue(mockChain({ count: 3, error: null }));

      const result = await repo.countUsages(TYPE_ID);

      expect(result).toBe(3);
    });

    it('returns 0 when count is null', async () => {
      supabase.from.mockReturnValue(mockChain({ count: null, error: null }));

      const result = await repo.countUsages(TYPE_ID);

      expect(result).toBe(0);
    });

    it('throws on supabase error', async () => {
      supabase.from.mockReturnValue(mockChain({ count: null, error: { message: 'Query failed' } }));

      await expect(repo.countUsages(TYPE_ID)).rejects.toThrow('Query failed');
    });
  });

  // ── deleteWithSubstitution ───────────────────────────────────────────────────

  describe('deleteWithSubstitution', () => {
    it('updates sessions then deletes the type when substitutionId is provided', async () => {
      supabase.from
        .mockReturnValueOnce(mockChain({ error: null })) // update coach_sessions
        .mockReturnValueOnce(mockChain({ error: null })); // delete session_type

      await expect(repo.deleteWithSubstitution(TYPE_ID, SUB_ID)).resolves.toBeUndefined();
      expect(supabase.from).toHaveBeenCalledTimes(2);
      expect(supabase.from).toHaveBeenNthCalledWith(1, 'coach_sessions');
      expect(supabase.from).toHaveBeenNthCalledWith(2, 'session_types');
    });

    it('deletes the type directly when no substitutionId', async () => {
      supabase.from.mockReturnValue(mockChain({ error: null }));

      await expect(repo.deleteWithSubstitution(TYPE_ID)).resolves.toBeUndefined();
      expect(supabase.from).toHaveBeenCalledTimes(1);
      expect(supabase.from).toHaveBeenCalledWith('session_types');
    });

    it('throws and does not delete if update fails', async () => {
      supabase.from.mockReturnValue(mockChain({ error: { message: 'Update failed' } }));

      await expect(repo.deleteWithSubstitution(TYPE_ID, SUB_ID)).rejects.toThrow('Update failed');
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });

    it('throws if delete fails after update', async () => {
      supabase.from
        .mockReturnValueOnce(mockChain({ error: null }))
        .mockReturnValueOnce(mockChain({ error: { message: 'Delete failed' } }));

      await expect(repo.deleteWithSubstitution(TYPE_ID, SUB_ID)).rejects.toThrow('Delete failed');
    });
  });
});
