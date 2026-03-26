# BACKLOG

## ✅ Completado

#### RF-E6-05 — Agrupaciones de planes nutricionales

**¿Qué hace?**
El entrenador puede organizar sus planes nutricionales en agrupaciones con nombre y descripción opcional. Desde la lista de planes hay un acceso directo a "Agrupaciones". En la lista de agrupaciones puede crear nuevas, ver cuántos planes tiene cada una y eliminarlas. En el detalle de cada agrupación puede añadir planes del catálogo y quitarlos individualmente. Los planes no se borran al eliminar una agrupación.

**Pantallas / flujo:**
- `app/(coach)/nutrition/index.tsx` — modificada: nuevo botón "Agrupaciones" en la barra de accesos secundarios
- `app/(coach)/nutrition/groups/index.tsx` — lista de agrupaciones con conteo de planes, modal inline de creación, borrado con confirmación
- `app/(coach)/nutrition/groups/[id].tsx` — detalle: lista de planes vinculados, botón dashed "+ Añadir plan", modal de selección con planes ya añadidos deshabilitados, quitar plan con confirmación

**Decisiones de diseño:**
- El planCount en la lista se actualiza optimistamente tras añadir/quitar planes (sin refetch global).
- Al añadir un plan, se hace un refetch del detalle completo para garantizar coherencia con el dato real de BD.
- Al quitar un plan, se actualiza el estado local sin refetch (operación determinista).
- La pantalla de detalle usa `useFocusEffect` para recargar tanto el detalle del grupo como los planes del coach (para el modal de selección).

**Implementación técnica:**
- `NutritionPlan.ts` — nuevos `PlanGroupSchema`, `CreatePlanGroupSchema`, `PlanGroup`, `CreatePlanGroupInput`
- `INutritionRepository.ts` — 6 nuevos métodos de plan groups
- `NutritionRemoteRepository.ts` — implementación con queries a `plan_groups` y `plan_group_plans`; `mapGroup` privado
- `NutritionUseCases.ts` — 6 nuevos use cases de plan groups
- `nutritionStore.ts` — estado `groups`, `groupDetail` + 6 nuevas acciones
- `strings.ts` — 19 nuevas claves en sección RF-E6-05
- `supabase/migrations/20260326100000_add_plan_groups.sql` — tablas + índices + RLS

**Métricas finales:**
- Test Suites: 60/60 ✅ | Tests: 1173/1173 ✅ (+40 tests nuevos: 20 use case + 20 store)

---

#### RF-E6-10 — Vincular recetas a comidas de un plan nutricional

**¿Qué hace?**
El entrenador puede asociar una o varias recetas del catálogo a cada comida de un plan nutricional. Al acceder al detalle del plan, cada comida muestra sus recetas vinculadas con un botón ✕ para desvincular. Un botón "+" abre un modal de selección donde el coach elige la receta a añadir. Los macros de la comida se recalculan automáticamente al vincular o desvincular recetas (trigger PostgreSQL). Los cambios son visibles para los atletas a los que esté asignado el plan.

**Pantallas / flujo:**
- `app/(coach)/nutrition/[id].tsx` — reescrita
  - Cabecera con nombre del plan, tipo y macros diarios
  - Lista de comidas con sus macros actualizados
  - Por cada comida: lista de recetas vinculadas con nombre + botón ✕ (desvincular)
  - Botón dashed "+ Añadir receta" en cada comida
  - Modal (pageSheet) con recetas disponibles; las ya vinculadas aparecen deshabilitadas con indicador "Ya vinculada"
  - Spinner por receta durante las operaciones de vínculo/desvínculo

**Decisiones de diseño:**
- Los macros de la comida se recalculan vía trigger PostgreSQL (`sync_meal_macros_from_recipes`) al insertar/borrar en `meal_recipes`. No hay cómputo en cliente.
- Tras cada operación de vínculo/desvínculo, el store refetch el plan completo (`repo.getPlanById(planId)`) para reflejar los macros actualizados por el trigger.
- Los nombres de las recetas vinculadas se obtienen directamente en la query del plan via join anidado PostgREST: `meals(*, meal_recipes(recipe_id, recipes(id, name)))`.
- RLS de `meal_recipes` encadena por `meal_id → meals → nutrition_plans` para acceso del coach, y por `meal_id → meals → nutrition_assignments` para acceso del atleta.
- La migración crea la tabla `meal_recipes` con FK a `meals` y `recipes`, índice compuesto único, y el trigger de recálculo de macros.

**Implementación técnica:**
- `NutritionPlan.ts` — nuevo `LinkedRecipeSchema` / `LinkedRecipe`; `MealSchema` añade `linkedRecipes`
- `INutritionRepository` — nuevos métodos `linkRecipeToMeal`, `unlinkRecipeFromMeal`
- `NutritionRemoteRepository` — `PLAN_SELECT` con join `meal_recipes → recipes`; `mapPlan` mapea `linkedRecipes`; dos nuevos métodos de repo
- `NutritionUseCases.ts` — `linkRecipeToMealUseCase`, `unlinkRecipeFromMealUseCase`
- `nutritionStore.ts` — acciones `linkRecipe`, `unlinkRecipe`, `refreshPlan`
- `strings.ts` — 10 nuevas claves de UI
- `supabase/migrations/20260326000000_add_meal_recipes.sql` — tabla + RLS + trigger

**Métricas finales:**
- Test Suites: 3/3 ✅ | Tests: 96/96 ✅ (+25 tests nuevos: 8 use case + 17 store)

---

#### RF-E6-07 — Duplicado de planes nutricionales

**¿Qué hace?**
El entrenador puede duplicar cualquier plan nutricional de su lista con un toque. El plan copia se crea con el nombre "(Copia) Nombre original" (truncado a 100 caracteres si fuera necesario), el mismo tipo, descripción, macros diarios y todas las comidas del original. La copia aparece inmediatamente al principio de la lista sin necesidad de recargar.

**Pantallas / flujo:**
- `app/(coach)/nutrition/index.tsx` — modificada
  - Botón 📋 junto al 🗑 en cada tarjeta de plan (columna de acciones vertical)
  - Ambos botones se ocultan en modo selección (long-press)
  - Spinner global `isSubmitting` durante la operación

**Decisiones de diseño:**
- El use case construye el input de creación manualmente, sin pasar por `CreateNutritionPlanSchema.parse`, para evitar el `meals.min(1)` del schema original y soportar el caso borde de planes sin comidas.
- El `coachId` lo pasa la pantalla desde `useAuthStore`, siguiendo el mismo patrón que `editFood`.

**Implementación técnica:**
- `NutritionUseCases.ts` — nuevo `duplicatePlanUseCase(plan, coachId, repo)`
- `nutritionStore.ts` — nueva acción `duplicatePlan(plan, coachId) → Promise<boolean>`
- `nutrition/index.tsx` — `PlanCard` con prop `onDuplicate`; estilos `cardActions` / `cardActionIcon`

**Métricas finales:**
- Test Suites: 2/2 ✅ | Tests: 71/71 ✅ (+16 tests nuevos: 8 use case + 8 store)

---

#### RF-E6-08 — Asignación de planes nutricionales a atletas

**¿Qué hace?**
El entrenador puede seleccionar uno o varios planes nutricionales de su lista y asignarlos a un atleta. Se activa manteniendo pulsado un plan (long-press), lo que abre el modo selección. Desde ahí puede añadir más planes al lote y pulsar "Asignar" para elegir el atleta destinatario. Si ya tenía ese plan asignado, no se produce error (upsert). El flujo termina con un mensaje de confirmación.

**Pantallas / flujo:**
- `app/(coach)/nutrition/index.tsx` — modificada
  - Long-press en una tarjeta activa el modo selección (checkbox redondo)
  - Tap sobre tarjeta seleccionada alterna su selección; si queda a 0, sale del modo
  - "Cancelar" en el header sale del modo selección sin asignar
  - Barra azul inferior con contador de planes seleccionados + botón "Asignar"
  - Botón de borrar se oculta en modo selección
  - Links de navegación a Recetas y Alimentos se ocultan en modo selección
  - Modal (pageSheet) con lista de atletas: avatar + nombre + email
  - Estado vacío en el modal si el coach no tiene atletas
  - Spinner por atleta durante la asignación en curso

