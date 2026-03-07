import {
  createNutritionPlanUseCase,
  assignNutritionPlanUseCase,
  getCoachNutritionPlansUseCase,
  deleteNutritionPlanUseCase,
} from '../../../src/application/coach/NutritionUseCases';
import {
  getAssignedNutritionPlanUseCase,
  logMealUseCase,
  getDailyNutritionSummaryUseCase,
  getWeeklyAdherenceUseCase,
} from '../../../src/application/athlete/NutritionUseCases';
import {
  sumMacros, macroPercentages, NutritionPlan, MealLogEntry,
} from '../../../src/domain/entities/NutritionPlan';
import { INutritionRepository } from '../../../src/domain/repositories/INutritionRepository';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const UUID       = '123e4567-e89b-12d3-a456-426614174000';
const COACH_ID   = '223e4567-e89b-12d3-a456-426614174001';
const ATHLETE_ID = '323e4567-e89b-12d3-a456-426614174002';
const MEAL_ID    = '423e4567-e89b-12d3-a456-426614174003';
const NOW = new Date('2024-06-15T12:00:00Z');

const MACROS = { calories: 500, proteinG: 40, carbsG: 50, fatG: 15 };
const DAILY_MACROS = { calories: 2000, proteinG: 160, carbsG: 200, fatG: 60 };

const MOCK_MEAL = {
  id: MEAL_ID, nutritionPlanId: UUID,
  name: 'Breakfast', order: 1, targetMacros: MACROS,
};

const MOCK_PLAN: NutritionPlan = {
  id: UUID, coachId: COACH_ID,
  name: 'Lean Bulk Phase 1',
  dailyTargetMacros: DAILY_MACROS,
  meals: [MOCK_MEAL],
  createdAt: NOW, updatedAt: NOW,
};

const MOCK_LOG_ENTRY: MealLogEntry = {
  id: UUID, mealId: MEAL_ID, athleteId: ATHLETE_ID,
  loggedAt: NOW, actualMacros: MACROS,
};

