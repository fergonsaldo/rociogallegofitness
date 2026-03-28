# BACKLOG

## ✅ Completado

#### RF-E2-04b — Grupos de atletas: asignación masiva de contenido

**¿Qué hace?**
Desde el detalle de un grupo, el coach puede asignar una rutina, un cardio o un plan de nutrición a todos los miembros del grupo en un solo paso. Un modal con tres pickers permite seleccionar el contenido a asignar. El botón "Asignar" está deshabilitado si el grupo no tiene miembros o no se ha seleccionado ningún contenido. Al confirmar, el sistema asigna en paralelo y muestra un Alert de éxito o error.

**Pantallas / flujo:**
- `app/(coach)/clients/group-detail.tsx` — modificada
  - Botón 📋 en el header (deshabilitado sin miembros) abre `AssignContentModal`
  - `AssignContentModal`: 3 sección-pickers (rutina, cardio, plan) + botones Asignar/Cancelar
  - `ContentPickerModal`: picker genérico reutilizable con opción "Sin asignar"
  - Al asignar: Alert de éxito o Alert de error con mensaje descriptivo

**Decisiones de diseño:**
- `assignContentToGroupUseCase` usa `Promise.allSettled` para que todas las asignaciones corran aunque alguna falle, luego lanza error si hay fallos — igual que en tag automations.
- El modal carga listas de contenido en `group-detail` al montar (no en el modal), para no repetir la carga si el modal se abre varias veces.
- El botón "Asignar" se deshabilita si `isAssigning` está activo (evita doble submit).

**Implementación técnica:**
- `application/coach/AthleteGroupUseCases.ts` — `assignContentToGroupUseCase` + `AssignContentToGroupInput`
- `presentation/stores/athleteGroupStore.ts` — `isAssigning` + `assignContentToGroup` action
- `app/(coach)/clients/group-detail.tsx` — UI completa con `AssignContentModal` y `ContentPickerModal`
- `shared/constants/strings.ts` — 12 nuevas claves RF-E2-04b

**Métricas finales:**
- Test Suites: 79/79 ✅ | Tests: 1581/1581 ✅ (+11 use cases + 2 store)

---

#### RF-E2-04a — Grupos de atletas: CRUD y gestión de miembros

**¿Qué hace?**
El coach puede crear grupos de atletas (ej. "Principiantes enero"), añadir y quitar atletas de cada grupo, y editarlos o eliminarlos. Desde la pantalla de clientes hay un botón 👥 que abre la lista de grupos. Pulsando un grupo se accede a su detalle con la lista de miembros.

**Pantallas / flujo:**
- `app/(coach)/clients/index.tsx` — modificada: botón 👥 añadido junto al 🏷️
- `app/(coach)/clients/groups.tsx` — nueva pantalla: lista de grupos + modal de creación/edición
- `app/(coach)/clients/group-detail.tsx` — nueva pantalla: lista de miembros + modal para añadir atletas + quitar con confirmación

**Decisiones de diseño:**
- `memberCount` se calcula en el repositorio al listar (batch query sobre `group_members`), no se persiste como columna.
- El modal de "Añadir atletas" filtra los atletas ya miembros para no mostrar duplicados.
- `addMember` en el store es idempotente: si el atleta ya está en la lista local, no duplica ni incrementa el contador.

**Implementación técnica:**
- Migración: `coach_groups` + `group_members` + RLS via coach ownership
- `domain/entities/AthleteGroup.ts` — 3 schemas (Create, Update, AthleteGroup)
- `domain/repositories/IAthleteGroupRepository.ts` — 7 métodos
- `infrastructure/.../AthleteGroupRemoteRepository.ts` — implementación Supabase
- `application/coach/AthleteGroupUseCases.ts` — 7 use cases
- `presentation/stores/athleteGroupStore.ts` — CRUD + miembros con caché por groupId

**Métricas finales:**
- Test Suites: 79/79 ✅ | Tests: 1570/1570 ✅ (+58: 15 entity + 21 use cases + 22 store)

---

#### RF-E2-06b — Automatizaciones por etiqueta: UI de configuración y trigger

**¿Qué hace?**
El coach puede configurar qué contenido se asigna automáticamente al aplicar una etiqueta. Cada etiqueta tiene un botón ⚙ que abre una pantalla con tres pickers (rutina, cardio, plan de nutrición). Al guardar, la automatización queda activa. Al asignar la etiqueta desde `TagPickerModal`, el contenido configurado se asigna al atleta de forma automática y silenciosa. Si alguna asignación falla, se muestra un Alert informativo.

**Pantallas / flujo:**
- `app/(coach)/clients/tags.tsx` — modificada
  - Botón ⚙ por etiqueta (resaltado si tiene automatización activa)
  - Texto dinámico: "Automatización activa" / "Sin automatizaciones"
  - Navega a `/(coach)/clients/tag-automation?id=<tagId>&name=<tagName>`
- `app/(coach)/clients/tag-automation.tsx` — nueva pantalla
  - Muestra 3 pickers: rutina, cardio, plan de nutrición
  - Botón "Guardar automatización" (upsert)
  - Botón "Eliminar automatización" (solo visible si ya existe config)

**Decisiones de diseño:**
- La pantalla de config lee sus propios datos (routines, cardios, plans) en montaje para no depender del estado previo de otros stores.
- El trigger es fire-and-forget en `TagPickerModal.toggle()` — no bloquea el flujo de asignación de etiqueta.
- El store cachea por tagId (`Record<string, TagAutomation | null>`) — `null` = sin config, `undefined` = no cargado aún.