**Decisiones de diseño:**
- El fetch de atletas se hace directamente desde Supabase en la pantalla (excepción documentada, mismo patrón que `routines/index.tsx`). No se añaden atletas al store de nutrición.
- La selección y el estado del modal son estado local de la pantalla — no se persisten en el store.
- El use case `assignPlansToAthleteUseCase` asigna en secuencia (no en paralelo) para simplificar el manejo de errores: si uno falla, los siguientes no se ejecutan y el error se propaga limpiamente.

**Implementación técnica:**
- `NutritionUseCases.ts` — nuevo `assignPlansToAthleteUseCase(planIds, athleteId, repo)`
- `nutritionStore.ts` — nueva acción `assignMultipleToAthlete(planIds, athleteId) → Promise<boolean>`
- `strings.ts` — 5 nuevas claves en la sección `RF-E6-08`
- `nutrition/index.tsx` — modo selección, barra bulk-assign y modal de atletas

**Métricas finales:**
- Test Suites: 2/2 ✅ | Tests: 55/55 ✅ (+11 tests nuevos: 6 use case + 5 store)

---

#### RF-E6-11 — Edición de alimentos del catálogo

**¿Qué hace?**
El entrenador puede editar cualquier alimento de su catálogo: tanto los genéricos (base compartida) como los creados por él. Al editar un alimento genérico se crea una copia personalizada sin afectar al catálogo base. Al editar uno propio se actualiza directamente. El formulario llega pre-relleno con los valores actuales y muestra un aviso informativo cuando el alimento es genérico.

**Pantallas / flujo:**
- `app/(coach)/foods/index.tsx` — botón ✏️ visible en todos los alimentos (genéricos y propios); botón 🗑 solo en los propios
- `app/(coach)/foods/edit.tsx` *(nueva)* — formulario pre-relleno con nombre, tipo y macros
  - Banner informativo azul si el alimento es genérico
  - Banner de error dismissible si falla el guardado
  - Botón Guardar deshabilitado durante `isSubmitting`

**Decisiones de diseño:**
- Al editar un alimento genérico (`coachId === null`), se hace un `INSERT` con los valores editados y `coach_id = auth.uid()`. El original genérico permanece en la lista; ambos conviven. El coach puede usar el filtro "Propios" para ver solo su versión.
- La lógica genérico/propio reside en el use case (`editFoodUseCase`), no en la pantalla ni en el store.

**Implementación técnica:**
- `Food.ts` — añadido `UpdateFoodSchema` + tipo `UpdateFoodInput`
- `IFoodRepository` / `FoodRemoteRepository` — nuevos métodos `updateFood` y `cloneGenericFood`
- `FoodUseCases` — nuevo `editFoodUseCase` que bifurca según `food.coachId`
- `foodStore` — nueva acción `editFood`; clonación añade a la lista, edición reemplaza in-place
- `strings.ts` — añadidos `foodEditTitle`, `foodEditGenericNote`, `foodEditNotFound`, `errorFallback`

**Métricas finales:**
- Test Suites: 2/2 ✅ | Tests: 62/62 ✅ (+31 tests nuevos: 10 use case + 21 store)

---

#### RF-E5-01 — Biblioteca de vídeos

**¿Qué hace?**
Pantalla de vídeos del coach donde puede gestionar su biblioteca personal de vídeos de YouTube.
Permite buscar por título o descripción, filtrar por etiquetas mediante chips (derivados del propio
catálogo), añadir nuevos vídeos (título + URL YouTube + etiquetas + descripción) y eliminarlos con
confirmación. El estado vacío invita a añadir el primer vídeo.

**Pantallas / flujo:**
- `app/(coach)/videos/index.tsx` — lista + buscador + chips de etiquetas dinámicos
  - Chips generados dinámicamente a partir de las etiquetas del catálogo (`flatMap` + `Set`)
  - Filtrado OR: vídeo visible si contiene alguna de las etiquetas activas
  - Long-press no aplica; borrado directo con icono 🗑 + Alert de confirmación
  - `useFocusEffect` para recargar al volver del formulario
- `app/(coach)/videos/create.tsx` — formulario: título, URL YouTube, etiquetas (multi-tag input), descripción

**Decisiones de diseño:**
- Las etiquetas se almacenan como `text[]` en PostgreSQL directamente en la fila del vídeo (sin tabla separada). Suficiente para el volumen esperado y evita joins.
- Los chips de filtro se derivan en cliente con `[...new Set(catalog.flatMap(v => v.tags))].sort()` — sin estado adicional ni query extra.
- Filtrado OR entre etiquetas activas (si "fuerza" y "cardio" están activos, muestra vídeos con cualquiera de los dos).
- La validación de URL YouTube se hace mediante regex en el schema Zod (`CreateVideoSchema`), no en la pantalla.
- No hay catálogo base Harbiz (a diferencia de cardios/ejercicios): todos los vídeos son propios del coach.

**Implementación técnica:**
- `Video.ts`: entidad con `CreateVideoSchema` (valida URL YouTube via regex) + `VideoSchema` (extiende con id/createdAt)
- `IVideoRepository` + `VideoRemoteRepository`: `getAll`, `create`, `delete`
- `VideoUseCases.ts`: `getAllVideosUseCase`, `createVideoUseCase`, `deleteVideoUseCase`, `filterVideos(items, query, tags)`
- `videoStore.ts`: `fetchAll`, `create` (inserta ordenado alfabéticamente), `delete`, `clearError`
- Migración SQL: tabla `videos` + RLS (coach solo ve/gestiona sus propios vídeos) + índice en `(coach_id, created_at desc)`

**Métricas finales:**
- Test Suites: 54/54 ✅ | Tests: 931/931 ✅ (+41 tests)

---

#### RF-E4-04 — Catálogo de cardios

**¿Qué hace?**
Pantalla de cardios del coach con catálogo base de 12 sesiones predefinidas más las
creadas por cada coach. Permite buscar por nombre/descripción, filtrar por tipo de
actividad (9 tipos) e intensidad (3 niveles), y seleccionar múltiples cardios para
asignarlos en bloque a un atleta. El coach puede crear nuevos cardios propios y
eliminar solo los suyos.

**Pantallas / flujo:**
- `app/(coach)/cardios/index.tsx` — lista unificada + búsqueda + chips tipo/intensidad + multi-select
  - Chips de tipo (9, scroll horizontal): Correr, Ciclismo, Natación, Elíptica...
  - Chips de intensidad (3): Baja / Media / Alta con color semántico (verde/naranja/rojo)
  - Long-press activa modo selección; barra de acción para asignar en bloque
  - Botón borrar solo en cardios propios del coach, con confirmación
  - `useFocusEffect` para recargar al volver de creación
- `app/(coach)/cardios/create.tsx` — formulario: nombre, tipo, intensidad, rango duración, descripción

**Decisiones de diseño:**
- El catálogo base se siembra en la BD (`coach_id NULL`) en lugar de ser estático en cliente. Así el assignment funciona de forma uniforme para todos los cardios (base o propios) sin lógica especial en cliente.
- RLS: SELECT permite `coach_id = auth.uid() OR coach_id IS NULL`; INSERT/UPDATE/DELETE solo en filas propias.
- `filterCardios` vive en la capa de use cases (patrón idéntico a `applyExerciseFilters`).
- El schema Zod usa dos objetos separados (`CardioBaseSchema` → `CreateCardioSchema` con refine, `CardioSchema` con extend) para evitar el error de `.omit()` en `ZodEffects`.

**Implementación técnica:**
- `Cardio.ts`: entidad con `CardioType` (9 valores), `CardioIntensity` (3), rango de duración, Zod schema con validación de rango
- `ICardioRepository` + `CardioRemoteRepository`: `getAll`, `create`, `delete`, `assignToAthlete`, `unassignFromAthlete`
- `CardioUseCases.ts`: `getAllCardiosUseCase`, `createCardioUseCase`, `deleteCardioUseCase`, `assignCardioToAthleteUseCase`, `assignMultipleCardiosUseCase`, `filterCardios`
- `cardioStore.ts`: `fetchAll`, `create`, `delete`, `assignMultipleToAthlete`
- Migración SQL: tablas `cardios` + `cardio_assignments` + seed 12 cardios base

