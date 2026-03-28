/**
 * TagAutomationUseCases tests — RF-E2-06a
 */

import {
  getTagAutomationUseCase,
  saveTagAutomationUseCase,
  deleteTagAutomationUseCase,
  executeTagAutomationUseCase,
} from '../../../src/application/coach/TagAutomationUseCases';
import { ITagAutomationRepository } from '../../../src/domain/repositories/ITagAutomationRepository';
import { IRoutineRepository } from '../../../src/domain/repositories/IRoutineRepository';
import { ICardioRepository } from '../../../src/domain/repositories/ICardioRepository';
import { INutritionRepository } from '../../../src/domain/repositories/INutritionRepository';
import { TagAutomation } from '../../../src/domain/entities/TagAutomation';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TAG_ID      = '00000000-0000-4000-b000-000000000001';
const ATHLETE_ID  = '00000000-0000-4000-b000-000000000002';
const ROUTINE_ID  = '00000000-0000-4000-b000-000000000003';
const CARDIO_ID   = '00000000-0000-4000-b000-000000000004';
const NUTRITION_ID = '00000000-0000-4000-b000-000000000005';

const AUTOMATION: TagAutomation = {
  id:              '00000000-0000-4000-b000-000000000010',
  tagId:           TAG_ID,
  routineId:       ROUTINE_ID,
  cardioId:        CARDIO_ID,
  nutritionPlanId: NUTRITION_ID,
  createdAt:       new Date(),
};

// ── Mock repos ────────────────────────────────────────────────────────────────

const mockAutoRepo: jest.Mocked<ITagAutomationRepository> = {
  getByTagId: jest.fn(),
  save:       jest.fn(),
  delete:     jest.fn(),
};

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

// ── getTagAutomationUseCase ───────────────────────────────────────────────────

describe('getTagAutomationUseCase', () => {
  it('returns automation when found', async () => {
    mockAutoRepo.getByTagId.mockResolvedValue(AUTOMATION);
    const result = await getTagAutomationUseCase(TAG_ID, mockAutoRepo);
    expect(result).toEqual(AUTOMATION);
    expect(mockAutoRepo.getByTagId).toHaveBeenCalledWith(TAG_ID);
  });

  it('returns null when no automation configured', async () => {
    mockAutoRepo.getByTagId.mockResolvedValue(null);
    const result = await getTagAutomationUseCase(TAG_ID, mockAutoRepo);
    expect(result).toBeNull();
  });

  it('throws when tagId is empty', async () => {
    await expect(getTagAutomationUseCase('', mockAutoRepo)).rejects.toThrow('tagId is required');
  });

  it('propagates repo errors', async () => {
    mockAutoRepo.getByTagId.mockRejectedValue(new Error('DB error'));
    await expect(getTagAutomationUseCase(TAG_ID, mockAutoRepo)).rejects.toThrow('DB error');
  });
});

// ── saveTagAutomationUseCase ──────────────────────────────────────────────────

describe('saveTagAutomationUseCase', () => {
  it('saves and returns automation', async () => {
    mockAutoRepo.save.mockResolvedValue(AUTOMATION);
    const result = await saveTagAutomationUseCase(TAG_ID, { routineId: ROUTINE_ID }, mockAutoRepo);
    expect(result).toEqual(AUTOMATION);
    expect(mockAutoRepo.save).toHaveBeenCalledWith(TAG_ID, { routineId: ROUTINE_ID });
  });

  it('saves with all fields', async () => {
    mockAutoRepo.save.mockResolvedValue(AUTOMATION);
    await saveTagAutomationUseCase(TAG_ID, {
      routineId: ROUTINE_ID, cardioId: CARDIO_ID, nutritionPlanId: NUTRITION_ID,
    }, mockAutoRepo);
    expect(mockAutoRepo.save).toHaveBeenCalledTimes(1);
  });

  it('saves with empty input (clears config)', async () => {
    mockAutoRepo.save.mockResolvedValue({ ...AUTOMATION, routineId: null, cardioId: null, nutritionPlanId: null });
    const result = await saveTagAutomationUseCase(TAG_ID, {}, mockAutoRepo);
    expect(result.routineId).toBeNull();
  });

  it('throws when tagId is empty', async () => {
    await expect(saveTagAutomationUseCase('', {}, mockAutoRepo)).rejects.toThrow('tagId is required');
  });

  it('throws when routineId is an invalid UUID', async () => {
    await expect(
      saveTagAutomationUseCase(TAG_ID, { routineId: 'not-a-uuid' }, mockAutoRepo),
    ).rejects.toThrow();
  });

  it('propagates repo errors', async () => {
    mockAutoRepo.save.mockRejectedValue(new Error('Network error'));
    await expect(saveTagAutomationUseCase(TAG_ID, {}, mockAutoRepo)).rejects.toThrow('Network error');
  });
});

// ── deleteTagAutomationUseCase ────────────────────────────────────────────────

describe('deleteTagAutomationUseCase', () => {
  it('calls repo.delete with tagId', async () => {
    mockAutoRepo.delete.mockResolvedValue(undefined);
    await deleteTagAutomationUseCase(TAG_ID, mockAutoRepo);
    expect(mockAutoRepo.delete).toHaveBeenCalledWith(TAG_ID);
  });

  it('throws when tagId is empty', async () => {
    await expect(deleteTagAutomationUseCase('', mockAutoRepo)).rejects.toThrow('tagId is required');
  });

  it('propagates repo errors', async () => {
    mockAutoRepo.delete.mockRejectedValue(new Error('Delete failed'));
    await expect(deleteTagAutomationUseCase(TAG_ID, mockAutoRepo)).rejects.toThrow('Delete failed');
  });
});

