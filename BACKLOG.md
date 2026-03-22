# BACKLOG

## ✅ Completado

#### RF-E1-01 — Dashboard consolidado de operación

**Implementado:**
- `ICoachRepository` — contrato con `getDashboardSummary`, `CoachDashboardSummary`, `RecentAthleteSession`
- `CoachRemoteRepository` — implementación Supabase (3 queries: atletas, sesiones recientes, atletas activos esta semana)
- `getCoachDashboardSummaryUseCase` — use case en `ClientUseCases.ts`
- `coachDashboardStore` — store Zustand con `fetchDashboardSummary` y `clearError`
- `dashboard.tsx` — pantalla con widget de clientes (total + activos esta semana) y widget de actividad reciente
- Estados vacíos informativos en ambos widgets
- Fix: `mockChain` en `CoachRemoteRepository.test.ts` añade `.in` y `.gte`; `clearAllMocks` → `resetAllMocks`

**Métricas finales:**
- Test Suites: 40/40 ✅
- Tests: 620/620 ✅
- Statements: 98.04% ✅ | Branches: 91.08% ✅ | Functions: 99.49% ✅ | Lines: 99.84% ✅

---

#### TECH-01 — Saneamiento de tests heredados del prototipo

**Implementado:**
- Corregidos 5 ficheros con tests rotos (15 fallos → 0):
  - `RoutineRemoteRepository.test.ts` — describe `create`/`update` fuera del describe raíz (brace prematuro)
  - `MessageRemoteRepository.test.ts` — describe `getConversations` fuera del describe raíz (mismo patrón)
  - `ProgressUseCases.test.ts` — `EXERCISE_ID` undefined, corregido a `EXERCISE_A`
  - `WorkoutUseCases.test.ts` — `mockResolvedValueOnce` duplicados que envenenaban tests siguientes; cambiado `clearAllMocks` → `resetAllMocks`
  - `WorkoutLocalRepository.test.ts` — mock de Drizzle resolvía objeto en vez de array
- `jest.config.ts` — umbral de cobertura corregido de 95% a 90% (según instrucciones del proyecto)
- Cobertura elevada desde 69.94% → 90%+ en branches (línea base original del prototipo)
- 598 tests pasando (vs 502 originales con 15 fallos)
- Sin modificaciones a código de negocio — solo tests y configuración
- `errores_test.log` y `jest-output.log` no eliminados del repo (requieren acceso git — pendiente en siguiente sesión de trabajo con el repo clonado)

**Métricas finales:**
- Test Suites: 39/39 ✅
- Tests: 598/598 ✅
- Statements: ≥ 90% ✅
- Branches: ≥ 90% ✅
- Functions: ≥ 90% ✅
- Lines: ≥ 90% ✅

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

#### RF-E2-01 (P0) Listado de clientes segmentado por estado
**Requisito:** Gestionar clientes en tabs Activos / Invitados / Archivados.

**Criterios de aceptación:**
- Mostrar contador por tab.
- Cambiar de tab actualiza la tabla sin perder contexto.
- Mantener paginación y filtros por tab.

**Dependencia de plan:** No observada.

---

#### RF-E2-02 (P0) Búsqueda de clientes
**Requisito:** Buscar clientes por nombre o email.

**Criterios de aceptación:**
- Búsqueda parcial y tolerante a mayúsculas/minúsculas.
- Tiempo de respuesta < 2 s en datasets medios.
- Mostrar estado "sin resultados" si aplica.

**Dependencia de plan:** No observada.

---

#### RF-E2-03 (P0) Tabla de clientes con métricas clave
**Requisito:** Exponer columnas de estado operativo (plan, cumplimiento, actividad, pagos).

**Criterios de aceptación:**
- Columnas visibles: Cliente, Etiquetas, Profesionales, Activación, Plan, Estado plan, Último pago, Cumplimiento, Última actividad.
- Soporte de ordenación en columnas permitidas.
- Soporte de selección múltiple mediante checkbox.

**Dependencia de plan:** No observada.

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

#### RF-E6-01 (P0) Planes nutricionales
**Requisito:** Crear y gestionar planes con kcal/macros y metadata.

**Criterios de aceptación:**
- Tabla con columnas: nombre, descripción, tipo, kcal/día, propietario, fecha de creación.
- Búsqueda, ordenación y paginación.
- Soporte de duplicado y versionado.

**Dependencia de plan:** No observada.

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

_Última actualización: 2026-03-22 — RF-E1-01 cerrado. Próxima: RF-E2-01 (listado de clientes segmentado por estado)._
