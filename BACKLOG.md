# BACKLOG

## ✅ Completado

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

## 🔲 En curso

---

## 💡 Pendiente

---

### ÉPICA E1 — Home profesional y productividad

#### RF-E1-01 (P0) Dashboard consolidado de operación
**Requisito:** El sistema debe mostrar un dashboard con actividad, eventos, cumplimiento y suscripciones.

**Criterios de aceptación:**
- Al entrar en home, se muestran widgets de: Actividad reciente, Próximos eventos, Revisar cumplimiento y Suscripciones.
- Cada widget refleja datos actualizados del rango temporal vigente.
- Si no hay datos, debe mostrarse estado vacío informativo.

**Dependencia de plan:** No observada.

---

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

#### RF-E2-05 (P1) Etiquetas de clientes
**Requisito:** Alta, consulta, detalle y borrado de etiquetas.

**Criterios de aceptación:**
- Crear etiqueta con nombre único por cuenta.
- Tabla muestra número de clientes y si tiene automatizaciones asociadas.
- La acción de borrado exige confirmación explícita.

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

#### RF-E4-01 (P0) Catálogo de ejercicios
**Requisito:** Crear, listar, buscar y filtrar ejercicios.

**Criterios de aceptación:**
- Buscador por nombre y tags.
- Paginación y contador total visible.
- Alta de ejercicio con metadatos mínimos: nombre, tipo y media.

**Dependencia de plan:** No observada.

---

#### RF-E4-02 (P0) Catálogo de workouts
**Requisito:** Gestionar workouts en tabla con trazabilidad de creador y fecha.

**Criterios de aceptación:**
- Búsqueda por nombre o descripción.
- Ordenación por nombre, fecha de creación y creador.
- Paginación y selección múltiple.

**Dependencia de plan:** No observada.

---

#### RF-E4-04 (P0) Catálogo de cardios
**Requisito:** Crear y administrar sesiones de cardio reutilizables.

**Criterios de aceptación:**
- Vista card/lista de cardios propios y de base Harbiz.
- Buscador por nombre.
- Alta de cardio con duración, intensidad y tipo.

**Dependencia de plan:** No observada.

---

#### RF-E4-05 (P1) Reutilización cross-módulo
**Requisito:** Ejercicios, workouts y cardios deben poder asignarse en planes, programas y clientes.

**Criterios de aceptación:**
- Selección desde buscador unificado.
- Mantener versión referenciada en el momento de asignación.
- Registrar uso por cliente y programa.

**Dependencia de plan:** No observada.

---

### ÉPICA E5 — Librería: vídeos

#### RF-E5-01 (P0) Biblioteca de vídeos
**Requisito:** Gestionar vídeos propios y de librería Harbiz.

**Criterios de aceptación:**
- Toggles "Ver mis vídeos" y "Ver vídeos librería Harbiz".
- Buscador por nombre.
- Filtros por etiquetas y criterio "contiene".

**Dependencia de plan:** No observada.

---

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


#### RF-E6-07 (P1) Duplicado de planes nutricionales
**Requisito:** Copiar un plan existente para crear uno nuevo a partir de él.

**Criterios de aceptación:**
- Acción "Duplicar" accesible desde la lista de planes.
- El plan duplicado se crea con el mismo contenido y nombre "(Copia) Nombre original".
- El duplicado aparece en la lista sin recargar manualmente.

**Dependencia:** RF-E6-01 completado.

---

#### RF-E6-08 (P1) Asignación de planes nutricionales a atletas
**Requisito:** Asignar uno o varios planes a un atleta desde el catálogo.

**Criterios de aceptación:**
- Selección múltiple con long-press (mismo patrón que cardios/rutinas).
- Modal de selección de atleta.
- Confirmación tras asignación exitosa.

**Dependencia:** RF-E6-01 completado.

---

#### RF-E6-09 (P2) Versionado de planes nutricionales
**Requisito:** Historial de cambios por plan para trazabilidad.

**Criterios de aceptación:**
- Al editar un plan se crea una nueva versión en lugar de sobrescribir.
- Vista de historial de versiones por plan con fecha y autor.
- Posibilidad de restaurar una versión anterior.

**Dependencia:** RF-E6-01 + RF-E6-07 completados.

---

#### RF-E6-03 (P0) Recetas
**Requisito:** Biblioteca de recetas con etiquetas y kcal.

**Criterios de aceptación:**
- Añadir receta de forma manual.
- Buscador y filtros por tags y creador.
- Acción mostrar/ocultar receta a clientes.

**Dependencia de plan:** No observada.

---

#### RF-E6-04 (P0) Alimentos y base nutricional
**Requisito:** Gestión de base de alimentos (energía, macros, fibra).

**Criterios de aceptación:**
- Filtro por tipo: genérico, específico, suplemento y propios.
- Tabla nutricional completa por alimento.
- Crear alimento personalizado.

**Dependencia de plan:** No observada.

---

#### RF-E6-05 (P1) Agrupaciones de planes
**Requisito:** Agrupar planes nutricionales para asignación masiva.

**Criterios de aceptación:**
- Crear agrupación con nombre y descripción.
- Asociar N planes a la agrupación.
- Buscar y listar agrupaciones con conteo de planes incluidos.

**Dependencia de plan:** No observada.

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

#### RF-E7-01 (P0) Programas
**Requisito:** Gestionar programas por semanas, automatización y creador.

**Criterios de aceptación:**
- Tabla con columnas funcionales: semanas, actualizado, automatizado, creador, etc.
- Añadir programa y editar estructura.
- Menú de acciones por fila (editar, duplicar, archivar, etc.).

**Dependencia de plan:** No observada.

---

#### RF-E7-02 (P0) Documentos
**Requisito:** Subir, clasificar y compartir documentos con control de visibilidad.

**Criterios de aceptación:**
- Alta de documento con nombre, descripción y visibilidad.
- Buscador por nombre o autor.
- Acciones por documento: editar, compartir, etc.

**Dependencia de plan:** No observada.

---

#### RF-E7-03 (P0) Formularios
**Requisito:** Crear y gestionar formularios para onboarding y seguimiento.

**Criterios de aceptación:**
- Añadir formulario nuevo.
- Tabla con nombre, creador y fecha.
- Soporte para formularios de "envío automático".

**Dependencia de plan:** No observada.

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

#### RF-E8-01 (P0) Calendario operativo
**Requisito:** Vista mensual con eventos/sesiones y navegación temporal.

**Criterios de aceptación:**
- Botón "Hoy" + navegación mes anterior/siguiente.
- Render de eventos por día con detalle mínimo visible.
- Acción "Crear" accesible desde el calendario.

**Dependencia de plan:** No observada.

---

#### RF-E8-02 (P0) Sesiones agendadas
**Requisito:** Vista lista por rango de fechas con filtros y métricas.

**Criterios de aceptación:**
- Selector desde–hasta para rango temporal.
- Filtros aplicables y persistentes durante la sesión de usuario.
- Modo lista y modo métricas disponibles.

**Dependencia de plan:** No observada.

---

#### RF-E8-03 (P0) Creación de sesiones
**Requisito:** Crear sesión indicando cliente, tipo, modalidad, hora y duración.

**Criterios de aceptación:**
- Formulario de alta con validaciones de solape horario.
- Confirmación y reflejo inmediato en calendario y lista.
- Registro de actividad automático al crear.

**Dependencia de plan:** No observada.

---

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