**Implementación técnica:**
- `tagAutomationStore.ts` — `fetchAutomation`, `saveAutomation`, `deleteAutomation`; caché por tagId
- `tag-automation.tsx` — pantalla con PickerModal genérico + SectionPicker reutilizable
- `tags.tsx` — botón ⚙ + lazy-load de automations al hacer focus
- `TagPickerModal.tsx` — fire-and-forget `executeTagAutomationUseCase` + Alert en caso de fallo
- `strings.ts` — 16 nuevas claves RF-E2-06

**Métricas finales:**
- Test Suites: 76/76 ✅ | Tests: 1512/1512 ✅ (+10 store)

---

#### RF-E2-06a — Automatizaciones por etiqueta: capa de datos y lógica de negocio

**¿Qué hace?**
Permite al sistema asociar contenido (rutina, cardio, plan de nutrición) a una etiqueta. Al asignar la etiqueta a un atleta, el sistema ejecuta automáticamente las asignaciones de contenido configuradas. Si alguna asignación falla, el proceso continúa con las demás y se notifica al usuario con un Alert.

**Pantallas / flujo:**
- Sin UI en esta historia — capa de datos y lógica pura.

**Decisiones de diseño:**
- Un UNIQUE en `tag_id` garantiza una sola configuración por etiqueta; el repositorio hace upsert.
- `executeTagAutomation` usa `Promise.allSettled` para que todos los assignments corran en paralelo aunque alguno falle; lanza error si hay cualquier fallo para que el caller muestre el Alert.
- RLS via JOIN con `client_tags` (el coach solo accede a automatizaciones de sus propias etiquetas).

**Implementación técnica:**
- `supabase/migrations/20260328400000_add_tag_automations.sql` — tabla + RLS
- `database.types.ts` — `TagAutomationRow`, `TagAutomationInsert`, `TagAutomationUpdate`
- `domain/entities/TagAutomation.ts` — `TagAutomationSchema` + `SaveTagAutomationSchema`
- `domain/repositories/ITagAutomationRepository.ts` — contrato: `getByTagId`, `save`, `delete`
- `application/coach/TagAutomationUseCases.ts` — 4 use cases: get, save, delete, execute
- `infrastructure/supabase/remote/TagAutomationRemoteRepository.ts` — implementación Supabase

**Métricas finales:**
- Test Suites: 2/2 ✅ | Tests: 39/39 ✅ (11 entity + 28 use cases)

---

#### RF-E8-08 — Edición de sesiones planificadas con asignación de atleta

**¿Qué hace?**
El coach puede editar cualquier sesión ya planificada: título, tipo, modalidad, fecha/hora, duración, notas y el atleta asignado. Pulsar ✏️ en la tarjeta de la sesión abre un formulario pre-relleno con los datos actuales. Al guardar, el sistema valida que la nueva fecha no colisione con otra sesión, actualiza el calendario en tiempo real y registra una entrada `'updated'` en el historial de actividad.

**Pantallas / flujo:**
- `app/(coach)/calendar/index.tsx` — modificada
  - Botón ✏️ añadido en cada `sessionRow`, antes del botón 🗑
  - Navega a `/(coach)/calendar/edit?id=<sessionId>`
- `app/(coach)/calendar/edit.tsx` — nueva pantalla
  - Formulario idéntico a `create.tsx` pero pre-relleno desde `sessions`/`rangeSessions` del store
  - Muestra error si la sesión no se encuentra en el store

**Decisiones de diseño:**
- La exclusión de la sesión editada del check de solapamiento se hace filtrando en el use case (`overlapping.filter(s => s.id !== id)`), sin cambiar la firma de `getOverlapping`.
- Fire-and-forget para el log `'updated'`, igual que para `created` y `deleted`.
- `'updated'` añadido a `ActivityAction` (era `'created' | 'deleted'`).

**Implementación técnica:**
- `SessionActivityLog.ts` — `ActivityAction` ampliado con `'updated'`
- `CoachSession.ts` — `UpdateCoachSessionSchema` + `UpdateCoachSessionInput`
- `ICoachSessionRepository.ts` / `CoachSessionRemoteRepository.ts` — método `update`
- `CoachSessionUseCases.ts` — `updateSessionUseCase` con check de solapamiento excluyendo self
- `coachCalendarStore.ts` — acción `editSession` + actualiza `sessions` y `rangeSessions`
- `strings.ts` — 3 nuevas claves RF-E8-08

**Métricas finales:**
- Test Suites: 4/4 ✅ | Tests: 115/115 ✅ (+51 nuevos: 13 entity + 8 use case + 8 store)

---

#### RF-E5-05 — Edición de vídeo existente

**¿Qué hace?**
El coach puede editar los metadatos de cualquier vídeo de su biblioteca: título, URL de YouTube, etiquetas y descripción. Pulsando el botón ✏️ en la tarjeta del vídeo se abre un formulario pre-relleno con los datos actuales. Al guardar, la biblioteca se actualiza de inmediato sin recargar.

**Pantallas / flujo:**
- `app/(coach)/videos/index.tsx` — modificada
  - `VideoCard` tiene nuevo botón ✏️ en la zona de acciones
  - Navega a `/(coach)/videos/edit?id=<videoId>` al pulsar
- `app/(coach)/videos/edit.tsx` — nueva pantalla
  - Formulario idéntico al de creación pero pre-relleno con los datos del vídeo
  - Lee el vídeo desde el catalog del store (sin llamada de red extra)
  - Muestra "Vídeo no encontrado" si el id no está en catalog

**Decisiones de diseño:**
- Los vídeos son URLs de YouTube, no ficheros en Storage — no hay operaciones de Storage en esta historia.
- La pantalla lee el vídeo del catalog del store en lugar de hacer un `getById` — el catalog siempre está cargado al llegar desde el listado.
- `visibleToClients` es editable en el formulario (aunque RF-E5-02/03 tienen su propio toggle en la lista); ambas vías son válidas.

