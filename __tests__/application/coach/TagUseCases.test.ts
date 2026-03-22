/**
 * TagUseCases tests
 */

import {
  getTagsUseCase,
  createTagUseCase,
  updateTagUseCase,
  deleteTagUseCase,
  getAthleteTagsUseCase,
  assignTagToAthleteUseCase,
  removeTagFromAthleteUseCase,
} from '../../../src/application/coach/TagUseCases';
import { ITagRepository } from '../../../src/domain/repositories/ITagRepository';
import { ClientTag } from '../../../src/domain/entities/ClientTag';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID   = 'coac-uuid-0001-0000-000000000001';
const ATHLETE_ID = 'athl-uuid-0001-0000-000000000001';
const TAG_ID     = 'tag1-uuid-0001-0000-000000000001';
const NOW        = new Date();

const TAG: ClientTag = {
  id: TAG_ID, coachId: COACH_ID, name: 'VIP', color: '#C90960',
  clientCount: 2, createdAt: NOW,
};

// ── Mock repo ─────────────────────────────────────────────────────────────────

const mockRepo: jest.Mocked<ITagRepository> = {
  getByCoachId:        jest.fn(),
  create:              jest.fn(),
  update:              jest.fn(),
  delete:              jest.fn(),
  getClientCount:      jest.fn(),
  getTagsForAthlete:   jest.fn(),
  getTagsForAthletes:  jest.fn(),
  assignTag:           jest.fn(),
  removeTag:           jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── getTagsUseCase ────────────────────────────────────────────────────────────

describe('getTagsUseCase', () => {
  it('returns tags for a valid coachId', async () => {
    mockRepo.getByCoachId.mockResolvedValue([TAG]);
    const result = await getTagsUseCase(COACH_ID, mockRepo);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('VIP');
    expect(mockRepo.getByCoachId).toHaveBeenCalledWith(COACH_ID);
  });

  it('returns empty array when coach has no tags', async () => {
    mockRepo.getByCoachId.mockResolvedValue([]);
    expect(await getTagsUseCase(COACH_ID, mockRepo)).toEqual([]);
  });

  it('throws when coachId is empty', async () => {
    await expect(getTagsUseCase('', mockRepo)).rejects.toThrow('coachId is required');
    expect(mockRepo.getByCoachId).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.getByCoachId.mockRejectedValue(new Error('DB error'));
    await expect(getTagsUseCase(COACH_ID, mockRepo)).rejects.toThrow('DB error');
  });
});

// ── createTagUseCase ──────────────────────────────────────────────────────────

describe('createTagUseCase', () => {
  it('creates a tag and returns it', async () => {
    mockRepo.create.mockResolvedValue(TAG);
    const result = await createTagUseCase({ coachId: COACH_ID, name: 'VIP', color: '#C90960' }, mockRepo);
    expect(result.name).toBe('VIP');
    expect(mockRepo.create).toHaveBeenCalledWith({ coachId: COACH_ID, name: 'VIP', color: '#C90960' });
  });

  it('trims whitespace from name before creating', async () => {
    mockRepo.create.mockResolvedValue(TAG);
    await createTagUseCase({ coachId: COACH_ID, name: '  VIP  ', color: '#C90960' }, mockRepo);
    expect(mockRepo.create.mock.calls[0][0].name).toBe('VIP');
  });

  it('throws when coachId is empty', async () => {
    await expect(createTagUseCase({ coachId: '', name: 'VIP', color: '#C90960' }, mockRepo))
      .rejects.toThrow('coachId is required');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('throws when name is empty', async () => {
    await expect(createTagUseCase({ coachId: COACH_ID, name: '', color: '#C90960' }, mockRepo))
      .rejects.toThrow('name is required');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('throws when name is only whitespace', async () => {
    await expect(createTagUseCase({ coachId: COACH_ID, name: '   ', color: '#C90960' }, mockRepo))
      .rejects.toThrow('name is required');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.create.mockRejectedValue(new Error('Duplicate name'));
    await expect(createTagUseCase({ coachId: COACH_ID, name: 'VIP', color: '#C90960' }, mockRepo))
      .rejects.toThrow('Duplicate name');
  });
});

// ── updateTagUseCase ──────────────────────────────────────────────────────────

describe('updateTagUseCase', () => {
  it('updates a tag and returns it', async () => {
    const updated = { ...TAG, name: 'Premium' };
    mockRepo.update.mockResolvedValue(updated);
    const result = await updateTagUseCase(TAG_ID, { name: 'Premium' }, mockRepo);
    expect(result.name).toBe('Premium');
    expect(mockRepo.update).toHaveBeenCalledWith(TAG_ID, { name: 'Premium' });
  });

  it('trims whitespace from name when updating', async () => {
    const updated = { ...TAG, name: 'Premium' };
    mockRepo.update.mockResolvedValue(updated);
    await updateTagUseCase(TAG_ID, { name: '  Premium  ' }, mockRepo);
    expect(mockRepo.update.mock.calls[0][1].name).toBe('Premium');
  });

  it('allows updating only color', async () => {
    const updated = { ...TAG, color: '#059669' };
    mockRepo.update.mockResolvedValue(updated);
    const result = await updateTagUseCase(TAG_ID, { color: '#059669' }, mockRepo);
    expect(result.color).toBe('#059669');
  });

  it('throws when id is empty', async () => {
    await expect(updateTagUseCase('', { name: 'Premium' }, mockRepo))
      .rejects.toThrow('id is required');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('throws when name is explicitly empty string', async () => {
    await expect(updateTagUseCase(TAG_ID, { name: '' }, mockRepo))
      .rejects.toThrow('name cannot be empty');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.update.mockRejectedValue(new Error('Not found'));
    await expect(updateTagUseCase(TAG_ID, { name: 'Premium' }, mockRepo))
      .rejects.toThrow('Not found');
  });
});

// ── getAthleteTagsUseCase ─────────────────────────────────────────────────────

describe('getAthleteTagsUseCase', () => {
  it('returns tags for a valid athleteId', async () => {
    mockRepo.getTagsForAthlete.mockResolvedValue([TAG]);
    const result = await getAthleteTagsUseCase(ATHLETE_ID, mockRepo);
    expect(result).toHaveLength(1);
    expect(mockRepo.getTagsForAthlete).toHaveBeenCalledWith(ATHLETE_ID);
  });

  it('throws when athleteId is empty', async () => {
    await expect(getAthleteTagsUseCase('', mockRepo)).rejects.toThrow('athleteId is required');
    expect(mockRepo.getTagsForAthlete).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.getTagsForAthlete.mockRejectedValue(new Error('DB error'));
    await expect(getAthleteTagsUseCase(ATHLETE_ID, mockRepo)).rejects.toThrow('DB error');
  });
});

// ── assignTagToAthleteUseCase ─────────────────────────────────────────────────

describe('assignTagToAthleteUseCase', () => {
  it('calls repository.assignTag with correct ids', async () => {
    mockRepo.assignTag.mockResolvedValue(undefined);
    await assignTagToAthleteUseCase(TAG_ID, ATHLETE_ID, mockRepo);
    expect(mockRepo.assignTag).toHaveBeenCalledWith(TAG_ID, ATHLETE_ID);
  });

  it('throws when tagId is empty', async () => {
    await expect(assignTagToAthleteUseCase('', ATHLETE_ID, mockRepo))
      .rejects.toThrow('tagId is required');
    expect(mockRepo.assignTag).not.toHaveBeenCalled();
  });

  it('throws when athleteId is empty', async () => {
    await expect(assignTagToAthleteUseCase(TAG_ID, '', mockRepo))
      .rejects.toThrow('athleteId is required');
    expect(mockRepo.assignTag).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.assignTag.mockRejectedValue(new Error('RLS error'));
    await expect(assignTagToAthleteUseCase(TAG_ID, ATHLETE_ID, mockRepo))
      .rejects.toThrow('RLS error');
  });
});

// ── removeTagFromAthleteUseCase ───────────────────────────────────────────────

describe('removeTagFromAthleteUseCase', () => {
  it('calls repository.removeTag with correct ids', async () => {
    mockRepo.removeTag.mockResolvedValue(undefined);
    await removeTagFromAthleteUseCase(TAG_ID, ATHLETE_ID, mockRepo);
    expect(mockRepo.removeTag).toHaveBeenCalledWith(TAG_ID, ATHLETE_ID);
  });

  it('throws when tagId is empty', async () => {
    await expect(removeTagFromAthleteUseCase('', ATHLETE_ID, mockRepo))
      .rejects.toThrow('tagId is required');
    expect(mockRepo.removeTag).not.toHaveBeenCalled();
  });

  it('throws when athleteId is empty', async () => {
    await expect(removeTagFromAthleteUseCase(TAG_ID, '', mockRepo))
      .rejects.toThrow('athleteId is required');
    expect(mockRepo.removeTag).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.removeTag.mockRejectedValue(new Error('Delete failed'));
    await expect(removeTagFromAthleteUseCase(TAG_ID, ATHLETE_ID, mockRepo))
      .rejects.toThrow('Delete failed');
  });
});

// ── deleteTagUseCase ──────────────────────────────────────────────────────────

describe('deleteTagUseCase', () => {
  it('calls repository.delete with the tag id', async () => {
    mockRepo.delete.mockResolvedValue(undefined);
    await deleteTagUseCase(TAG_ID, mockRepo);
    expect(mockRepo.delete).toHaveBeenCalledWith(TAG_ID);
  });

  it('throws when id is empty', async () => {
    await expect(deleteTagUseCase('', mockRepo)).rejects.toThrow('id is required');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.delete.mockRejectedValue(new Error('Delete failed'));
    await expect(deleteTagUseCase(TAG_ID, mockRepo)).rejects.toThrow('Delete failed');
  });
});