**Métricas finales:**
- Test Suites: 52/52 ✅ | Tests: 890/890 ✅ (+48 tests)

---

#### RF-E4-02 — Catálogo de rutinas

**¿Qué hace?**
Pantalla de rutinas del coach con búsqueda por nombre/descripción y selección múltiple
para asignar varias rutinas a un atleta de una sola vez. El coach puede hacer long-press
sobre una rutina para activar el modo selección, marcar las que quiera, y pulsar
"Asignar seleccionadas" para elegir el atleta destinatario en un modal.

**Pantallas / flujo:**
- `app/(coach)/routines/index.tsx` — lista con búsqueda + multi-selección
  - Barra de búsqueda: filtra por nombre o descripción (case-insensitive)
  - Long-press activa modo selección: checkbox en cada card
  - Barra de acción con contador + botón "Asignar seleccionadas"
  - Botón "Cancelar" en cabecera para salir del modo selección
  - Modal de atletas: lista con avatar de iniciales + nombre + email
  - Confirmación vía `Alert` tras asignación exitosa
  - `useFocusEffect` para recargar al volver de otra pantalla

**Decisiones de diseño:**
- `filterRoutines` es una función pura exportada desde el archivo de pantalla (mismo patrón que `filterAthletes` en clients/index), testeable de forma aislada en `__tests__/presentation/screens/routinesFilter.test.ts`.
- La lista de atletas se obtiene directamente de Supabase en el modal (igual que en `routines/[id].tsx`), sin store intermedio, para no duplicar lógica de cliente.
- `assignMultipleRoutinesUseCase` usa `Promise.all` para hacer las N asignaciones en paralelo.
- `RoutineCard` ampliado con `onLongPress` opcional (sin romper usos existentes).

**Implementación técnica:**
- `AssignRoutineUseCase.ts`: `assignMultipleRoutinesUseCase(routineIds, athleteId, repo)`
- `routineStore.ts`: `assignMultipleToAthlete(routineIds, athleteId) → Promise<boolean>`
- `RoutineCard.tsx`: prop `onLongPress?: (routine: Routine) => void`
- `strings.ts`: `routineNewButton`, `routineSearchPlaceholder`, `routineSubtitle`, `routineSelectionCount`, `routineBulkAssignButton`, `routineBulkAssignSuccess`, `routineEmpty*`

**Métricas finales:**
- Test Suites: 50/50 ✅ | Tests: 842/842 ✅ (+21 tests)

---

#### RF-E4-01 — Catálogo de ejercicios

**¿Qué hace?**
Pantalla de librería unificada de ejercicios. Muestra en una sola lista los ejercicios
del catálogo base (20 ejercicios predefinidos) y los ejercicios personalizados creados
por el coach. El coach puede filtrar por categoría (Fuerza, Cardio, Flexibilidad,
Isométrico) y por grupo muscular (12 chips en scroll horizontal), buscar por nombre
o por músculo traducido, y crear nuevos ejercicios personalizados. Solo puede
editar/borrar los que ha creado él mismo.

**Pantallas / flujo:**
- `app/(coach)/exercises/index.tsx` — lista unificada con búsqueda + filtros
  - Chips de categoría (4): Fuerza / Cardio / Flexibilidad / Isométrico
  - Chips de músculo (12, scroll horizontal): Pecho, Espalda, Hombros…
  - Filtros acumulables: vacío = sin filtro, múltiple selección permitida
  - Búsqueda por nombre y por nombre de músculo traducido (ej. "pecho" filtra chest)
  - Contador "N ejercicios" sobre los resultados filtrados
  - Botón borrar solo en ejercicios propios, con confirmación + check de rutinas activas
- `app/(coach)/exercises/create.tsx` — formulario de alta (sin cambios)
- `app/(coach)/exercises/[id].tsx` — detalle y edición (sin cambios)

**Decisiones de diseño:**
- `CatalogExercise = Exercise & { coachId: string | null }` — tipo unificado: `coachId: null` = catálogo base (solo lectura), `coachId: uuid` = ejercicio del coach (editable).
- El catálogo base (`EXERCISE_CATALOG`) se funde con los custom exercises en el use case `getAllExercisesUseCase`, ordenado alfabéticamente. Sin cambios en BD.
- `applyExerciseFilters` vive en la capa de use cases (no en UI) para ser testeable de forma aislada.
- `MUSCLE_LABELS` y `CATEGORY_LABELS` centralizados en `src/shared/constants/exercises.ts`, eliminando la duplicación que había en `index.tsx` y `[id].tsx`.
- El store sincroniza `catalog` al borrar un ejercicio para evitar una recarga extra de red.

**Implementación técnica:**
- `CustomExerciseUseCases.ts`: `CatalogExercise` type, `getAllExercisesUseCase`, `applyExerciseFilters`
- `customExerciseStore.ts`: `catalog: CatalogExercise[]`, `fetchAll(coachId)`, `delete` sincroniza `catalog`
- `exercises/index.tsx`: reescrito usando store + filter chips (sin acceso directo a Supabase)
- `exercises.ts`: `MUSCLE_LABELS` y `CATEGORY_LABELS` exportados

**Métricas finales:**
- Test Suites: 48/48 ✅ | Tests: 821/821 ✅

---

#### RF-E8-02 — Vista lista de sesiones agendadas

**¿Qué hace?**
Nueva pestaña "Lista" dentro de la pantalla de Calendario. El coach puede explorar
todas sus sesiones en un rango de fechas personalizable, filtrar por tipo de sesión
y modalidad, y ver un resumen de métricas (totales, horas y desglose por tipo y modalidad).
Los filtros se mantienen activos mientras el usuario navega por la app.

**Pantallas / flujo:**
- `app/(coach)/calendar/index.tsx` — toggle superior Calendario / Lista
- `app/(coach)/calendar/SessionListView.tsx` — vista lista completa
  - Sub-toggle Lista / Métricas
  - Selector de rango de fechas (desde / hasta) con DateTimePicker nativo
  - Chips de filtro: 4 tipos de sesión + 2 modalidades (vacío = sin filtro)
  - **Modo Lista:** una fila por sesión con fecha, hora, tipo, badge de modalidad, nombre del atleta y botón de borrado con confirmación
  - **Modo Métricas:** total sesiones, total horas, tarjetas de % online/presencial, barras de progreso por tipo de sesión

**Decisiones de diseño:**
- Filtrado client-side: los filtros no lanzan nuevas queries, operan sobre los datos ya cargados en el store. Justificación: rangos típicos de 1-3 meses caben en memoria y el cambio de filtro es instantáneo.
- Los filtros y el rango de fechas persisten en el store Zustand durante toda la sesión del usuario.
- `removeSession` limpia también `rangeSessions` para que borrar desde la lista actualice el estado sin recargar.

**Implementación técnica:**
- `getForRange` en `ICoachSessionRepository` + `CoachSessionRemoteRepository` (join con `users` para athleteName)
- `getSessionsForRangeUseCase` en `CoachSessionUseCases`
- `coachCalendarStore` ampliado: `rangeSessions`, `listFrom`, `listTo`, `listFilters`, `isLoadingRange`, `fetchRange`, `setListFrom`, `setListTo`, `setListFilters`

**Métricas finales:**
- Test Suites: 47/47 ✅ | Tests: 796/796 ✅

---

#### RF-E8-01 + RF-E8-03 — Calendario operativo + Creación de sesiones

**¿Qué hace?**
Pantalla de calendario mensual para el coach. Los días con sesiones aparecen marcados
con un punto. Al tocar un día se muestran sus sesiones debajo del grid. Desde ahí se
puede borrar una sesión (con confirmación) o navegar al formulario de creación.
El formulario valida que la nueva sesión no se solape con ninguna existente antes de guardar.
El dashboard muestra un widget con las sesiones de hoy o las próximas.

**Pantallas / flujo:**
- `app/(coach)/calendar/index.tsx` — grid mensual navegable (mes anterior / siguiente)
  - Punto naranja en días con sesiones
  - Toque en día → lista de sesiones del día con hora, duración, tipo, modalidad y atleta
  - Botón "Nueva sesión" → navega a formulario pasando la fecha seleccionada
  - Long-press en sesión → confirmación de borrado
