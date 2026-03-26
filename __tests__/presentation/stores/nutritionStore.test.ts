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
  linkRecipeToMealUseCase:        jest.fn(),
  unlinkRecipeFromMealUseCase:    jest.fn(),
  createPlanGroupUseCase:         jest.fn(),
  deletePlanGroupUseCase:         jest.fn(),
  getPlanGroupsUseCase:           jest.fn(),
  getPlanGroupDetailUseCase:      jest.fn(),
  addPlanToGroupUseCase:          jest.fn(),
  removePlanFromGroupUseCase:     jest.fn(),
}));

jest.mock('../../../src/application/athlete/NutritionUseCases', () => ({
  getAssignedNutritionPlanUseCase:  jest.fn(),
  logMealUseCase:                   jest.fn(),
  getDailyNutritionSummaryUseCase:  jest.fn(),
  getWeeklyAdherenceUseCase:        jest.fn(),
}));

jest.mock('../../../src/infrastructure/supabase/remote/NutritionRemoteRepository', () => {
  const repoInstance = { getPlanById: jest.fn() };
  return {
    NutritionRemoteRepository: jest.fn().mockImplementation(() => repoInstance),
    __repoInstance: repoInstance,
  };
});

import {
  assignPlansToAthleteUseCase,
  duplicatePlanUseCase,
  linkRecipeToMealUseCase,
  unlinkRecipeFromMealUseCase,
  createPlanGroupUseCase,
  deletePlanGroupUseCase,
  getPlanGroupsUseCase,
  getPlanGroupDetailUseCase,
  addPlanToGroupUseCase,
  removePlanFromGroupUseCase,
} from '../../../src/application/coach/NutritionUseCases';
import { NutritionPlan, PlanGroup } from '../../../src/domain/entities/NutritionPlan';

const mockAssignPlans       = assignPlansToAthleteUseCase  as jest.MockedFunction<typeof assignPlansToAthleteUseCase>;
const mockDuplicate         = duplicatePlanUseCase          as jest.MockedFunction<typeof duplicatePlanUseCase>;
const mockLinkRecipe        = linkRecipeToMealUseCase       as jest.MockedFunction<typeof linkRecipeToMealUseCase>;
const mockUnlinkRecipe      = unlinkRecipeFromMealUseCase   as jest.MockedFunction<typeof unlinkRecipeFromMealUseCase>;
const mockCreateGroup       = createPlanGroupUseCase        as jest.MockedFunction<typeof createPlanGroupUseCase>;
const mockDeleteGroup       = deletePlanGroupUseCase        as jest.MockedFunction<typeof deletePlanGroupUseCase>;
const mockGetGroups         = getPlanGroupsUseCase          as jest.MockedFunction<typeof getPlanGroupsUseCase>;
const mockGetGroupDetail    = getPlanGroupDetailUseCase     as jest.MockedFunction<typeof getPlanGroupDetailUseCase>;
const mockAddPlanToGroup    = addPlanToGroupUseCase         as jest.MockedFunction<typeof addPlanToGroupUseCase>;
const mockRemovePlanFromGroup = removePlanFromGroupUseCase  as jest.MockedFunction<typeof removePlanFromGroupUseCase>;

// Access the repo instance exposed by the mock factory
const mockGetPlanById: jest.Mock =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require('../../../src/infrastructure/supabase/remote/NutritionRemoteRepository') as any)
    .__repoInstance.getPlanById;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID   = '00000000-0000-4000-b000-000000000099';
const ATHLETE_ID = '00000000-0000-4000-b000-000000000001';
const PLAN_ID_A  = 'aaaaaaaa-0000-4000-b000-000000000001';
const PLAN_ID_B  = 'bbbbbbbb-0000-4000-b000-000000000002';
const GROUP_ID   = 'gggggggg-0000-4000-b000-000000000001';
const MEAL_ID    = 'mmmmmmmm-0000-4000-b000-000000000001';
const RECIPE_ID  = 'rrrrrrrr-0000-4000-b000-000000000001';
const NOW        = new Date('2024-01-01');

