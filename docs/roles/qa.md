# QA

## Misión
Garantizar que el código funciona como se especificó y que los tests detectarán regresiones reales — no solo que el código se ejecuta sin lanzar errores.

---

## Cobertura mínima

**80%** en statements, branches, functions y lines.

Verificar con:
```bash
npx jest --coverage --testPathPattern="NombreModulo"
```

---

## Qué testear por capa

| Capa | Qué testear | Herramienta |
|---|---|---|
| `domain/entities/` | Validaciones Zod: válidos, inválidos, casos borde (vacío, máximo, formato) | Jest puro |
| `application/` use cases | Happy path, errores del repo, validaciones de entrada | Mock del repositorio |
| `application/` funciones puras | Filtros, formateos: todas las combinaciones de parámetros | Jest puro, sin mocks |
| `presentation/stores/` | Estado antes/después de cada acción, ciclo isLoading, strings de error, fallback strings | Mock de use cases |
| `presentation/screens/` | Funciones puras exportadas (`filterX`, `formatX`) | Jest puro, sin mocks |

---

## Estructura de los tests

**Organización de ficheros:**
```
__tests__/
  application/coach/    → NombreUseCases.test.ts
  presentation/stores/  → nombreStore.test.ts
  presentation/screens/ → nombreFilter.test.ts
  domain/entities/      → NombreEntidad.test.ts (si tiene validaciones complejas)
```

**Estructura interna de cada fichero:**
```typescript
// ── Mocks ────────────────────────────────────────────────────
jest.mock('../../../src/...');
// imports de mocks con cast: const mockFn = fn as jest.MockedFunction<typeof fn>

// ── Fixtures ─────────────────────────────────────────────────
const VALID_UUID = '...';
function makeItem(overrides = {}): Tipo { ... }

// ── Helpers ───────────────────────────────────────────────────
function resetStore() { useStore.setState({ ... }); }
beforeEach(() => { jest.clearAllMocks(); resetStore(); });

// ── describe por función / acción ────────────────────────────
describe('nombreFunción', () => {
  it('descripción del comportamiento esperado', async () => { ... });
});
```

---

## Casos obligatorios por tipo

**Use cases:**
- ✅ Happy path: llama al repo con los parámetros correctos y devuelve el resultado
- ✅ Error de validación: lanza cuando el input es inválido (sin llamar al repo)
- ✅ Error del repo: propaga el error correctamente
- ✅ Caso borde: lista vacía, string vacío, ID inválido

**Stores:**
- ✅ Estado correcto tras acción exitosa
- ✅ `isLoading` / `isCreating` es `true` durante la operación y `false` después
- ✅ `error` se setea correctamente cuando falla
- ✅ Fallback string cuando el error no es `instanceof Error` (ej. `mockFn.mockRejectedValue('unexpected')`)
- ✅ Error previo se limpia al inicio de la siguiente acción
- ✅ El use case se llama con los argumentos exactos esperados

**Funciones puras de filtro:**
- ✅ Sin filtros activos → devuelve todos los items
- ✅ Query solo whitespace → devuelve todos los items
- ✅ Lista de entrada vacía → devuelve array vacío
- ✅ Búsqueda por nombre (case-insensitive)
- ✅ Búsqueda por descripción / campo secundario
- ✅ Filtro por cada chip individualmente
- ✅ Filtro combinado (texto + chip)
- ✅ Sin resultados → devuelve array vacío

---

## Convenciones de nombrado

**Ficheros:** `NombreUseCases.test.ts`, `nombreStore.test.ts`, `nombreFilter.test.ts`

**Describes:** nombre exacto de la función o acción
```typescript
describe('getAllCardiosUseCase', () => { ... })
describe('useCardioStore — fetchAll', () => { ... })
describe('filterCardios — text search', () => { ... })
```

**Its:** un único comportamiento, legible sin ver el cuerpo
```typescript
// ✅ Correcto
it('returns false and sets error on failure', ...)
it('throws when coachId is empty', ...)
it('clears previous error before new fetch', ...)

// ❌ Incorrecto
it('works correctly', ...)
it('test 1', ...)
it('handles the error case', ...)
```

---

## Checklist antes de entregar

- [ ] `npx jest --no-coverage` pasa al 100%
- [ ] Cada `describe` agrupa tests de una sola función/acción
- [ ] Cada `it` describe un único comportamiento sin necesidad de leer el cuerpo
- [ ] No hay estado compartido entre tests
- [ ] `beforeEach` limpia mocks y resetea el store
- [ ] Los strings de error se validan con el texto exacto (`.toBe('Error al...')`, no `.toThrow()` vacío)
- [ ] Se testea el fallback string (cuando `err` no es `instanceof Error`)
- [ ] Los fixtures usan UUIDs válidos (formato `xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx`)
- [ ] No hay tests que solo verifican que el mock fue llamado sin verificar el estado resultante

---

## Anti-patrones a evitar

```typescript
// ❌ Solo verifica que se llamó, no qué pasó después
it('calls use case', async () => {
  await store.fetchAll(COACH_ID);
  expect(mockGetAll).toHaveBeenCalled();
});

// ✅ Verifica el estado resultante
it('sets catalog on success', async () => {
  mockGetAll.mockResolvedValue([ITEM_A]);
  await act(async () => { await store.fetchAll(COACH_ID); });
  expect(store.catalog).toHaveLength(1);
  expect(store.isLoading).toBe(false);
  expect(store.error).toBeNull();
});
```
