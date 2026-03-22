/**
 * CoachSessionRemoteRepository tests
 */

import { CoachSessionRemoteRepository } from '../../../src/infrastructure/supabase/remote/CoachSessionRemoteRepository';

const { supabase } = require('../../../src/infrastructure/supabase/client');

const COACH_ID    = 'coac-uuid-0001-0000-000000000001';
const SESSION_ID  = 'sess-uuid-0001-0000-000000000001';
const ATHLETE_ID  = 'athl-uuid-0001-0000-000000000001';
const NOW_ISO     = '2026-03-22T10:00:00.000Z';

const RAW_ROW = {
  id:               SESSION_ID,
  coach_id:         COACH_ID,
  athlete_id:       null,
  title:            'Sesión de fuerza',
  session_type:     'Entrenamiento',
  modality:         'in_person',
  scheduled_at:     NOW_ISO,
  duration_minutes: 60,
  notes:            null,
  created_at:       NOW_ISO,
};

const RAW_ROW_WITH_ATHLETE = {
  ...RAW_ROW,
  athlete_id: ATHLETE_ID,
  athlete:    { full_name: 'Ana García' },
};

function mockChain(finalResult: object) {
  const chain: any = {};
  ['select', 'eq', 'gte', 'lt', 'gt', 'order', 'insert', 'delete', 'single', 'upsert'].forEach((m) => {
    chain[m] = jest.fn(() => chain);
  });
  chain.then = (resolve: any) => Promise.resolve(finalResult).then(resolve);
  return chain;
}

describe('CoachSessionRemoteRepository', () => {
  let repo: CoachSessionRemoteRepository;

  beforeEach(() => {
    repo = new CoachSessionRemoteRepository();
    jest.resetAllMocks();
  });

  // ── getForMonth ─────────────────────────────────────────────────────────────

  describe('getForMonth', () => {
    it('maps rows to CoachSession entities', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [RAW_ROW], error: null }));

      const result = await repo.getForMonth(COACH_ID, 2026, 3);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(SESSION_ID);
      expect(result[0].coachId).toBe(COACH_ID);
      expect(result[0].scheduledAt).toBeInstanceOf(Date);
      expect(result[0].scheduledAt.toISOString()).toBe(NOW_ISO);
      expect(result[0].durationMinutes).toBe(60);
      expect(result[0].modality).toBe('in_person');
      expect(result[0].athleteName).toBeNull();
    });

    it('populates athleteName from join when athlete is present', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [RAW_ROW_WITH_ATHLETE], error: null }));

      const result = await repo.getForMonth(COACH_ID, 2026, 3);

      expect(result[0].athleteId).toBe(ATHLETE_ID);
      expect(result[0].athleteName).toBe('Ana García');
    });

    it('returns empty array when no sessions', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [], error: null }));
      expect(await repo.getForMonth(COACH_ID, 2026, 3)).toEqual([]);
    });

    it('handles null data gracefully', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: null }));
      expect(await repo.getForMonth(COACH_ID, 2026, 3)).toEqual([]);
    });

    it('throws on supabase error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'RLS error' } }));
      await expect(repo.getForMonth(COACH_ID, 2026, 3))
        .rejects.toMatchObject({ message: 'RLS error' });
    });
  });

  // ── getOverlapping ──────────────────────────────────────────────────────────

  describe('getOverlapping', () => {
    const T0    = new Date('2026-03-22T10:00:00.000Z');
    const T30   = new Date('2026-03-22T10:30:00.000Z');
    const T60   = new Date('2026-03-22T11:00:00.000Z');
    const T90   = new Date('2026-03-22T11:30:00.000Z');
    const T120  = new Date('2026-03-22T12:00:00.000Z');

    const sessionAt0For60 = {
      ...RAW_ROW, scheduled_at: T0.toISOString(), duration_minutes: 60,
    };

    it('returns sessions that truly overlap the range', async () => {
      // Session [T0, T60) — checking overlap with [T30, T90) → overlaps
      supabase.from.mockReturnValue(mockChain({ data: [sessionAt0For60], error: null }));
      const result = await repo.getOverlapping(COACH_ID, T30, T90);
      expect(result).toHaveLength(1);
    });

    it('excludes sessions that end exactly when the range starts (adjacent)', async () => {
      // Session [T0, T60) — checking overlap with [T60, T120) → no overlap
      supabase.from.mockReturnValue(mockChain({ data: [sessionAt0For60], error: null }));
      const result = await repo.getOverlapping(COACH_ID, T60, T120);
      expect(result).toHaveLength(0);
    });

    it('includes sessions that start exactly when the range ends (adjacent flip)', async () => {
      // Session [T60, T120) — checking overlap with [T0, T60) → no overlap
      const sessionAt60For60 = {
        ...RAW_ROW, scheduled_at: T60.toISOString(), duration_minutes: 60,
      };
      supabase.from.mockReturnValue(mockChain({ data: [sessionAt60For60], error: null }));
      const result = await repo.getOverlapping(COACH_ID, T0, T60);
      expect(result).toHaveLength(0);
    });

    it('returns empty array when no sessions in DB range', async () => {
      supabase.from.mockReturnValue(mockChain({ data: [], error: null }));
      const result = await repo.getOverlapping(COACH_ID, T0, T60);
      expect(result).toHaveLength(0);
    });

    it('throws on supabase error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'DB error' } }));
      await expect(repo.getOverlapping(COACH_ID, T0, T60))
        .rejects.toMatchObject({ message: 'DB error' });
    });
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('inserts and returns mapped CoachSession', async () => {
      supabase.from.mockReturnValue(mockChain({ data: RAW_ROW, error: null }));

      const result = await repo.create({
        coachId:         COACH_ID,
        athleteId:       null,
        title:           'Sesión de fuerza',
        sessionType:     'Entrenamiento',
        modality:        'in_person',
        scheduledAt:     new Date(NOW_ISO),
        durationMinutes: 60,
        notes:           null,
      });

      expect(result.id).toBe(SESSION_ID);
      expect(result.modality).toBe('in_person');
      expect(result.athleteName).toBeNull();
    });

    it('throws when supabase returns an error', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: { message: 'Conflict' } }));
      await expect(repo.create({
        coachId: COACH_ID, athleteId: null, title: null,
        sessionType: 'Entrenamiento', modality: 'in_person',
        scheduledAt: new Date(), durationMinutes: 60, notes: null,
      })).rejects.toMatchObject({ message: 'Conflict' });
    });

    it('throws when no data is returned', async () => {
      supabase.from.mockReturnValue(mockChain({ data: null, error: null }));
      await expect(repo.create({
        coachId: COACH_ID, athleteId: null, title: null,
        sessionType: 'Entrenamiento', modality: 'in_person',
        scheduledAt: new Date(), durationMinutes: 60, notes: null,
      })).rejects.toThrow('No data returned after insert');
    });
  });

  // ── delete ──────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('resolves without error on success', async () => {
      supabase.from.mockReturnValue(mockChain({ error: null }));
      await expect(repo.delete(SESSION_ID)).resolves.toBeUndefined();
    });

    it('throws when supabase returns an error', async () => {
      supabase.from.mockReturnValue(mockChain({ error: { message: 'Not found' } }));
      await expect(repo.delete(SESSION_ID)).rejects.toMatchObject({ message: 'Not found' });
    });
  });
});