function makeGroup(overrides: Partial<PlanGroup> = {}): PlanGroup {
  return {
    id: GROUP_ID, coachId: COACH_ID, name: 'Grupo A',
    description: undefined, planCount: 0, createdAt: NOW,
    ...overrides,
  };
}

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
    groups: [], groupsLoading: false,
    groupDetail: null, groupDetailLoading: false,
    coachPlans: [], coachPlansLoading: false,
    assignedPlan: null, assignedPlanLoading: false,
    dailySummary: null, dailySummaryLoading: false,
    weeklyAdherence: [], isSubmitting: false, error: null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPlanById.mockReset();
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

// ── linkRecipe ────────────────────────────────────────────────────────────────

describe('useNutritionStore — linkRecipe', () => {
  it('devuelve true y actualiza el plan en coachPlans en caso de éxito', async () => {
    const original = makePlan({ id: PLAN_ID_A });
    const updated  = makePlan({ id: PLAN_ID_A, name: 'Plan actualizado' });
    useNutritionStore.setState({ coachPlans: [original] });
    mockLinkRecipe.mockResolvedValue(undefined);
    mockGetPlanById.mockResolvedValue(updated);

    let result: boolean | undefined;
    await act(async () => {
      result = await useNutritionStore.getState().linkRecipe(MEAL_ID, RECIPE_ID, PLAN_ID_A);
    });

    expect(result).toBe(true);
    expect(useNutritionStore.getState().coachPlans[0]).toEqual(updated);
  });

  it('llama al use case con mealId y recipeId correctos', async () => {
    mockLinkRecipe.mockResolvedValue(undefined);
    mockGetPlanById.mockResolvedValue(makePlan());

    await act(async () => {
      await useNutritionStore.getState().linkRecipe(MEAL_ID, RECIPE_ID, PLAN_ID_A);
    });

    expect(mockLinkRecipe).toHaveBeenCalledWith(MEAL_ID, RECIPE_ID, expect.anything());
  });

  it('llama a getPlanById con el planId correcto tras el vínculo', async () => {
    mockLinkRecipe.mockResolvedValue(undefined);
    mockGetPlanById.mockResolvedValue(makePlan());

    await act(async () => {
      await useNutritionStore.getState().linkRecipe(MEAL_ID, RECIPE_ID, PLAN_ID_A);
    });

    expect(mockGetPlanById).toHaveBeenCalledWith(PLAN_ID_A);
  });

  it('devuelve false y setea error cuando el use case falla', async () => {
    mockLinkRecipe.mockRejectedValue(new Error('Link failed'));

    let result: boolean | undefined;
    await act(async () => {
      result = await useNutritionStore.getState().linkRecipe(MEAL_ID, RECIPE_ID, PLAN_ID_A);
    });

    expect(result).toBe(false);
    expect(useNutritionStore.getState().error).toBe('Link failed');
  });

  it('usa el fallback string cuando el error no tiene mensaje', async () => {
    mockLinkRecipe.mockRejectedValue('unexpected');

    await act(async () => {
      await useNutritionStore.getState().linkRecipe(MEAL_ID, RECIPE_ID, PLAN_ID_A);
    });

    expect(useNutritionStore.getState().error).toBeTruthy();
  });

  it('limpia el error previo al inicio de la operación', async () => {
    useNutritionStore.setState({ error: 'error previo' });
    mockLinkRecipe.mockResolvedValue(undefined);
    mockGetPlanById.mockResolvedValue(makePlan());

    await act(async () => {
      await useNutritionStore.getState().linkRecipe(MEAL_ID, RECIPE_ID, PLAN_ID_A);
    });

    expect(useNutritionStore.getState().error).toBeNull();
  });

  it('no modifica coachPlans si getPlanById devuelve null', async () => {
    const original = makePlan({ id: PLAN_ID_A });
    useNutritionStore.setState({ coachPlans: [original] });
    mockLinkRecipe.mockResolvedValue(undefined);
    mockGetPlanById.mockResolvedValue(null);

    await act(async () => {
      await useNutritionStore.getState().linkRecipe(MEAL_ID, RECIPE_ID, PLAN_ID_A);
    });

    expect(useNutritionStore.getState().coachPlans[0]).toEqual(original);
  });
});

