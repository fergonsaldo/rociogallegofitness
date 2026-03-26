import { act } from 'react';
import { useFoodStore } from '../../../src/presentation/stores/foodStore';
import { Food, UpdateFoodInput } from '../../../src/domain/entities/Food';

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock('../../../src/application/coach/FoodUseCases', () => ({
  getFoodsUseCase:  jest.fn(),
  createFoodUseCase: jest.fn(),
  editFoodUseCase:  jest.fn(),
  deleteFoodUseCase: jest.fn(),
}));

jest.mock('../../../src/infrastructure/supabase/remote/FoodRemoteRepository', () => ({
  FoodRemoteRepository: jest.fn().mockImplementation(() => ({})),
}));

import {
  getFoodsUseCase,
  createFoodUseCase,
  editFoodUseCase,
  deleteFoodUseCase,
} from '../../../src/application/coach/FoodUseCases';

const mockGetFoods  = getFoodsUseCase  as jest.MockedFunction<typeof getFoodsUseCase>;
const mockCreate    = createFoodUseCase as jest.MockedFunction<typeof createFoodUseCase>;
const mockEdit      = editFoodUseCase   as jest.MockedFunction<typeof editFoodUseCase>;
const mockDelete    = deleteFoodUseCase as jest.MockedFunction<typeof deleteFoodUseCase>;

// ── Fixtures ───────────────────────────────────────────────────────────────────

const COACH_ID = '00000000-0000-4000-b000-000000000001';
const NOW      = new Date('2024-01-01');

function makeFood(overrides: Partial<Food> = {}): Food {
  return {
    id:              'aaaaaaaa-0000-4000-b000-000000000001',
    coachId:         COACH_ID,
    name:            'Pechuga de pollo',
    type:            'generic',
    caloriesPer100g: 165,
    proteinG:        31,
    carbsG:          0,
    fatG:            3.6,
    fiberG:          0,
    createdAt:       NOW,
    ...overrides,
  };
}

const GENERIC_FOOD = makeFood({ coachId: null, id: 'bbbbbbbb-0000-4000-b000-000000000001', name: 'Arroz blanco' });
const OWN_FOOD     = makeFood({ coachId: COACH_ID, id: 'cccccccc-0000-4000-b000-000000000001', name: 'Mi mezcla' });