- `app/(coach)/calendar/create.tsx` — formulario de alta de sesión
  - Chips de tipo de sesión, toggle de modalidad, DateTimePicker fecha/hora
  - Presets de duración (30, 45, 60, 90 min) + campo libre
  - Modal de selección de atleta con búsqueda
  - Validación de solapamiento antes de guardar
- `app/(coach)/dashboard.tsx` — widget "Agenda" con sesiones de hoy o próximas

**Decisiones de diseño:**
- La detección de solapamiento se hace en el use case (no en el repo): `getOverlapping` trae candidatos de BD, el filtro de solapamiento exacto se aplica en memoria para mayor precisión.
- El offset del primer día de la semana es lunes (ISO), no domingo.

**Implementación técnica:**
- SQL: tabla `coach_sessions` con RLS e índice en `(coach_id, scheduled_at)`
- Domain: entidad `CoachSession` (Zod), `ICoachSessionRepository` (4 métodos)
- Use cases: `getSessionsForMonthUseCase`, `createSessionUseCase` (valida solapamiento), `deleteSessionUseCase`
- `CoachSessionRemoteRepository`: `getForMonth`, `getOverlapping`, `create`, `delete`
- `coachCalendarStore`: `fetchMonth`, `addSession`, `removeSession`, `setSelectedDate`, `clearError`

**Métricas finales:**
- Test Suites: 47/47 ✅ | Tests: 775/775 ✅

---

#### RF-E2-05 — Etiquetas de clientes

**¿Qué hace?**
Sistema de etiquetas de colores para clasificar clientes. El coach puede crear etiquetas
con nombre y color, editarlas, borrarlas (con confirmación), y asignarlas o quitarlas
a clientes concretos. Las etiquetas aparecen como chips en la tarjeta de cada cliente
(lista) y en su pantalla de detalle.

**Pantallas / flujo:**
- `app/(coach)/clients/tags.tsx` — gestión de etiquetas
  - Lista de etiquetas existentes con su color y número de clientes asignados
  - Botón crear → modal con nombre + selector de color
  - Toque en etiqueta → modal de edición
  - Long-press → confirmación de borrado
- `app/(coach)/clients/index.tsx` — lista de clientes
  - Botón 🏷️ en cabecera → navega a gestión de etiquetas
  - Long-press en cliente → opción "Gestionar etiquetas" → abre TagPickerModal
  - Chips de color visibles en cada tarjeta
- `app/(coach)/clients/[id].tsx` — detalle del cliente
  - Sección "Etiquetas" con chips asignados + botón para abrir TagPickerModal
- `TagPickerModal` — bottom-sheet reutilizable con toggle asignar / quitar y feedback visual

**Implementación técnica:**
- SQL: tablas `client_tags` y `athlete_tags` con RLS e índices
- Domain: entidad `ClientTag` (Zod), `ITagRepository` (9 métodos)
- Use cases: getTags, createTag, updateTag, deleteTag, getAthleteTags, assignTag, removeTag
- `TagRemoteRepository`: bulk queries sin N+1, upsert idempotente para asignación
- `tagStore` Zustand con lista ordenada, error handling y clearError

**Métricas finales:**
- Test Suites: 44/44 ✅ | Tests: 725/725 ✅

---

#### RF-E2-03a — Métricas en tarjeta de cliente

**¿Qué hace?**
Las tarjetas de la lista de clientes muestran dos métricas operativas: cuándo fue la
última actividad del cliente (hoy, ayer, hace N días, hace N semanas, o fecha exacta)
y cuántas rutinas tiene asignadas.

**Pantallas / flujo:**
- `app/(coach)/clients/index.tsx` — tarjeta de cliente ampliada
  - Fila de métricas: ⚡ última actividad + 📋 nº rutinas

**Decisiones de diseño:**
- `fetchAthletes` usa `Promise.all` para hacer las queries de métricas en paralelo y evitar N+1.

**Implementación técnica:**
- `Athlete` extendido con `lastSessionAt: Date | null` y `routineCount: number`
- `formatLastActivity()` como función pura exportada y testeable
- `linkAthlete` y `createAthlete` inicializan los nuevos campos con valores neutros

**Métricas finales:**
- Test Suites: 4/4 ✅ | Tests: 82/82 ✅

---

#### RF-E2-02 — Búsqueda de clientes

**¿Qué hace?**
Barra de búsqueda en la lista de clientes que filtra por nombre o email de forma
parcial e insensible a mayúsculas/minúsculas. Muestra un estado vacío diferenciado
según si no hay clientes o si la búsqueda no produce resultados. Al cambiar de tab
(Activos / Archivados) la búsqueda se resetea.

**Pantallas / flujo:**
- `app/(coach)/clients/index.tsx` — search bar entre tabs y lista
  - Estado vacío: "Sin clientes" vs "Sin resultados para «query»"

**Implementación técnica:**
- `filterAthletes`: función pura exportada que filtra por tab y query

**Métricas finales:**
- Test Suites: 41/41 ✅ | Tests: 644/644 ✅

---

#### RF-E2-01 — Listado de clientes segmentado por estado

**¿Qué hace?**
La lista de clientes se divide en dos tabs: Activos y Archivados, cada uno con su
contador. El coach puede archivar un cliente activo (desaparece de Activos, pasa a
Archivados) o restaurarlo / eliminarlo definitivamente desde el tab Archivados.
Todo mediante long-press con menú de confirmación.

**Pantallas / flujo:**
- `app/(coach)/clients/index.tsx` — tabs Activos / Archivados con contador
  - Long-press en cliente activo → "Archivar"
  - Long-press en cliente archivado → "Restaurar" o "Eliminar"
  - Estado vacío diferenciado por tab

**Implementación técnica:**
- SQL: columna `status` (`active` | `archived`) en `coach_athletes`, default `active`
- `ClientStatus` type en dominio; `updateAthleteStatus` en repo
- `archiveAthleteUseCase` + `restoreAthleteUseCase`

**Métricas finales:**
- Test Suites: 40/40 ✅ | Tests: 631/631 ✅

---

#### RF-E1-01 — Dashboard consolidado de operación

**¿Qué hace?**
Pantalla home del coach con dos widgets informativos: un resumen de clientes
(total registrados + activos esta semana) y un feed de actividad reciente
(últimas sesiones completadas por sus atletas). Cada widget tiene un estado
vacío informativo si no hay datos.

**Pantallas / flujo:**
- `app/(coach)/dashboard.tsx`
  - Widget "Clientes": total + activos esta semana
  - Widget "Actividad reciente": lista de últimas sesiones con atleta, ejercicio y fecha

**Implementación técnica:**
- `getDashboardSummary` en `ICoachRepository` + `CoachRemoteRepository` (3 queries paralelas)
- `getCoachDashboardSummaryUseCase`
- `coachDashboardStore` Zustand con `fetchDashboardSummary` y `clearError`

**Métricas finales:**
- Test Suites: 40/40 ✅ | Tests: 620/620 ✅

---

#### TECH-01 — Saneamiento de tests heredados del prototipo

**¿Qué hace?**
Corrección de los tests rotos que venían del prototipo inicial. No hay cambios
visibles para el usuario. El objetivo es establecer una línea base limpia de
calidad antes de continuar con el desarrollo productivo.

**Pantallas / flujo:**
- Sin pantallas nuevas ni modificadas.

**Decisiones de diseño:**
- Umbral de cobertura corregido de 95% a 80% (según instrucciones del proyecto).
- `clearAllMocks` → `resetAllMocks` en tests con mocks de Supabase para evitar contaminación entre tests.

**Implementación técnica:**
- Corregidos 5 ficheros de tests con braces prematuros, fixtures incorrectos y mocks mal configurados
- `jest.config.ts`: umbral de cobertura ajustado

**Métricas finales:**
- Test Suites: 39/39 ✅ | Tests: 598/598 ✅

---

#### RF-E6-01 — Planes nutricionales: catálogo

**¿Qué hace?**
Pantalla de planes nutricionales del coach con lista de todos sus planes. Permite buscar
por nombre o descripción, filtrar por tipo (Déficit / Mantenimiento / Superávit / Otro)
mediante chips, crear nuevos planes con nombre, tipo, objetivos de macros diarios y comidas,
y borrar planes propios con confirmación.