**Implementación técnica:**
- `Video.ts` — `UpdateVideoSchema` + tipo `UpdateVideoInput` (todos los campos opcionales)
- `IVideoRepository.ts` — método `update(id, input)` añadido al contrato
- `VideoRemoteRepository.ts` — implementación con `supabase.update().eq('id', id).select().single()`
- `VideoUseCases.ts` — `updateVideoUseCase` (valida UUID + schema antes de llamar al repo)
- `videoStore.ts` — acción `update` con estado `isUpdating`
- `strings.ts` — 4 nuevas claves: `videoEditTitle`, `videoEditSubmit`, `videoEditSuccess`, `videoEditButtonLabel`

**Métricas finales:**
- Test Suites: 3/3 ✅ | Tests: 98/98 ✅ (+29 nuevos: 9 UpdateVideoSchema + 7 updateVideoUseCase + 13 store update)

---

#### RF-E2-10 — Email de bienvenida al atleta al dar de alta

**¿Qué hace?**
Al crear un nuevo atleta, la app envía automáticamente un email de invitación a su dirección. El atleta hace clic en el link y establece su propia contraseña. El coach ya no necesita comunicar credenciales manualmente.

**Pantallas / flujo:**
- `app/(coach)/clients/index.tsx` — modificada
  - Eliminado el campo "Contraseña inicial" del formulario de creación
  - Texto informativo actualizado
  - Alert de confirmación muestra "Invitación enviada" con el email del atleta

**Decisiones de diseño:**
- Se usa `admin.inviteUserByEmail` en lugar de `admin.createUser` — el email de invitación se envía a través del SMTP de Strato ya configurado en Supabase Auth, sin necesidad de secrets adicionales ni servicios externos.
- Si la creación del usuario tiene éxito pero falla la inserción de perfil o relación, se propaga el error. No se revierte el usuario de auth (comportamiento acorde al criterio de aceptación).

**Implementación técnica:**
- `supabase/functions/create-athlete/index.ts` — v2: `createUser` → `inviteUserByEmail`, elimina `password` del body
- `app/(coach)/clients/index.tsx` — elimina estado `newPassword`, campo contraseña y validación asociada

**Métricas finales:**
- Test Suites: 72/72 ✅ | Tests: 1410/1410 ✅

---

#### RF-E2-09 — Eliminar enlace de auto-registro del login

**¿Qué hace?**
La pantalla de login ya no muestra el footer "¿No tienes cuenta? Crear una". Los clientes no pueden registrarse por su cuenta — el coach los crea. El enlace era incorrecto y se ha eliminado.

**Pantallas / flujo:**
- `app/(auth)/login.tsx` — eliminado el footer con el enlace a `/(auth)/register`

**Implementación técnica:**
- Eliminados: JSX del footer, estilos `footer`/`footerText`/`footerLink`, import `useRouter`

**Métricas finales:**
- Test Suites: 72/72 ✅ | Tests: 1410/1410 ✅

---

#### RF-E2-08 — Creación de atleta mediante Edge Function

**¿Qué hace?**
La creación de atletas se ejecuta ahora en el servidor a través de una Supabase Edge Function, eliminando el riesgo de seguridad que suponía llamar a `auth.admin.createUser` desde el cliente móvil. El UX para el coach es idéntico al anterior.

**Pantallas / flujo:**
- `app/(coach)/clients/index.tsx` — modificada
  - `createAthlete` invoca `supabase.functions.invoke('create-athlete', ...)` en lugar de llamar directamente a la API de auth

**Decisiones de diseño:**
- La Edge Function verifica el JWT del caller y comprueba que su rol sea `coach` antes de ejecutar cualquier operación.
- La `SUPABASE_SERVICE_ROLE_KEY` solo existe en el entorno de la Edge Function — nunca en el cliente móvil.
- Si el email ya existe, la función devuelve 409 con mensaje descriptivo; el cliente lo presenta como Alert igual que antes.

**Implementación técnica:**
- `supabase/functions/create-athlete/index.ts` — Edge Function desplegada en Supabase
- `app/(coach)/clients/index.tsx` — `createAthlete` refactorizado a `supabase.functions.invoke`

**Métricas finales:**
- Test Suites: 72/72 ✅ | Tests: 1410/1410 ✅

---

#### RF-E2-07 — Eliminar flujo "vincular atleta existente"

**¿Qué hace?**
El botón "+" de la pantalla de clientes abre directamente el formulario de creación de atleta, sin pasar por un menú intermedio que ofrecía dos opciones. La opción "Vincular atleta existente" (buscar por nombre/email y añadir un usuario ya registrado) ha sido eliminada por ser irrelevante en el modelo de negocio actual.

**Pantallas / flujo:**
- `app/(coach)/clients/index.tsx` — modificada
  - El botón "+ Añadir" y el CTA del estado vacío abren directamente el modal de creación
  - Eliminados: modal menú, modal de búsqueda/vinculación

**Decisiones de diseño:**
- `ModalMode` simplificado de `'menu' | 'link' | 'create'` a `'create'` — un tipo unión con un solo miembro es equivalente a un booleano, pero se mantiene el patrón existente para consistencia.

**Implementación técnica:**
- Eliminados: `interface AvailableAthlete`, estados `available/search/searching/adding`, funciones `searchAthletes` y `linkAthlete`
- Eliminados: modal menú y modal búsqueda/vincular del JSX
- Eliminados: 11 estilos huérfanos + `searchInput` duplicado en StyleSheet

**Métricas finales:**
- Test Suites: 72/72 ✅ | Tests: 1410/1410 ✅

---

#### RF-E1-02 — Accesos rápidos configurables

