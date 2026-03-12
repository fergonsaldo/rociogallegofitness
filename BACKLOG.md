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
- [x] Cobertura de tests ≥ 95% — 262 tests en 21 ficheros

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

### Atleta — Progreso
- [x] Historial de entrenamientos (sesiones completadas)
- [x] Detalle de sesión: ejercicios y series registradas
- [x] Progresión por ejercicio (gráfico de evolución)
- [x] Récords personales (1RM estimado, mejor peso/reps)
- [x] Refresco automático al volver a la pantalla (`useFocusEffect`)

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
- [x] `useEffect` con dependencias correctas en pantalla de sesión
- [x] Catálogo de ejercicios estático con IDs estables (20 ejercicios)

---

## 🔲 Pendiente

### Épica: Librería de ejercicios con vídeo

- [x] **Historia 1** — Catálogo base visible para el atleta (nueva pestaña + player YouTube)
- [x] **Historia 2** — Vídeo accesible desde ExercisePicker del coach
- [x] **Historia 3** — El coach crea ejercicios personalizados
- [x] **Historia 4** — El coach edita y elimina sus ejercicios personalizados
- [ ] **Historia 5** — Ver vídeo de técnica durante la sesión de entrenamiento (modal sin salir de la sesión)