// ── unlinkRecipe ──────────────────────────────────────────────────────────────

describe('useNutritionStore — unlinkRecipe', () => {
  it('devuelve true y actualiza el plan en coachPlans en caso de éxito', async () => {
    const original = makePlan({ id: PLAN_ID_A });
    const updated  = makePlan({ id: PLAN_ID_A, name: 'Plan actualizado' });
    useNutritionStore.setState({ coachPlans: [original] });
    mockUnlinkRecipe.mockResolvedValue(undefined);
    mockGetPlanById.mockResolvedValue(updated);

    let result: boolean | undefined;
    await act(async () => {
      result = await useNutritionStore.getState().unlinkRecipe(MEAL_ID, RECIPE_ID, PLAN_ID_A);
    });

    expect(result).toBe(true);
    expect(useNutritionStore.getState().coachPlans[0]).toEqual(updated);
  });

  it('llama al use case con mealId y recipeId correctos', async () => {
    mockUnlinkRecipe.mockResolvedValue(undefined);
    mockGetPlanById.mockResolvedValue(makePlan());

    await act(async () => {
      await useNutritionStore.getState().unlinkRecipe(MEAL_ID, RECIPE_ID, PLAN_ID_A);
    });

    expect(mockUnlinkRecipe).toHaveBeenCalledWith(MEAL_ID, RECIPE_ID, expect.anything());
  });

  it('devuelve false y setea error cuando el use case falla', async () => {
    mockUnlinkRecipe.mockRejectedValue(new Error('Unlink failed'));

    let result: boolean | undefined;
    await act(async () => {
      result = await useNutritionStore.getState().unlinkRecipe(MEAL_ID, RECIPE_ID, PLAN_ID_A);
    });

    expect(result).toBe(false);
    expect(useNutritionStore.getState().error).toBe('Unlink failed');
  });

  it('usa el fallback string cuando el error no tiene mensaje', async () => {
    mockUnlinkRecipe.mockRejectedValue('unexpected');

    await act(async () => {
      await useNutritionStore.getState().unlinkRecipe(MEAL_ID, RECIPE_ID, PLAN_ID_A);
    });

    expect(useNutritionStore.getState().error).toBeTruthy();
  });

  it('limpia el error previo al inicio de la operación', async () => {
    useNutritionStore.setState({ error: 'error previo' });
    mockUnlinkRecipe.mockResolvedValue(undefined);
    mockGetPlanById.mockResolvedValue(makePlan());

    await act(async () => {
      await useNutritionStore.getState().unlinkRecipe(MEAL_ID, RECIPE_ID, PLAN_ID_A);
    });

    expect(useNutritionStore.getState().error).toBeNull();
  });
});

// ── refreshPlan ───────────────────────────────────────────────────────────────

