import { createRoutineUseCase } from '../../../src/application/coach/CreateRoutineUseCase';
import { getCoachRoutinesUseCase, getAthleteRoutinesUseCase, getRoutineByIdUseCase } from '../../../src/application/coach/GetRoutinesUseCase';
import { assignRoutineUseCase, unassignRoutineUseCase, assignMultipleRoutinesUseCase } from '../../../src/application/coach/AssignRoutineUseCase';
import { deleteRoutineUseCase } from '../../../src/application/coach/DeleteRoutineUseCase';
import { IRoutineRepository } from '../../../src/domain/repositories/IRoutineRepository';
import { Routine } from '../../../src/domain/entities/Routine';

// ── Mock repository ───────────────────────────────────────────────────────────
const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const COACH_UUID = '223e4567-e89b-12d3-a456-426614174001';
const ATHLETE_UUID = '323e4567-e89b-12d3-a456-426614174002';
const NOW = new Date();

const MOCK_ROUTINE: Routine = {
  id: VALID_UUID,
  coachId: COACH_UUID,
  name: 'Strength Program A',
  durationWeeks: 8,
  days: [{
    id: VALID_UUID,
    routineId: VALID_UUID,
    dayNumber: 1,
    name: 'Push Day',
    exercises: [{
      id: VALID_UUID,
      routineDayId: VALID_UUID,
      exerciseId: '11111111-0001-0000-0000-000000000001',
      order: 1,
      targetSets: 3,
      targetReps: 10,
      restBetweenSetsSeconds: 90,
    }],
  }],
  createdAt: NOW,
  updatedAt: NOW,
};

