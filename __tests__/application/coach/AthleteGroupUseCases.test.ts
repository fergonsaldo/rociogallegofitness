/**
 * AthleteGroupUseCases tests — RF-E2-04a / RF-E2-04b
 */

import {
  getGroupsUseCase,
  createGroupUseCase,
  updateGroupUseCase,
  deleteGroupUseCase,
  getGroupMembersUseCase,
  addMemberToGroupUseCase,
  removeMemberFromGroupUseCase,
  assignContentToGroupUseCase,
} from '../../../src/application/coach/AthleteGroupUseCases';
import { IAthleteGroupRepository } from '../../../src/domain/repositories/IAthleteGroupRepository';
import { IRoutineRepository } from '../../../src/domain/repositories/IRoutineRepository';
import { ICardioRepository } from '../../../src/domain/repositories/ICardioRepository';
import { INutritionRepository } from '../../../src/domain/repositories/INutritionRepository';
import { AthleteGroup } from '../../../src/domain/entities/AthleteGroup';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID   = '00000000-0000-4000-b000-000000000001';
const GROUP_ID   = '00000000-0000-4000-b000-000000000002';
const ATHLETE_ID = '00000000-0000-4000-b000-000000000003';

const GROUP: AthleteGroup = {
  id: GROUP_ID, coachId: COACH_ID, name: 'Principiantes',
  description: null, memberCount: 2, createdAt: new Date(),
};

// ── Mock repos ────────────────────────────────────────────────────────────────

const mockRepo: jest.Mocked<IAthleteGroupRepository> = {
  getByCoachId:  jest.fn(),
  create:        jest.fn(),
  update:        jest.fn(),
  delete:        jest.fn(),
  getMembers:    jest.fn(),
  addMember:     jest.fn(),
  removeMember:  jest.fn(),
};

const ROUTINE_ID   = '00000000-0000-4000-b000-000000000010';
const CARDIO_ID    = '00000000-0000-4000-b000-000000000011';
const NUTRITION_ID = '00000000-0000-4000-b000-000000000012';

const mockRoutineRepo = {
  assignToAthlete: jest.fn(),
} as unknown as jest.Mocked<IRoutineRepository>;

const mockCardioRepo = {
  assignToAthlete: jest.fn(),
} as unknown as jest.Mocked<ICardioRepository>;

const mockNutritionRepo = {
  assignToAthlete: jest.fn(),
} as unknown as jest.Mocked<INutritionRepository>;

beforeEach(() => jest.clearAllMocks());

// ── getGroupsUseCase ──────────────────────────────────────────────────────────

describe('getGroupsUseCase', () => {
  it('returns groups for valid coachId', async () => {
    mockRepo.getByCoachId.mockResolvedValue([GROUP]);
    const result = await getGroupsUseCase(COACH_ID, mockRepo);
    expect(result).toEqual([GROUP]);
    expect(mockRepo.getByCoachId).toHaveBeenCalledWith(COACH_ID);
  });

  it('throws when coachId is empty', async () => {
    await expect(getGroupsUseCase('', mockRepo)).rejects.toThrow('coachId is required');
  });

  it('propagates repo errors', async () => {
    mockRepo.getByCoachId.mockRejectedValue(new Error('DB error'));
    await expect(getGroupsUseCase(COACH_ID, mockRepo)).rejects.toThrow('DB error');
  });
});

// ── createGroupUseCase ────────────────────────────────────────────────────────

describe('createGroupUseCase', () => {
  it('creates a group with trimmed name', async () => {
    mockRepo.create.mockResolvedValue(GROUP);
    await createGroupUseCase({ coachId: COACH_ID, name: '  Principiantes  ' }, mockRepo);
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Principiantes' }),
    );
  });

  it('creates with description', async () => {
    mockRepo.create.mockResolvedValue(GROUP);
    await createGroupUseCase({ coachId: COACH_ID, name: 'VIP', description: 'Clientes premium' }, mockRepo);
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Clientes premium' }),
    );
  });

  it('throws when name is empty', async () => {
    await expect(
      createGroupUseCase({ coachId: COACH_ID, name: '' }, mockRepo),
    ).rejects.toThrow();
  });

  it('throws when coachId is invalid UUID', async () => {
    await expect(
      createGroupUseCase({ coachId: 'bad', name: 'Test' }, mockRepo),
    ).rejects.toThrow();
  });

  it('throws when name exceeds 100 characters', async () => {
    await expect(
      createGroupUseCase({ coachId: COACH_ID, name: 'x'.repeat(101) }, mockRepo),
    ).rejects.toThrow();
  });
});

// ── updateGroupUseCase ────────────────────────────────────────────────────────