describe('useNutritionStore — refreshPlan', () => {
  it('reemplaza el plan en coachPlans con el plan actualizado del repositorio', async () => {
    const original = makePlan({ id: PLAN_ID_A, name: 'Plan original' });
    const updated  = makePlan({ id: PLAN_ID_A, name: 'Plan actualizado' });
    useNutritionStore.setState({ coachPlans: [original] });
    mockGetPlanById.mockResolvedValue(updated);

    await act(async () => {
      await useNutritionStore.getState().refreshPlan(PLAN_ID_A);
    });

    expect(useNutritionStore.getState().coachPlans[0]).toEqual(updated);
  });

  it('llama a getPlanById con el planId correcto', async () => {
    mockGetPlanById.mockResolvedValue(makePlan());

    await act(async () => {
      await useNutritionStore.getState().refreshPlan(PLAN_ID_A);
    });

    expect(mockGetPlanById).toHaveBeenCalledWith(PLAN_ID_A);
  });

  it('no modifica coachPlans si getPlanById devuelve null', async () => {
    const original = makePlan({ id: PLAN_ID_A });
    useNutritionStore.setState({ coachPlans: [original] });
    mockGetPlanById.mockResolvedValue(null);

    await act(async () => {
      await useNutritionStore.getState().refreshPlan(PLAN_ID_A);
    });

    expect(useNutritionStore.getState().coachPlans[0]).toEqual(original);
  });

  it('setea error si getPlanById lanza una excepción', async () => {
    mockGetPlanById.mockRejectedValue(new Error('DB error'));

    await act(async () => {
      await useNutritionStore.getState().refreshPlan(PLAN_ID_A);
    });

    expect(useNutritionStore.getState().error).toBe('DB error');
  });

  it('no toca otros planes al actualizar uno específico', async () => {
    const planA = makePlan({ id: PLAN_ID_A, name: 'Plan A' });
    const planB = makePlan({ id: PLAN_ID_B, name: 'Plan B' });
    const updatedA = makePlan({ id: PLAN_ID_A, name: 'Plan A updated' });
    useNutritionStore.setState({ coachPlans: [planA, planB] });
    mockGetPlanById.mockResolvedValue(updatedA);

    await act(async () => {
      await useNutritionStore.getState().refreshPlan(PLAN_ID_A);
    });

    const plans = useNutritionStore.getState().coachPlans;
    expect(plans).toHaveLength(2);
    expect(plans.find((p) => p.id === PLAN_ID_B)).toEqual(planB);
    expect(plans.find((p) => p.id === PLAN_ID_A)).toEqual(updatedA);
  });
});

// ── fetchGroups ───────────────────────────────────────────────────────────────

describe('useNutritionStore — fetchGroups', () => {
  it('setea los grupos en caso de éxito', async () => {
    const groups = [makeGroup(), makeGroup({ id: 'gggggggg-0000-4000-b000-000000000002', name: 'Grupo B' })];
    mockGetGroups.mockResolvedValue(groups);

    await act(async () => { await useNutritionStore.getState().fetchGroups(COACH_ID); });

    expect(useNutritionStore.getState().groups).toEqual(groups);
    expect(useNutritionStore.getState().groupsLoading).toBe(false);
    expect(useNutritionStore.getState().error).toBeNull();
  });

  it('setea error en caso de fallo', async () => {
    mockGetGroups.mockRejectedValue(new Error('Network error'));

    await act(async () => { await useNutritionStore.getState().fetchGroups(COACH_ID); });

    expect(useNutritionStore.getState().error).toBe('Network error');
    expect(useNutritionStore.getState().groupsLoading).toBe(false);
  });

  it('usa fallback string si el error no tiene mensaje', async () => {
    mockGetGroups.mockRejectedValue('unexpected');

    await act(async () => { await useNutritionStore.getState().fetchGroups(COACH_ID); });

    expect(useNutritionStore.getState().error).toBeTruthy();
  });

  it('limpia el error previo al inicio de la operación', async () => {
    useNutritionStore.setState({ error: 'error previo' });
    mockGetGroups.mockResolvedValue([]);

    await act(async () => { await useNutritionStore.getState().fetchGroups(COACH_ID); });

    expect(useNutritionStore.getState().error).toBeNull();
  });
});

// ── createGroup ───────────────────────────────────────────────────────────────

