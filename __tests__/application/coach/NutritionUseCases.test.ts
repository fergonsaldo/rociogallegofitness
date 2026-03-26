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
import { INutritionRepository } from '../../../src/domain/repositories/INutritionRepository';
import { NutritionPlan, PlanGroup } from '../../../src/domain/entities/NutritionPlan';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ATHLETE_ID = '00000000-0000-4000-b000-000000000001';
const PLAN_ID_A  = 'aaaaaaaa-0000-4000-b000-000000000001';
const PLAN_ID_B  = 'bbbbbbbb-0000-4000-b000-000000000002';
const MEAL_ID    = 'mmmmmmmm-0000-4000-b000-000000000001';
const RECIPE_ID  = 'rrrrrrrr-0000-4000-b000-000000000001';

const mockRepo: jest.Mocked<Pick<
  INutritionRepository,
  'assignToAthlete' | 'createPlan' | 'linkRecipeToMeal' | 'unlinkRecipeFromMeal' |
  'createPlanGroup' | 'deletePlanGroup' | 'getPlanGroups' | 'getPlanGroupDetail' |
  'addPlanToGroup' | 'removePlanFromGroup'
>> = {
  assignToAthlete:      jest.fn(),
  createPlan:           jest.fn(),
  linkRecipeToMeal:     jest.fn(),
  unlinkRecipeFromMeal: jest.fn(),
  createPlanGroup:      jest.fn(),
  deletePlanGroup:      jest.fn(),
  getPlanGroups:        jest.fn(),
  getPlanGroupDetail:   jest.fn(),
  addPlanToGroup:       jest.fn(),
  removePlanFromGroup:  jest.fn(),
};

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID  = '00000000-0000-4000-b000-000000000099';
const GROUP_ID  = 'gggggggg-0000-4000-b000-000000000001';
const NOW      = new Date('2024-01-01');

function makeGroup(overrides: Partial<PlanGroup> = {}): PlanGroup {
  return {
    id:          GROUP_ID,
    coachId:     COACH_ID,
    name:        'Grupo A',
    description: 'Descripción del grupo',
    planCount:   0,
    createdAt:   new Date('2024-01-01'),
    ...overrides,
  };
}

