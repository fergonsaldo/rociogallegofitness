/**
 * TagRemoteRepository tests
 */

import { TagRemoteRepository } from '../../../src/infrastructure/supabase/remote/TagRemoteRepository';

const { supabase } = require('../../../src/infrastructure/supabase/client');

const COACH_ID   = 'coac-uuid-0001-0000-000000000001';
const ATHLETE_ID = 'athl-uuid-0001-0000-000000000001';
const TAG_ID     = 'tag1-uuid-0001-0000-000000000001';
const NOW        = new Date().toISOString();

const RAW_TAG_ROW = {
  id: TAG_ID, coach_id: COACH_ID, name: 'VIP', color: '#C90960', created_at: NOW,
};

function mockChain(finalResult: object) {
  const chain: any = {};
  ['select', 'eq', 'order', 'limit', 'delete', 'in', 'insert', 'update', 'upsert', 'single'].forEach((m) => {
    chain[m] = jest.fn(() => chain);
  });
  chain.then = (resolve: any) => Promise.resolve(finalResult).then(resolve);
  return chain;
}

function mockCountChain(finalResult: object) {
  const chain: any = {};
  ['select', 'eq'].forEach((m) => { chain[m] = jest.fn(() => chain); });
  chain.then = (resolve: any) => Promise.resolve(finalResult).then(resolve);
  return chain;
}

