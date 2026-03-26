import { act } from 'react';
import { useRecipeStore } from '../../../src/presentation/stores/recipeStore';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../../src/application/coach/RecipeUseCases', () => ({
  getRecipesUseCase:                jest.fn(),
  getRecipeDetailUseCase:           jest.fn(),
  createRecipeUseCase:              jest.fn(),
  updateRecipeUseCase:              jest.fn(),
  deleteRecipeUseCase:              jest.fn(),
  setAllRecipesVisibilityUseCase:   jest.fn(),
  filterRecipes:                    jest.fn(),
  computeRecipeMacros:              jest.fn(),
}));

jest.mock('../../../src/infrastructure/supabase/remote/RecipeRemoteRepository', () => ({
  RecipeRemoteRepository: jest.fn().mockImplementation(() => ({
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
  })),
}));

import { setAllRecipesVisibilityUseCase } from '../../../src/application/coach/RecipeUseCases';
import { Recipe } from '../../../src/domain/entities/Recipe';

const mockSetAllVisibility = setAllRecipesVisibilityUseCase as jest.MockedFunction<typeof setAllRecipesVisibilityUseCase>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID   = '00000000-0000-4000-b000-000000000001';
const RECIPE_ID_A = 'aaaaaaaa-0000-4000-b000-000000000001';
const RECIPE_ID_B = 'bbbbbbbb-0000-4000-b000-000000000002';
const NOW         = new Date('2024-01-01');

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id:               RECIPE_ID_A,
    coachId:          COACH_ID,
    name:             'Bowl de pollo',
    instructions:     null,
    imagePath:        null,
    imageUrl:         null,
    tags:             [],
    showMacros:       true,
    visibleToClients: true,
    createdAt:        NOW,
    updatedAt:        NOW,
    ...overrides,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function resetStore() {
  useRecipeStore.setState({
    recipes: [], currentRecipe: null,
    isListLoading: false, isDetailLoading: false,
    isSubmitting: false, error: null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

// ── setAllVisibility ──────────────────────────────────────────────────────────

describe('useRecipeStore — setAllVisibility', () => {
  it('actualiza visibleToClients=true en todas las recetas en caso de éxito', async () => {
    const recipeA = makeRecipe({ id: RECIPE_ID_A, visibleToClients: false });
    const recipeB = makeRecipe({ id: RECIPE_ID_B, visibleToClients: false });
    useRecipeStore.setState({ recipes: [recipeA, recipeB] });
    mockSetAllVisibility.mockResolvedValue();

    let result: boolean | undefined;
    await act(async () => {
      result = await useRecipeStore.getState().setAllVisibility(COACH_ID, true);
    });

    expect(result).toBe(true);
    const recipes = useRecipeStore.getState().recipes;
    expect(recipes.every((r) => r.visibleToClients === true)).toBe(true);
  });

  it('actualiza visibleToClients=false en todas las recetas en caso de éxito', async () => {
    const recipeA = makeRecipe({ id: RECIPE_ID_A, visibleToClients: true });
    const recipeB = makeRecipe({ id: RECIPE_ID_B, visibleToClients: true });
    useRecipeStore.setState({ recipes: [recipeA, recipeB] });
    mockSetAllVisibility.mockResolvedValue();

    await act(async () => {
      await useRecipeStore.getState().setAllVisibility(COACH_ID, false);
    });

    const recipes = useRecipeStore.getState().recipes;
    expect(recipes.every((r) => r.visibleToClients === false)).toBe(true);
  });

  it('devuelve false y setea error en caso de fallo', async () => {
    mockSetAllVisibility.mockRejectedValue(new Error('DB update failed'));

    let result: boolean | undefined;
    await act(async () => {
      result = await useRecipeStore.getState().setAllVisibility(COACH_ID, true);
    });

    expect(result).toBe(false);
    expect(useRecipeStore.getState().error).toBe('DB update failed');
  });

  it('usa fallback string si el error no tiene mensaje', async () => {
    mockSetAllVisibility.mockRejectedValue('unexpected');

    await act(async () => {
      await useRecipeStore.getState().setAllVisibility(COACH_ID, true);
    });

    expect(useRecipeStore.getState().error).toBeTruthy();
  });

  it('isSubmitting es true durante la operación y false al terminar', async () => {
    const states: boolean[] = [];
    mockSetAllVisibility.mockImplementation(() => {
      states.push(useRecipeStore.getState().isSubmitting);
      return Promise.resolve();
    });

    await act(async () => {
      await useRecipeStore.getState().setAllVisibility(COACH_ID, true);
    });

    expect(states[0]).toBe(true);
    expect(useRecipeStore.getState().isSubmitting).toBe(false);
  });

  it('limpia el error previo al inicio de la operación', async () => {
    useRecipeStore.setState({ error: 'error previo' });
    mockSetAllVisibility.mockResolvedValue();

    await act(async () => {
      await useRecipeStore.getState().setAllVisibility(COACH_ID, true);
    });

    expect(useRecipeStore.getState().error).toBeNull();
  });

  it('llama al use case con los parámetros correctos', async () => {
    mockSetAllVisibility.mockResolvedValue();

    await act(async () => {
      await useRecipeStore.getState().setAllVisibility(COACH_ID, false);
    });

    expect(mockSetAllVisibility).toHaveBeenCalledWith(COACH_ID, false, expect.anything());
  });

  it('no modifica las recetas si la lista está vacía', async () => {
    useRecipeStore.setState({ recipes: [] });
    mockSetAllVisibility.mockResolvedValue();

    await act(async () => {
      await useRecipeStore.getState().setAllVisibility(COACH_ID, true);
    });

    expect(useRecipeStore.getState().recipes).toHaveLength(0);
  });
});
