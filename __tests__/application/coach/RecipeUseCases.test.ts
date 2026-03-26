import {
  getRecipesUseCase,
  getRecipeDetailUseCase,
  createRecipeUseCase,
  updateRecipeUseCase,
  deleteRecipeUseCase,
  setAllRecipesVisibilityUseCase,
  filterRecipes,
  computeRecipeMacros,
} from '../../../src/application/coach/RecipeUseCases';
import { IRecipeRepository } from '../../../src/domain/repositories/IRecipeRepository';
import { Recipe, RecipeWithIngredients, RecipeIngredientWithFood } from '../../../src/domain/entities/Recipe';
import { Food } from '../../../src/domain/entities/Food';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID  = '00000000-0000-4000-b000-000000000001';
const RECIPE_ID = 'aaaaaaaa-0000-4000-b000-000000000001';
const FOOD_ID   = 'bbbbbbbb-0000-4000-b000-000000000001';

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

const makeRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id:               RECIPE_ID,
  coachId:          COACH_ID,
  name:             'Bowl de pollo',
  instructions:     'Cocina el pollo y mezcla.',
  imagePath:        null,
  imageUrl:         null,
  tags:             ['almuerzo', 'proteína'],
  showMacros:       true,
  visibleToClients: true,
  createdAt:        new Date('2024-01-01'),
  updatedAt:        new Date('2024-01-01'),
  ...overrides,
});

const makeIngredientWithFood = (overrides: Partial<RecipeIngredientWithFood> = {}): RecipeIngredientWithFood => ({
  id:        'cccccccc-0000-4000-b000-000000000001',
  recipeId:  RECIPE_ID,
  foodId:    FOOD_ID,
  quantityG: 200,
  createdAt: new Date('2024-01-01'),
  food:      makeFood(),
  ...overrides,
});

const makeRecipeWithIngredients = (overrides: Partial<RecipeWithIngredients> = {}): RecipeWithIngredients => ({
  ...makeRecipe(),
  ingredients: [makeIngredientWithFood()],
  ...overrides,
});