// ── executeTagAutomationUseCase ───────────────────────────────────────────────

describe('executeTagAutomationUseCase', () => {
  const exec = (overrides: Partial<TagAutomation> = {}) => {
    mockAutoRepo.getByTagId.mockResolvedValue({ ...AUTOMATION, ...overrides });
    mockRoutineRepo.assignToAthlete.mockResolvedValue(undefined);
    mockCardioRepo.assignToAthlete.mockResolvedValue(undefined);
    mockNutritionRepo.assignToAthlete.mockResolvedValue(undefined);
    return executeTagAutomationUseCase(
      TAG_ID, ATHLETE_ID, mockAutoRepo, mockRoutineRepo, mockCardioRepo, mockNutritionRepo,
    );
  };

  it('assigns routine, cardio and nutrition plan when all configured', async () => {
    await exec();
    expect(mockRoutineRepo.assignToAthlete).toHaveBeenCalledWith(ROUTINE_ID, ATHLETE_ID);
    expect(mockCardioRepo.assignToAthlete).toHaveBeenCalledWith(CARDIO_ID, ATHLETE_ID);
    expect(mockNutritionRepo.assignToAthlete).toHaveBeenCalledWith(NUTRITION_ID, ATHLETE_ID);
  });

  it('only assigns routine when only routineId is set', async () => {
    await exec({ cardioId: null, nutritionPlanId: null });
    expect(mockRoutineRepo.assignToAthlete).toHaveBeenCalledTimes(1);
    expect(mockCardioRepo.assignToAthlete).not.toHaveBeenCalled();
    expect(mockNutritionRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('only assigns cardio when only cardioId is set', async () => {
    await exec({ routineId: null, nutritionPlanId: null });
    expect(mockCardioRepo.assignToAthlete).toHaveBeenCalledTimes(1);
    expect(mockRoutineRepo.assignToAthlete).not.toHaveBeenCalled();
    expect(mockNutritionRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('only assigns nutrition plan when only nutritionPlanId is set', async () => {
    await exec({ routineId: null, cardioId: null });
    expect(mockNutritionRepo.assignToAthlete).toHaveBeenCalledTimes(1);
    expect(mockRoutineRepo.assignToAthlete).not.toHaveBeenCalled();
    expect(mockCardioRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('does nothing when no automation is configured for the tag', async () => {
    mockAutoRepo.getByTagId.mockResolvedValue(null);
    await executeTagAutomationUseCase(
      TAG_ID, ATHLETE_ID, mockAutoRepo, mockRoutineRepo, mockCardioRepo, mockNutritionRepo,
    );
    expect(mockRoutineRepo.assignToAthlete).not.toHaveBeenCalled();
    expect(mockCardioRepo.assignToAthlete).not.toHaveBeenCalled();
    expect(mockNutritionRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('does nothing when automation exists but all ids are null', async () => {
    await exec({ routineId: null, cardioId: null, nutritionPlanId: null });
    expect(mockRoutineRepo.assignToAthlete).not.toHaveBeenCalled();
    expect(mockCardioRepo.assignToAthlete).not.toHaveBeenCalled();
    expect(mockNutritionRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('throws when any assignment fails', async () => {
    mockAutoRepo.getByTagId.mockResolvedValue(AUTOMATION);
    mockRoutineRepo.assignToAthlete.mockResolvedValue(undefined);
    mockCardioRepo.assignToAthlete.mockRejectedValue(new Error('Cardio error'));
    mockNutritionRepo.assignToAthlete.mockResolvedValue(undefined);
    await expect(
      executeTagAutomationUseCase(
        TAG_ID, ATHLETE_ID, mockAutoRepo, mockRoutineRepo, mockCardioRepo, mockNutritionRepo,
      ),
    ).rejects.toThrow('Alguna asignación automática ha fallado');
  });

  it('still assigns other content even when one fails (allSettled)', async () => {
    mockAutoRepo.getByTagId.mockResolvedValue(AUTOMATION);
    mockRoutineRepo.assignToAthlete.mockResolvedValue(undefined);
    mockCardioRepo.assignToAthlete.mockRejectedValue(new Error('Cardio error'));
    mockNutritionRepo.assignToAthlete.mockResolvedValue(undefined);
    try {
      await executeTagAutomationUseCase(
        TAG_ID, ATHLETE_ID, mockAutoRepo, mockRoutineRepo, mockCardioRepo, mockNutritionRepo,
      );
    } catch {
      // expected
    }
    expect(mockRoutineRepo.assignToAthlete).toHaveBeenCalled();
    expect(mockNutritionRepo.assignToAthlete).toHaveBeenCalled();
  });

  it('throws when tagId is empty', async () => {
    await expect(
      executeTagAutomationUseCase('', ATHLETE_ID, mockAutoRepo, mockRoutineRepo, mockCardioRepo, mockNutritionRepo),
    ).rejects.toThrow('tagId is required');
  });

  it('throws when athleteId is empty', async () => {
    await expect(
      executeTagAutomationUseCase(TAG_ID, '', mockAutoRepo, mockRoutineRepo, mockCardioRepo, mockNutritionRepo),
    ).rejects.toThrow('athleteId is required');
  });
});
