import {
  getSessionActivityUseCase,
  logSessionActivityUseCase,
} from '../../../src/application/coach/SessionActivityLogUseCases';
import { ISessionActivityLogRepository } from '../../../src/domain/repositories/ISessionActivityLogRepository';
import { SessionActivityLog, CreateSessionActivityLogInput } from '../../../src/domain/entities/SessionActivityLog';

// ── helpers ────────────────────────────────────────────────────────────────────

function makeLog(overrides: Partial<SessionActivityLog> = {}): SessionActivityLog {
  return {
    id:          'log-1',
    coachId:     'coach-1',
    sessionId:   'session-1',
    action:      'created',
    title:       'Sesión de fuerza',
    sessionType: 'Fuerza',
    modality:    'online',
    scheduledAt: new Date('2026-03-15T10:00:00Z'),
    loggedAt:    new Date('2026-03-15T10:01:00Z'),
    ...overrides,
  };
}

function makeRepo(logs: SessionActivityLog[] = []): ISessionActivityLogRepository {
  return {
    getByCoachId: jest.fn().mockResolvedValue(logs),
    create:       jest.fn().mockResolvedValue(undefined),
  };
}

function makeCreateInput(overrides: Partial<CreateSessionActivityLogInput> = {}): CreateSessionActivityLogInput {
  return {
    coachId:     'coach-1',
    sessionId:   'session-1',
    action:      'created',
    title:       'Sesión de fuerza',
    sessionType: 'Fuerza',
    modality:    'online',
    scheduledAt: new Date('2026-03-15T10:00:00Z'),
    ...overrides,
  };
}

// ── getSessionActivityUseCase ──────────────────────────────────────────────────

describe('getSessionActivityUseCase', () => {
  const from = new Date('2026-03-01T00:00:00Z');
  const to   = new Date('2026-03-31T23:59:59Z');

  it('returns logs from repo for valid inputs', async () => {
    const logs = [makeLog()];
    const repo = makeRepo(logs);

    const result = await getSessionActivityUseCase('coach-1', from, to, repo);

    expect(result).toEqual(logs);
    expect(repo.getByCoachId).toHaveBeenCalledWith('coach-1', from, to);
  });

  it('returns empty array when repo has no logs', async () => {
    const repo = makeRepo([]);

    const result = await getSessionActivityUseCase('coach-1', from, to, repo);

    expect(result).toEqual([]);
  });

  it('throws when coachId is empty string', async () => {
    const repo = makeRepo();

    await expect(getSessionActivityUseCase('', from, to, repo)).rejects.toThrow('coachId is required');
    expect(repo.getByCoachId).not.toHaveBeenCalled();
  });

  it('throws when from is after to', async () => {
    const repo = makeRepo();
    const laterFrom = new Date('2026-04-01T00:00:00Z');

    await expect(getSessionActivityUseCase('coach-1', laterFrom, to, repo)).rejects.toThrow(
      'from must be before or equal to to',
    );
    expect(repo.getByCoachId).not.toHaveBeenCalled();
  });

  it('allows from equal to to (same instant)', async () => {
    const same = new Date('2026-03-15T12:00:00Z');
    const repo = makeRepo([makeLog()]);

    const result = await getSessionActivityUseCase('coach-1', same, same, repo);

    expect(result).toHaveLength(1);
    expect(repo.getByCoachId).toHaveBeenCalledWith('coach-1', same, same);
  });

  it('propagates repo errors', async () => {
    const repo = makeRepo();
    (repo.getByCoachId as jest.Mock).mockRejectedValue(new Error('DB error'));

    await expect(getSessionActivityUseCase('coach-1', from, to, repo)).rejects.toThrow('DB error');
  });

  it('returns multiple logs ordered as repo provides them', async () => {
    const logs = [
      makeLog({ id: 'log-2', loggedAt: new Date('2026-03-16T10:00:00Z') }),
      makeLog({ id: 'log-1', loggedAt: new Date('2026-03-15T10:00:00Z') }),
    ];
    const repo = makeRepo(logs);

    const result = await getSessionActivityUseCase('coach-1', from, to, repo);

    expect(result[0].id).toBe('log-2');
    expect(result[1].id).toBe('log-1');
  });
});

// ── logSessionActivityUseCase ──────────────────────────────────────────────────

describe('logSessionActivityUseCase', () => {
  it('calls repo.create with valid input', async () => {
    const repo  = makeRepo();
    const input = makeCreateInput();

    await logSessionActivityUseCase(input, repo);

    expect(repo.create).toHaveBeenCalledWith(input);
  });

  it('resolves without error for "deleted" action', async () => {
    const repo  = makeRepo();
    const input = makeCreateInput({ action: 'deleted' });

    await expect(logSessionActivityUseCase(input, repo)).resolves.toBeUndefined();
  });

  it('throws when coachId is empty string', async () => {
    const repo  = makeRepo();
    const input = makeCreateInput({ coachId: '' });

    await expect(logSessionActivityUseCase(input, repo)).rejects.toThrow('coachId is required');
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws when sessionId is empty string', async () => {
    const repo  = makeRepo();
    const input = makeCreateInput({ sessionId: '' });

    await expect(logSessionActivityUseCase(input, repo)).rejects.toThrow('sessionId is required');
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws when action is empty string', async () => {
    const repo  = makeRepo();
    const input = makeCreateInput({ action: '' as any });

    await expect(logSessionActivityUseCase(input, repo)).rejects.toThrow('action is required');
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('propagates repo errors', async () => {
    const repo  = makeRepo();
    (repo.create as jest.Mock).mockRejectedValue(new Error('insert failed'));
    const input = makeCreateInput();

    await expect(logSessionActivityUseCase(input, repo)).rejects.toThrow('insert failed');
  });

  it('allows null title in input', async () => {
    const repo  = makeRepo();
    const input = makeCreateInput({ title: null });

    await expect(logSessionActivityUseCase(input, repo)).resolves.toBeUndefined();
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ title: null }));
  });
});