const mockRepo: jest.Mocked<IRecipeRepository> = {
  getRecipesByCoach: jest.fn(),
  getRecipeDetail:   jest.fn(),
  createRecipe:      jest.fn(),
  updateRecipe:      jest.fn(),
  deleteRecipe:      jest.fn(),
  setAllVisibility:  jest.fn(),
  uploadImage:       jest.fn(),
  deleteImage:       jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── getRecipesUseCase ─────────────────────────────────────────────────────────

describe('getRecipesUseCase', () => {
  it('devuelve recetas del repositorio para un coachId válido', async () => {
    const recipes = [makeRecipe()];
    mockRepo.getRecipesByCoach.mockResolvedValue(recipes);
    const result = await getRecipesUseCase(COACH_ID, mockRepo);
    expect(result).toEqual(recipes);
    expect(mockRepo.getRecipesByCoach).toHaveBeenCalledWith(COACH_ID);
  });

  it('lanza error si coachId está vacío', async () => {
    await expect(getRecipesUseCase('', mockRepo)).rejects.toThrow('coachId is required');
    expect(mockRepo.getRecipesByCoach).not.toHaveBeenCalled();
  });

  it('devuelve array vacío si no hay recetas', async () => {
    mockRepo.getRecipesByCoach.mockResolvedValue([]);
    expect(await getRecipesUseCase(COACH_ID, mockRepo)).toEqual([]);
  });

  it('propaga errores del repositorio', async () => {
    mockRepo.getRecipesByCoach.mockRejectedValue(new Error('DB error'));
    await expect(getRecipesUseCase(COACH_ID, mockRepo)).rejects.toThrow('DB error');
  });
});

// ── getRecipeDetailUseCase ────────────────────────────────────────────────────

describe('getRecipeDetailUseCase', () => {
  it('devuelve el detalle de una receta con ingredientes', async () => {
    const detail = makeRecipeWithIngredients();
    mockRepo.getRecipeDetail.mockResolvedValue(detail);
    const result = await getRecipeDetailUseCase(RECIPE_ID, COACH_ID, mockRepo);
    expect(result).toEqual(detail);
    expect(mockRepo.getRecipeDetail).toHaveBeenCalledWith(RECIPE_ID, COACH_ID);
  });

  it('lanza error si id está vacío', async () => {
    await expect(getRecipeDetailUseCase('', COACH_ID, mockRepo)).rejects.toThrow('id is required');
    expect(mockRepo.getRecipeDetail).not.toHaveBeenCalled();
  });

  it('lanza error si coachId está vacío', async () => {
    await expect(getRecipeDetailUseCase(RECIPE_ID, '', mockRepo)).rejects.toThrow('coachId is required');
    expect(mockRepo.getRecipeDetail).not.toHaveBeenCalled();
  });

  it('propaga errores del repositorio', async () => {
    mockRepo.getRecipeDetail.mockRejectedValue(new Error('Not found'));
    await expect(getRecipeDetailUseCase(RECIPE_ID, COACH_ID, mockRepo)).rejects.toThrow('Not found');
  });
});

// ── createRecipeUseCase ───────────────────────────────────────────────────────

describe('createRecipeUseCase', () => {
  const validInput = {
    coachId:          COACH_ID,
    name:             'Bowl de pollo',
    instructions:     'Pasos de preparación',
    tags:             ['almuerzo'],
    showMacros:       true,
    visibleToClients: true,
    ingredients:      [{ foodId: FOOD_ID, quantityG: 150 }],
  };

  it('crea una receta con input válido', async () => {
    const created = makeRecipe();
    mockRepo.createRecipe.mockResolvedValue(created);
    const result = await createRecipeUseCase(validInput, mockRepo);
    expect(result).toEqual(created);
    expect(mockRepo.createRecipe).toHaveBeenCalledWith(validInput);
  });

  it('crea una receta sin ingredientes', async () => {
    mockRepo.createRecipe.mockResolvedValue(makeRecipe());
    await expect(createRecipeUseCase({ ...validInput, ingredients: [] }, mockRepo)).resolves.toBeDefined();
  });

  it('lanza ZodError si el nombre está vacío', async () => {
    await expect(createRecipeUseCase({ ...validInput, name: '' }, mockRepo)).rejects.toThrow();
    expect(mockRepo.createRecipe).not.toHaveBeenCalled();
  });

  it('lanza ZodError si el nombre supera 100 caracteres', async () => {
    await expect(createRecipeUseCase({ ...validInput, name: 'a'.repeat(101) }, mockRepo)).rejects.toThrow();
    expect(mockRepo.createRecipe).not.toHaveBeenCalled();
  });

  it('lanza ZodError si coachId no es UUID válido', async () => {
    await expect(createRecipeUseCase({ ...validInput, coachId: 'no-es-uuid' }, mockRepo)).rejects.toThrow();
    expect(mockRepo.createRecipe).not.toHaveBeenCalled();
  });

  it('lanza ZodError si un ingrediente tiene cantidad negativa', async () => {
    await expect(
      createRecipeUseCase({ ...validInput, ingredients: [{ foodId: FOOD_ID, quantityG: -10 }] }, mockRepo),
    ).rejects.toThrow();
    expect(mockRepo.createRecipe).not.toHaveBeenCalled();
  });

  it('lanza ZodError si un ingrediente tiene foodId inválido', async () => {
    await expect(
      createRecipeUseCase({ ...validInput, ingredients: [{ foodId: 'bad', quantityG: 100 }] }, mockRepo),
    ).rejects.toThrow();
    expect(mockRepo.createRecipe).not.toHaveBeenCalled();
  });

  it('propaga errores del repositorio', async () => {
    mockRepo.createRecipe.mockRejectedValue(new Error('Insert failed'));
    await expect(createRecipeUseCase(validInput, mockRepo)).rejects.toThrow('Insert failed');
  });
});

// ── updateRecipeUseCase ───────────────────────────────────────────────────────

describe('updateRecipeUseCase', () => {
  it('actualiza una receta con campos válidos', async () => {
    const updated = makeRecipe({ name: 'Nuevo nombre' });
    mockRepo.updateRecipe.mockResolvedValue(updated);
    const result = await updateRecipeUseCase(RECIPE_ID, COACH_ID, { name: 'Nuevo nombre' }, mockRepo);
    expect(result.name).toBe('Nuevo nombre');
    expect(mockRepo.updateRecipe).toHaveBeenCalledWith(RECIPE_ID, COACH_ID, { name: 'Nuevo nombre' });
  });

  it('lanza error si id está vacío', async () => {
    await expect(updateRecipeUseCase('', COACH_ID, { name: 'Nombre' }, mockRepo)).rejects.toThrow('id is required');
    expect(mockRepo.updateRecipe).not.toHaveBeenCalled();
  });

  it('lanza error si coachId está vacío', async () => {
    await expect(updateRecipeUseCase(RECIPE_ID, '', { name: 'Nombre' }, mockRepo)).rejects.toThrow('coachId is required');
    expect(mockRepo.updateRecipe).not.toHaveBeenCalled();
  });

  it('lanza ZodError si el nombre supera 100 caracteres', async () => {
    await expect(
      updateRecipeUseCase(RECIPE_ID, COACH_ID, { name: 'a'.repeat(101) }, mockRepo),
    ).rejects.toThrow();
    expect(mockRepo.updateRecipe).not.toHaveBeenCalled();
  });

  it('acepta update parcial (solo tags)', async () => {
    mockRepo.updateRecipe.mockResolvedValue(makeRecipe());
    await expect(
      updateRecipeUseCase(RECIPE_ID, COACH_ID, { tags: ['cena'] }, mockRepo),
    ).resolves.toBeDefined();
  });

  it('propaga errores del repositorio', async () => {
    mockRepo.updateRecipe.mockRejectedValue(new Error('Update failed'));
    await expect(updateRecipeUseCase(RECIPE_ID, COACH_ID, { name: 'Nombre' }, mockRepo))
      .rejects.toThrow('Update failed');
  });
});

// ── deleteRecipeUseCase ───────────────────────────────────────────────────────

describe('deleteRecipeUseCase', () => {
  it('elimina una receta por id', async () => {
    mockRepo.deleteRecipe.mockResolvedValue(undefined);
    await expect(deleteRecipeUseCase(RECIPE_ID, mockRepo)).resolves.toBeUndefined();
    expect(mockRepo.deleteRecipe).toHaveBeenCalledWith(RECIPE_ID);
  });

  it('lanza error si id está vacío', async () => {
    await expect(deleteRecipeUseCase('', mockRepo)).rejects.toThrow('id is required');
    expect(mockRepo.deleteRecipe).not.toHaveBeenCalled();
  });

  it('propaga errores del repositorio', async () => {
    mockRepo.deleteRecipe.mockRejectedValue(new Error('Delete failed'));
    await expect(deleteRecipeUseCase(RECIPE_ID, mockRepo)).rejects.toThrow('Delete failed');
  });
});

// ── filterRecipes (pure) ──────────────────────────────────────────────────────

describe('filterRecipes', () => {
  const bowl    = makeRecipe({ id: '1', name: 'Bowl de pollo',   tags: ['almuerzo', 'proteína'] });
  const wrap    = makeRecipe({ id: '2', name: 'Wrap de atún',    tags: ['cena', 'rápido'] });
  const batido  = makeRecipe({ id: '3', name: 'Batido proteico', tags: ['proteína', 'desayuno'] });
  const all     = [bowl, wrap, batido];

  it('sin filtros devuelve todas las recetas', () => {
    expect(filterRecipes(all, '', [])).toEqual(all);
  });

  it('filtra por query parcial case-insensitive', () => {
    expect(filterRecipes(all, 'atún', [])).toEqual([wrap]);
  });

  it('query con espacios en blanco devuelve todas', () => {
    expect(filterRecipes(all, '   ', [])).toEqual(all);
  });

  it('filtra por tag activo', () => {
    expect(filterRecipes(all, '', ['proteína'])).toEqual([bowl, batido]);
  });

  it('filtra por múltiples tags (OR)', () => {
    expect(filterRecipes(all, '', ['cena', 'desayuno'])).toEqual([wrap, batido]);
  });

  it('combina query y tag', () => {
    expect(filterRecipes(all, 'bowl', ['almuerzo'])).toEqual([bowl]);
  });

  it('devuelve vacío si query no coincide', () => {
    expect(filterRecipes(all, 'xyzzy', [])).toEqual([]);
  });

  it('devuelve vacío si tag no existe en ninguna receta', () => {
    expect(filterRecipes(all, '', ['inexistente'])).toEqual([]);
  });

  it('devuelve vacío con lista de entrada vacía', () => {
    expect(filterRecipes([], 'bowl', ['proteína'])).toEqual([]);
  });
});

// ── computeRecipeMacros (pure) ────────────────────────────────────────────────

describe('computeRecipeMacros', () => {
  it('calcula macros correctamente para un ingrediente', () => {
    // 200g de pollo (165 kcal, 31g prot, 0g carbs, 3.6g fat, 0g fibra) por 100g
    const ingredient = makeIngredientWithFood({ quantityG: 200 });
    const macros = computeRecipeMacros([ingredient]);
    expect(macros.calories).toBe(330);        // 165 * 2
    expect(macros.proteinG).toBe(62);         // 31 * 2
    expect(macros.carbsG).toBe(0);
    expect(macros.fatG).toBe(7.2);            // 3.6 * 2
    expect(macros.fiberG).toBe(0);
  });

  it('suma macros de múltiples ingredientes', () => {
    const pollo  = makeIngredientWithFood({ id: '1', foodId: FOOD_ID, quantityG: 100 });
    const arroz  = makeIngredientWithFood({
      id: '2', foodId: 'dddddddd-0000-4000-b000-000000000001', quantityG: 100,
      food: makeFood({ caloriesPer100g: 130, proteinG: 2.7, carbsG: 28.2, fatG: 0.3, fiberG: 0.4 }),
    });
    const macros = computeRecipeMacros([pollo, arroz]);
    expect(macros.calories).toBe(295);        // 165 + 130
    expect(macros.proteinG).toBe(33.7);       // 31 + 2.7
    expect(macros.carbsG).toBe(28.2);
    expect(macros.fatG).toBe(3.9);            // 3.6 + 0.3
    expect(macros.fiberG).toBe(0.4);
  });

  it('devuelve ceros con lista de ingredientes vacía', () => {
    const macros = computeRecipeMacros([]);
    expect(macros).toEqual({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 });
  });

  it('redondea calorías a entero', () => {
    const ingredient = makeIngredientWithFood({
      quantityG: 150,
      food: makeFood({ caloriesPer100g: 155.3, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }),
    });
    const macros = computeRecipeMacros([ingredient]);
    expect(Number.isInteger(macros.calories)).toBe(true);
    expect(macros.calories).toBe(233);        // round(155.3 * 1.5) = round(232.95) = 233
  });

  it('redondea macros en g a 1 decimal', () => {
    const ingredient = makeIngredientWithFood({
      quantityG: 150,
      food: makeFood({ caloriesPer100g: 0, proteinG: 31.3, carbsG: 0, fatG: 0, fiberG: 0 }),
    });
    const macros = computeRecipeMacros([ingredient]);
    expect(macros.proteinG).toBe(47);         // round(31.3 * 1.5 * 10) / 10 = round(469.5) / 10 = 47
  });

  it('calcula correctamente con cantidad menor a 100g', () => {
    const ingredient = makeIngredientWithFood({ quantityG: 50 });
    const macros = computeRecipeMacros([ingredient]);
    expect(macros.calories).toBe(83);         // round(165 * 0.5) = round(82.5) = 83 (Math.round)
    expect(macros.proteinG).toBe(15.5);       // 31 * 0.5
  });
});

// ── setAllRecipesVisibilityUseCase ────────────────────────────────────────────

describe('setAllRecipesVisibilityUseCase', () => {
  it('llama al repo con coachId y visible=true', async () => {
    mockRepo.setAllVisibility.mockResolvedValue();

    await setAllRecipesVisibilityUseCase(COACH_ID, true, mockRepo);

    expect(mockRepo.setAllVisibility).toHaveBeenCalledWith(COACH_ID, true);
  });

  it('llama al repo con coachId y visible=false', async () => {
    mockRepo.setAllVisibility.mockResolvedValue();

    await setAllRecipesVisibilityUseCase(COACH_ID, false, mockRepo);

    expect(mockRepo.setAllVisibility).toHaveBeenCalledWith(COACH_ID, false);
  });

  it('lanza si coachId está vacío', async () => {
    await expect(
      setAllRecipesVisibilityUseCase('', true, mockRepo),
    ).rejects.toThrow('coachId is required');
    expect(mockRepo.setAllVisibility).not.toHaveBeenCalled();
  });

  it('propaga el error del repositorio', async () => {
    mockRepo.setAllVisibility.mockRejectedValue(new Error('DB update failed'));

    await expect(
      setAllRecipesVisibilityUseCase(COACH_ID, true, mockRepo),
    ).rejects.toThrow('DB update failed');
  });
});