describe('useNutritionStore — createGroup', () => {
  it('añade el grupo al principio de la lista y devuelve true', async () => {
    const existing = makeGroup({ id: 'gggggggg-0000-4000-b000-000000000002', name: 'Viejo' });
    const newGroup = makeGroup({ name: 'Nuevo' });
    useNutritionStore.setState({ groups: [existing] });
    mockCreateGroup.mockResolvedValue(newGroup);

    let result: boolean | undefined;
    await act(async () => { result = await useNutritionStore.getState().createGroup(COACH_ID, 'Nuevo'); });

    expect(result).toBe(true);
    const groups = useNutritionStore.getState().groups;
    expect(groups[0]).toEqual(newGroup);
    expect(groups).toHaveLength(2);
  });

  it('devuelve false y setea error en caso de fallo', async () => {
    mockCreateGroup.mockRejectedValue(new Error('Insert failed'));

    let result: boolean | undefined;
    await act(async () => { result = await useNutritionStore.getState().createGroup(COACH_ID, 'X'); });

    expect(result).toBe(false);
    expect(useNutritionStore.getState().error).toBe('Insert failed');
  });

  it('isSubmitting es true durante la operación y false al terminar', async () => {
    const states: boolean[] = [];
    mockCreateGroup.mockImplementation(() => {
      states.push(useNutritionStore.getState().isSubmitting);
      return Promise.resolve(makeGroup());
    });

    await act(async () => { await useNutritionStore.getState().createGroup(COACH_ID, 'Grupo'); });

    expect(states[0]).toBe(true);
    expect(useNutritionStore.getState().isSubmitting).toBe(false);
  });

  it('pasa la descripción al use case cuando se proporciona', async () => {
    mockCreateGroup.mockResolvedValue(makeGroup({ description: 'Desc' }));

    await act(async () => { await useNutritionStore.getState().createGroup(COACH_ID, 'Grupo', 'Desc'); });

    expect(mockCreateGroup).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Desc' }),
      expect.anything(),
    );
  });
});

// ── deleteGroup ───────────────────────────────────────────────────────────────

describe('useNutritionStore — deleteGroup', () => {
  it('elimina el grupo de la lista y devuelve true', async () => {
    const groupA = makeGroup();
    const groupB = makeGroup({ id: 'gggggggg-0000-4000-b000-000000000002', name: 'Grupo B' });
    useNutritionStore.setState({ groups: [groupA, groupB] });
    mockDeleteGroup.mockResolvedValue();

    let result: boolean | undefined;
    await act(async () => { result = await useNutritionStore.getState().deleteGroup(GROUP_ID); });

    expect(result).toBe(true);
    expect(useNutritionStore.getState().groups).toEqual([groupB]);
  });

  it('devuelve false y setea error en caso de fallo', async () => {
    mockDeleteGroup.mockRejectedValue(new Error('Delete failed'));

    let result: boolean | undefined;
    await act(async () => { result = await useNutritionStore.getState().deleteGroup(GROUP_ID); });

    expect(result).toBe(false);
    expect(useNutritionStore.getState().error).toBe('Delete failed');
  });

  it('usa fallback string si el error no tiene mensaje', async () => {
    mockDeleteGroup.mockRejectedValue('unexpected');

    await act(async () => { await useNutritionStore.getState().deleteGroup(GROUP_ID); });

    expect(useNutritionStore.getState().error).toBeTruthy();
  });
});

// ── fetchGroupDetail ──────────────────────────────────────────────────────────

describe('useNutritionStore — fetchGroupDetail', () => {
  it('setea el detalle del grupo en caso de éxito', async () => {
    const group = makeGroup({ planCount: 1 });
    const plan  = makePlan();
    mockGetGroupDetail.mockResolvedValue({ group, plans: [plan] });

    await act(async () => { await useNutritionStore.getState().fetchGroupDetail(GROUP_ID); });

    const detail = useNutritionStore.getState().groupDetail;
    expect(detail?.group).toEqual(group);
    expect(detail?.plans).toHaveLength(1);
    expect(useNutritionStore.getState().groupDetailLoading).toBe(false);
  });

  it('setea error en caso de fallo', async () => {
    mockGetGroupDetail.mockRejectedValue(new Error('Not found'));

    await act(async () => { await useNutritionStore.getState().fetchGroupDetail(GROUP_ID); });

    expect(useNutritionStore.getState().error).toBe('Not found');
    expect(useNutritionStore.getState().groupDetailLoading).toBe(false);
  });
});