const mockRepo: jest.Mocked<IRoutineRepository> = {
  getByCoachId: jest.fn(),
  getByAthleteId: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  hasAssignments: jest.fn(),
  assignToAthlete: jest.fn(),
  unassignFromAthlete: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── createRoutineUseCase ──────────────────────────────────────────────────────
describe('createRoutineUseCase', () => {
  const VALID_INPUT = {
    coachId: COACH_UUID,
    name: 'Strength Program A',
    durationWeeks: 8,
    days: MOCK_ROUTINE.days,
  };

  it('calls repository.create with valid input and returns the routine', async () => {
    mockRepo.create.mockResolvedValue(MOCK_ROUTINE);
    const result = await createRoutineUseCase(VALID_INPUT, mockRepo);
    expect(mockRepo.create).toHaveBeenCalledWith(VALID_INPUT);
    expect(result.name).toBe('Strength Program A');
  });

  it('throws a validation error when name is empty', async () => {
    await expect(
      createRoutineUseCase({ ...VALID_INPUT, name: '' }, mockRepo)
    ).rejects.toThrow();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('throws a validation error when days array is empty', async () => {
    await expect(
      createRoutineUseCase({ ...VALID_INPUT, days: [] }, mockRepo)
    ).rejects.toThrow();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('throws a validation error when durationWeeks exceeds 52', async () => {
    await expect(
      createRoutineUseCase({ ...VALID_INPUT, durationWeeks: 53 }, mockRepo)
    ).rejects.toThrow();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });
});

// ── getCoachRoutinesUseCase ───────────────────────────────────────────────────
describe('getCoachRoutinesUseCase', () => {
  it('returns routines for a valid coachId', async () => {
    mockRepo.getByCoachId.mockResolvedValue([MOCK_ROUTINE]);
    const result = await getCoachRoutinesUseCase(COACH_UUID, mockRepo);
    expect(mockRepo.getByCoachId).toHaveBeenCalledWith(COACH_UUID);
    expect(result).toHaveLength(1);
  });

  it('throws when coachId is empty', async () => {
    await expect(getCoachRoutinesUseCase('', mockRepo)).rejects.toThrow('coachId is required');
    expect(mockRepo.getByCoachId).not.toHaveBeenCalled();
  });
});

// ── getAthleteRoutinesUseCase ─────────────────────────────────────────────────
describe('getAthleteRoutinesUseCase', () => {
  it('returns routines for a valid athleteId', async () => {
    mockRepo.getByAthleteId.mockResolvedValue([MOCK_ROUTINE]);
    const result = await getAthleteRoutinesUseCase(ATHLETE_UUID, mockRepo);
    expect(mockRepo.getByAthleteId).toHaveBeenCalledWith(ATHLETE_UUID);
    expect(result).toHaveLength(1);
  });

  it('throws when athleteId is empty', async () => {
    await expect(getAthleteRoutinesUseCase('', mockRepo)).rejects.toThrow('athleteId is required');
  });
});

// ── getRoutineByIdUseCase ─────────────────────────────────────────────────────
describe('getRoutineByIdUseCase', () => {
  it('returns the routine when found', async () => {
    mockRepo.getById.mockResolvedValue(MOCK_ROUTINE);
    const result = await getRoutineByIdUseCase(VALID_UUID, mockRepo);
    expect(result?.id).toBe(VALID_UUID);
  });

  it('returns null when not found', async () => {
    mockRepo.getById.mockResolvedValue(null);
    const result = await getRoutineByIdUseCase(VALID_UUID, mockRepo);
    expect(result).toBeNull();
  });

  it('throws when routineId is empty', async () => {
    await expect(getRoutineByIdUseCase('', mockRepo)).rejects.toThrow('routineId is required');
  });
});

// ── assignRoutineUseCase ──────────────────────────────────────────────────────
describe('assignRoutineUseCase', () => {
  it('calls repository.assignToAthlete with valid UUIDs', async () => {
    mockRepo.assignToAthlete.mockResolvedValue();
    await assignRoutineUseCase({ routineId: VALID_UUID, athleteId: ATHLETE_UUID }, mockRepo);
    expect(mockRepo.assignToAthlete).toHaveBeenCalledWith(VALID_UUID, ATHLETE_UUID);
  });

  it('throws a validation error when routineId is not a UUID', async () => {
    await expect(
      assignRoutineUseCase({ routineId: 'not-a-uuid', athleteId: ATHLETE_UUID }, mockRepo)
    ).rejects.toThrow('Invalid routine ID');
    expect(mockRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('throws a validation error when athleteId is not a UUID', async () => {
    await expect(
      assignRoutineUseCase({ routineId: VALID_UUID, athleteId: 'not-a-uuid' }, mockRepo)
    ).rejects.toThrow('Invalid athlete ID');
    expect(mockRepo.assignToAthlete).not.toHaveBeenCalled();
  });
});

// ── unassignRoutineUseCase ────────────────────────────────────────────────────
describe('unassignRoutineUseCase', () => {
  it('calls repository.unassignFromAthlete with valid UUIDs', async () => {
    mockRepo.unassignFromAthlete.mockResolvedValue();
    await unassignRoutineUseCase({ routineId: VALID_UUID, athleteId: ATHLETE_UUID }, mockRepo);
    expect(mockRepo.unassignFromAthlete).toHaveBeenCalledWith(VALID_UUID, ATHLETE_UUID);
  });

  it('throws a validation error when routineId is not a UUID', async () => {
    await expect(
      unassignRoutineUseCase({ routineId: 'not-a-uuid', athleteId: ATHLETE_UUID }, mockRepo)
    ).rejects.toThrow('Invalid routine ID');
    expect(mockRepo.unassignFromAthlete).not.toHaveBeenCalled();
  });

  it('throws a validation error when athleteId is not a UUID', async () => {
    await expect(
      unassignRoutineUseCase({ routineId: VALID_UUID, athleteId: 'bad-id' }, mockRepo)
    ).rejects.toThrow('Invalid athlete ID');
    expect(mockRepo.unassignFromAthlete).not.toHaveBeenCalled();
  });
});

// ── assignMultipleRoutinesUseCase ─────────────────────────────────────────────

describe('assignMultipleRoutinesUseCase', () => {
  it('calls repo.assignToAthlete once per routineId', async () => {
    mockRepo.assignToAthlete.mockResolvedValue();
    const ids = [VALID_UUID, COACH_UUID];
    await assignMultipleRoutinesUseCase(ids, ATHLETE_UUID, mockRepo);
    expect(mockRepo.assignToAthlete).toHaveBeenCalledTimes(2);
    expect(mockRepo.assignToAthlete).toHaveBeenCalledWith(VALID_UUID, ATHLETE_UUID);
    expect(mockRepo.assignToAthlete).toHaveBeenCalledWith(COACH_UUID, ATHLETE_UUID);
  });

  it('throws when routineIds is empty', async () => {
    await expect(assignMultipleRoutinesUseCase([], ATHLETE_UUID, mockRepo))
      .rejects.toThrow('routineIds must not be empty');
    expect(mockRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('throws when athleteId is not a valid UUID', async () => {
    await expect(assignMultipleRoutinesUseCase([VALID_UUID], 'bad-id', mockRepo))
      .rejects.toThrow('Invalid athlete ID');
    expect(mockRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('throws when any routineId is not a valid UUID', async () => {
    await expect(assignMultipleRoutinesUseCase([VALID_UUID, 'not-uuid'], ATHLETE_UUID, mockRepo))
      .rejects.toThrow('Invalid routine ID');
    expect(mockRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.assignToAthlete.mockRejectedValue(new Error('DB error'));
    await expect(assignMultipleRoutinesUseCase([VALID_UUID], ATHLETE_UUID, mockRepo))
      .rejects.toThrow('DB error');
  });
});

// ── deleteRoutineUseCase ──────────────────────────────────────────────────────
describe('deleteRoutineUseCase', () => {
  it('deletes the routine when it has no assignments', async () => {
    mockRepo.hasAssignments.mockResolvedValue(false);
    mockRepo.delete.mockResolvedValue();

    await deleteRoutineUseCase(VALID_UUID, mockRepo);

    expect(mockRepo.hasAssignments).toHaveBeenCalledWith(VALID_UUID);
    expect(mockRepo.delete).toHaveBeenCalledWith(VALID_UUID);
  });

  it('throws and does not delete when the routine is assigned to clients', async () => {
    mockRepo.hasAssignments.mockResolvedValue(true);

    await expect(deleteRoutineUseCase(VALID_UUID, mockRepo)).rejects.toThrow(
      'No se puede eliminar esta rutina porque está asignada a uno o más clientes'
    );
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('propagates repository errors from hasAssignments', async () => {
    mockRepo.hasAssignments.mockRejectedValue(new Error('DB error'));

    await expect(deleteRoutineUseCase(VALID_UUID, mockRepo)).rejects.toThrow('DB error');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('propagates repository errors from delete', async () => {
    mockRepo.hasAssignments.mockResolvedValue(false);
    mockRepo.delete.mockRejectedValue(new Error('Delete failed'));

    await expect(deleteRoutineUseCase(VALID_UUID, mockRepo)).rejects.toThrow('Delete failed');
  });
});