**¿Qué hace?**
El coach puede personalizar qué accesos rápidos aparecen en su dashboard. Pulsando "Editar" junto a la sección, se abre un modal con los 6 destinos disponibles (Clientes, Rutinas, Nutrición, Agenda, Vídeos, Mensajes). El coach marca o desmarca cada uno y guarda. La selección se persiste en Supabase y se restaura en cada sesión.

**Pantallas / flujo:**
- `app/(coach)/dashboard.tsx` — modificada
  - Botón "Editar" junto al título "ACCESOS RÁPIDOS"
  - Modal `pageSheet` con grid de 6 chips seleccionables (checkmark visual cuando está activo)
  - Botones "Cancelar" y "Guardar" en la cabecera del modal
  - Alert si se intenta guardar con cero shortcuts seleccionados

**Decisiones de diseño:**
- El catálogo de shortcuts es una constante en `quickAccessCatalog.ts` (no en BD) — no hay necesidad de gestión dinámica.
- Sin reordenado manual: el orden sigue el del catálogo (scope excluido para no añadir dependencia de drag-and-drop).
- Preferencias guardadas en tabla `coach_preferences` con upsert, siguiendo el patrón de repositorio del proyecto.

**Implementación técnica:**
- `supabase/migrations/20260328300000_add_coach_preferences.sql` — tabla + RLS
- `ICoachPreferencesRepository.ts` / `CoachPreferencesRemoteRepository.ts` — contrato e implementación
- `CoachPreferencesUseCases.ts` — `getQuickAccessUseCase`, `saveQuickAccessUseCase`
- `quickAccessCatalog.ts` — catálogo + `getActiveShortcuts` (función pura) + `DEFAULT_QUICK_ACCESS`
- `coachPreferencesStore.ts` — `loadQuickAccess`, `saveQuickAccess`, `isSaving`
- `strings.ts` — 7 nuevas claves RF-E1-02

**Métricas finales:**
- Test Suites: 72/72 ✅ | Tests: 1410/1410 ✅ (+26 nuevos: 9 use cases + 7 catálogo + 10 store)

---

#### RF-E1-03 — Filtro de actividad reciente

**¿Qué hace?**
El widget "Actividad Reciente" del dashboard del coach muestra ahora tres chips de filtro: Todos, Completada y En curso. Al pulsar un chip, la lista se filtra instantáneamente sin llamada a red. El chip activo queda resaltado en azul.

**Pantallas / flujo:**
- `app/(coach)/dashboard.tsx` — modificada
  - Tres chips `[Todos] [Completada] [En curso]` encima de la lista de sesiones
  - El filtro es estado local del componente; no persiste entre sesiones

**Decisiones de diseño:**
- Filtro puramente local (no afecta al store ni a la carga de datos) para mantener el scope mínimo.
- "En curso" agrupa `active` y `abandoned` porque ambos representan sesiones no finalizadas desde el punto de vista del coach.

**Implementación técnica:**
- `filterActivityByStatus(sessions, filter)` — función pura en `ClientUseCases.ts`
- `ActivityStatusFilter = 'all' | 'completed' | 'in_progress'` — tipo exportado
- `strings.ts` — 3 claves: `activityFilterAll`, `activityFilterCompleted`, `activityFilterInProgress`
- `dashboard.tsx` — chips + estado local `useState<ActivityStatusFilter>('all')`

**Métricas finales:**
- Test Suites: 69/69 ✅ | Tests: 1384/1384 ✅ (+13 nuevos en filterActivityByStatus)

---

#### RF-E8-07 — KPIs de agenda

**¿Qué hace?**
En la vista de calendario, el coach ve de un vistazo cuatro métricas del mes en curso: número total de sesiones programadas, horas totales, sesiones presenciales y sesiones online. Las cifras se actualizan automáticamente al navegar entre meses.

**Pantallas / flujo:**
- `app/(coach)/calendar/index.tsx` — modificada
  - Franja de 4 tarjetas KPI (Sesiones / Horas / Presencial / Online) visible solo en la pestaña "Calendario"
  - Se muestra entre el toggle de vista y el navegador de meses

**Decisiones de diseño:**
- `computeMonthKpis` es función pura que recibe el array de sesiones ya cargado; sin llamada adicional a BD.
- Vive en `CoachSessionUseCases.ts` porque opera sobre el mismo dominio que los use cases de sesión.
- `totalHours` redondeado a 1 decimal (Math.round × 10 / 10) para evitar `.999` de coma flotante.

**Implementación técnica:**
- `computeMonthKpis(sessions)` añadida a `CoachSessionUseCases.ts` + tipo `MonthKpis`
- KPI strip añadida en `app/(coach)/calendar/index.tsx` (solo pestaña "Calendario")
- `strings.ts` — 4 claves: `calendarKpiSessions`, `calendarKpiHours`, `calendarKpiInPerson`, `calendarKpiOnline`

**Métricas finales:**
- Test Suites: 68/68 ✅ | Tests: 1366/1366 ✅ (+10 nuevos en CoachSessionUseCases)

---

#### RF-E8-06 — Historial de actividad de agenda

**¿Qué hace?**
El coach puede consultar un log cronológico de todas las sesiones creadas y eliminadas, filtrado por rango de fechas. Cada entrada muestra el tipo de acción (creada / eliminada), el título y tipo de sesión, la modalidad y la fecha programada. Las sesiones eliminadas aparecen con texto grisado y badge "eliminada". Al pulsar sobre una sesión existente, el calendario se posiciona automáticamente en su fecha.

