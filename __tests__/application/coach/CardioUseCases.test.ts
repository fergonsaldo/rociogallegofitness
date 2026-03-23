import {
  getAllCardiosUseCase,
  createCardioUseCase,
  deleteCardioUseCase,
  assignCardioToAthleteUseCase,
  assignMultipleCardiosUseCase,
  filterCardios,
} from '../../../src/application/coach/CardioUseCases';
import { ICardioRepository } from '../../../src/domain/repositories/ICardioRepository';
import { CatalogCardio, CreateCardioInput } from '../../../src/domain/entities/Cardio';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID   = '00000000-0000-4000-b000-000000000001';
const CARDIO_ID  = '11111111-0000-4000-b000-000000000002';
const ATHLETE_ID = '22222222-0000-4000-b000-000000000003';
const NOW = new Date();

const BASE_CARDIO: CatalogCardio = {
  id: 'c0000001-0000-4000-b000-000000000001',
  coachId: null,
  name: 'Carrera continua suave',
  type: 'running',
  intensity: 'low',
  durationMinMinutes: 20,
  durationMaxMinutes: 40,
  createdAt: NOW,
};

const COACH_CARDIO: CatalogCardio = {
  id: CARDIO_ID,
  coachId: COACH_ID,
  name: 'Sprint intervals custom',
  type: 'running',
  intensity: 'high',
  durationMinMinutes: 15,
  durationMaxMinutes: 25,
  description: 'Series cortas de alta intensidad',
  createdAt: NOW,
};

const VALID_INPUT: CreateCardioInput = {
  coachId:            COACH_ID,
  name:               'Sprint intervals custom',
  type:               'running',
  intensity:          'high',
  durationMinMinutes: 15,
  durationMaxMinutes: 25,
};