**Pantallas / flujo:**
- `app/(coach)/nutrition/index.tsx` — lista + buscador + chips de tipo + estado vacío
  - Chips de tipo (4): Déficit, Mantenimiento, Superávit, Otro
  - `MacroPill` por plan: Cal / P / C / G con color semántico
  - Borrado con icono 🗑 + Alert de confirmación
  - `useFocusEffect` para recargar al volver del formulario
- `app/(coach)/nutrition/create.tsx` — formulario 2 pasos: (1) datos + tipo + macros; (2) comidas
  - Paso 1: selector de tipo por chips + macros diarios con auto-cálculo de kcal (fórmula 4-4-9)
  - Paso 2: comidas con macros individuales y presets (Desayuno, Almuerzo, Cena, Snack)
  - Todos los textos localizados al español mediante `Strings`

**Decisiones de diseño:**
- Migración SQL corrige esquema del prototipo: rename columnas `daily_*` → planas, hace `athlete_id` nullable, añade columna `type` y crea tablas `meals` y `nutrition_assignments`.
- El tipo de plan (`PlanType`) se gestiona como enum en dominio, no como string libre.
- `filterNutritionPlans` es función pura en capa application (testeable sin infraestructura).
- `TYPE_LABELS` se define localmente en cada pantalla que lo necesita (sin abstracción prematura).

**Implementación técnica:**
- `NutritionPlan.ts`: añade `PLAN_TYPES`, `PlanType`, campo `type` a schemas
- `NutritionUseCases.ts`: añade `filterNutritionPlans(items, query, types)` pura
- `NutritionRemoteRepository.ts`: `mapPlan` + `createPlan` incluyen `type` y `description`
- `strings.ts`: sección completa de literales para catálogo y formulario de planes nutricionales
- `nutritionStore.ts`, `INutritionRepository.ts`: sin cambios (infraestructura ya preparada)

**Métricas finales:**
- Test Suites: 1/1 ✅ | Tests: 43/43 ✅ (+12 tests `filterNutritionPlans`)

---

#### RF-E2-01 — Listado de clientes segmentado por estado

**¿Qué hace?**
Pantalla principal de clientes del coach con lista segmentada en dos tabs: Activos y Archivados.
Cada tab muestra solo los clientes de ese estado con su contador. El coach puede archivar clientes
activos, restaurar archivados o eliminarlos definitivamente mediante long-press. También puede
crear nuevos atletas o vincular existentes desde el botón "+".

**Pantallas / flujo:**
- `app/(coach)/clients/index.tsx` — lista + tabs Activos/Archivados + acciones
  - Tabs con contador en tiempo real (derivado del array local sin re-fetch)
  - Long-press abre Alert contextual: archivar (activos) / restaurar+eliminar (archivados)
  - Modal "Añadir cliente": dos modos → crear nuevo atleta (nombre+email+contraseña) o vincular existente (búsqueda por email/nombre)
  - Tags por atleta con `TagPickerModal`
  - `lastSessionAt` y `routineCount` visibles en cada tarjeta

**Decisiones de diseño:**
- `filterAthletes(athletes, tab, query)` es función pura exportada desde el componente — testeable sin montar UI.
- Los contadores por tab se derivan del array local para evitar queries extra.
- `useEffect` (no `useFocusEffect`) porque la pantalla es la raíz de la tab y permanece montada.

**Implementación técnica:**
- Migración `add_client_status.sql`: columna `status text check('active','archived')` en `coach_athletes`
- `ICoachRepository`: `updateAthleteStatus(coachId, athleteId, status)`
- `archiveAthleteUseCase` / `restoreAthleteUseCase` en `ClientUseCases.ts`
- `ClientTag` + `TagRemoteRepository` + `TagPickerModal` para gestión de etiquetas
- `formatLastActivity(date)` — función pura de presentación con i18n básico

**Métricas finales:**
- Test Suites: 2/2 ✅ | Tests: 45/45 ✅

---

#### RF-E2-02 — Búsqueda de clientes

**¿Qué hace?**
Buscador integrado en la pantalla de clientes que filtra en tiempo real por nombre o email,
dentro del tab activo. La búsqueda es parcial y no distingue mayúsculas/minúsculas. Muestra
estado "sin resultados" cuando ningún cliente coincide.

**Pantallas / flujo:**
- `app/(coach)/clients/index.tsx` — barra de búsqueda sobre la lista, persistente entre tabs
  - Query se aplica sobre el tab activo: busca en `full_name` y `email` simultáneamente
  - Estado vacío si la query no produce resultados

**Decisiones de diseño:**
- Filtrado en cliente (no query a BD) — la lista completa ya está en memoria, el volumen por coach es pequeño.

**Implementación técnica:**
- `filterAthletes` maneja tab + query en una sola pasada
- No requiere cambios de infraestructura ni migración

**Métricas finales:**
- Cubierto por los mismos tests que RF-E2-01 (misma suite)

---

#### RF-E8-01 — Calendario operativo

**¿Qué hace?**
Vista mensual del calendario del coach con navegación por meses, dots en días con sesiones,
panel de sesiones del día seleccionado y acceso directo a crear sesión. Incluye una segunda
vista de lista con filtros por rango de fechas, tipo de sesión y modalidad.

**Pantallas / flujo:**
- `app/(coach)/calendar/index.tsx` — calendario mensual + tabs Calendario/Lista
  - Grid 7×N con lunes como primer día; dots por sesión en cada día
  - Panel inferior muestra sesiones del día con hora, título, atleta y acción eliminar
  - Botón "+" navega a creación pre-rellenando la fecha seleccionada
- `app/(coach)/calendar/SessionListView.tsx` — lista con filtros persistentes
  - Selector rango desde/hasta + chips tipo + chips modalidad

**Implementación técnica:**
- `CoachSession` entity + `coachCalendarStore`: `fetchMonth`, `addSession`, `removeSession`
- `buildCalendarDays` función pura que genera el grid con offset de lunes
- Migración `add_coach_sessions.sql`: tabla `coach_sessions` con RLS

**Métricas finales:**
- Test Suites: 2/2 ✅ | Tests: 51/51 ✅

---

#### RF-E8-02 — Sesiones agendadas (vista lista)

**¿Qué hace?**
Vista de lista dentro del calendario que filtra sesiones por rango de fechas, tipo y modalidad.
Los filtros son persistentes durante la sesión de usuario.

**Pantallas / flujo:**
- `app/(coach)/calendar/SessionListView.tsx` — tab "Lista" dentro del calendario

**Implementación técnica:**
- `applyFilters(sessions, filters)` función pura + `ListFilters` type en `coachCalendarStore`

**Métricas finales:**
- Cubierto por los mismos tests que RF-E8-01

---

#### RF-E8-03 — Creación de sesiones

**¿Qué hace?**
Formulario para crear una sesión indicando título, atleta, tipo, modalidad, fecha/hora y duración.
La sesión aparece inmediatamente en el calendario al guardar.

**Pantallas / flujo:**
- `app/(coach)/calendar/create.tsx` — formulario con DateTimePicker nativo
  - Selector de atleta, chips tipo y modalidad, duración en opciones fijas (30–120 min)
  - Recibe parámetro `date` para pre-rellenar la fecha desde el calendario

**Implementación técnica:**
- `createSessionUseCase` valida solape horario antes de insertar
- `@react-native-community/datetimepicker` para fecha y hora

**Métricas finales:**
- Cubierto por los mismos tests que RF-E8-01

---

#### RF-E6-04 — Catálogo de alimentos

**¿Qué hace?**
Pantalla de alimentos del coach con un catálogo base de 35 alimentos predefinidos (genéricos, específicos
y suplementos) más los que cree cada coach. Permite buscar por nombre, filtrar por tipo mediante chips
(Genérico / Específico / Suplemento / Propios) y crear nuevos alimentos con nombre, tipo y macros
completos (kcal, proteína, carbos, grasas, fibra) por 100 g. Solo se pueden eliminar los alimentos
propios del coach.