// ── addPlanToGroup ────────────────────────────────────────────────────────────

describe('useNutritionStore — addPlanToGroup', () => {
  it('actualiza el detalle y el planCount en la lista de grupos', async () => {
    const group = makeGroup({ planCount: 0 });
    const plan  = makePlan();
    useNutritionStore.setState({
      groups: [group],
      groupDetail: { group, plans: [] },
    });
    mockAddPlanToGroup.mockResolvedValue();
    mockGetGroupDetail.mockResolvedValue({ group: { ...group, planCount: 1 }, plans: [plan] });

    let result: boolean | undefined;
    await act(async () => { result = await useNutritionStore.getState().addPlanToGroup(GROUP_ID, PLAN_ID_A); });

    expect(result).toBe(true);
    expect(useNutritionStore.getState().groupDetail?.plans).toHaveLength(1);
    expect(useNutritionStore.getState().groups[0].planCount).toBe(1);
  });

  it('devuelve false y setea error en caso de fallo', async () => {
    mockAddPlanToGroup.mockRejectedValue(new Error('Upsert failed'));

    let result: boolean | undefined;
    await act(async () => { result = await useNutritionStore.getState().addPlanToGroup(GROUP_ID, PLAN_ID_A); });

    expect(result).toBe(false);
    expect(useNutritionStore.getState().error).toBe('Upsert failed');
  });
});

// ── removePlanFromGroup ───────────────────────────────────────────────────────

describe('useNutritionStore — removePlanFromGroup', () => {
  it('elimina el plan del detalle y actualiza el planCount', async () => {
    const plan  = makePlan({ id: PLAN_ID_A });
    const plan2 = makePlan({ id: PLAN_ID_B, name: 'Plan B' });
    const group = makeGroup({ planCount: 2 });
    useNutritionStore.setState({
      groups: [group],
      groupDetail: { group, plans: [plan, plan2] },
    });
    mockRemovePlanFromGroup.mockResolvedValue();

    let result: boolean | undefined;
    await act(async () => { result = await useNutritionStore.getState().removePlanFromGroup(GROUP_ID, PLAN_ID_A); });

    expect(result).toBe(true);
    const state = useNutritionStore.getState();
    expect(state.groupDetail?.plans).toHaveLength(1);
    expect(state.groupDetail?.plans[0].id).toBe(PLAN_ID_B);
    expect(state.groups[0].planCount).toBe(1);
  });

  it('devuelve false y setea error en caso de fallo', async () => {
    mockRemovePlanFromGroup.mockRejectedValue(new Error('Delete failed'));

    let result: boolean | undefined;
    await act(async () => { result = await useNutritionStore.getState().removePlanFromGroup(GROUP_ID, PLAN_ID_A); });

    expect(result).toBe(false);
    expect(useNutritionStore.getState().error).toBe('Delete failed');
  });

  it('no modifica el estado si el groupDetail es de otro grupo', async () => {
    const otherGroupId = 'gggggggg-0000-4000-b000-000000000099';
    const plan = makePlan();
    useNutritionStore.setState({
      groups: [],
      groupDetail: { group: makeGroup({ id: otherGroupId }), plans: [plan] },
    });
    mockRemovePlanFromGroup.mockResolvedValue();

    await act(async () => { await useNutritionStore.getState().removePlanFromGroup(GROUP_ID, PLAN_ID_A); });

    expect(useNutritionStore.getState().groupDetail?.plans).toHaveLength(1);
  });
});
