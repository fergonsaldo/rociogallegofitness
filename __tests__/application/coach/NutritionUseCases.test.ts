import { assignPlansToAthleteUseCase, duplicatePlanUseCase } from '../../../src/application/coach/NutritionUseCases';
import { INutritionRepository } from '../../../src/domain/repositories/INutritionRepository';
import { NutritionPlan } from '../../../src/domain/entities/NutritionPlan';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ATHLETE_ID = '00000000-0000-4000-b000-000000000001';
const PLAN_ID_A  = 'aaaaaaaa-0000-4000-b000-000000000001';
const PLAN_ID_B  = 'bbbbbbbb-0000-4000-b000-000000000002';

const mockRepo: jest.Mocked<Pick<INutritionRepository, 'assignToAthlete' | 'createPlan'>> = {
  assignToAthlete: jest.fn(),
  createPlan:      jest.fn(),
};

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID = '00000000-0000-4000-b000-000000000099';
const NOW      = new Date('2024-01-01');

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
