import { act } from 'react';
import { useNutritionStore } from '../../../src/presentation/stores/nutritionStore';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../../src/application/coach/NutritionUseCases', () => ({
  getCoachNutritionPlansUseCase:  jest.fn(),
  createNutritionPlanUseCase:     jest.fn(),
  assignNutritionPlanUseCase:     jest.fn(),
  assignPlansToAthleteUseCase:    jest.fn(),
  deleteNutritionPlanUseCase:     jest.fn(),
  filterNutritionPlans:           jest.fn(),
}));

jest.mock('../../../src/application/athlete/NutritionUseCases', () => ({
  getAssignedNutritionPlanUseCase:  jest.fn(),
  logMealUseCase:                   jest.fn(),
  getDailyNutritionSummaryUseCase:  jest.fn(),
  getWeeklyAdherenceUseCase:        jest.fn(),
}));

jest.mock('../../../src/infrastructure/supabase/remote/NutritionRemoteRepository', () => ({
  NutritionRemoteRepository: jest.fn().mockImplementation(() => ({})),
}));

import { assignPlansToAthleteUseCase } from '../../../src/application/coach/NutritionUseCases';

const mockAssignPlans = assignPlansToAthleteUseCase as jest.MockedFunction<typeof assignPlansToAthleteUseCase>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ATHLETE_ID = '00000000-0000-4000-b000-000000000001';
const PLAN_ID_A  = 'aaaaaaaa-0000-4000-b000-000000000001';
const PLAN_ID_B  = 'bbbbbbbb-0000-4000-b000-000000000002';

// ── Helpers ───────────────────────────────────────────────────────────────────

function resetStore() {
  useNutritionStore.setState({
    coachPlans: [], coachPlansLoading: false,
    assignedPlan: null, assignedPlanLoading: false,
    dailySummary: null, dailySummaryLoading: false,
    weeklyAdherence: [], isSubmitting: false, error: null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

// ── assignMultipleToAthlete ───────────────────────────────────────────────────

describe('useNutritionStore — assignMultipleToAthlete', () => {
  it('devuelve true y no setea error cuando el use case tiene éxito', async () => {
    mockAssignPlans.mockResolvedValue(undefined);

    let result: boolean | undefined;
    await act(async () => {
      result = await useNutritionStore.getState().assignMultipleToAthlete([PLAN_ID_A, PLAN_ID_B], ATHLETE_ID);
    });

    expect(result).toBe(true);
    expect(useNutritionStore.getState().error).toBeNull();
  });

  it('llama al use case con los planIds y athleteId exactos', async () => {
    mockAssignPlans.mockResolvedValue(undefined);

    await act(async () => {
      await useNutritionStore.getState().assignMultipleToAthlete([PLAN_ID_A, PLAN_ID_B], ATHLETE_ID);
    });

    expect(mockAssignPlans).toHaveBeenCalledWith([PLAN_ID_A, PLAN_ID_B], ATHLETE_ID, expect.anything());
  });

  it('devuelve false y setea error cuando el use case falla', async () => {
    mockAssignPlans.mockRejectedValue(new Error('Assign failed'));

    let result: boolean | undefined;
    await act(async () => {
      result = await useNutritionStore.getState().assignMultipleToAthlete([PLAN_ID_A], ATHLETE_ID);
    });

    expect(result).toBe(false);
    expect(useNutritionStore.getState().error).toBe('Assign failed');
  });

  it('usa el fallback string cuando el error no tiene mensaje', async () => {
    mockAssignPlans.mockRejectedValue('unexpected');

    await act(async () => {
      await useNutritionStore.getState().assignMultipleToAthlete([PLAN_ID_A], ATHLETE_ID);
    });

    expect(useNutritionStore.getState().error).toBeTruthy();
  });

  it('limpia el error previo al inicio de la operación', async () => {
    useNutritionStore.setState({ error: 'error previo' });
    mockAssignPlans.mockResolvedValue(undefined);

    await act(async () => {
      await useNutritionStore.getState().assignMultipleToAthlete([PLAN_ID_A], ATHLETE_ID);
    });

    expect(useNutritionStore.getState().error).toBeNull();
  });

  it('no modifica coachPlans en el estado', async () => {
    const plan = {
      id: PLAN_ID_A, coachId: '00000000-0000-4000-b000-000000000099',
      name: 'Plan A', type: 'deficit' as const,
      description: undefined, dailyTargetMacros: { calories: 2000, proteinG: 150, carbsG: 200, fatG: 60 },
      meals: [], createdAt: new Date(), updatedAt: new Date(),
    };
    useNutritionStore.setState({ coachPlans: [plan] });
    mockAssignPlans.mockResolvedValue(undefined);

    await act(async () => {
      await useNutritionStore.getState().assignMultipleToAthlete([PLAN_ID_A], ATHLETE_ID);
    });

    expect(useNutritionStore.getState().coachPlans).toHaveLength(1);
    expect(useNutritionStore.getState().coachPlans[0]).toEqual(plan);
  });
});
