# FitCoach — Backlog

## ✅ Completado

### Infraestructura y arquitectura
- [x] Proyecto React Native + Expo Router + TypeScript configurado
- [x] Clean Architecture: domain / application / infrastructure / presentation
- [x] Base de datos local SQLite con DrizzleORM (offline-first)
- [x] Supabase como backend remoto (auth + base de datos)
- [x] Sincronización SQLite → Supabase al terminar sesión (`SyncService`)
- [x] Migraciones SQLite automáticas al arrancar la app
- [x] Path aliases (`@/`) configurados en TypeScript y Jest
- [x] NativeWind / Tailwind para estilos
- [x] Sistema de strings centralizado (`strings.ts`) — UI en español
- [x] Tema de colores y espaciado centralizado (`theme.ts`)
- [x] RLS (Row Level Security) configurado en Supabase
- [x] Función SECURITY DEFINER para romper recursión en RLS
- [x] Cobertura de tests ≥ 95% — 430 tests en 34 suites, 0 fallos

### Autenticación
- [x] Login con email y contraseña
- [x] Registro de usuario con rol (coach / atleta)
- [x] Restauración de sesión al relanzar la app (`useSessionListener`)
- [x] Logout
- [x] Redirección automática según rol tras autenticación

### Coach — Rutinas
- [x] Listado de rutinas del coach
- [x] Creación de rutina con días y ejercicios
- [x] Detalle de rutina (días, ejercicios, músculos)
- [x] Eliminación de rutina (con validación: no se puede borrar si está asignada)
- [x] Asignación de rutina a uno o varios atletas (modal con estado "ya asignado")
- [x] Desasignación de rutina desde el perfil del atleta (long press)

### Coach — Clientes
- [x] Listado de atletas del coach (con búsqueda)
- [x] Perfil del atleta: rutinas asignadas, sesiones recientes, estadísticas
- [x] Datos del atleta cargados vía repositorio (sin queries directas en pantalla)

### Coach — Nutrición
- [x] Listado de planes de nutrición del coach
- [x] Creación de plan de nutrición (macros objetivo, comidas)
- [x] Detalle de plan de nutrición
- [x] Asignación de plan nutricional a un atleta
- [x] Desasignación de plan nutricional

### Coach — Librería de ejercicios con vídeo
- [x] El coach crea ejercicios personalizados (nombre, músculos, categoría, URL YouTube)
- [x] El coach edita y elimina sus ejercicios personalizados
- [x] Vídeo accesible desde el ExercisePicker al crear/editar rutinas

### Atleta — Entrenamiento
- [x] Listado de rutinas asignadas por el coach
- [x] Selector de día cuando la rutina tiene varios días
- [x] Sesión de entrenamiento activa: ejercicios, series, descanso
- [x] Registro de series (reps + peso, o isométrico con duración)
- [x] Temporizador de descanso entre series (visible y configurable)
- [x] Temporizador de sesión en tiempo real (desde `startedAt`, no se reinicia)
- [x] Terminar sesión con resumen (volumen total, series, duración)
- [x] Abandonar sesión
- [x] Restauración de sesión activa al reabrir la app
- [x] Persistencia offline: todo se escribe primero en SQLite
- [x] Sincronización automática con Supabase al terminar
- [x] Ver vídeo de técnica durante la sesión (modal `ExerciseVideoPlayer`, sin salir de la sesión)

### Atleta — Catálogo de ejercicios
- [x] Catálogo base visible para el atleta (pestaña dedicada + player YouTube)
- [x] Catálogo incluye ejercicios personalizados del coach

### Atleta — Progreso
- [x] Historial de entrenamientos (sesiones completadas)
- [x] Detalle de sesión: ejercicios y series registradas
- [x] Progresión por ejercicio (gráfico de evolución)
- [x] Récords personales (1RM estimado, mejor peso/reps)
- [x] Refresco automático al volver a la pantalla (`useFocusEffect`)

### Atleta — Métricas corporales
- [x] Registro de métricas: peso, cintura, cadera, % grasa corporal, notas
- [x] Historial de métricas en tabla con fecha
- [x] Gráfico de evolución con selector de campo (`BodyMetricChart`)
- [x] Heatmap de consistencia 12 semanas + racha + stats del mes (`ConsistencyChart`)
- [x] Eliminación de métricas (long press)
- [x] Validación: al menos un campo de medición obligatorio

### Atleta — Fotos de progreso
- [x] Subida de foto desde galería con tag (frontal / espalda / lateral) y notas
- [x] Timeline de fotos agrupado por mes, eliminación con long press
- [x] Comparador antes/después con slider (`PhotoComparator`)
- [x] Bucket privado en Supabase Storage — URLs firmadas (1h), nunca persistidas
- [x] Flujo comparador: seleccionar foto A → foto B → comparar

### Atleta — Nutrición
- [x] Visualización del plan nutricional asignado
- [x] Resumen diario de macros (calorías, proteína, carbos, grasa)
- [x] Registro de comidas del día
- [x] Adherencia semanal
- [x] Actualización optimista de macros al registrar comida

### Calidad de código
- [x] Type guards para `ExerciseSet.performance` (`isRepsPerformance`, `isIsometricPerformance`)
- [x] Eliminación de todos los `as any` sobre performance
- [x] Eliminación de logs de debug (solo quedan `console.warn` en fallos silenciosos)
- [x] Catálogo de ejercicios estático con IDs estables (20 ejercicios)
- [x] Config Jest exclusivamente en `jest.config.ts` (sin bloque `"jest"` en `package.json`)

---

## 🔲 Pendiente

> No hay historias pendientes en el backlog actual.
> Proponer nueva épica para continuar el desarrollo.

### Ideas para próximas épicas (sin priorizar)
- **Notificaciones push** — aviso al atleta cuando el coach le asigna rutina o plan
- **Chat coach ↔ atleta** — mensajería directa dentro de la app
- **Planificación semanal** — el coach programa qué días entrena el atleta
- **RPE / feedback de sesión** — el atleta puntúa el esfuerzo percibido al terminar
- **Compartir progreso** — exportar gráficos o fotos como imagen para redes sociales
- **Modo coach en tablet** — vista optimizada para pantallas grandes