**Pantallas / flujo:**
- `app/(coach)/foods/index.tsx` — lista + buscador + 4 chips de filtro
  - Chip "Propios" es mutuamente excluyente con los chips de tipo
  - Cada tarjeta muestra nombre, badge de tipo, "por 100g" y 5 MacroPills (Kcal/P/C/G/F)
  - Botón eliminar solo visible en alimentos propios del coach
  - `useFocusEffect` para recargar al volver del formulario
- `app/(coach)/foods/create.tsx` — formulario: nombre, tipo (3 chips), 5 campos numéricos en grid
- Accesible desde `app/(coach)/nutrition/index.tsx` mediante botón "Alimentos →" en la cabecera

**Decisiones de diseño:**
- Ruta oculta (href: null) en el layout del coach — no aparece en la tab bar, se navega desde nutrición.
- El filtro "Propios" se resuelve en cliente comparando `coachId === user.id`, no es un tipo de BD. La BD usa solo 3 tipos: `generic | specific | supplement`.
- Catálogo base sembrado en BD con `coach_id = NULL` (igual que cardios), lo que permite asignarlo en historias futuras de forma uniforme.
- `parseFloat(...) || 0` en el formulario: campos numéricos opcionales, valor 0 si se dejan vacíos.

**Implementación técnica:**
- `Food.ts`: entidad con `FoodSchema` + `CreateFoodSchema` (Zod, validación de rangos por macro)
- `IFoodRepository` + `FoodRemoteRepository`: `getFoodsByCoach` (OR coach_id IS NULL), `createFood`, `deleteFood`
- `FoodUseCases.ts`: `getFoodsUseCase`, `createFoodUseCase`, `deleteFoodUseCase`, `filterFoods` (pura)
- `foodStore.ts`: `fetchFoods`, `createFood` (inserta ordenado alfabéticamente), `deleteFood`, `clearError`
- Migración SQL: tabla `foods` + RLS + seed 35 alimentos base

**Métricas finales:**
- Test Suites: 1/1 ✅ | Tests: 30/30 ✅

---

#### RF-E6-03 — Recetas

**¿Qué hace?**
Biblioteca de recetas del coach. El coach puede crear recetas con nombre, instrucciones, imagen opcional,
tags libres e ingredientes (cada uno vinculado a un alimento del catálogo con cantidad en gramos). Los macros
totales (kcal, proteína, carbos, grasas, fibra) se calculan automáticamente en cliente. Las recetas se pueden
editar y eliminar con confirmación. El coach no puede borrar un alimento que esté siendo usado en alguna receta.

**Pantallas / flujo:**
- `app/(coach)/recipes/index.tsx` — lista + buscador + chips de tags dinámicos + delete con confirmación
  - Chips generados de todos los tags del catálogo propio
  - Filtrado OR: receta visible si contiene alguno de los tags activos
  - `useFocusEffect` para recargar al volver del formulario
- `app/(coach)/recipes/create.tsx` — formulario: nombre, imagen, tags, ingredientes (food picker modal + cantidad), instrucciones
- `app/(coach)/recipes/[id].tsx` — detalle: imagen, macros totales, lista de ingredientes, instrucciones + botón "Editar"
- `app/(coach)/recipes/edit.tsx` — mismo formulario pre-rellenado, acepta `id` como param
- Accesible desde `app/(coach)/nutrition/index.tsx` via botón "Recetas →"

**Decisiones de diseño:**
- Macros calculados en cliente con `computeRecipeMacros()` (pura), no almacenados en BD. Evita sincronización de datos derivados.
- Ingredientes reemplazados en bloque en update (DELETE + INSERT), no diff individual. Simplifica la lógica de edición.
- `ON DELETE RESTRICT` implícito en FK `recipe_ingredients.food_id → foods.id`. `deleteFoodUseCase` verifica `isUsedInRecipes` primero y lanza error con mensaje claro.
- Imagen en bucket privado `recipe-images` con signed URLs (1h), mismo patrón que `progress-photos`.
- `show_macros` y `visible_to_clients` almacenados en BD (default `true`) para uso futuro en la app del atleta, sin UI en esta historia.

**Implementación técnica:**
- `Recipe.ts`: entidad con `CreateRecipeSchema`, `UpdateRecipeSchema`, `RecipeIngredientSchema`, tipos `RecipeWithIngredients` y `RecipeMacros`
- `IRecipeRepository` + `RecipeRemoteRepository`: CRUD + `uploadImage`/`deleteImage` en Storage
- `RecipeUseCases.ts`: 5 use cases + `filterRecipes(items, query, tags)` + `computeRecipeMacros(ingredients)`
- `recipeStore.ts`: `fetchRecipes`, `fetchRecipeDetail`, `createRecipe`, `updateRecipe` (con swap de imagen), `deleteRecipe`
- `IFoodRepository` + `FoodRemoteRepository` actualizados con `isUsedInRecipes`; `deleteFoodUseCase` actualizado

**Métricas finales:**
- Test Suites: 2/2 ✅ | Tests: 73/73 ✅ (40 RecipeUseCases + 33 FoodUseCases)

---

#### RF-E7-02 — Repositorio de documentos compartidos

**¿Qué hace?**
Depósito de intercambio de ficheros entre el coach y un atleta concreto. El coach puede subir cualquier tipo de
archivo desde su móvil (PDF, Word, imágenes, vídeos, etc.) para un atleta determinado, abrirlo directamente
o eliminarlo si fue él quien lo subió. Los documentos solo son visibles entre el par coach-atleta concreto.
Los ejecutables (.exe, .apk, .sh, .bat, .cmd, .ps1, .msi, .deb, .dmg, .bin) están bloqueados.

**Pantallas / flujo:**
- `app/(coach)/clients/documents.tsx` — lista de documentos + subida + apertura + borrado
  - Accesible desde `app/(coach)/clients/[id].tsx` mediante botón "Documentos" en la topbar
  - Selector de fichero nativo via `expo-document-picker`
  - Validación de extensión bloqueada antes de subir
  - Tarjeta por documento: badge de extensión, nombre, tamaño (KB), fecha, botón "Abrir" (signed URL) y papelera (solo uploader)
  - Estado vacío con emoji y texto descriptivo
  - Banner de error no bloqueante

**Decisiones de diseño:**
- Documentos aislados por par `(coach_id, athlete_id)`: RLS garantiza que solo los dos implicados los ven.
- Ficheros almacenados en bucket privado `documents` con path `{coachId}/{athleteId}/{timestamp}.{ext}`.
- Signed URLs generadas en lectura con expiración de 1h. Apertura via `Linking.openURL` sin módulo nativo adicional.
- `isBlockedExtension` es una función pura en la capa application, testeable de forma aislada.
- Solo el uploader puede borrar su fichero (`uploaded_by = auth.uid()` en RLS DELETE).
- La parte del atleta (subir desde el lado cliente) queda pendiente en RF-E7-02b.

**Implementación técnica:**
- Migración SQL: tabla `documents` + índice `(coach_id, athlete_id)` + RLS (SELECT, INSERT, DELETE) + bucket `documents`
- `Document.ts`: entidad con `BLOCKED_EXTENSIONS`, `DocumentSchema`, `CreateDocumentSchema`
- `IDocumentRepository` + `DocumentRemoteRepository`: `getDocuments`, `uploadFile`, `uploadDocument`, `deleteDocument`
- `DocumentUseCases.ts`: `isBlockedExtension` (pura), `getDocumentsUseCase`, `uploadDocumentUseCase`, `deleteDocumentUseCase`
- `documentStore.ts`: estado `documents`, `isLoading`, `isUploading`, `error`
- `expo-document-picker` como nueva dependencia nativa (`~14.0.8`)

**Métricas finales:**
- Test Suites: 1/1 ✅ | Tests: 35/35 ✅

---

## 🐛 Bugs resueltos

#### BUG-01 — Correcciones de defectos (sesión 2026-03-25)

**¿Qué hace?**
Corrección de seis defectos detectados durante pruebas manuales en la sección de nutrición y recetas.

**Defectos corregidos:**

1. **Botón Guardar en creación de plan nutricional no hacía nada**
   - `PostgrestError` de Supabase no es `instanceof Error`, la catch del store usaba el mensaje genérico de fallback y no lo propagaba a la UI.
   - Fix: `nutritionStore.createPlan` extrae `err?.message`; `create.tsx` muestra banner de error dismissible.