const VALID_UPDATE: UpdateFoodInput = {
  name:            'Pechuga editada',
  type:            'specific',
  caloriesPer100g: 160,
  proteinG:        32,
  carbsG:          0,
  fatG:            3,
  fiberG:          0,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function resetStore() {
  useFoodStore.setState({ foods: [], isLoading: false, isSubmitting: false, error: null });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

// ── fetchFoods ─────────────────────────────────────────────────────────────────

describe('useFoodStore — fetchFoods', () => {
  it('carga alimentos y los guarda en el estado', async () => {
    const foods = [GENERIC_FOOD, OWN_FOOD];
    mockGetFoods.mockResolvedValue(foods);

    await act(async () => { await useFoodStore.getState().fetchFoods(COACH_ID); });

    expect(useFoodStore.getState().foods).toEqual(foods);
    expect(useFoodStore.getState().isLoading).toBe(false);
    expect(useFoodStore.getState().error).toBeNull();
  });

  it('isLoading es true durante la carga y false al terminar', async () => {
    const states: boolean[] = [];
    mockGetFoods.mockImplementation(() => {
      states.push(useFoodStore.getState().isLoading);
      return Promise.resolve([]);
    });

    await act(async () => { await useFoodStore.getState().fetchFoods(COACH_ID); });

    expect(states[0]).toBe(true);
    expect(useFoodStore.getState().isLoading).toBe(false);
  });

  it('setea error en el estado cuando el use case falla', async () => {
    mockGetFoods.mockRejectedValue(new Error('Network error'));

    await act(async () => { await useFoodStore.getState().fetchFoods(COACH_ID); });

    expect(useFoodStore.getState().error).toBe('Network error');
    expect(useFoodStore.getState().isLoading).toBe(false);
  });

  it('usa el fallback string cuando el error no tiene mensaje', async () => {
    mockGetFoods.mockRejectedValue('unexpected string error');

    await act(async () => { await useFoodStore.getState().fetchFoods(COACH_ID); });

    expect(useFoodStore.getState().error).toBeTruthy();
  });

  it('limpia el error previo al inicio de fetchFoods', async () => {
    useFoodStore.setState({ error: 'error previo' });
    mockGetFoods.mockResolvedValue([]);

    await act(async () => { await useFoodStore.getState().fetchFoods(COACH_ID); });

    expect(useFoodStore.getState().error).toBeNull();
  });
});

// ── createFood ─────────────────────────────────────────────────────────────────

describe('useFoodStore — createFood', () => {
  const newFood = makeFood({ id: 'dddddddd-0000-4000-b000-000000000001', name: 'Nuevo' });

  it('añade el alimento al estado ordenado alfabéticamente', async () => {
    useFoodStore.setState({ foods: [OWN_FOOD] });
    mockCreate.mockResolvedValue(newFood);

    await act(async () => { await useFoodStore.getState().createFood({} as any); });

    const foods = useFoodStore.getState().foods;
    expect(foods).toContainEqual(newFood);
    expect(foods.map((f) => f.name)).toEqual(
      [...foods.map((f) => f.name)].sort((a, b) => a.localeCompare(b)),
    );
  });

  it('devuelve el alimento creado en caso de éxito', async () => {
    mockCreate.mockResolvedValue(newFood);

    let result: Food | null = null;
    await act(async () => { result = await useFoodStore.getState().createFood({} as any); });

    expect(result).toEqual(newFood);
  });

  it('devuelve null y setea error en caso de fallo', async () => {
    mockCreate.mockRejectedValue(new Error('Create failed'));

    let result: Food | null = makeFood();
    await act(async () => { result = await useFoodStore.getState().createFood({} as any); });

    expect(result).toBeNull();
    expect(useFoodStore.getState().error).toBe('Create failed');
  });

  it('isSubmitting es true durante la operación y false al terminar', async () => {
    const states: boolean[] = [];
    mockCreate.mockImplementation(() => {
      states.push(useFoodStore.getState().isSubmitting);
      return Promise.resolve(newFood);
    });

    await act(async () => { await useFoodStore.getState().createFood({} as any); });

    expect(states[0]).toBe(true);
    expect(useFoodStore.getState().isSubmitting).toBe(false);
  });
});

// ── editFood ───────────────────────────────────────────────────────────────────

describe('useFoodStore — editFood', () => {
  it('reemplaza el alimento en el estado cuando se edita uno propio', async () => {
    const updated = { ...OWN_FOOD, name: VALID_UPDATE.name };
    useFoodStore.setState({ foods: [OWN_FOOD, GENERIC_FOOD] });
    mockEdit.mockResolvedValue(updated);

    await act(async () => {
      await useFoodStore.getState().editFood(OWN_FOOD, VALID_UPDATE, COACH_ID);
    });

    const foods = useFoodStore.getState().foods;
    expect(foods.find((f) => f.id === OWN_FOOD.id)).toEqual(updated);
    expect(foods).toHaveLength(2);
  });

  it('añade el alimento clonado al estado cuando se edita uno genérico', async () => {
    const cloned = makeFood({ id: 'eeeeeeee-0000-4000-b000-000000000001', coachId: COACH_ID, name: VALID_UPDATE.name });
    useFoodStore.setState({ foods: [GENERIC_FOOD] });
    mockEdit.mockResolvedValue(cloned);

    await act(async () => {
      await useFoodStore.getState().editFood(GENERIC_FOOD, VALID_UPDATE, COACH_ID);
    });

    const foods = useFoodStore.getState().foods;
    expect(foods).toContainEqual(cloned);
    expect(foods).toContainEqual(GENERIC_FOOD);
  });

  it('mantiene la lista ordenada alfabéticamente al clonar un genérico', async () => {
    const foodA  = makeFood({ id: 'id-a', name: 'Avena', coachId: null });
    const foodZ  = makeFood({ id: 'id-z', name: 'Zanahoria', coachId: null });
    const cloned = makeFood({ id: 'id-m', name: 'Manzana', coachId: COACH_ID });
    useFoodStore.setState({ foods: [foodA, foodZ] });
    mockEdit.mockResolvedValue(cloned);

    await act(async () => {
      await useFoodStore.getState().editFood(foodA, VALID_UPDATE, COACH_ID);
    });

    const names = useFoodStore.getState().foods.map((f) => f.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('devuelve el alimento editado en caso de éxito', async () => {
    const updated = { ...OWN_FOOD, name: VALID_UPDATE.name };
    useFoodStore.setState({ foods: [OWN_FOOD] });
    mockEdit.mockResolvedValue(updated);

    let result: Food | null = null;
    await act(async () => {
      result = await useFoodStore.getState().editFood(OWN_FOOD, VALID_UPDATE, COACH_ID);
    });

    expect(result).toEqual(updated);
  });

  it('devuelve null y setea error en caso de fallo', async () => {
    useFoodStore.setState({ foods: [OWN_FOOD] });
    mockEdit.mockRejectedValue(new Error('Edit failed'));

    let result: Food | null = makeFood();
    await act(async () => {
      result = await useFoodStore.getState().editFood(OWN_FOOD, VALID_UPDATE, COACH_ID);
    });

    expect(result).toBeNull();
    expect(useFoodStore.getState().error).toBe('Edit failed');
  });

  it('isSubmitting es true durante la operación y false al terminar', async () => {
    const states: boolean[] = [];
    mockEdit.mockImplementation(() => {
      states.push(useFoodStore.getState().isSubmitting);
      return Promise.resolve({ ...OWN_FOOD });
    });
    useFoodStore.setState({ foods: [OWN_FOOD] });

    await act(async () => {
      await useFoodStore.getState().editFood(OWN_FOOD, VALID_UPDATE, COACH_ID);
    });

    expect(states[0]).toBe(true);
    expect(useFoodStore.getState().isSubmitting).toBe(false);
  });

  it('limpia el error previo al inicio de editFood', async () => {
    useFoodStore.setState({ foods: [OWN_FOOD], error: 'error previo' });
    mockEdit.mockResolvedValue({ ...OWN_FOOD });

    await act(async () => {
      await useFoodStore.getState().editFood(OWN_FOOD, VALID_UPDATE, COACH_ID);
    });

    expect(useFoodStore.getState().error).toBeNull();
  });

  it('usa el fallback string cuando el error no tiene mensaje', async () => {
    useFoodStore.setState({ foods: [OWN_FOOD] });
    mockEdit.mockRejectedValue('unexpected');

    await act(async () => {
      await useFoodStore.getState().editFood(OWN_FOOD, VALID_UPDATE, COACH_ID);
    });

    expect(useFoodStore.getState().error).toBeTruthy();
  });
});

// ── deleteFood ─────────────────────────────────────────────────────────────────

describe('useFoodStore — deleteFood', () => {
  it('elimina el alimento del estado en caso de éxito', async () => {
    useFoodStore.setState({ foods: [OWN_FOOD, GENERIC_FOOD] });
    mockDelete.mockResolvedValue(undefined);

    await act(async () => { await useFoodStore.getState().deleteFood(OWN_FOOD.id); });

    expect(useFoodStore.getState().foods).toEqual([GENERIC_FOOD]);
  });

  it('setea error cuando el use case falla', async () => {
    useFoodStore.setState({ foods: [OWN_FOOD] });
    mockDelete.mockRejectedValue(new Error('Delete failed'));

    await act(async () => { await useFoodStore.getState().deleteFood(OWN_FOOD.id); });

    expect(useFoodStore.getState().error).toBe('Delete failed');
    expect(useFoodStore.getState().foods).toEqual([OWN_FOOD]);
  });
});

// ── clearError ─────────────────────────────────────────────────────────────────

describe('useFoodStore — clearError', () => {
  it('limpia el error del estado', () => {
    useFoodStore.setState({ error: 'algún error' });
    useFoodStore.getState().clearError();
    expect(useFoodStore.getState().error).toBeNull();
  });
});
