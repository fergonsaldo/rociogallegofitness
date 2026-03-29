/**
 * SessionTypeUseCases tests (RF-E8-05)
 */

import {
  getSessionTypesUseCase,
  createSessionTypeUseCase,
  updateSessionTypeUseCase,
  deleteSessionTypeUseCase,
  getSessionTypeUsageCountUseCase,
  deleteSessionTypeWithSubstitutionUseCase,
} from '../../../src/application/coach/SessionTypeUseCases';
import { ISessionTypeRepository } from '../../../src/domain/repositories/ISessionTypeRepository';
import { SessionType } from '../../../src/domain/entities/SessionType';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID = 'coac-uuid-0001-0000-000000000001';
const TYPE_ID  = 'type-uuid-0001-0000-000000000001';
const NOW      = new Date();

const SESSION_TYPE: SessionType = {
  id: TYPE_ID, coachId: COACH_ID, name: 'Fuerza', color: '#DC2626', createdAt: NOW,
};

// ── Mock repo ─────────────────────────────────────────────────────────────────

const mockRepo: jest.Mocked<ISessionTypeRepository> = {
  getByCoachId:            jest.fn(),
  create:                  jest.fn(),
  update:                  jest.fn(),
  delete:                  jest.fn(),
  countUsages:             jest.fn(),
  deleteWithSubstitution:  jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── getSessionTypesUseCase ────────────────────────────────────────────────────

describe('getSessionTypesUseCase', () => {
  it('returns session types for a valid coachId', async () => {
    mockRepo.getByCoachId.mockResolvedValue([SESSION_TYPE]);
    const result = await getSessionTypesUseCase(COACH_ID, mockRepo);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Fuerza');
    expect(mockRepo.getByCoachId).toHaveBeenCalledWith(COACH_ID);
  });

  it('returns empty array when coach has no session types', async () => {
    mockRepo.getByCoachId.mockResolvedValue([]);
    expect(await getSessionTypesUseCase(COACH_ID, mockRepo)).toEqual([]);
  });

  it('throws when coachId is empty', async () => {
    await expect(getSessionTypesUseCase('', mockRepo)).rejects.toThrow('coachId is required');
    expect(mockRepo.getByCoachId).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.getByCoachId.mockRejectedValue(new Error('DB error'));
    await expect(getSessionTypesUseCase(COACH_ID, mockRepo)).rejects.toThrow('DB error');
  });
});

// ── createSessionTypeUseCase ──────────────────────────────────────────────────

describe('createSessionTypeUseCase', () => {
  it('creates a session type and returns it', async () => {
    mockRepo.create.mockResolvedValue(SESSION_TYPE);
    const result = await createSessionTypeUseCase(
      { coachId: COACH_ID, name: 'Fuerza', color: '#DC2626' },
      mockRepo,
    );
    expect(result.name).toBe('Fuerza');
    expect(mockRepo.create).toHaveBeenCalledWith({ coachId: COACH_ID, name: 'Fuerza', color: '#DC2626' });
  });

  it('trims whitespace from name before creating', async () => {
    mockRepo.create.mockResolvedValue(SESSION_TYPE);
    await createSessionTypeUseCase({ coachId: COACH_ID, name: '  Fuerza  ', color: '#DC2626' }, mockRepo);
    expect(mockRepo.create.mock.calls[0][0].name).toBe('Fuerza');
  });

  it('throws when coachId is empty', async () => {
    await expect(createSessionTypeUseCase({ coachId: '', name: 'Fuerza', color: '#DC2626' }, mockRepo))
      .rejects.toThrow('coachId is required');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('throws when name is empty', async () => {
    await expect(createSessionTypeUseCase({ coachId: COACH_ID, name: '', color: '#DC2626' }, mockRepo))
      .rejects.toThrow('name is required');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('throws when name is only whitespace', async () => {
    await expect(createSessionTypeUseCase({ coachId: COACH_ID, name: '   ', color: '#DC2626' }, mockRepo))
      .rejects.toThrow('name is required');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.create.mockRejectedValue(new Error('Insert failed'));
    await expect(createSessionTypeUseCase({ coachId: COACH_ID, name: 'Fuerza', color: '#DC2626' }, mockRepo))
      .rejects.toThrow('Insert failed');
  });
});

// ── updateSessionTypeUseCase ──────────────────────────────────────────────────

describe('updateSessionTypeUseCase', () => {
  it('updates a session type and returns it', async () => {
    const updated = { ...SESSION_TYPE, name: 'Cardio' };
    mockRepo.update.mockResolvedValue(updated);
    const result = await updateSessionTypeUseCase(TYPE_ID, { name: 'Cardio' }, mockRepo);
    expect(result.name).toBe('Cardio');
    expect(mockRepo.update).toHaveBeenCalledWith(TYPE_ID, { name: 'Cardio' });
  });

  it('trims whitespace from name when updating', async () => {
    const updated = { ...SESSION_TYPE, name: 'Cardio' };
    mockRepo.update.mockResolvedValue(updated);
    await updateSessionTypeUseCase(TYPE_ID, { name: '  Cardio  ' }, mockRepo);
    expect(mockRepo.update.mock.calls[0][1].name).toBe('Cardio');
  });

  it('allows updating only color', async () => {
    const updated = { ...SESSION_TYPE, color: '#059669' };
    mockRepo.update.mockResolvedValue(updated);
    const result = await updateSessionTypeUseCase(TYPE_ID, { color: '#059669' }, mockRepo);
    expect(result.color).toBe('#059669');
  });

  it('throws when id is empty', async () => {
    await expect(updateSessionTypeUseCase('', { name: 'Cardio' }, mockRepo))
      .rejects.toThrow('id is required');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('throws when name is explicitly empty string', async () => {
    await expect(updateSessionTypeUseCase(TYPE_ID, { name: '' }, mockRepo))
      .rejects.toThrow('name cannot be empty');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('throws when name is only whitespace', async () => {
    await expect(updateSessionTypeUseCase(TYPE_ID, { name: '   ' }, mockRepo))
      .rejects.toThrow('name cannot be empty');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.update.mockRejectedValue(new Error('Not found'));
    await expect(updateSessionTypeUseCase(TYPE_ID, { name: 'Cardio' }, mockRepo))
      .rejects.toThrow('Not found');
  });
});

// ── deleteSessionTypeUseCase ──────────────────────────────────────────────────

describe('deleteSessionTypeUseCase', () => {
  it('calls repository.delete with the session type id', async () => {
    mockRepo.delete.mockResolvedValue(undefined);
    await deleteSessionTypeUseCase(TYPE_ID, mockRepo);
    expect(mockRepo.delete).toHaveBeenCalledWith(TYPE_ID);
  });

  it('throws when id is empty', async () => {
    await expect(deleteSessionTypeUseCase('', mockRepo)).rejects.toThrow('id is required');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.delete.mockRejectedValue(new Error('Delete failed'));
    await expect(deleteSessionTypeUseCase(TYPE_ID, mockRepo)).rejects.toThrow('Delete failed');
  });
});

// ── getSessionTypeUsageCountUseCase ──────────────────────────────────────────

describe('getSessionTypeUsageCountUseCase', () => {
  it('returns usage count for a valid typeId', async () => {
    mockRepo.countUsages.mockResolvedValue(5);
    const result = await getSessionTypeUsageCountUseCase(TYPE_ID, mockRepo);
    expect(result).toBe(5);
    expect(mockRepo.countUsages).toHaveBeenCalledWith(TYPE_ID);
  });

  it('returns 0 when type is not in use', async () => {
    mockRepo.countUsages.mockResolvedValue(0);
    const result = await getSessionTypeUsageCountUseCase(TYPE_ID, mockRepo);
    expect(result).toBe(0);
  });

  it('throws when typeId is empty', async () => {
    await expect(getSessionTypeUsageCountUseCase('', mockRepo)).rejects.toThrow('typeId is required');
    expect(mockRepo.countUsages).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.countUsages.mockRejectedValue(new Error('Query failed'));
    await expect(getSessionTypeUsageCountUseCase(TYPE_ID, mockRepo)).rejects.toThrow('Query failed');
  });
});

// ── deleteSessionTypeWithSubstitutionUseCase ─────────────────────────────────

const SUB_ID = 'type-uuid-0002-0000-000000000002';

describe('deleteSessionTypeWithSubstitutionUseCase', () => {
  it('calls deleteWithSubstitution with id and substitutionId', async () => {
    mockRepo.deleteWithSubstitution.mockResolvedValue(undefined);
    await deleteSessionTypeWithSubstitutionUseCase(TYPE_ID, SUB_ID, mockRepo);
    expect(mockRepo.deleteWithSubstitution).toHaveBeenCalledWith(TYPE_ID, SUB_ID);
  });

  it('calls deleteWithSubstitution without substitutionId when undefined', async () => {
    mockRepo.deleteWithSubstitution.mockResolvedValue(undefined);
    await deleteSessionTypeWithSubstitutionUseCase(TYPE_ID, undefined, mockRepo);
    expect(mockRepo.deleteWithSubstitution).toHaveBeenCalledWith(TYPE_ID, undefined);
  });

  it('throws when id is empty', async () => {
    await expect(deleteSessionTypeWithSubstitutionUseCase('', SUB_ID, mockRepo))
      .rejects.toThrow('id is required');
    expect(mockRepo.deleteWithSubstitution).not.toHaveBeenCalled();
  });

  it('throws when substitutionId is explicitly empty string', async () => {
    await expect(deleteSessionTypeWithSubstitutionUseCase(TYPE_ID, '', mockRepo))
      .rejects.toThrow('substitutionId cannot be empty');
    expect(mockRepo.deleteWithSubstitution).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.deleteWithSubstitution.mockRejectedValue(new Error('Substitution failed'));
    await expect(deleteSessionTypeWithSubstitutionUseCase(TYPE_ID, SUB_ID, mockRepo))
      .rejects.toThrow('Substitution failed');
  });
});
