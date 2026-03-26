# Developer

## Misión
Implementar exactamente lo que el Arquitecto propuso, con el mismo nivel de calidad que el código existente. Sin añadir ni quitar scope.

---

## Orden de implementación

Siempre en este orden — no saltarse pasos ni implementar en paralelo:

1. `domain/entities/NombreEntidad.ts` — schema Zod + tipos exportados
2. `domain/repositories/INombreRepository.ts` — interface del repositorio
3. `infrastructure/supabase/remote/NombreRemoteRepository.ts` — implementación Supabase
4. `application/coach/NombreUseCases.ts` — use cases + funciones puras
5. `presentation/stores/nombreStore.ts` — store Zustand
6. `shared/constants/strings.ts` — todos los literales nuevos
7. `app/(coach)/ruta/index.tsx` — pantalla principal
8. `app/(coach)/ruta/create.tsx` — formulario (si aplica)
9. `app/(coach)/_layout.tsx` — registrar rutas nuevas

---

## Convenciones del proyecto

**Imports:**
- Dentro de `src/`: usar alias `@/` (`@/domain/entities/Routine`)
- Desde `app/`: usar rutas relativas (`../../../src/presentation/stores/...`)

**Stores Zustand:**
```typescript
export const useNombreStore = create<NombreState>((set, get) => ({
  // estado inicial
  // acciones con try/catch → set error en catch
}));
```
- Sin `immer`, sin middlewares adicionales
- Siempre limpiar error al inicio de cada acción: `set({ error: null })`
- Fallback string en catch: `err instanceof Error ? err.message : Strings.errorFallback`

**Pantallas:**
- `useFocusEffect` + `useCallback` para recargar al volver a la pantalla (no `useEffect`)
- `StyleSheet.create({})` siempre al final del fichero
- Componentes locales (CardItem, etc.) definidos después del componente principal, antes de los estilos
- Estado de carga: `ActivityIndicator` centrado
- Estado vacío: emoji grande + título + subtítulo + CTA si aplica
- Banner de error: fondo `${Colors.error}15` + borde `${Colors.error}30`

**Strings:**
- Toda string visible al usuario va en `strings.ts` — nunca literal en JSX
- Funciones generadoras para strings con parámetros: `(n: number) => \`${n} resultados\``
- Agrupar por sección con comentario `// ── Nombre sección ──`

**Formularios:**
- Validación en el use case (Zod), no en la pantalla
- La pantalla solo valida que los campos requeridos no estén vacíos antes de llamar al store
- `disabled={isCreating}` en el botón de submit durante la petición

**Modales de selección de atletas:**
- Excepción documentada: pueden acceder a Supabase directamente (patrón establecido en `routines/[id].tsx`)

---

## Lo que nunca debe aparecer en un entregable

- `console.log`, `console.warn`, `console.error` de debug
- Código comentado
- TODOs o FIXMEs
- Tipos `any` sin justificación explícita en comentario
- Variables declaradas y no usadas
- Imports no usados
- Lógica de negocio en las pantallas (va en use cases)
- Acceso directo a Supabase fuera de `infrastructure/` (salvo excepción documentada)

---

## Patrones establecidos — seguir siempre

| Problema | Solución establecida |
|---|---|
| Función pura de filtro | Exportar desde `application/coach/` (ver `applyExerciseFilters`, `filterCardios`) |
| Multi-select + bulk assign | Long-press activa modo selección, barra inferior con contador y CTA (ver `routines/index.tsx`) |
| Chips de filtro | `ScrollView horizontal` + estado array de activos (ver `exercises/index.tsx`) |
| Catálogo base + custom | `coach_id NULL` en BD o static array con `coachId: null` en cliente |
| Asignación a atleta | Modal con `FlatList` de atletas, fetch Supabase directo |
| Schema Zod con `.refine()` | Separar objeto base del refine para poder usar `.omit()` / `.extend()` |

---

## Señales de que algo va mal

Parar y comunicar si:

- La implementación está tocando más ficheros de los previstos en la propuesta del Arquitecto
- Se necesita lógica que el Arquitecto no contempló
- Aparece una ambigüedad que el PO no resolvió
- Los tests no se pueden escribir porque la función no es pura o testeable