**Pantallas / flujo:**
- `app/(coach)/session-activity/index.tsx` — nueva pantalla (sin tab)
  - Selector de rango con DateTimePicker (desde / hasta)
  - Lista de `ActivityLogRow` con badge de acción (verde=creada, rojo=eliminada)
  - Tap en fila navegable → `setSelectedDate` + push a `/(coach)/calendar`
  - Estado vacío y estado de error con botón "Reintentar"

**Decisiones de diseño:**
- El log guarda snapshot de los datos de sesión en el momento del evento: el historial permanece intacto aunque la sesión se elimine después (`session_id` usa `ON DELETE SET NULL`).
- El logging es fire-and-forget en `coachCalendarStore` (no bloquea la operación principal).
- Rango por defecto: mes en curso (1º día → último día).

**Implementación técnica:**
- `supabase/migrations/20260328200000_add_session_activity_log.sql` — tabla + índice + RLS
- `SessionActivityLog.ts` / `ISessionActivityLogRepository.ts` / `SessionActivityLogUseCases.ts` — domain + application
- `SessionActivityLogRemoteRepository.ts` / `sessionActivityStore.ts` — infrastructure + presentation
- `coachCalendarStore.ts` — logging en `addSession` y `removeSession`
- `strings.ts` — 8 nuevas claves RF-E8-06

**Métricas finales:**
- Test Suites: 68/68 ✅ | Tests: 1356/1356 ✅ (+27 nuevos: 14 use case + 13 store)

---

#### RF-E8-04 — Horarios reservables

**¿Qué hace?**
El coach puede crear ventanas de disponibilidad (horarios) con rango de fechas, franja horaria diaria, duración de slot y modalidad. Cada horario muestra el total de slots disponibles calculado automáticamente. El coach puede activar o desactivar cada horario con un toggle sin abrir formulario, y eliminarlos con confirmación.

**Pantallas / flujo:**
- `app/(coach)/schedules/index.tsx` — lista de horarios (sin tab)
  - Tarjeta por horario con título, fechas, franja, duración, modality pill, badge activo/inactivo y total de slots
  - Switch por tarjeta para activar/desactivar al momento
  - Botón 🗑 con Alert de confirmación
- `app/(coach)/schedules/create.tsx` — formulario con DateTimePicker nativo (ya instalado)
  - Fecha inicio/fin, hora inicio/fin, chips de duración, toggle modalidad, switch "Activo al crear"

**Decisiones de diseño:**
- `calculateTotalSlots` es función pura (días × slots/día) — no requiere BD, se calcula en cliente. Sin ocupación real hasta que haya booking de cliente.
- Patrón de pantalla separada para create (no modal), igual que `calendar/create.tsx`, por la cantidad de campos con DateTimePicker.
- Validaciones cruzadas de fechas y horas en el use case, no en Zod, para mensajes de error descriptivos.

**Implementación técnica:**
- `supabase/migrations/20260328100000_add_schedules.sql` — tabla + índice + RLS
- `Schedule.ts` / `IScheduleRepository.ts` / `ScheduleUseCases.ts` — domain + application
- `ScheduleRemoteRepository.ts` / `scheduleStore.ts` — infrastructure + presentation
- `strings.ts` — 34 nuevas claves RF-E8-04

**Métricas finales:**
- Test Suites: 66/66 ✅ | Tests: 1329/1329 ✅ (+44 nuevos: 25 use case + 19 store)

---

#### RF-E8-05 — Tipos de sesión

**¿Qué hace?**
El coach puede crear, editar y eliminar tipos de sesión con nombre y color. Sirven para categorizar visualmente las sesiones de la agenda. La lista ordena los tipos alfabéticamente y muestra la fecha de creación de cada uno. Los colores se eligen de una paleta fija de 12 colores. Al eliminar, el sistema pide confirmación antes de borrar.

**Pantallas / flujo:**
- `app/(coach)/session-types/index.tsx` — nueva pantalla (sin tab, accesible desde agenda)
  - Lista de tipos con chip de color, nombre y fecha de creación
  - Botones ✏️ y 🗑 por fila
  - Estado vacío con CTA implícito al botón "Nuevo tipo"
  - Modal bottom-sheet para crear y editar (nombre + paleta de color)
  - Alert de confirmación antes de eliminar

**Decisiones de diseño:**
- Sin FK a `coach_sessions` aún — esa conexión llega con RF-E8-04 para no mezclar responsabilidades.
- Patrón idéntico a `ClientTag`: misma estructura de entidad, repositorio, use cases y store.
- Ruta sin tab (`href: null`) para no saturar la barra de navegación.

**Implementación técnica:**
- `supabase/migrations/20260328000000_add_session_types.sql` — tabla + índice + RLS (`coach_id = auth.uid()`)
- `SessionType.ts` / `ISessionTypeRepository.ts` / `SessionTypeUseCases.ts` — capas domain y application
- `SessionTypeRemoteRepository.ts` / `sessionTypeStore.ts` — capas infrastructure y presentation
- `strings.ts` — 16 nuevas claves en sección RF-E8-05

**Métricas finales:**
- Test Suites: 64/64 ✅ | Tests: 1285/1285 ✅ (+37 nuevos: 18 use case + 19 store)

---

#### RF-E7-02b — Documentos — lado atleta

**¿Qué hace?**
El atleta accede a un repositorio de documentos compartidos con su coach desde la sección "Recursos" del dashboard. Puede ver todos los archivos del par coach-atleta, subir nuevos ficheros con las mismas restricciones de extensión que el coach, abrir cualquier documento y eliminar solo los que él mismo ha subido. Los documentos del coach son visibles pero no eliminables.

**Pantallas / flujo:**
- `app/(athlete)/dashboard.tsx` — modificada
  - Nueva sección "Recursos" con tarjeta "📁 Documentos"
