import {
  getQuickAccessUseCase,
  saveQuickAccessUseCase,
} from '../../../src/application/coach/CoachPreferencesUseCases';
import { ICoachPreferencesRepository } from '../../../src/domain/repositories/ICoachPreferencesRepository';
import { DEFAULT_QUICK_ACCESS } from '../../../src/shared/constants/quickAccessCatalog';

// ── helpers ────────────────────────────────────────────────────────────────────

function makeRepo(stored: string[] | null = null): ICoachPreferencesRepository {
  return {
    getQuickAccess:    jest.fn().mockResolvedValue(stored),
    upsertQuickAccess: jest.fn().mockResolvedValue(undefined),
  };
}

// ── getQuickAccessUseCase ──────────────────────────────────────────────────────

describe('getQuickAccessUseCase', () => {
  it('returns stored keys when repo has preferences', async () => {
    const keys = ['clients', 'calendar'];
    const repo = makeRepo(keys);

    const result = await getQuickAccessUseCase('coach-1', repo);

    expect(result).toEqual(keys);
    expect(repo.getQuickAccess).toHaveBeenCalledWith('coach-1');
  });

  it('returns DEFAULT_QUICK_ACCESS when repo returns null (first time)', async () => {
    const repo = makeRepo(null);

    const result = await getQuickAccessUseCase('coach-1', repo);

    expect(result).toEqual(DEFAULT_QUICK_ACCESS);
  });

  it('throws when coachId is empty', async () => {
    const repo = makeRepo();

    await expect(getQuickAccessUseCase('', repo)).rejects.toThrow('coachId is required');
    expect(repo.getQuickAccess).not.toHaveBeenCalled();
  });

  it('propagates repo errors', async () => {
    const repo = makeRepo();
    (repo.getQuickAccess as jest.Mock).mockRejectedValue(new Error('DB error'));

    await expect(getQuickAccessUseCase('coach-1', repo)).rejects.toThrow('DB error');
  });
});

// ── saveQuickAccessUseCase ─────────────────────────────────────────────────────

describe('saveQuickAccessUseCase', () => {
  it('calls repo.upsertQuickAccess with coachId and keys', async () => {
    const repo = makeRepo();
    const keys = ['clients', 'videos'];

    await saveQuickAccessUseCase('coach-1', keys, repo);

    expect(repo.upsertQuickAccess).toHaveBeenCalledWith('coach-1', keys);
  });

  it('throws when coachId is empty', async () => {
    const repo = makeRepo();

    await expect(saveQuickAccessUseCase('', ['clients'], repo)).rejects.toThrow('coachId is required');
    expect(repo.upsertQuickAccess).not.toHaveBeenCalled();
  });

  it('throws when keys array is empty', async () => {
    const repo = makeRepo();

    await expect(saveQuickAccessUseCase('coach-1', [], repo)).rejects.toThrow(
      'At least one shortcut must be selected',
    );
    expect(repo.upsertQuickAccess).not.toHaveBeenCalled();
  });

  it('allows saving a single key', async () => {
    const repo = makeRepo();

    await expect(saveQuickAccessUseCase('coach-1', ['calendar'], repo)).resolves.toBeUndefined();
    expect(repo.upsertQuickAccess).toHaveBeenCalledWith('coach-1', ['calendar']);
  });

  it('propagates repo errors', async () => {
    const repo = makeRepo();
    (repo.upsertQuickAccess as jest.Mock).mockRejectedValue(new Error('upsert failed'));

    await expect(saveQuickAccessUseCase('coach-1', ['clients'], repo)).rejects.toThrow('upsert failed');
  });
});
