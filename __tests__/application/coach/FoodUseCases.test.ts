import {
  getFoodsUseCase,
  createFoodUseCase,
  deleteFoodUseCase,
  filterFoods,
} from '../../../src/application/coach/FoodUseCases';
import { IFoodRepository } from '../../../src/domain/repositories/IFoodRepository';
import { Food } from '../../../src/domain/entities/Food';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID  = '00000000-0000-4000-b000-000000000001';
const COACH_ID2 = '00000000-0000-4000-b000-000000000002';
const FOOD_ID   = 'aaaaaaaa-0000-4000-b000-000000000001';

const makeFood = (overrides: Partial<Food> = {}): Food => ({
  id:              FOOD_ID,
  coachId:         null,
  name:            'Pechuga de pollo',
  type:            'generic',
  caloriesPer100g: 165,
  proteinG:        31,
  carbsG:          0,
  fatG:            3.6,
  fiberG:          0,
  createdAt:       new Date('2024-01-01'),
  ...overrides,
});

const mockRepo: jest.Mocked<IFoodRepository> = {
  getFoodsByCoach: jest.fn(),
  createFood:      jest.fn(),
  deleteFood:      jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── getFoodsUseCase ───────────────────────────────────────────────────────────

describe('getFoodsUseCase', () => {
  it('devuelve alimentos del repositorio para un coachId válido', async () => {
    const foods = [makeFood()];
    mockRepo.getFoodsByCoach.mockResolvedValue(foods);

    const result = await getFoodsUseCase(COACH_ID, mockRepo);

    expect(result).toEqual(foods);
    expect(mockRepo.getFoodsByCoach).toHaveBeenCalledWith(COACH_ID);
  });

  it('lanza error si coachId está vacío', async () => {
    await expect(getFoodsUseCase('', mockRepo)).rejects.toThrow('coachId is required');
    expect(mockRepo.getFoodsByCoach).not.toHaveBeenCalled();
  });

  it('propaga errores del repositorio', async () => {
    mockRepo.getFoodsByCoach.mockRejectedValue(new Error('DB error'));
    await expect(getFoodsUseCase(COACH_ID, mockRepo)).rejects.toThrow('DB error');
  });

  it('devuelve lista vacía si no hay alimentos', async () => {
    mockRepo.getFoodsByCoach.mockResolvedValue([]);
    const result = await getFoodsUseCase(COACH_ID, mockRepo);
    expect(result).toEqual([]);
  });
});

// ── createFoodUseCase ─────────────────────────────────────────────────────────

describe('createFoodUseCase', () => {
  const validInput = {
    coachId:         COACH_ID,
    name:            'Huevo entero',
    type:            'generic' as const,
    caloriesPer100g: 155,
    proteinG:        13,
    carbsG:          1.1,
    fatG:            11,
    fiberG:          0,
  };

  it('crea un alimento con input válido', async () => {
    const created = makeFood({ ...validInput });
    mockRepo.createFood.mockResolvedValue(created);

    const result = await createFoodUseCase(validInput, mockRepo);

    expect(result).toEqual(created);
    expect(mockRepo.createFood).toHaveBeenCalledWith(validInput);
  });

  it('lanza ZodError si el nombre está vacío', async () => {
    await expect(createFoodUseCase({ ...validInput, name: '' }, mockRepo)).rejects.toThrow();
    expect(mockRepo.createFood).not.toHaveBeenCalled();
  });

  it('lanza ZodError si el nombre supera 100 caracteres', async () => {
    await expect(createFoodUseCase({ ...validInput, name: 'a'.repeat(101) }, mockRepo)).rejects.toThrow();
    expect(mockRepo.createFood).not.toHaveBeenCalled();
  });

  it('lanza ZodError si el tipo no es válido', async () => {
    await expect(createFoodUseCase({ ...validInput, type: 'unknown' as any }, mockRepo)).rejects.toThrow();
    expect(mockRepo.createFood).not.toHaveBeenCalled();
  });

  it('lanza ZodError si caloriesPer100g es negativo', async () => {
    await expect(createFoodUseCase({ ...validInput, caloriesPer100g: -1 }, mockRepo)).rejects.toThrow();
    expect(mockRepo.createFood).not.toHaveBeenCalled();
  });

  it('lanza ZodError si proteinG supera 100', async () => {
    await expect(createFoodUseCase({ ...validInput, proteinG: 101 }, mockRepo)).rejects.toThrow();
    expect(mockRepo.createFood).not.toHaveBeenCalled();
  });

  it('lanza ZodError si coachId no es UUID válido', async () => {
    await expect(createFoodUseCase({ ...validInput, coachId: 'no-es-uuid' }, mockRepo)).rejects.toThrow();
    expect(mockRepo.createFood).not.toHaveBeenCalled();
  });

  it('acepta todos los tipos de food válidos', async () => {
    for (const type of ['generic', 'specific', 'supplement'] as const) {
      mockRepo.createFood.mockResolvedValue(makeFood({ type }));
      await expect(createFoodUseCase({ ...validInput, type }, mockRepo)).resolves.toBeDefined();
    }
  });

  it('propaga errores del repositorio', async () => {
    mockRepo.createFood.mockRejectedValue(new Error('Insert failed'));
    await expect(createFoodUseCase(validInput, mockRepo)).rejects.toThrow('Insert failed');
  });
});

// ── deleteFoodUseCase ─────────────────────────────────────────────────────────

describe('deleteFoodUseCase', () => {
  it('elimina un alimento por id', async () => {
    mockRepo.deleteFood.mockResolvedValue(undefined);
    await expect(deleteFoodUseCase(FOOD_ID, mockRepo)).resolves.toBeUndefined();
    expect(mockRepo.deleteFood).toHaveBeenCalledWith(FOOD_ID);
  });

  it('lanza error si id está vacío', async () => {
    await expect(deleteFoodUseCase('', mockRepo)).rejects.toThrow('id is required');
    expect(mockRepo.deleteFood).not.toHaveBeenCalled();
  });

  it('propaga errores del repositorio', async () => {
    mockRepo.deleteFood.mockRejectedValue(new Error('Delete failed'));
    await expect(deleteFoodUseCase(FOOD_ID, mockRepo)).rejects.toThrow('Delete failed');
  });
});

// ── filterFoods ───────────────────────────────────────────────────────────────

describe('filterFoods', () => {
  const chicken  = makeFood({ id: '1', name: 'Pechuga de pollo', type: 'generic',    coachId: null });
  const oats     = makeFood({ id: '2', name: 'Avena',            type: 'generic',    coachId: null });
  const whey     = makeFood({ id: '3', name: 'Proteína whey',    type: 'supplement', coachId: null });
  const yogurt   = makeFood({ id: '4', name: 'Yogur griego',     type: 'specific',   coachId: null });
  const ownFood  = makeFood({ id: '5', name: 'Mi mezcla custom', type: 'generic',    coachId: COACH_ID });
  const otherOwn = makeFood({ id: '6', name: 'Otro coach',       type: 'specific',   coachId: COACH_ID2 });

  const all = [chicken, oats, whey, yogurt, ownFood, otherOwn];

  it('sin filtros devuelve todos los alimentos', () => {
    expect(filterFoods(all, '', [], false, COACH_ID)).toEqual(all);
  });

  it('filtra por query parcial case-insensitive', () => {
    const result = filterFoods(all, 'prot', [], false, COACH_ID);
    expect(result).toEqual([whey]);
  });

  it('filtra por query con espacios en blanco retorna todos', () => {
    const result = filterFoods(all, '   ', [], false, COACH_ID);
    expect(result).toEqual(all);
  });

  it('filtra por tipo generic', () => {
    const result = filterFoods(all, '', ['generic'], false, COACH_ID);
    expect(result).toEqual([chicken, oats, ownFood]);
  });

  it('filtra por tipo supplement', () => {
    const result = filterFoods(all, '', ['supplement'], false, COACH_ID);
    expect(result).toEqual([whey]);
  });

  it('filtra por múltiples tipos', () => {
    const result = filterFoods(all, '', ['generic', 'specific'], false, COACH_ID);
    expect(result).toEqual([chicken, oats, yogurt, ownFood, otherOwn]);
  });

  it('showOwn devuelve solo los alimentos del coach', () => {
    const result = filterFoods(all, '', [], true, COACH_ID);
    expect(result).toEqual([ownFood]);
  });

  it('showOwn ignora los filtros de tipo', () => {
    const result = filterFoods(all, '', ['supplement'], true, COACH_ID);
    expect(result).toEqual([ownFood]);
  });

  it('combina query y tipo', () => {
    // "Pechuga de pollo" y "Mi mezcla custom" contienen 'o'; "Avena" no
    const result = filterFoods(all, 'o', ['generic'], false, COACH_ID);
    expect(result).toEqual([chicken, ownFood]);
  });

  it('combina query y showOwn', () => {
    const result = filterFoods(all, 'mezcla', [], true, COACH_ID);
    expect(result).toEqual([ownFood]);
  });

  it('devuelve array vacío si query no coincide con nada', () => {
    const result = filterFoods(all, 'xyzzy', [], false, COACH_ID);
    expect(result).toEqual([]);
  });

  it('devuelve array vacío si tipo no tiene coincidencias', () => {
    const noSupp = [chicken, oats, yogurt];
    const result = filterFoods(noSupp, '', ['supplement'], false, COACH_ID);
    expect(result).toEqual([]);
  });

  it('devuelve array vacío si showOwn pero el coach no tiene alimentos propios', () => {
    const result = filterFoods([chicken, oats, whey], '', [], true, COACH_ID);
    expect(result).toEqual([]);
  });

  it('devuelve array vacío con lista de entrada vacía', () => {
    expect(filterFoods([], 'pollo', ['generic'], true, COACH_ID)).toEqual([]);
  });
});