- `app/(athlete)/documents/index.tsx` — nueva pantalla
  - Obtiene coachId de `coach_athletes` (excepción documentada: Supabase directo en presentación)
  - Lista de documentos con badge de extensión, tamaño, fecha y botón "Abrir" (signed URL)
  - Botón 🗑 solo en documentos propios del atleta
  - Estado vacío con texto específico para atleta
  - Estado de error si el atleta no tiene coach asignado

**Decisiones de diseño:**
- Sin cambios de backend: store, use cases y repositorio de documentos ya soportan el par (coachId, athleteId) con cualquier uploader.
- Ruta sin tab (`href: null`) para no saturar la barra de 6 iconos; accesible desde el dashboard.
- Color de acento `Colors.athlete` en lugar del azul del coach para coherencia visual de la sección atleta.

**Implementación técnica:**
- `strings.ts` — 3 nuevas claves: `docEmptySubtitleAthlete`, `docNoCoachAssigned`, `docAthleteSubtitle`
- `app/(athlete)/documents/index.tsx` — nueva pantalla
- `app/(athlete)/_layout.tsx` — ruta `documents/index` registrada sin tab
- `app/(athlete)/dashboard.tsx` — sección "Recursos" con enlace a documentos

**Métricas finales:**
- Test Suites: 62/62 ✅ | Tests: 1248/1248 ✅

---

#### RF-E4-05 — Vista consolidada de contenido asignado a un cliente

**¿Qué hace?**
En el perfil de cada cliente, el entrenador ve ahora todo el contenido asignado en una sola pantalla: rutinas, cardios y plan nutricional activo. Antes había que navegar módulo a módulo para saber qué tenía asignado un atleta. Ahora está todo agrupado en secciones claras con nombre del ítem y fecha de asignación. El plan nutricional muestra solo el más reciente. Cada ítem es navegable: pulsar sobre él lleva a su detalle.

**Pantallas / flujo:**
- `app/(coach)/clients/[id].tsx` — modificada
  - Nueva sección "CARDIOS ASIGNADOS": lista de cardios con nombre y fecha, estado vacío si no hay ninguno
  - Nueva sección "PLAN NUTRICIONAL": muestra el plan más reciente asignado con nombre y fecha; estado vacío si no hay ninguno
  - Tap en cardio navega a la pantalla de cardios; tap en plan nutricional navega al detalle del plan

**Decisiones de diseño:**
- El plan nutricional muestra solo el más reciente (primero del array ordenado por `assigned_at desc`). Si el coach asignó varios planes, solo el último es relevante como "plan activo".
- Los colores de acento diferencian los módulos visualmente: azul para rutinas (ya existía), cian para cardios, ámbar para nutrición.
- No se añade tienda (store) nueva: la pantalla ya carga datos localmente con `getAthleteDetailUseCase` via `Promise.all`.

**Implementación técnica:**
- `ICoachRepository.ts` — 2 nuevas interfaces (`AthleteCardioAssignment`, `AthleteNutritionAssignment`) + 2 nuevos métodos de contrato
- `CoachRemoteRepository.ts` — implementación de `getAthleteCardioAssignments` y `getAthleteNutritionAssignments` con joins a `cardio_assignments` y `nutrition_assignments`
- `ClientUseCases.ts` — `AthleteDetail` ampliado; `getAthleteDetailUseCase` pasa a 4 queries en paralelo
- `strings.ts` — 5 nuevas claves en sección RF-E4-05
- `clients/[id].tsx` — 2 nuevas secciones con estilos de acento diferenciados

**Métricas finales:**
- Test Suites: 61/61 ✅ | Tests: 1213/1213 ✅ (+8 tests nuevos en ClientUseCases)

---

#### RF-E6-09 — Versionado de planes nutricionales

**¿Qué hace?**
El entrenador puede editar los metadatos de un plan nutricional (nombre, tipo, descripción y macros diarios) desde el detalle del plan. Antes de guardar cada cambio, el sistema crea automáticamente una instantánea de la versión actual. El coach puede abrir el historial de versiones, ver cuándo se guardó cada una y restaurar cualquier versión anterior; la restauración también guarda una instantánea previa antes de sobreescribir.

**Pantallas / flujo:**
- `app/(coach)/nutrition/[id].tsx` — modificada
  - Topbar con dos nuevos iconos: ✏️ (editar) y 🕐 (historial)
  - Modal "Editar plan" (pageSheet): nombre, tipo (chips), descripción, macros con auto-cálculo de calorías
  - Modal "Historial" (pageSheet): lista de versiones ordenadas; cada versión muestra nombre, tipo, fecha, macros y botón "Restaurar"
  - Confirmación Alert antes de restaurar

**Decisiones de diseño:**
- La tabla `plan_versions` guarda solo los metadatos (nombre, tipo, descripción, macros) — no duplica las comidas, que no cambian en esta operación.
- El snapshot se toma en el use case *antes* de aplicar el cambio (save-first), garantizando que siempre hay una versión previa recuperable.
- Las comidas siguen gestionándose por separado (RF-E6-10). El modal de edición solo cubre los metadatos del plan.

**Implementación técnica:**
- `NutritionPlan.ts` — nuevos `PlanVersionSchema`, `UpdatePlanMetaSchema`, `PlanVersion`, `UpdatePlanMetaInput`
- `INutritionRepository.ts` — 4 nuevos métodos: `updatePlanMeta`, `savePlanVersion`, `getPlanVersions`, `restorePlanVersion`
- `NutritionRemoteRepository.ts` — implementación con `mapVersion`; `restorePlanVersion` aplica snapshot + `updatePlanMeta`
- `NutritionUseCases.ts` — 3 nuevos use cases: `updatePlanMetaUseCase`, `getPlanVersionsUseCase`, `restorePlanVersionUseCase`
- `nutritionStore.ts` — estado `planVersions`, `planVersionsLoading` + 3 nuevas acciones
- `strings.ts` — 18 nuevas claves en sección RF-E6-09
- `supabase/migrations/20260326200000_add_plan_versions.sql` — tabla + índice + RLS