describe('updateGroupUseCase', () => {
  it('updates with trimmed name', async () => {
    mockRepo.update.mockResolvedValue(GROUP);
    await updateGroupUseCase(GROUP_ID, { name: '  Nuevo  ' }, mockRepo);
    expect(mockRepo.update).toHaveBeenCalledWith(GROUP_ID, expect.objectContaining({ name: 'Nuevo' }));
  });

  it('updates description to null', async () => {
    mockRepo.update.mockResolvedValue(GROUP);
    await updateGroupUseCase(GROUP_ID, { description: null }, mockRepo);
    expect(mockRepo.update).toHaveBeenCalledWith(GROUP_ID, { description: null });
  });

  it('accepts empty input (no-op patch)', async () => {
    mockRepo.update.mockResolvedValue(GROUP);
    await expect(updateGroupUseCase(GROUP_ID, {}, mockRepo)).resolves.not.toThrow();
  });

  it('throws when id is empty', async () => {
    await expect(updateGroupUseCase('', { name: 'X' }, mockRepo)).rejects.toThrow('id is required');
  });

  it('throws when name is empty string', async () => {
    await expect(updateGroupUseCase(GROUP_ID, { name: '' }, mockRepo)).rejects.toThrow();
  });
});

// ── deleteGroupUseCase ────────────────────────────────────────────────────────

describe('deleteGroupUseCase', () => {
  it('calls repo.delete with id', async () => {
    mockRepo.delete.mockResolvedValue(undefined);
    await deleteGroupUseCase(GROUP_ID, mockRepo);
    expect(mockRepo.delete).toHaveBeenCalledWith(GROUP_ID);
  });

  it('throws when id is empty', async () => {
    await expect(deleteGroupUseCase('', mockRepo)).rejects.toThrow('id is required');
  });
});

// ── getGroupMembersUseCase ────────────────────────────────────────────────────

describe('getGroupMembersUseCase', () => {
  it('returns member athleteIds', async () => {
    mockRepo.getMembers.mockResolvedValue([ATHLETE_ID]);
    const result = await getGroupMembersUseCase(GROUP_ID, mockRepo);
    expect(result).toEqual([ATHLETE_ID]);
  });

  it('returns empty array when group has no members', async () => {
    mockRepo.getMembers.mockResolvedValue([]);
    const result = await getGroupMembersUseCase(GROUP_ID, mockRepo);
    expect(result).toEqual([]);
  });

  it('throws when groupId is empty', async () => {
    await expect(getGroupMembersUseCase('', mockRepo)).rejects.toThrow('groupId is required');
  });
});

// ── addMemberToGroupUseCase ───────────────────────────────────────────────────

describe('addMemberToGroupUseCase', () => {
  it('calls repo.addMember', async () => {
    mockRepo.addMember.mockResolvedValue(undefined);
    await addMemberToGroupUseCase(GROUP_ID, ATHLETE_ID, mockRepo);
    expect(mockRepo.addMember).toHaveBeenCalledWith(GROUP_ID, ATHLETE_ID);
  });

  it('throws when groupId is empty', async () => {
    await expect(addMemberToGroupUseCase('', ATHLETE_ID, mockRepo)).rejects.toThrow('groupId is required');
  });

  it('throws when athleteId is empty', async () => {
    await expect(addMemberToGroupUseCase(GROUP_ID, '', mockRepo)).rejects.toThrow('athleteId is required');
  });
});

// ── removeMemberFromGroupUseCase ──────────────────────────────────────────────

describe('removeMemberFromGroupUseCase', () => {
  it('calls repo.removeMember', async () => {
    mockRepo.removeMember.mockResolvedValue(undefined);
    await removeMemberFromGroupUseCase(GROUP_ID, ATHLETE_ID, mockRepo);
    expect(mockRepo.removeMember).toHaveBeenCalledWith(GROUP_ID, ATHLETE_ID);
  });

  it('throws when groupId is empty', async () => {
    await expect(removeMemberFromGroupUseCase('', ATHLETE_ID, mockRepo)).rejects.toThrow('groupId is required');
  });

  it('throws when athleteId is empty', async () => {
    await expect(removeMemberFromGroupUseCase(GROUP_ID, '', mockRepo)).rejects.toThrow('athleteId is required');
  });
});

// ── assignContentToGroupUseCase ───────────────────────────────────────────────