describe('TagRemoteRepository', () => {
  let repo: TagRemoteRepository;

  beforeEach(() => {
    repo = new TagRemoteRepository();
    jest.resetAllMocks();
  });

  // ── getByCoachId ────────────────────────────────────────────────────────────

  describe('getByCoachId', () => {
    it('returns tags with clientCount populated', async () => {
      supabase.from
        .mockReturnValueOnce(mockChain({ data: [RAW_TAG_ROW], error: null }))
        .mockReturnValueOnce(mockChain({ data: [{ tag_id: TAG_ID }, { tag_id: TAG_ID }], error: null }));

      const result = await repo.getByCoachId(COACH_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(TAG_ID);
      expect(result[0].name).toBe('VIP');
      expect(result[0].color).toBe('#C90960');
      expect(result[0].clientCount).toBe(2);
      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('returns tags with clientCount 0 when no assignments', async () => {
      supabase.from
        .mockReturnValueOnce(mockChain({ data: [RAW_TAG_ROW], error: null }))
        .mockReturnValueOnce(mockChain({ data: [], error: null }));

      const result = await repo.getByCoachId(COACH_ID);
      expect(result[0].clientCount).toBe(0);
    });

    it('returns empty array when no tags', async () => {
      supabase.from.mockReturnValueOnce(mockChain({ data: [], error: null }));
      expect(await repo.getByCoachId(COACH_ID)).toEqual([]);
    });

    it('handles null data gracefully', async () => {
      supabase.from.mockReturnValueOnce(mockChain({ data: null, error: null }));
      expect(await repo.getByCoachId(COACH_ID)).toEqual([]);
    });

    it('throws when tags query fails', async () => {
      supabase.from.mockReturnValueOnce(mockChain({ data: null, error: { message: 'RLS error' } }));
      await expect(repo.getByCoachId(COACH_ID)).rejects.toMatchObject({ message: 'RLS error' });
    });

    it('throws when assignments query fails', async () => {
      supabase.from
        .mockReturnValueOnce(mockChain({ data: [RAW_TAG_ROW], error: null }))
        .mockReturnValueOnce(mockChain({ data: null, error: { message: 'Join error' } }));
      await expect(repo.getByCoachId(COACH_ID)).rejects.toMatchObject({ message: 'Join error' });
    });
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('inserts and returns the new tag', async () => {
      supabase.from.mockReturnValue(mockChain({ data: RAW_TAG_ROW, error: null }));

      const result = await repo.create({ coachId: COACH_ID, name: 'VIP', color: '#C90960' });

      expect(result.id).toBe(TAG_ID);
      expect(result.name).toBe('VIP');
      expect(result.clientCount).toBe(0);
    });

    it('throws when supabase returns an error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'Duplicate name' } }));
      await expect(repo.create({ coachId: COACH_ID, name: 'VIP', color: '#C90960' }))
        .rejects.toMatchObject({ message: 'Duplicate name' });
    });

    it('throws when no data is returned', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: null }));
      await expect(repo.create({ coachId: COACH_ID, name: 'VIP', color: '#C90960' }))
        .rejects.toThrow('No data returned after insert');
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates and returns the tag with clientCount', async () => {
      const updatedRow = { ...RAW_TAG_ROW, name: 'Premium' };
      supabase.from
        .mockReturnValueOnce(mockChain({ data: updatedRow, error: null }))
        .mockReturnValueOnce(mockCountChain({ count: 3, error: null }));

      const result = await repo.update(TAG_ID, { name: 'Premium' });

      expect(result.name).toBe('Premium');
      expect(result.clientCount).toBe(3);
    });

    it('throws when supabase returns an error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'Not found' } }));
      await expect(repo.update(TAG_ID, { name: 'Premium' }))
        .rejects.toMatchObject({ message: 'Not found' });
    });

    it('throws when no data is returned', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: null }));
      await expect(repo.update(TAG_ID, { name: 'Premium' }))
        .rejects.toThrow('No data returned after update');
    });
  });

  // ── delete ──────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('resolves without error on success', async () => {
      supabase.from.mockReturnValue(mockChain({ error: null }));
      await expect(repo.delete(TAG_ID)).resolves.toBeUndefined();
    });

    it('throws when supabase returns an error', async () => {
      supabase.from.mockReturnValue(mockChain({ error: { message: 'Delete failed' } }));
      await expect(repo.delete(TAG_ID)).rejects.toMatchObject({ message: 'Delete failed' });
    });
  });

  // ── getTagsForAthlete ───────────────────────────────────────────────────────

  describe('getTagsForAthlete', () => {
    it('maps joined rows to ClientTag array', async () => {
      supabase.from.mockReturnValue(
        mockChain({ data: [{ client_tags: RAW_TAG_ROW }], error: null })
      );

      const result = await repo.getTagsForAthlete(ATHLETE_ID);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('VIP');
      expect(result[0].clientCount).toBe(0);
    });

    it('filters out null client_tags', async () => {
      supabase.from.mockReturnValue(
        mockChain({ data: [{ client_tags: null }, { client_tags: RAW_TAG_ROW }], error: null })
      );
      const result = await repo.getTagsForAthlete(ATHLETE_ID);
      expect(result).toHaveLength(1);
    });

    it('returns empty array when no tags', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [], error: null }));
      expect(await repo.getTagsForAthlete(ATHLETE_ID)).toEqual([]);
    });

    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'RLS error' } }));
      await expect(repo.getTagsForAthlete(ATHLETE_ID)).rejects.toMatchObject({ message: 'RLS error' });
    });
  });

  // ── getTagsForAthletes ──────────────────────────────────────────────────────

  describe('getTagsForAthletes', () => {
    it('returns empty map for empty athleteIds array', async () => {
      const result = await repo.getTagsForAthletes([]);
      expect(result.size).toBe(0);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('returns map of athleteId to tags', async () => {
      supabase.from.mockReturnValue(
        mockChain({ data: [{ athlete_id: ATHLETE_ID, client_tags: RAW_TAG_ROW }], error: null })
      );

      const result = await repo.getTagsForAthletes([ATHLETE_ID]);

      expect(result.get(ATHLETE_ID)).toHaveLength(1);
      expect(result.get(ATHLETE_ID)![0].name).toBe('VIP');
    });

    it('filters out null client_tags', async () => {
      supabase.from.mockReturnValue(
        mockChain({ data: [{ athlete_id: ATHLETE_ID, client_tags: null }], error: null })
      );
      const result = await repo.getTagsForAthletes([ATHLETE_ID]);
      expect(result.get(ATHLETE_ID)).toBeUndefined();
    });

    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'DB error' } }));
      await expect(repo.getTagsForAthletes([ATHLETE_ID])).rejects.toMatchObject({ message: 'DB error' });
    });
  });

  // ── assignTag ───────────────────────────────────────────────────────────────

  describe('assignTag', () => {
    it('resolves without error on success', async () => {
      supabase.from.mockReturnValue(mockChain({ error: null }));
      await expect(repo.assignTag(TAG_ID, ATHLETE_ID)).resolves.toBeUndefined();
    });

    it('throws when supabase returns an error', async () => {
      supabase.from.mockReturnValue(mockChain({ error: { message: 'Upsert failed' } }));
      await expect(repo.assignTag(TAG_ID, ATHLETE_ID))
        .rejects.toMatchObject({ message: 'Upsert failed' });
    });
  });

  // ── removeTag ───────────────────────────────────────────────────────────────

  describe('removeTag', () => {
    it('resolves without error on success', async () => {
      supabase.from.mockReturnValue(mockChain({ error: null }));
      await expect(repo.removeTag(TAG_ID, ATHLETE_ID)).resolves.toBeUndefined();
    });

    it('throws when supabase returns an error', async () => {
      supabase.from.mockReturnValue(mockChain({ error: { message: 'Delete failed' } }));
      await expect(repo.removeTag(TAG_ID, ATHLETE_ID))
        .rejects.toMatchObject({ message: 'Delete failed' });
    });
  });

  // ── getClientCount ──────────────────────────────────────────────────────────

  describe('getClientCount', () => {
    it('returns the count of athletes with the tag', async () => {
      supabase.from.mockReturnValue(mockCountChain({ count: 5, error: null }));
      expect(await repo.getClientCount(TAG_ID)).toBe(5);
    });

    it('returns 0 when count is null', async () => {
      supabase.from.mockReturnValue(mockCountChain({ count: null, error: null }));
      expect(await repo.getClientCount(TAG_ID)).toBe(0);
    });

    it('throws on error', async () => {
      supabase.from.mockReturnValue(mockCountChain({ count: null, error: { message: 'DB error' } }));
      await expect(repo.getClientCount(TAG_ID)).rejects.toMatchObject({ message: 'DB error' });
    });
  });
});