2. **Plan creado solo mostraba macros (columnas no encontradas en schema cache)**
   - Las columnas renombradas en la migración `fix_nutrition_plans.sql` no estaban en el caché de PostgREST. La migración había fallado parcialmente (transacción rollback) dejando un estado inconsistente entre el historial de migraciones y la BD real.
   - Fix: aplicación manual de columnas via Management API + `NOTIFY pgrst, 'reload schema'` + políticas RLS de `meals`.

3. **No aparecía el botón "Nuevo plan" tras crear uno (overflow de cabecera)**
   - Tres botones en una sola fila (`Recetas →`, `Alimentos →`, `+ Nuevo`) desbordaban el ancho en móvil.
   - Fix: `nutrition/index.tsx` — botón "+ Nuevo" junto al título; botones secundarios en segunda fila.

4. **Botón "Recetas →" mostraba spinner infinito**
   - `isLoading` compartido entre `fetchRecipes` y `fetchRecipeDetail` en `recipeStore`. Si el detalle corría en paralelo o dejaba el flag a `true`, la lista mostraba spinner permanente.
   - Fix: separar en `isListLoading` y `isDetailLoading`. Además `[id].tsx` separaba `isDetailLoading` de `!currentRecipe` para no mostrar spinner cuando no hay datos.

5. **"Recetas →" y "Alimentos →" navegaban a pantalla incorrecta**
   - `router.push('/(coach)/recipes/index')` se resolvía a `recipes/[id]` con `id='index'` porque `index.tsx` representa la raíz del directorio, no un segmento literal.
   - Además, todas las sub-pantallas de recetas/alimentos eran tabs planos sin stack propio, por lo que el tab group recordaba el último screen visitado (create, [id]…).
   - Fix: rutas corregidas a `/(coach)/recipes` y `/(coach)/foods`; creados `recipes/_layout.tsx` y `foods/_layout.tsx` con Stack navigator.

6. **Guardar receta con imagen fallaba silenciosamente**
   - `fetch(localUri).blob()` en React Native produce un Blob incompatible con el SDK de Supabase Storage → "network request failed".
   - Además el URI podía incluir query strings que corrompían la extensión del fichero.
   - Fix: `RecipeRemoteRepository.uploadImage` usa `expo-file-system/legacy` para leer como base64 y convierte a `Uint8Array` antes de subir. Extensión se extrae antes del `?`. Banner de error añadido a `create.tsx`.

**Archivos modificados:**
- `src/presentation/stores/nutritionStore.ts`
- `src/presentation/stores/recipeStore.ts`
- `src/infrastructure/supabase/remote/NutritionRemoteRepository.ts`
- `src/infrastructure/supabase/remote/RecipeRemoteRepository.ts`
- `app/(coach)/nutrition/index.tsx`
- `app/(coach)/nutrition/create.tsx`
- `app/(coach)/recipes/index.tsx`
- `app/(coach)/recipes/[id].tsx`
- `app/(coach)/recipes/edit.tsx`
- `app/(coach)/recipes/create.tsx`
- `app/(coach)/recipes/_layout.tsx` *(nuevo)*
- `app/(coach)/foods/_layout.tsx` *(nuevo)*
- `app/(coach)/_layout.tsx`

---

#### BUG-02 — Corrección sistémica de propagación de errores Supabase (sesión 2026-03-26)

**¿Qué hace?**
Corrección de un bug estructural presente en todos los stores y repositorios: los errores de Supabase (`PostgrestError`) no extiendan `Error` de JavaScript, por lo que el patrón `err instanceof Error` siempre devolvía `false` y los errores se silenciaban mostrando solo el mensaje de fallback genérico.

**Defectos corregidos:**

1. **`err instanceof Error` siempre `false` en catch blocks de stores (16 stores, ~75 ocurrencias)**
   - Los catch blocks usaban `err instanceof Error ? err.message : 'fallback'`, lo que siempre tomaba el fallback porque `PostgrestError` no hereda de `Error`.
   - Fix: sustituido por `(err as any)?.message ?? 'fallback'` en todos los stores.
   - Afecta: `authStore`, `bodyMetricStore`, `cardioStore`, `coachCalendarStore`, `coachDashboardStore`, `customExerciseStore`, `documentStore`, `foodStore`, `nutritionStore`, `progressPhotoStore`, `progressStore`, `recipeStore`, `routineStore`, `tagStore`, `videoStore`, `workoutStore`.

2. **`throw error` crudo (PostgrestError) en repositorios remotos (~68 ocurrencias)**
   - Los repositorios hacían `throw error` directamente con el objeto PostgrestError, que al llegar al catch del store no era reconocido como `instanceof Error`.
   - Fix: envuelto como `throw new Error(error.message)` en todos los casos. Los casos `if (error || !data) throw error` se separaron en dos guards: `if (error) throw new Error(error.message)` + `if (!data) throw new Error('...')`.
   - Afecta: `BodyMetricRemoteRepository`, `CoachRemoteRepository`, `CustomExerciseRemoteRepository`, `DocumentRemoteRepository`, `MessageRemoteRepository`, `NutritionRemoteRepository`, `ProgressPhotoRemoteRepository`, `ProgressRemoteRepository`, `RecipeRemoteRepository`, `RoutineRemoteRepository`.

**Archivos modificados:**
- 16 ficheros en `src/presentation/stores/`
- 10 ficheros en `src/infrastructure/supabase/remote/`

---

## 🔲 En curso

---

## 💡 Pendiente

---

### Deuda técnica detectada (no bloqueante)

#### DT-01 — Tests de NutritionRemoteRepository desactualizados tras BUG-02 ✅ (2026-03-26)
Corregidos los dos tests que esperaban el mensaje crudo del PostgrestError. Ahora los mocks incluyen `code` y los mensajes esperados usan el formato con prefijo (`'nutrition_plans insert: Insert failed (ERR)'`, `'meals insert: Meals failed (ERR)'`). Tests: 32/32 ✅

#### DT-02 — Strings.errorFallback ausente en strings.ts (pre-existente)
Todos los stores referenciaban `Strings.errorFallback` que no existía, dejando el error como `undefined` en el fallback. Añadido en RF-E6-11 (`'Ha ocurrido un error inesperado'`).

---

### ÉPICA E1 — Home profesional y productividad


#### RF-E1-02 (P1) Accesos rápidos configurables
**Requisito:** El usuario puede configurar accesos rápidos de acciones frecuentes.

**Criterios de aceptación:**
- Existe botón "Editar accesos rápidos".
- Se puede agregar, quitar y reordenar accesos.
- Los cambios persisten por usuario.

**Dependencia de plan:** No observada.

---

#### RF-E1-03 (P1) Filtro de actividad reciente
**Requisito:** Permitir filtrar el feed de actividad por tipo, evento, cliente o profesional.

**Criterios de aceptación:**
- El botón "Filtrar actividad" abre panel de filtros.
- El listado se actualiza según filtros aplicados.
- Se puede resetear filtros.

**Dependencia de plan:** No observada.

---

#### RF-E1-04 (P2) Recomendaciones contextuales / ayuda
**Requisito:** Mostrar carrusel de descubrimiento (tutoriales/promos) contextual al uso.

**Criterios de aceptación:**
- El carrusel es navegable.
- Cada slide tiene CTA accionable.
- Puede ocultarse/minimizarse para no interferir con el flujo principal.

**Dependencia de plan:** Parcial (algunas promos de add-ons).

---

### ÉPICA E2 — Gestión de clientes


#### RF-E2-03b (P1) Métricas avanzadas en tarjeta de cliente
**Requisito:** Exponer columnas de estado operativo adicionales (plan, cumplimiento, pagos, etiquetas).

**Criterios de aceptación:**
- Columnas visibles: Plan activo, Estado plan, Último pago, Cumplimiento, Etiquetas.
- Requiere schema de pagos y planes en Supabase.
- Soporte de ordenación en columnas permitidas.

**Dependencia de plan:** Requiere RF-E2-05 (etiquetas) y schema de pagos.

---