const mockRepo: jest.Mocked<ICardioRepository> = {
  getAll:              jest.fn(),
  create:              jest.fn(),
  delete:              jest.fn(),
  assignToAthlete:     jest.fn(),
  unassignFromAthlete: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── getAllCardiosUseCase ───────────────────────────────────────────────────────

describe('getAllCardiosUseCase', () => {
  it('returns catalog from repository', async () => {
    mockRepo.getAll.mockResolvedValue([BASE_CARDIO, COACH_CARDIO]);
    const result = await getAllCardiosUseCase(COACH_ID, mockRepo);
    expect(result).toHaveLength(2);
    expect(mockRepo.getAll).toHaveBeenCalledWith(COACH_ID);
  });

  it('throws when coachId is empty', async () => {
    await expect(getAllCardiosUseCase('', mockRepo)).rejects.toThrow('coachId is required');
    expect(mockRepo.getAll).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.getAll.mockRejectedValue(new Error('DB error'));
    await expect(getAllCardiosUseCase(COACH_ID, mockRepo)).rejects.toThrow('DB error');
  });
});

// ── createCardioUseCase ───────────────────────────────────────────────────────

describe('createCardioUseCase', () => {
  it('creates cardio with valid input', async () => {
    mockRepo.create.mockResolvedValue(COACH_CARDIO);
    const result = await createCardioUseCase(VALID_INPUT, mockRepo);
    expect(result.id).toBe(CARDIO_ID);
    expect(mockRepo.create).toHaveBeenCalledWith(VALID_INPUT);
  });

  it('throws when name is empty', async () => {
    await expect(createCardioUseCase({ ...VALID_INPUT, name: '' }, mockRepo)).rejects.toThrow();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('throws when durationMax < durationMin', async () => {
    await expect(createCardioUseCase(
      { ...VALID_INPUT, durationMinMinutes: 30, durationMaxMinutes: 20 },
      mockRepo,
    )).rejects.toThrow();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('accepts durationMax === durationMin', async () => {
    mockRepo.create.mockResolvedValue(COACH_CARDIO);
    await createCardioUseCase({ ...VALID_INPUT, durationMinMinutes: 20, durationMaxMinutes: 20 }, mockRepo);
    expect(mockRepo.create).toHaveBeenCalled();
  });

  it('throws when coachId is not a UUID', async () => {
    await expect(createCardioUseCase({ ...VALID_INPUT, coachId: 'bad' }, mockRepo)).rejects.toThrow();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.create.mockRejectedValue(new Error('Insert failed'));
    await expect(createCardioUseCase(VALID_INPUT, mockRepo)).rejects.toThrow('Insert failed');
  });
});

// ── deleteCardioUseCase ───────────────────────────────────────────────────────

describe('deleteCardioUseCase', () => {
  it('calls repository.delete with valid UUID', async () => {
    mockRepo.delete.mockResolvedValue();
    await deleteCardioUseCase(CARDIO_ID, mockRepo);
    expect(mockRepo.delete).toHaveBeenCalledWith(CARDIO_ID);
  });

  it('throws when id is not a valid UUID', async () => {
    await expect(deleteCardioUseCase('not-a-uuid', mockRepo)).rejects.toThrow('Invalid cardio ID');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.delete.mockRejectedValue(new Error('Delete failed'));
    await expect(deleteCardioUseCase(CARDIO_ID, mockRepo)).rejects.toThrow('Delete failed');
  });
});

// ── assignCardioToAthleteUseCase ──────────────────────────────────────────────

describe('assignCardioToAthleteUseCase', () => {
  it('calls assignToAthlete with valid UUIDs', async () => {
    mockRepo.assignToAthlete.mockResolvedValue();
    await assignCardioToAthleteUseCase(CARDIO_ID, ATHLETE_ID, mockRepo);
    expect(mockRepo.assignToAthlete).toHaveBeenCalledWith(CARDIO_ID, ATHLETE_ID);
  });

  it('throws when cardioId is invalid', async () => {
    await expect(assignCardioToAthleteUseCase('bad', ATHLETE_ID, mockRepo)).rejects.toThrow('Invalid cardio ID');
    expect(mockRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('throws when athleteId is invalid', async () => {
    await expect(assignCardioToAthleteUseCase(CARDIO_ID, 'bad', mockRepo)).rejects.toThrow('Invalid athlete ID');
    expect(mockRepo.assignToAthlete).not.toHaveBeenCalled();
  });
});

// ── assignMultipleCardiosUseCase ──────────────────────────────────────────────

describe('assignMultipleCardiosUseCase', () => {
  it('calls assignToAthlete once per cardioId', async () => {
    mockRepo.assignToAthlete.mockResolvedValue();
    const ids = [CARDIO_ID, 'c0000001-0000-4000-b000-000000000001'];
    await assignMultipleCardiosUseCase(ids, ATHLETE_ID, mockRepo);
    expect(mockRepo.assignToAthlete).toHaveBeenCalledTimes(2);
  });

  it('throws when cardioIds is empty', async () => {
    await expect(assignMultipleCardiosUseCase([], ATHLETE_ID, mockRepo))
      .rejects.toThrow('cardioIds must not be empty');
    expect(mockRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('throws when athleteId is invalid', async () => {
    await expect(assignMultipleCardiosUseCase([CARDIO_ID], 'bad', mockRepo))
      .rejects.toThrow('Invalid athlete ID');
    expect(mockRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('throws when any cardioId is invalid', async () => {
    await expect(assignMultipleCardiosUseCase([CARDIO_ID, 'not-uuid'], ATHLETE_ID, mockRepo))
      .rejects.toThrow('Invalid cardio ID');
    expect(mockRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.assignToAthlete.mockRejectedValue(new Error('DB error'));
    await expect(assignMultipleCardiosUseCase([CARDIO_ID], ATHLETE_ID, mockRepo))
      .rejects.toThrow('DB error');
  });
});

// ── filterCardios ─────────────────────────────────────────────────────────────

const CATALOG: CatalogCardio[] = [
  { ...BASE_CARDIO, id: '1', name: 'Carrera suave',    type: 'running',   intensity: 'low',    description: 'Trote ligero' },
  { ...BASE_CARDIO, id: '2', name: 'Ciclismo indoor',  type: 'cycling',   intensity: 'medium', description: undefined },
  { ...BASE_CARDIO, id: '3', name: 'Sprint',           type: 'running',   intensity: 'high',   description: 'Alta velocidad' },
  { ...BASE_CARDIO, id: '4', name: 'Natación',         type: 'swimming',  intensity: 'medium', description: undefined },
];

describe('filterCardios — empty filters', () => {
  it('returns all items when all filters are empty', () => {
    expect(filterCardios(CATALOG, '', [], [])).toHaveLength(4);
  });

  it('returns all items when query is only whitespace', () => {
    expect(filterCardios(CATALOG, '   ', [], [])).toHaveLength(4);
  });

  it('returns empty array when input is empty', () => {
    expect(filterCardios([], 'running', [], [])).toHaveLength(0);
  });
});

describe('filterCardios — text search', () => {
  it('filters by partial name (case-insensitive)', () => {
    expect(filterCardios(CATALOG, 'carrera', [], [])).toHaveLength(1);
    expect(filterCardios(CATALOG, 'CARRERA', [], [])).toHaveLength(1);
  });

  it('filters by description text', () => {
    const result = filterCardios(CATALOG, 'velocidad', [], []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('returns empty when query matches nothing', () => {
    expect(filterCardios(CATALOG, 'xyzzy', [], [])).toHaveLength(0);
  });
});

describe('filterCardios — type chips', () => {
  it('filters by single type', () => {
    const result = filterCardios(CATALOG, '', ['running'], []);
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.type === 'running')).toBe(true);
  });

  it('filters by multiple types', () => {
    const result = filterCardios(CATALOG, '', ['cycling', 'swimming'], []);
    expect(result).toHaveLength(2);
  });
});

describe('filterCardios — intensity chips', () => {
  it('filters by single intensity', () => {
    const result = filterCardios(CATALOG, '', [], ['high']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('filters by multiple intensities', () => {
    const result = filterCardios(CATALOG, '', [], ['low', 'high']);
    expect(result).toHaveLength(2);
  });
});

describe('filterCardios — combined filters', () => {
  it('combines text + type', () => {
    const result = filterCardios(CATALOG, 'sprint', ['running'], []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('combines type + intensity', () => {
    const result = filterCardios(CATALOG, '', ['running'], ['low']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });
});