function makePlan(overrides: Partial<NutritionPlan> = {}): NutritionPlan {
  return {
    id:      'pppppppp-0000-4000-b000-000000000001',
    coachId: COACH_ID,
    name:    'Plan base',
    type:    'deficit',
    description: 'Descripción original',
    dailyTargetMacros: { calories: 2000, proteinG: 150, carbsG: 200, fatG: 60 },
    meals: [
      {
        id: 'mmmmmmmm-0000-4000-b000-000000000001',
        nutritionPlanId: 'pppppppp-0000-4000-b000-000000000001',
        name: 'Desayuno', order: 1,
        targetMacros: { calories: 400, proteinG: 30, carbsG: 50, fatG: 10 },
        notes: undefined,
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

beforeEach(() => jest.clearAllMocks());

// ── duplicatePlanUseCase ──────────────────────────────────────────────────────

describe('duplicatePlanUseCase', () => {
  it('llama a createPlan con el nombre prefijado con "(Copia) "', async () => {
    const plan = makePlan({ name: 'Plan A' });
    const copy = makePlan({ name: '(Copia) Plan A' });
    mockRepo.createPlan.mockResolvedValue(copy);

    await duplicatePlanUseCase(plan, COACH_ID, mockRepo as any);

    expect(mockRepo.createPlan).toHaveBeenCalledWith(
      expect.objectContaining({ name: '(Copia) Plan A' }),
    );
  });

  it('trunca el nombre de la copia a 100 caracteres', async () => {
    const longName = 'A'.repeat(95);
    const plan = makePlan({ name: longName });
    mockRepo.createPlan.mockResolvedValue(makePlan());

    await duplicatePlanUseCase(plan, COACH_ID, mockRepo as any);

    const calledName: string = mockRepo.createPlan.mock.calls[0][0].name;
    expect(calledName.length).toBeLessThanOrEqual(100);
    expect(calledName).toBe(('(Copia) ' + longName).substring(0, 100));
  });

  it('copia el tipo, descripción y macros del plan original', async () => {
    const plan = makePlan();
    mockRepo.createPlan.mockResolvedValue(makePlan());

    await duplicatePlanUseCase(plan, COACH_ID, mockRepo as any);

    expect(mockRepo.createPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        coachId:           COACH_ID,
        type:              plan.type,
        description:       plan.description,
        dailyTargetMacros: plan.dailyTargetMacros,
      }),
    );
  });

  it('copia las comidas del plan original con nombre, orden, macros y notas', async () => {
    const plan = makePlan();
    mockRepo.createPlan.mockResolvedValue(makePlan());

    await duplicatePlanUseCase(plan, COACH_ID, mockRepo as any);

    const meals = mockRepo.createPlan.mock.calls[0][0].meals;
    expect(meals).toHaveLength(1);
    expect(meals[0]).toMatchObject({
      name:         'Desayuno',
      order:        1,
      targetMacros: { calories: 400, proteinG: 30, carbsG: 50, fatG: 10 },
    });
  });

  it('duplica correctamente un plan sin comidas', async () => {
    const plan = makePlan({ meals: [] });
    mockRepo.createPlan.mockResolvedValue(makePlan({ meals: [] }));

    await duplicatePlanUseCase(plan, COACH_ID, mockRepo as any);

    const meals = mockRepo.createPlan.mock.calls[0][0].meals;
    expect(meals).toHaveLength(0);
  });

  it('devuelve el plan creado por el repositorio', async () => {
    const plan = makePlan();
    const copy = makePlan({ id: 'copy-id', name: '(Copia) Plan base' });
    mockRepo.createPlan.mockResolvedValue(copy);

    const result = await duplicatePlanUseCase(plan, COACH_ID, mockRepo as any);

    expect(result).toEqual(copy);
  });

  it('lanza error cuando coachId está vacío', async () => {
    const plan = makePlan();

    await expect(duplicatePlanUseCase(plan, '', mockRepo as any)).rejects.toThrow('coachId is required');
    expect(mockRepo.createPlan).not.toHaveBeenCalled();
  });

  it('propaga el error del repositorio', async () => {
    mockRepo.createPlan.mockRejectedValue(new Error('DB insert failed'));

    await expect(duplicatePlanUseCase(makePlan(), COACH_ID, mockRepo as any)).rejects.toThrow('DB insert failed');
  });
});

// ── assignPlansToAthleteUseCase ───────────────────────────────────────────────

describe('assignPlansToAthleteUseCase', () => {
  it('llama a assignToAthlete una vez por cada planId', async () => {
    mockRepo.assignToAthlete.mockResolvedValue(undefined);

    await assignPlansToAthleteUseCase([PLAN_ID_A, PLAN_ID_B], ATHLETE_ID, mockRepo as any);

    expect(mockRepo.assignToAthlete).toHaveBeenCalledTimes(2);
    expect(mockRepo.assignToAthlete).toHaveBeenCalledWith(PLAN_ID_A, ATHLETE_ID);
    expect(mockRepo.assignToAthlete).toHaveBeenCalledWith(PLAN_ID_B, ATHLETE_ID);
  });

  it('funciona correctamente con un único planId', async () => {
    mockRepo.assignToAthlete.mockResolvedValue(undefined);

    await assignPlansToAthleteUseCase([PLAN_ID_A], ATHLETE_ID, mockRepo as any);

    expect(mockRepo.assignToAthlete).toHaveBeenCalledTimes(1);
    expect(mockRepo.assignToAthlete).toHaveBeenCalledWith(PLAN_ID_A, ATHLETE_ID);
  });

  it('lanza error cuando athleteId está vacío', async () => {
    await expect(
      assignPlansToAthleteUseCase([PLAN_ID_A], '', mockRepo as any),
    ).rejects.toThrow('athleteId is required');
    expect(mockRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('lanza error cuando planIds es un array vacío', async () => {
    await expect(
      assignPlansToAthleteUseCase([], ATHLETE_ID, mockRepo as any),
    ).rejects.toThrow('planIds must not be empty');
    expect(mockRepo.assignToAthlete).not.toHaveBeenCalled();
  });

  it('propaga el error del repo si assignToAthlete falla', async () => {
    mockRepo.assignToAthlete.mockRejectedValue(new Error('DB error'));

    await expect(
      assignPlansToAthleteUseCase([PLAN_ID_A], ATHLETE_ID, mockRepo as any),
    ).rejects.toThrow('DB error');
  });

  it('no llama a assignToAthlete con planes posteriores si uno falla', async () => {
    mockRepo.assignToAthlete
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('second fails'));

    await expect(
      assignPlansToAthleteUseCase([PLAN_ID_A, PLAN_ID_B], ATHLETE_ID, mockRepo as any),
    ).rejects.toThrow('second fails');

    expect(mockRepo.assignToAthlete).toHaveBeenCalledTimes(2);
  });
});

// ── linkRecipeToMealUseCase ───────────────────────────────────────────────────

describe('linkRecipeToMealUseCase', () => {
  it('llama a repo.linkRecipeToMeal con mealId y recipeId correctos', async () => {
    mockRepo.linkRecipeToMeal.mockResolvedValue(undefined);

    await linkRecipeToMealUseCase(MEAL_ID, RECIPE_ID, mockRepo as any);

    expect(mockRepo.linkRecipeToMeal).toHaveBeenCalledWith(MEAL_ID, RECIPE_ID);
  });

  it('lanza error cuando mealId está vacío', async () => {
    await expect(
      linkRecipeToMealUseCase('', RECIPE_ID, mockRepo as any),
    ).rejects.toThrow('mealId is required');
    expect(mockRepo.linkRecipeToMeal).not.toHaveBeenCalled();
  });

  it('lanza error cuando recipeId está vacío', async () => {
    await expect(
      linkRecipeToMealUseCase(MEAL_ID, '', mockRepo as any),
    ).rejects.toThrow('recipeId is required');
    expect(mockRepo.linkRecipeToMeal).not.toHaveBeenCalled();
  });

  it('propaga el error del repositorio', async () => {
    mockRepo.linkRecipeToMeal.mockRejectedValue(new Error('DB insert failed'));

    await expect(
      linkRecipeToMealUseCase(MEAL_ID, RECIPE_ID, mockRepo as any),
    ).rejects.toThrow('DB insert failed');
  });
});

// ── unlinkRecipeFromMealUseCase ───────────────────────────────────────────────

describe('unlinkRecipeFromMealUseCase', () => {
  it('llama a repo.unlinkRecipeFromMeal con mealId y recipeId correctos', async () => {
    mockRepo.unlinkRecipeFromMeal.mockResolvedValue(undefined);

    await unlinkRecipeFromMealUseCase(MEAL_ID, RECIPE_ID, mockRepo as any);

    expect(mockRepo.unlinkRecipeFromMeal).toHaveBeenCalledWith(MEAL_ID, RECIPE_ID);
  });

  it('lanza error cuando mealId está vacío', async () => {
    await expect(
      unlinkRecipeFromMealUseCase('', RECIPE_ID, mockRepo as any),
    ).rejects.toThrow('mealId is required');
    expect(mockRepo.unlinkRecipeFromMeal).not.toHaveBeenCalled();
  });

  it('lanza error cuando recipeId está vacío', async () => {
    await expect(
      unlinkRecipeFromMealUseCase(MEAL_ID, '', mockRepo as any),
    ).rejects.toThrow('recipeId is required');
    expect(mockRepo.unlinkRecipeFromMeal).not.toHaveBeenCalled();
  });

  it('propaga el error del repositorio', async () => {
    mockRepo.unlinkRecipeFromMeal.mockRejectedValue(new Error('DB delete failed'));

    await expect(
      unlinkRecipeFromMealUseCase(MEAL_ID, RECIPE_ID, mockRepo as any),
    ).rejects.toThrow('DB delete failed');
  });
});

// ── createPlanGroupUseCase ────────────────────────────────────────────────────

describe('createPlanGroupUseCase', () => {
  it('llama al repo con los datos validados y devuelve el grupo', async () => {
    const group = makeGroup();
    mockRepo.createPlanGroup.mockResolvedValue(group);

    const result = await createPlanGroupUseCase(
      { coachId: COACH_ID, name: 'Grupo A', description: 'Descripción' },
      mockRepo as any,
    );

    expect(mockRepo.createPlanGroup).toHaveBeenCalledWith(
      expect.objectContaining({ coachId: COACH_ID, name: 'Grupo A' }),
    );
    expect(result).toEqual(group);
  });

  it('lanza ZodError si el nombre está vacío', async () => {
    await expect(
      createPlanGroupUseCase({ coachId: COACH_ID, name: '' }, mockRepo as any),
    ).rejects.toThrow();
    expect(mockRepo.createPlanGroup).not.toHaveBeenCalled();
  });

  it('lanza ZodError si el coachId no es UUID válido', async () => {
    await expect(
      createPlanGroupUseCase({ coachId: 'invalid', name: 'Grupo' }, mockRepo as any),
    ).rejects.toThrow();
    expect(mockRepo.createPlanGroup).not.toHaveBeenCalled();
  });

  it('crea grupo sin descripción cuando no se pasa', async () => {
    const group = makeGroup({ description: undefined });
    mockRepo.createPlanGroup.mockResolvedValue(group);

    await createPlanGroupUseCase({ coachId: COACH_ID, name: 'Grupo sin desc' }, mockRepo as any);

    expect(mockRepo.createPlanGroup).toHaveBeenCalledWith(
      expect.not.objectContaining({ description: expect.anything() }),
    );
  });

  it('propaga el error del repositorio', async () => {
    mockRepo.createPlanGroup.mockRejectedValue(new Error('Insert failed'));

    await expect(
      createPlanGroupUseCase({ coachId: COACH_ID, name: 'Grupo' }, mockRepo as any),
    ).rejects.toThrow('Insert failed');
  });
});

// ── deletePlanGroupUseCase ────────────────────────────────────────────────────

describe('deletePlanGroupUseCase', () => {
  it('llama a repo.deletePlanGroup con el groupId correcto', async () => {
    mockRepo.deletePlanGroup.mockResolvedValue();

    await deletePlanGroupUseCase(GROUP_ID, mockRepo as any);

    expect(mockRepo.deletePlanGroup).toHaveBeenCalledWith(GROUP_ID);
  });

  it('lanza si groupId está vacío', async () => {
    await expect(
      deletePlanGroupUseCase('', mockRepo as any),
    ).rejects.toThrow('groupId is required');
    expect(mockRepo.deletePlanGroup).not.toHaveBeenCalled();
  });

  it('propaga el error del repositorio', async () => {
    mockRepo.deletePlanGroup.mockRejectedValue(new Error('Delete failed'));

    await expect(
      deletePlanGroupUseCase(GROUP_ID, mockRepo as any),
    ).rejects.toThrow('Delete failed');
  });
});

// ── getPlanGroupsUseCase ──────────────────────────────────────────────────────

describe('getPlanGroupsUseCase', () => {
  it('devuelve la lista de grupos del coach', async () => {
    const groups = [makeGroup(), makeGroup({ id: 'gggggggg-0000-4000-b000-000000000002', name: 'Grupo B' })];
    mockRepo.getPlanGroups.mockResolvedValue(groups);

    const result = await getPlanGroupsUseCase(COACH_ID, mockRepo as any);

    expect(result).toEqual(groups);
    expect(mockRepo.getPlanGroups).toHaveBeenCalledWith(COACH_ID);
  });

  it('devuelve array vacío si el coach no tiene grupos', async () => {
    mockRepo.getPlanGroups.mockResolvedValue([]);

    const result = await getPlanGroupsUseCase(COACH_ID, mockRepo as any);

    expect(result).toEqual([]);
  });

  it('lanza si coachId está vacío', async () => {
    await expect(
      getPlanGroupsUseCase('', mockRepo as any),
    ).rejects.toThrow('coachId is required');
    expect(mockRepo.getPlanGroups).not.toHaveBeenCalled();
  });
});

// ── getPlanGroupDetailUseCase ─────────────────────────────────────────────────

describe('getPlanGroupDetailUseCase', () => {
  it('devuelve el detalle con grupo y planes', async () => {
    const group = makeGroup({ planCount: 1 });
    const plan  = makePlan();
    mockRepo.getPlanGroupDetail.mockResolvedValue({ group, plans: [plan] });

    const result = await getPlanGroupDetailUseCase(GROUP_ID, mockRepo as any);

    expect(result.group).toEqual(group);
    expect(result.plans).toHaveLength(1);
  });

  it('lanza si groupId está vacío', async () => {
    await expect(
      getPlanGroupDetailUseCase('', mockRepo as any),
    ).rejects.toThrow('groupId is required');
    expect(mockRepo.getPlanGroupDetail).not.toHaveBeenCalled();
  });

  it('propaga el error del repositorio', async () => {
    mockRepo.getPlanGroupDetail.mockRejectedValue(new Error('Not found'));

    await expect(
      getPlanGroupDetailUseCase(GROUP_ID, mockRepo as any),
    ).rejects.toThrow('Not found');
  });
});

// ── addPlanToGroupUseCase ─────────────────────────────────────────────────────

describe('addPlanToGroupUseCase', () => {
  it('llama al repo con groupId y planId correctos', async () => {
    mockRepo.addPlanToGroup.mockResolvedValue();

    await addPlanToGroupUseCase(GROUP_ID, PLAN_ID_A, mockRepo as any);

    expect(mockRepo.addPlanToGroup).toHaveBeenCalledWith(GROUP_ID, PLAN_ID_A);
  });

  it('lanza si groupId está vacío', async () => {
    await expect(
      addPlanToGroupUseCase('', PLAN_ID_A, mockRepo as any),
    ).rejects.toThrow('groupId is required');
    expect(mockRepo.addPlanToGroup).not.toHaveBeenCalled();
  });

  it('lanza si planId está vacío', async () => {
    await expect(
      addPlanToGroupUseCase(GROUP_ID, '', mockRepo as any),
    ).rejects.toThrow('planId is required');
    expect(mockRepo.addPlanToGroup).not.toHaveBeenCalled();
  });

  it('propaga el error del repositorio', async () => {
    mockRepo.addPlanToGroup.mockRejectedValue(new Error('Upsert failed'));

    await expect(
      addPlanToGroupUseCase(GROUP_ID, PLAN_ID_A, mockRepo as any),
    ).rejects.toThrow('Upsert failed');
  });
});

// ── removePlanFromGroupUseCase ────────────────────────────────────────────────

describe('removePlanFromGroupUseCase', () => {
  it('llama al repo con groupId y planId correctos', async () => {
    mockRepo.removePlanFromGroup.mockResolvedValue();

    await removePlanFromGroupUseCase(GROUP_ID, PLAN_ID_A, mockRepo as any);

    expect(mockRepo.removePlanFromGroup).toHaveBeenCalledWith(GROUP_ID, PLAN_ID_A);
  });

  it('lanza si groupId está vacío', async () => {
    await expect(
      removePlanFromGroupUseCase('', PLAN_ID_A, mockRepo as any),
    ).rejects.toThrow('groupId is required');
    expect(mockRepo.removePlanFromGroup).not.toHaveBeenCalled();
  });

  it('lanza si planId está vacío', async () => {
    await expect(
      removePlanFromGroupUseCase(GROUP_ID, '', mockRepo as any),
    ).rejects.toThrow('planId is required');
    expect(mockRepo.removePlanFromGroup).not.toHaveBeenCalled();
  });

  it('propaga el error del repositorio', async () => {
    mockRepo.removePlanFromGroup.mockRejectedValue(new Error('Delete failed'));

    await expect(
      removePlanFromGroupUseCase(GROUP_ID, PLAN_ID_A, mockRepo as any),
    ).rejects.toThrow('Delete failed');
  });
});