#### RF-E2-04 (P1) Comunidad por grupos
**Requisito:** Crear y gestionar grupos para compartir contenido y comunicación.

**Criterios de aceptación:**
- Vista de comunidad con estado vacío y CTA "Crear grupo".
- Crear grupo solicita al menos nombre y alcance.
- El grupo permite publicar y compartir contenido.

**Dependencia de plan:** No observada.

---

#### RF-E2-06 (P1) Automatizaciones por etiqueta
**Requisito:** Permitir reglas que se disparan al crear perfil de cliente con una etiqueta.

**Criterios de aceptación:**
- Configurar automatizaciones desde el detalle de etiqueta.
- Al asignar etiqueta en alta de cliente, se ejecutan las reglas asociadas.
- Registrar evidencia en historial de actividad.

**Dependencia de plan:** No observada.

---

### ÉPICA E4 — Librería: actividad física (Ejercicios, Workouts, Cardio)

> RF-E4-01 (ejercicios), RF-E4-02 (rutinas/workouts) y RF-E4-04 (cardios) completados — ver sección Completado.

#### RF-E4-05 (P1) Reutilización cross-módulo
**Requisito:** Ejercicios, workouts y cardios deben poder asignarse en planes, programas y clientes.

**Criterios de aceptación:**
- Selección desde buscador unificado.
- Mantener versión referenciada en el momento de asignación.
- Registrar uso por cliente y programa.

**Dependencia de plan:** No observada.

---

### ÉPICA E5 — Librería: vídeos

> RF-E5-01 (biblioteca de vídeos) completado — ver sección Completado.

#### RF-E5-02 (P1) Alta de vídeo
**Requisito:** Añadir vídeo con metadatos de publicación.

**Criterios de aceptación:**
- Acción "Añadir vídeo" accesible desde la biblioteca.
- Campos mínimos: título, fuente, etiquetas y visibilidad.
- Previsualización y validación previa al guardado.

**Dependencia de plan:** No observada.

---

#### RF-E5-03 (P1) Gestión de visibilidad de vídeos
**Requisito:** Mostrar u ocultar vídeos para clientes y equipo según reglas.

**Criterios de aceptación:**
- Estado visible/no visible por elemento.
- Cambio de estado inmediato y auditable.
- Filtro por estado de visibilidad.

**Dependencia de plan:** No observada.

---

#### RF-E5-04 (P2) Add-on de clases profesionales
**Requisito:** Activación de paquete premium de vídeos.

**Criterios de aceptación:**
- Banner con CTA de activación y detalle del add-on.
- Si no está activo, mostrar teaser y beneficios.
- Si está activo, desbloquear catálogo completo.

**Dependencia de plan:** Sí (add-on de pago).

---

### ÉPICA E6 — Librería: nutrición (Planes, Recetas, Alimentos, Agrupaciones)

> RF-E6-01 (planes), RF-E6-03 (recetas) y RF-E6-04 (alimentos) completados — ver sección Completado.

#### RF-E6-11 (P1) Edición de alimentos del catálogo
**Requisito:** El entrenador puede editar cualquier alimento visible en su catálogo: tanto los del catálogo base genérico (coach_id IS NULL) como los creados por él.

**Criterios de aceptación:**
- Botón "Editar" visible en todos los alimentos (genéricos y propios).
- Formulario de edición pre-relleno con los valores actuales (nombre, tipo, macros).
- Al guardar un alimento genérico, se crea una copia del alimento para ese coach (coach_id = auth.uid()) en lugar de modificar el registro base — así los cambios son locales al entrenador y no afectan a otros.
- Al guardar un alimento propio, se actualiza el registro directamente.
- El alimento editado/creado reemplaza al original en la lista sin recargar manualmente.
- Validación de rangos igual que en creación.
- Si el alimento está en uso en recetas, la edición es igualmente posible (afecta cálculos futuros).

**Decisión de diseño pendiente:** confirmar si editar un genérico debe crear una copia por-coach o modificar el registro base (afectaría a todos los coaches). Preguntar antes de implementar.

**Dependencia:** RF-E6-04 completado.

---


---


#### RF-E6-09 (P2) Versionado de planes nutricionales
**Requisito:** Historial de cambios por plan para trazabilidad.

**Criterios de aceptación:**
- Al editar un plan se crea una nueva versión en lugar de sobrescribir.
- Vista de historial de versiones por plan con fecha y autor.
- Posibilidad de restaurar una versión anterior.

**Dependencia:** RF-E6-01 + RF-E6-07 completados.

---




---

#### RF-E6-06 (P1) Publicación controlada de contenido de librería Harbiz
**Requisito:** Capacidad de exponer u ocultar masivamente recetas del catálogo base.

**Criterios de aceptación:**
- Botón "Mostrar todas" (o equivalente) con confirmación previa.
- Aplicación masiva reversible.
- Impacto reflejado en visibilidad individual por receta.

**Dependencia de plan:** No observada.

---

### ÉPICA E7 — Librería: programas, documentos, formularios, validación

#### RF-E7-01 — Programas
> **EXCLUIDO** — No aplica en la app de momento. Decisión del producto.

---

#### RF-E7-02b (P1) Documentos — lado atleta
**Requisito:** El atleta puede subir ficheros al repositorio compartido con su coach y descargar los que el coach ha subido.

**Criterios de aceptación:**
- El atleta ve la misma pantalla de documentos pero accesible desde su área.
- Puede subir ficheros (mismas restricciones de extensión que el coach).
- Solo puede eliminar los ficheros que él mismo ha subido.

**Dependencia:** RF-E7-02 completado.

---

#### RF-E7-03 — Formularios
> **DIFERIDO** — Requisitos pendientes de definición por parte del producto. Retomaremos cuando estén claros.

**Notas previas:**
- Los formularios tendrán preguntas configurables (campos personalizados).
- Uso previsto: onboarding y seguimiento del atleta.

---

#### RF-E7-04 (P1) Flujo de validación de contenido
**Requisito:** Revisar y aprobar contenido generado por colaboradores antes de publicar.

**Criterios de aceptación:**
- Bandeja "Contenido a validar" con filtros aplicables.
- Acciones aprobar/rechazar con motivo obligatorio.
- Notificación al creador del resultado de la validación.

**Dependencia de plan:** No observada.

---

#### RF-E7-05 (P1) Trazabilidad editorial
**Requisito:** Registrar quién crea, quién valida y cuándo se publica cada contenido.

**Criterios de aceptación:**
- Metadata por contenido: creador, validador, fechas.
- Historial accesible desde el detalle de cada contenido.
- Exportable para auditoría.

**Dependencia de plan:** No observada.

---

### ÉPICA E8 — Agenda (calendario, sesiones, citas, tipos, actividad)

#### RF-E8-04 (P1) Horario de citas reservables
**Requisito:** Definir ventanas de reserva para que los clientes reserven desde la app.

**Criterios de aceptación:**
- Crear horario con rango de fechas, duración, profesional y modalidad.
- Activar/desactivar horario.
- Visualizar estado y ocupación del horario.

**Dependencia de plan:** No observada.

---

#### RF-E8-05 (P1) Tipos de sesión
**Requisito:** Configurar tipos de sesión con color y uso transversal.

**Criterios de aceptación:**
- Alta de tipo de sesión con nombre y color.
- Tabla con color y fecha de creación.
- Permitir sustitución del tipo cuando no se pueda borrar por estar en uso.

**Dependencia de plan:** No observada.

---

#### RF-E8-06 (P1) Historial de actividad de agenda
**Requisito:** Timeline de acciones sobre sesiones por rango de fechas.

**Criterios de aceptación:**
- Filtro por fechas aplicable al historial.
- Mostrar autor y acción realizada en cada entrada.
- Enlaces navegables a la sesión afectada.

**Dependencia de plan:** No observada.

---

#### RF-E8-07 (P1) KPI de agenda
**Requisito:** Mostrar KPIs de sesiones, asistencia, reservas y cancelaciones.

**Criterios de aceptación:**
- KPIs visibles en la vista de calendario.
- Recálculo automático según el periodo mostrado.
- Definición de fórmula por KPI documentada internamente.

**Dependencia de plan:** No observada.

---

_Última actualización: 2026-03-23 — RF-E5-01 cerrado._