**Métricas finales:**
- Test Suites: 61/61 ✅ | Tests: 1210/1210 ✅ (+25 tests nuevos: 16 use case + 9 store)

---

#### RF-E6-06 — Publicación controlada de recetas

**¿Qué hace?**
El entrenador puede mostrar u ocultar masivamente sus recetas para los atletas con dos botones en la pantalla de recetas: "Mostrar todas" y "Ocultar todas". Ambas acciones piden confirmación antes de ejecutarse. Cada tarjeta de receta muestra un pill de visibilidad ("Visible" / "Oculta") que refleja el estado actual de `visible_to_clients`. Los botones se deshabilitan cuando no hay recetas o durante la operación.

**Pantallas / flujo:**
- `app/(coach)/recipes/index.tsx` — modificada
  - Dos botones bulk bajo el header: "Mostrar todas" / "Ocultar todas"
  - Confirmación con `Alert.alert` antes de ejecutar
  - Pill de visibilidad en cada `RecipeCard` (verde "Visible" / gris "Oculta")
  - Botones deshabilitados si lista vacía o `isSubmitting`

**Decisiones de diseño:**
- El campo `visible_to_clients` ya existía en la BD y en la entidad. Sin migración necesaria.
- El UPDATE bulk usa RLS existente (`coach_id = auth.uid()`): una sola query actualiza todas las recetas del coach.
- El estado local se actualiza optimistamente (map en el store) sin refetch para evitar flicker.

**Implementación técnica:**
- `IRecipeRepository.ts` — nuevo método `setAllVisibility(coachId, visible)`
- `RecipeRemoteRepository.ts` — `UPDATE recipes SET visible_to_clients WHERE coach_id`
- `RecipeUseCases.ts` — `setAllRecipesVisibilityUseCase(coachId, visible, repo)`
- `recipeStore.ts` — nueva acción `setAllVisibility(coachId, visible) → boolean`
- `strings.ts` — 11 nuevas claves en sección RF-E6-06

**Métricas finales:**
- Test Suites: 61/61 ✅ | Tests: 1185/1185 ✅ (+12 tests nuevos: 4 use case + 8 store)

---

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

#### RF-E5-02/03 — Visibilidad de vídeos

**¿Qué hace?**
El entrenador puede marcar cada vídeo como visible o no visible para sus clientes desde la biblioteca de vídeos. Al crear un vídeo, decide su visibilidad inicial con un toggle. En la lista, puede alternar la visibilidad de cada vídeo con un toque (👁/🙈) y filtrar la biblioteca por estado: Todos, Visibles u Ocultos. Los vídeos visibles muestran un pill verde "Visible" en su tarjeta.

**Pantallas / flujo:**
- `app/(coach)/videos/index.tsx` — modificada
  - Chips de filtro "Todos / Visibles / Ocultos" bajo la barra de búsqueda
  - Pill "Visible" (verde) en cada tarjeta de vídeo visible
  - Icono 👁/🙈 tap para alternar visibilidad del vídeo individualmente
  - Confirmación con Alert tras el cambio
- `app/(coach)/videos/create.tsx` — modificada
  - Nuevo toggle Switch "Visible para clientes" antes del botón guardar
  - Default: oculto (false)

**Decisiones de diseño:**
- Visibilidad per-vídeo (no bulk), siguiendo el mismo patrón que el toggle individual previsto — más granular que el bulk de recetas.
- El filtro de visibilidad es un chip de selección única (no multi-select) para simplificar la UX.
- El update es optimista: el catálogo local se actualiza antes de confirmar respuesta de red.

**Implementación técnica:**
- `supabase/migrations/20260327100000_add_visible_to_clients_to_videos.sql` — `ALTER TABLE videos ADD COLUMN visible_to_clients boolean NOT NULL DEFAULT false`
- `Video.ts` — campo `visibleToClients: z.boolean().default(false)` en `CreateVideoSchema` y `VideoSchema`
- `IVideoRepository.ts` — nuevo método `setVisibility(videoId, visible)`
- `VideoRemoteRepository.ts` — `VideoRow` ampliado, `mapRow` actualizado, `create` incluye `visible_to_clients`, nuevo método `setVisibility`
- `VideoUseCases.ts` — `setVideoVisibilityUseCase` + tipo `VisibilityFilter` + parámetro `visibility` en `filterVideos`
- `videoStore.ts` — estado `visibilityFilter`, acciones `setVisibility` y `setVisibilityFilter`
- `strings.ts` — 6 nuevas claves en sección RF-E5-02/03

**Métricas finales:**
- Test Suites: 61/61 ✅ | Tests: 1231/1231 ✅ (+18 tests nuevos: 11 use case + 7 store)

---

## 🔲 En curso

---

## 💡 Pendiente

---

### ÉPICA E3 — Navegación y estructura de la app

#### RF-E3-01a (P1) — Hub de librería de contenido

**Requisito:** Crear una pantalla hub en `app/(coach)/library/index.tsx` que agrupe las cinco secciones de contenido del entrenador (Rutinas, Ejercicios, Cardio, Vídeos, Nutrición) en un grid de tarjetas de acceso rápido.

