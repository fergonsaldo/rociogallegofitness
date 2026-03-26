import { assignPlansToAthleteUseCase } from '../../../src/application/coach/NutritionUseCases';
import { INutritionRepository } from '../../../src/domain/repositories/INutritionRepository';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ATHLETE_ID = '00000000-0000-4000-b000-000000000001';
const PLAN_ID_A  = 'aaaaaaaa-0000-4000-b000-000000000001';
const PLAN_ID_B  = 'bbbbbbbb-0000-4000-b000-000000000002';

const mockRepo: jest.Mocked<Pick<INutritionRepository, 'assignToAthlete'>> = {
  assignToAthlete: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

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