// ── Mock repo ─────────────────────────────────────────────────────────────────
const mockRepo: jest.Mocked<INutritionRepository> = {
  createPlan: jest.fn(),
  getPlansByCoach: jest.fn(),
  getPlanById: jest.fn(),
  deletePlan: jest.fn(),
  assignToAthlete: jest.fn(),
  unassignFromAthlete: jest.fn(),
  getAssignedPlan: jest.fn(),
  logMeal: jest.fn(),
  getLogEntriesForDay: jest.fn(),
  getLogEntriesForRange: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── createNutritionPlanUseCase ────────────────────────────────────────────────
describe('createNutritionPlanUseCase', () => {
  const VALID_INPUT = {
    coachId: COACH_ID, name: 'Lean Bulk Phase 1',
    dailyTargetMacros: DAILY_MACROS,
    meals: [{ name: 'Breakfast', order: 1, targetMacros: MACROS }],
  };

  it('creates a plan with valid input', async () => {
    mockRepo.createPlan.mockResolvedValue(MOCK_PLAN);
    const result = await createNutritionPlanUseCase(VALID_INPUT, mockRepo);
    expect(result.name).toBe('Lean Bulk Phase 1');
    expect(mockRepo.createPlan).toHaveBeenCalledTimes(1);
  });

  it('throws ZodError when name is empty', async () => {
    await expect(
      createNutritionPlanUseCase({ ...VALID_INPUT, name: '' }, mockRepo)
    ).rejects.toThrow();
    expect(mockRepo.createPlan).not.toHaveBeenCalled();
  });

  it('throws ZodError when meals array is empty', async () => {
    await expect(
      createNutritionPlanUseCase({ ...VALID_INPUT, meals: [] }, mockRepo)
    ).rejects.toThrow('At least one meal is required');
  });

  it('throws ZodError when calories exceed max', async () => {
    await expect(
      createNutritionPlanUseCase({
        ...VALID_INPUT,
        dailyTargetMacros: { ...DAILY_MACROS, calories: 99999 },
      }, mockRepo)
    ).rejects.toThrow();
  });
});

// ── assignNutritionPlanUseCase ────────────────────────────────────────────────
describe('assignNutritionPlanUseCase', () => {
  it('assigns a plan to an athlete when the plan exists', async () => {
    mockRepo.getPlanById.mockResolvedValue(MOCK_PLAN);
    mockRepo.assignToAthlete.mockResolvedValue();
    await assignNutritionPlanUseCase({ planId: UUID, athleteId: ATHLETE_ID }, mockRepo);
    expect(mockRepo.assignToAthlete).toHaveBeenCalledWith(UUID, ATHLETE_ID);
  });

  it('throws when plan does not exist', async () => {
    mockRepo.getPlanById.mockResolvedValue(null);
    await expect(
      assignNutritionPlanUseCase({ planId: UUID, athleteId: ATHLETE_ID }, mockRepo)
    ).rejects.toThrow('Nutrition plan not found');
  });

  it('throws ZodError when planId is not a UUID', async () => {
    await expect(
      assignNutritionPlanUseCase({ planId: 'bad-id', athleteId: ATHLETE_ID }, mockRepo)
    ).rejects.toThrow('Invalid plan ID');
  });
});

// ── logMealUseCase ────────────────────────────────────────────────────────────
describe('logMealUseCase', () => {
  it('logs a meal entry and returns it', async () => {
    mockRepo.logMeal.mockResolvedValue(MOCK_LOG_ENTRY);
    const result = await logMealUseCase(
      { mealId: MEAL_ID, athleteId: ATHLETE_ID, actualMacros: MACROS },
      mockRepo
    );
    expect(result.mealId).toBe(MEAL_ID);
    expect(mockRepo.logMeal).toHaveBeenCalledTimes(1);
  });

  it('auto-calculates calories when set to 0', async () => {
    const expectedCals = Math.round(40 * 4 + 50 * 4 + 15 * 9); // 495
    mockRepo.logMeal.mockResolvedValue({ ...MOCK_LOG_ENTRY, actualMacros: { ...MACROS, calories: expectedCals } });

    await logMealUseCase(
      { mealId: MEAL_ID, athleteId: ATHLETE_ID, actualMacros: { ...MACROS, calories: 0 } },
      mockRepo
    );

    const callArg = mockRepo.logMeal.mock.calls[0][0];
    expect(callArg.actualMacros.calories).toBe(expectedCals);
  });
});

// ── getDailyNutritionSummaryUseCase ───────────────────────────────────────────
describe('getDailyNutritionSummaryUseCase', () => {
  it('returns correct progress ratios for partial consumption', async () => {
    // Consumed half the daily target
    const halfMacros = { calories: 1000, proteinG: 80, carbsG: 100, fatG: 30 };
    mockRepo.getLogEntriesForDay.mockResolvedValue([
      { ...MOCK_LOG_ENTRY, actualMacros: halfMacros },
    ]);

    const summary = await getDailyNutritionSummaryUseCase(
      ATHLETE_ID, NOW, MOCK_PLAN, mockRepo
    );

    expect(summary.progress.calories).toBeCloseTo(0.5);
    expect(summary.progress.protein).toBeCloseTo(0.5);
    expect(summary.progress.carbs).toBeCloseTo(0.5);
  });

  it('clamps progress to 1.0 even when over target', async () => {
    // Consumed double the target
    const doubleMacros = { calories: 4000, proteinG: 320, carbsG: 400, fatG: 120 };
    mockRepo.getLogEntriesForDay.mockResolvedValue([
      { ...MOCK_LOG_ENTRY, actualMacros: doubleMacros },
    ]);

    const summary = await getDailyNutritionSummaryUseCase(
      ATHLETE_ID, NOW, MOCK_PLAN, mockRepo
    );

    expect(summary.progress.calories).toBe(1);
    expect(summary.progress.protein).toBe(1);
  });

  it('returns zero progress with no log entries', async () => {
    mockRepo.getLogEntriesForDay.mockResolvedValue([]);
    const summary = await getDailyNutritionSummaryUseCase(
      ATHLETE_ID, NOW, MOCK_PLAN, mockRepo
    );
    expect(summary.progress.calories).toBe(0);
    expect(summary.totalConsumed.calories).toBe(0);
  });
});

// ── sumMacros & macroPercentages (pure functions) ─────────────────────────────
describe('sumMacros', () => {
  it('sums macros correctly across multiple entries', () => {
    const result = sumMacros([MACROS, MACROS]);
    expect(result.calories).toBe(1000);
    expect(result.proteinG).toBe(80);
    expect(result.carbsG).toBe(100);
    expect(result.fatG).toBe(30);
  });

  it('returns zero macros for empty array', () => {
    const result = sumMacros([]);
    expect(result.calories).toBe(0);
  });
});

describe('macroPercentages', () => {
  it('percentages sum to 100', () => {
    const pct = macroPercentages(DAILY_MACROS);
    // Allow ±1 due to rounding
    expect(pct.protein + pct.carbs + pct.fat).toBeGreaterThanOrEqual(99);
    expect(pct.protein + pct.carbs + pct.fat).toBeLessThanOrEqual(101);
  });

  it('handles zero macros without crashing', () => {
    const pct = macroPercentages({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
    expect(pct.protein).toBe(0);
  });
});
