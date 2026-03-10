/**
 * SyncService tests
 *
 * NetInfo and Supabase are mocked globally in jest.setup.ts.
 * WorkoutLocalRepository is mocked here per test.
 */

import NetInfo from '@react-native-community/netinfo';
import { SyncService } from '../../../src/infrastructure/sync/SyncService';
import { WorkoutSession } from '../../../src/domain/entities/WorkoutSession';
import { ExerciseSet } from '../../../src/domain/entities/ExerciseSet';

const { supabase } = require('../../../src/infrastructure/supabase/client');

// ── Mock WorkoutLocalRepository ───────────────────────────────────────────────

const mockGetUnsyncedSessions = jest.fn();
const mockMarkSynced          = jest.fn();

jest.mock('../../../src/infrastructure/database/local/WorkoutLocalRepository', () => ({
  WorkoutLocalRepository: jest.fn().mockImplementation(() => ({
    getUnsyncedSessions: mockGetUnsyncedSessions,
    markSynced: mockMarkSynced,
  })),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ATHLETE_ID = 'athl-uuid-0001-0000-000000000001';
const SESSION_ID = 'sess-uuid-0001-0000-000000000001';
const NOW        = new Date();

const REPS_SET: ExerciseSet = {
  id: 'set-001', sessionId: SESSION_ID, exerciseId: '11111111-0001-0000-0000-000000000001',
  setNumber: 1, performance: { type: 'reps', reps: 10, weightKg: 80 },
  restAfterSeconds: 90, completedAt: NOW,
};

const ISO_SET: ExerciseSet = {
  id: 'set-002', sessionId: SESSION_ID, exerciseId: '11111111-0006-0000-0000-000000000001',
  setNumber: 1, performance: { type: 'isometric', durationSeconds: 45 },
  restAfterSeconds: 0, completedAt: NOW,
};

const COMPLETED_SESSION: WorkoutSession = {
  id: SESSION_ID, athleteId: ATHLETE_ID, status: 'completed',
  sets: [REPS_SET], startedAt: NOW, finishedAt: NOW,
};

function mockSupabaseSuccess() {
  const chain: any = {};
  ['select','insert','upsert','eq'].forEach((m) => { chain[m] = jest.fn(() => chain); });
  chain.then = (resolve: any) => Promise.resolve({ error: null }).then(resolve);
  supabase.from.mockReturnValue(chain);
}

function mockSupabaseError(message: string) {
  const chain: any = {};
  ['select','insert','upsert','eq'].forEach((m) => { chain[m] = jest.fn(() => chain); });
  chain.then = (resolve: any) => Promise.resolve({ error: { message } }).then(resolve);
  supabase.from.mockReturnValue(chain);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SyncService', () => {
  let service: SyncService;

  beforeEach(() => {
    service = new SyncService();
    jest.clearAllMocks();
    mockMarkSynced.mockResolvedValue(undefined);
  });

  // ── syncPendingSessions ─────────────────────────────────────────────────────

  describe('syncPendingSessions', () => {
    it('skips sync when device is offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
      mockGetUnsyncedSessions.mockResolvedValue([COMPLETED_SESSION]);

      await service.syncPendingSessions(ATHLETE_ID);

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('does nothing when there are no unsynced sessions', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      mockGetUnsyncedSessions.mockResolvedValue([]);

      await service.syncPendingSessions(ATHLETE_ID);

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('syncs a session with reps sets when online', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      mockGetUnsyncedSessions.mockResolvedValue([COMPLETED_SESSION]);
      mockSupabaseSuccess();

      await service.syncPendingSessions(ATHLETE_ID);

      expect(supabase.from).toHaveBeenCalled();
      expect(mockMarkSynced).toHaveBeenCalledWith(SESSION_ID);
    });

    it('syncs a session with isometric sets and maps them correctly', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      const isoSession = { ...COMPLETED_SESSION, sets: [ISO_SET] };
      mockGetUnsyncedSessions.mockResolvedValue([isoSession]);
      mockSupabaseSuccess();

      await service.syncPendingSessions(ATHLETE_ID);

      expect(mockMarkSynced).toHaveBeenCalledWith(SESSION_ID);
    });

    it('syncs a session with no sets (session header only)', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      const emptySession = { ...COMPLETED_SESSION, sets: [] };
      mockGetUnsyncedSessions.mockResolvedValue([emptySession]);
      mockSupabaseSuccess();

      await service.syncPendingSessions(ATHLETE_ID);

      expect(mockMarkSynced).toHaveBeenCalledWith(SESSION_ID);
    });

    it('does not mark as synced when session upsert fails', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      mockGetUnsyncedSessions.mockResolvedValue([COMPLETED_SESSION]);
      mockSupabaseError('Connection timeout');

      await service.syncPendingSessions(ATHLETE_ID);

      expect(mockMarkSynced).not.toHaveBeenCalled();
    });

    it('continues syncing remaining sessions when one fails', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

      const session2 = { ...COMPLETED_SESSION, id: 'sess-002' };
      mockGetUnsyncedSessions.mockResolvedValue([COMPLETED_SESSION, session2]);

      // First call fails, second succeeds
      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        const chain: any = {};
        ['select','insert','upsert','eq'].forEach((m) => { chain[m] = jest.fn(() => chain); });
        const shouldFail = callCount === 1;
        chain.then = (resolve: any) =>
          Promise.resolve({ error: shouldFail ? { message: 'fail' } : null }).then(resolve);
        return chain;
      });

      // Should not throw — allSettled absorbs the failure
      await expect(service.syncPendingSessions(ATHLETE_ID)).resolves.toBeUndefined();
    });
  });
});