**Criterios de aceptación:**
- La pantalla muestra 5 tarjetas, una por sección: Rutinas, Ejercicios, Cardio, Vídeos, Nutrición.
- Cada tarjeta tiene icono (emoji), nombre de sección y un subtítulo descriptivo.
- Pulsar una tarjeta navega a la pantalla de índice de esa sección (`/routines`, `/exercises`, etc.).
- La pantalla tiene cabecera con título "Librería".
- Diseño coherente con el resto de la app (colores, tipografía, espaciado de `theme.ts`).
- No contiene lógica de negocio: es una pantalla de navegación pura.

**Scope excluido:**
- Contadores de ítems en cada tarjeta (requeriría 5 llamadas a red — fuera de scope).
- Reordenado de tarjetas (no hay requisito de personalización en este nivel).

**Dependencia:** Ninguna. Historia independiente.

---

#### RF-E3-01b (P1) — Reorganización de la barra de tabs del entrenador

**Requisito:** Reducir la barra de navegación inferior del entrenador de 8 a 5 tabs, sustituyendo las 5 secciones de librería individuales por una única tab "Librería" y elevando "Agenda" a tab visible.

**Criterios de aceptación:**
- La barra muestra exactamente 5 tabs: Inicio · Clientes · Librería · Agenda · Mensajes.
- Las tabs Rutinas, Ejercicios, Cardio, Vídeos y Nutrición desaparecen como tabs visibles; sus rutas permanecen registradas con `href: null` para que la navegación interna siga funcionando.
- La tab "Librería" (📚) navega a `/(coach)/library` (RF-E3-01a).
- La tab "Agenda" (📅) navega a `/(coach)/calendar` (antes tenía `href: null`).
- El badge de mensajes no leídos sigue funcionando en la tab Mensajes.
- Se registra `calendar/edit` como ruta oculta (`href: null`) — omisión detectada de RF-E8-08.
- No se rompe ninguna navegación existente: todas las rutas de detalle, creación y formularios siguen accesibles.

**Scope excluido:**
- Cambios en la barra de tabs del atleta.
- Animaciones de transición personalizadas.

**Dependencia:** RF-E3-01a debe estar completada antes de iniciar esta historia.

---

### Deuda técnica detectada (no bloqueante)

#### DT-01 — Tests de NutritionRemoteRepository desactualizados tras BUG-02 ✅ (2026-03-26)
Corregidos los dos tests que esperaban el mensaje crudo del PostgrestError. Ahora los mocks incluyen `code` y los mensajes esperados usan el formato con prefijo (`'nutrition_plans insert: Insert failed (ERR)'`, `'meals insert: Meals failed (ERR)'`). Tests: 32/32 ✅

#### DT-02 — Strings.errorFallback ausente en strings.ts (pre-existente)
Todos los stores referenciaban `Strings.errorFallback` que no existía, dejando el error como `undefined` en el fallback. Añadido en RF-E6-11 (`'Ha ocurrido un error inesperado'`).

---

### ÉPICA E1 — Home profesional y productividad



#### RF-E1-04 (P2) Recomendaciones contextuales / ayuda
**Requisito:** Mostrar carrusel de descubrimiento (tutoriales/promos) contextual al uso.

**Criterios de aceptación:**
- El carrusel es navegable.
- Cada slide tiene CTA accionable.
- Puede ocultarse/minimizarse para no interferir con el flujo principal.

**Dependencia de plan:** Parcial (algunas promos de add-ons).

---

### ÉPICA E2 — Gestión de clientes


---



---

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


### ÉPICA E4 — Librería: actividad física (Ejercicios, Workouts, Cardio)

> RF-E4-01 (ejercicios), RF-E4-02 (rutinas/workouts) y RF-E4-04 (cardios) completados — ver sección Completado.

---

### ÉPICA E5 — Librería: vídeos

> RF-E5-01, RF-E5-02 y RF-E5-03 completados — ver sección Completado.

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

> RF-E6-01, RF-E6-03, RF-E6-04, RF-E6-05, RF-E6-06, RF-E6-07, RF-E6-08, RF-E6-09, RF-E6-10 y RF-E6-11 completados — ver sección Completado.

---


---




---

---

### ÉPICA E7 — Librería: programas, documentos, formularios, validación

#### RF-E7-01 — Programas
> **EXCLUIDO** — No aplica en la app de momento. Decisión del producto.

---

#### RF-E7-03 — Formularios
> **DIFERIDO** — Requisitos pendientes de definición por parte del producto. Retomaremos cuando estén claros.

**Notas previas:**
- Los formularios tendrán preguntas configurables (campos personalizados).
- Uso previsto: onboarding y seguimiento del atleta.

---

#### RF-E7-04 — Flujo de validación de contenido
> **EXCLUIDO** — Depende del rol "colaborador" que no va a existir en la app. Sin actor que genere contenido externo para validar, la historia no tiene caso de uso real.

---

#### RF-E7-05 — Trazabilidad editorial
> **EXCLUIDO** — Depende del flujo de validación (RF-E7-04) y del rol "colaborador". Sin ambos, no hay trazabilidad que registrar.

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

---

### DEUDA TÉCNICA — Navegación

#### DT-NAV-01 — Revisión global del botón "Volver"

**Problema:**
El botón volver no regresa a la pantalla anterior en todos los casos de la app. No se ha identificado exactamente qué pantallas fallan — requiere revisión exhaustiva.

**Alcance:**
Revisar todas las pantallas de ambos roles (coach y atleta) que tengan botón volver o dependan de la navegación hacia atrás (hardware back button en Android, gesto swipe en iOS, botón explícito en header).

**Criterios de cierre:**
- Inventario completo de pantallas con botón volver.
- Cada pantalla verificada en iOS y Android.
- Todos los botones volver llevan a la pantalla inmediatamente anterior en el stack de navegación.

**Prioridad:** P2 (no bloquea funcionalidad, pero afecta a UX)

---

_Última actualización: 2026-03-28_