describe('assignContentToGroupUseCase', () => {
  beforeEach(() => {
    (mockRoutineRepo.assignToAthlete as jest.Mock).mockResolvedValue(undefined);
    (mockCardioRepo.assignToAthlete as jest.Mock).mockResolvedValue(undefined);
    (mockNutritionRepo.assignToAthlete as jest.Mock).mockResolvedValue(undefined);
  });

  it('assigns all three content types to every member', async () => {
    mockRepo.getMembers.mockResolvedValue([ATHLETE_ID]);
    await assignContentToGroupUseCase(
      GROUP_ID,
      { routineId: ROUTINE_ID, cardioId: CARDIO_ID, nutritionPlanId: NUTRITION_ID },
      mockRepo, mockRoutineRepo, mockCardioRepo, mockNutritionRepo,
    );
    expect(mockRoutineRepo.assignToAthlete).toHaveBeenCalledWith(ROUTINE_ID, ATHLETE_ID);
    expect(mockCardioRepo.assignToAthlete).toHaveBeenCalledWith(CARDIO_ID, ATHLETE_ID);
    expect(mockNutritionRepo.assignToAthlete).toHaveBeenCalledWith(NUTRITION_ID, ATHLETE_ID);
  });

  it('assigns only routine when only routineId provided', async () => {
    mockRepo.getMembers.mockResolvedValue([ATHLETE_ID]);
    await assignContentToGroupUseCase(
      GROUP_ID,
      { routineId: ROUTINE_ID },
      mockRepo, mockRoutineRepo, mockCardioRepo, mockNutritionRepo,
    );
    expect(mockRoutineRepo.assignToAthlete).toHaveBeenCalledTimes(1);
    expect(mockCardioRepo.assignToAthlete).not.toHaveBeenCalled();
    expect(mockNutritionRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('assigns to multiple members', async () => {
    const ATHLETE_B = '00000000-0000-4000-b000-000000000020';
    mockRepo.getMembers.mockResolvedValue([ATHLETE_ID, ATHLETE_B]);
    await assignContentToGroupUseCase(
      GROUP_ID,
      { routineId: ROUTINE_ID },
      mockRepo, mockRoutineRepo, mockCardioRepo, mockNutritionRepo,
    );
    expect(mockRoutineRepo.assignToAthlete).toHaveBeenCalledTimes(2);
    expect(mockRoutineRepo.assignToAthlete).toHaveBeenCalledWith(ROUTINE_ID, ATHLETE_ID);
    expect(mockRoutineRepo.assignToAthlete).toHaveBeenCalledWith(ROUTINE_ID, ATHLETE_B);
  });

  it('resolves immediately when group has no members', async () => {
    mockRepo.getMembers.mockResolvedValue([]);
    await expect(
      assignContentToGroupUseCase(
        GROUP_ID,
        { routineId: ROUTINE_ID },
        mockRepo, mockRoutineRepo, mockCardioRepo, mockNutritionRepo,
      ),
    ).resolves.toBeUndefined();
    expect(mockRoutineRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('throws when groupId is empty', async () => {
    await expect(
      assignContentToGroupUseCase('', { routineId: ROUTINE_ID }, mockRepo, mockRoutineRepo, mockCardioRepo, mockNutritionRepo),
    ).rejects.toThrow('groupId is required');
  });

  it('throws when no content is selected', async () => {
    mockRepo.getMembers.mockResolvedValue([ATHLETE_ID]);
    await expect(
      assignContentToGroupUseCase(GROUP_ID, {}, mockRepo, mockRoutineRepo, mockCardioRepo, mockNutritionRepo),
    ).rejects.toThrow('Al menos un contenido debe estar seleccionado');
  });

  it('throws when all content ids are null', async () => {
    mockRepo.getMembers.mockResolvedValue([ATHLETE_ID]);
    await expect(
      assignContentToGroupUseCase(
        GROUP_ID,
        { routineId: null, cardioId: null, nutritionPlanId: null },
        mockRepo, mockRoutineRepo, mockCardioRepo, mockNutritionRepo,
      ),
    ).rejects.toThrow('Al menos un contenido debe estar seleccionado');
  });

  it('throws when any assignment fails', async () => {
    mockRepo.getMembers.mockResolvedValue([ATHLETE_ID]);
    (mockRoutineRepo.assignToAthlete as jest.Mock).mockRejectedValue(new Error('assign error'));
    await expect(
      assignContentToGroupUseCase(
        GROUP_ID,
        { routineId: ROUTINE_ID },
        mockRepo, mockRoutineRepo, mockCardioRepo, mockNutritionRepo,
      ),
    ).rejects.toThrow('Alguna asignación de contenido ha fallado');
  });

  it('runs all assignments even if one fails (Promise.allSettled)', async () => {
    const ATHLETE_B = '00000000-0000-4000-b000-000000000020';
    mockRepo.getMembers.mockResolvedValue([ATHLETE_ID, ATHLETE_B]);
    (mockRoutineRepo.assignToAthlete as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('partial fail'));

    await expect(
      assignContentToGroupUseCase(
        GROUP_ID,
        { routineId: ROUTINE_ID },
        mockRepo, mockRoutineRepo, mockCardioRepo, mockNutritionRepo,
      ),
    ).rejects.toThrow('Alguna asignación de contenido ha fallado');

    expect(mockRoutineRepo.assignToAthlete).toHaveBeenCalledTimes(2);
  });
});
