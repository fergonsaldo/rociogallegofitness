# Reglas del Proyecto — rociogallegofitness

Este fichero complementa las instrucciones del sistema. Se debe leer al inicio de cada sesión y antes de arrancar cualquier historia.

---

## ORDEN PERMANENTE: Análisis previo de implementación

**Antes de comenzar cualquier historia del backlog**, y como paso previo al rol de Product Owner, se debe ejecutar siempre el siguiente análisis:

### Protocolo de verificación previa

1. **Localizar los ficheros relevantes** para la historia en cuestión:
   - Pantallas en `app/(coach)/` o `app/(athlete)/`
   - Casos de uso en `src/application/`
   - Repositorios en `src/infrastructure/`
   - Stores en `src/presentation/stores/`
   - Tests en `__tests__/`

2. **Evaluar el nivel de implementación** de cada criterio de aceptación de la historia:
   - ✅ **Completo** — implementado y testado
   - ⚠️ **Parcial** — existe pero incompleto o sin tests suficientes
   - ❌ **Ausente** — no existe nada

3. **Presentar el informe al usuario** antes de proponer cualquier plan de trabajo, con el formato:

   ```
   ## Análisis previo — [ID Historia]

   | Criterio de aceptación | Estado | Ficheros afectados |
   |---|---|---|
   | [criterio 1] | ✅ / ⚠️ / ❌ | [fichero] |
   | [criterio 2] | ✅ / ⚠️ / ❌ | [fichero] |

   ### Recomendación
   [Una de estas tres opciones:]
   - Marcar como ✅ completada y pasar a la siguiente
   - Completar solo los gaps (⚠️ y ❌), reutilizando lo existente
   - Reimplementar desde cero (solo si lo existente es incompatible con la arquitectura)
   ```

4. **Esperar confirmación del usuario** antes de proceder con la implementación.

### Por qué esta regla existe

El prototipo tiene funcionalidad implementada que no está reflejada en el BACKLOG. Sin verificación previa, se corre el riesgo de duplicar trabajo o sobreescribir código funcional.

---

## Estado del repositorio (baseline)

Funcionalidad implementada en el prototipo que **no aparece en el BACKLOG**:

### Coach
- Auth completa (login / registro)
- Dashboard con accesos rápidos estáticos (Clientes, Rutinas, Nutrición)
- Gestión de rutinas (CRUD + días + ejercicios + asignación a atleta)
- Librería de ejercicios custom (CRUD + búsqueda + vídeo YouTube)
- Gestión de clientes (listar, buscar, vincular, crear, ver detalle)
- Planes de nutrición (CRUD + meals + macros + asignación)
- Mensajería (lista de conversaciones + hilo)

### Atleta
- Dashboard con stats (racha, workouts, volumen semanal, mejores marcas)
- Sesión de entrenamiento activa (series, temporizador descanso, resumen)
- Progreso: historial, progresión por ejercicio, métricas corporales, gráficas
- Fotos de progreso (añadir, timeline, comparador)
- Plan nutricional (ver plan asignado, loguear comidas)
- Librería de ejercicios (vista atleta)
- Mensajería

### Infraestructura
- Offline-first: SQLite local + SyncService → Supabase
- 39 suites / 598 tests con cobertura ≥ 90%

---

## Historias del BACKLOG ya implementadas (pendiente de mover a ✅)

| Historia | Estado real |
|---|---|
| RF-E2-02 Búsqueda de clientes | ✅ Implementada en `clients/index.tsx` |
| RF-E4-01 Catálogo de ejercicios | ✅ Implementada en `exercises/index.tsx` + `exercises/[id].tsx` |
| RF-E6-01 Planes nutricionales básicos | ✅ Implementada en `nutrition/` (sin duplicado ni versionado) |
| RF-E1-01 Dashboard | ⚠️ Parcial — hay dashboard pero sin widgets dinámicos |
| RF-E2-01 Listado clientes segmentado | ⚠️ Parcial — hay listado pero sin tabs Activos/Invitados/Archivados |
