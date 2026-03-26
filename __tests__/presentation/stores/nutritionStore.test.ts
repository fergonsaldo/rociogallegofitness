import { act } from 'react';
import { useNutritionStore } from '../../../src/presentation/stores/nutritionStore';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../../src/application/coach/NutritionUseCases', () => ({
  getCoachNutritionPlansUseCase:  jest.fn(),
  createNutritionPlanUseCase:     jest.fn(),
  duplicatePlanUseCase:           jest.fn(),
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

import {
  assignPlansToAthleteUseCase,
  duplicatePlanUseCase,
} from '../../../src/application/coach/NutritionUseCases';
import { NutritionPlan } from '../../../src/domain/entities/NutritionPlan';

const mockAssignPlans  = assignPlansToAthleteUseCase as jest.MockedFunction<typeof assignPlansToAthleteUseCase>;
const mockDuplicate    = duplicatePlanUseCase        as jest.MockedFunction<typeof duplicatePlanUseCase>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID   = '00000000-0000-4000-b000-000000000099';
const ATHLETE_ID = '00000000-0000-4000-b000-000000000001';
const PLAN_ID_A  = 'aaaaaaaa-0000-4000-b000-000000000001';
const PLAN_ID_B  = 'bbbbbbbb-0000-4000-b000-000000000002';
const NOW        = new Date('2024-01-01');

function makePlan(overrides: Partial<NutritionPlan> = {}): NutritionPlan {
  return {
    id: PLAN_ID_A, coachId: COACH_ID, name: 'Plan A', type: 'deficit',
    description: undefined,
    dailyTargetMacros: { calories: 2000, proteinG: 150, carbsG: 200, fatG: 60 },
    meals: [], createdAt: NOW, updatedAt: NOW,
    ...overrides,
  };
}

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

// ── duplicatePlan ─────────────────────────────────────────────────────────────

describe('useNutritionStore — duplicatePlan', () => {
  it('añade la copia al principio de coachPlans en caso de éxito', async () => {
    const original = makePlan({ id: PLAN_ID_A, name: 'Plan A' });
    const copy     = makePlan({ id: PLAN_ID_B, name: '(Copia) Plan A' });
    useNutritionStore.setState({ coachPlans: [original] });
    mockDuplicate.mockResolvedValue(copy);

    await act(async () => {
      await useNutritionStore.getState().duplicatePlan(original, COACH_ID);
    });

    const plans = useNutritionStore.getState().coachPlans;
    expect(plans[0]).toEqual(copy);
    expect(plans).toHaveLength(2);
  });

  it('devuelve true en caso de éxito', async () => {
    const original = makePlan();
    mockDuplicate.mockResolvedValue(makePlan({ id: PLAN_ID_B }));

    let result: boolean | undefined;
    await act(async () => {
      result = await useNutritionStore.getState().duplicatePlan(original, COACH_ID);
    });

    expect(result).toBe(true);
  });

  it('devuelve false y setea error en caso de fallo', async () => {
    mockDuplicate.mockRejectedValue(new Error('Duplicate failed'));

    let result: boolean | undefined;
    await act(async () => {
      result = await useNutritionStore.getState().duplicatePlan(makePlan(), COACH_ID);
    });

    expect(result).toBe(false);
    expect(useNutritionStore.getState().error).toBe('Duplicate failed');
  });

  it('usa el fallback string cuando el error no tiene mensaje', async () => {
    mockDuplicate.mockRejectedValue('unexpected');

    await act(async () => {
      await useNutritionStore.getState().duplicatePlan(makePlan(), COACH_ID);
    });

    expect(useNutritionStore.getState().error).toBeTruthy();
  });

  it('isSubmitting es true durante la operación y false al terminar', async () => {
    const states: boolean[] = [];
    mockDuplicate.mockImplementation(() => {
      states.push(useNutritionStore.getState().isSubmitting);
      return Promise.resolve(makePlan({ id: PLAN_ID_B }));
    });

    await act(async () => {
      await useNutritionStore.getState().duplicatePlan(makePlan(), COACH_ID);
    });

    expect(states[0]).toBe(true);
    expect(useNutritionStore.getState().isSubmitting).toBe(false);
  });

  it('limpia el error previo al inicio de la operación', async () => {
    useNutritionStore.setState({ error: 'error previo' });
    mockDuplicate.mockResolvedValue(makePlan({ id: PLAN_ID_B }));

    await act(async () => {
      await useNutritionStore.getState().duplicatePlan(makePlan(), COACH_ID);
    });

    expect(useNutritionStore.getState().error).toBeNull();
  });

  it('llama al use case con el plan y coachId correctos', async () => {
    const original = makePlan();
    mockDuplicate.mockResolvedValue(makePlan({ id: PLAN_ID_B }));

    await act(async () => {
      await useNutritionStore.getState().duplicatePlan(original, COACH_ID);
    });

    expect(mockDuplicate).toHaveBeenCalledWith(original, COACH_ID, expect.anything());
  });

  it('no modifica coachPlans en caso de fallo', async () => {
    const original = makePlan();
    useNutritionStore.setState({ coachPlans: [original] });
    mockDuplicate.mockRejectedValue(new Error('fail'));

    await act(async () => {
      await useNutritionStore.getState().duplicatePlan(original, COACH_ID);
    });

    expect(useNutritionStore.getState().coachPlans).toHaveLength(1);
  });
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
