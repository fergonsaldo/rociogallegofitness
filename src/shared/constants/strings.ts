/**
 * Textos centralizados de la aplicación en español.
 * Todos los literales visibles al usuario deben referenciarse desde aquí.
 */

export const Strings = {
  // ── Saludos ──────────────────────────────────────────────────────────────
  greetingMorning: 'Buenos días',
  greetingAfternoon: 'Buenas tardes',
  greetingEvening: 'Buenas noches',

  // ── Navegación (Atleta) ───────────────────────────────────────────────────
  tabHome: 'Inicio',
  tabTrain: 'Entrenar',
  tabProgress: 'Progreso',
  tabNutrition: 'Nutrición',

  // ── Navegación (Coach) ────────────────────────────────────────────────────
  tabDashboard: 'Inicio',
  tabClients: 'Clientes',
  tabRoutines: 'Rutinas',

  // ── Dashboard Atleta ──────────────────────────────────────────────────────
  labelDayStreak: 'Días seguidos',
  labelWorkouts: 'Entrenamientos',
  labelThisWeek: 'Esta semana',
  labelSets: 'Series',
  labelExercises: 'Ejercicios',
  labelVolume: 'Volumen',
  fallbackAthlete: 'Atleta',
  fallbackUnknown: 'Desconocido',

  // ── Progreso ──────────────────────────────────────────────────────────────
  tabHistory: '📋 Historial',
  tabPersonalBests: '🏆 Récords personales',
  labelEstimated1RM: '🏋️ 1RM estimado',
  labelVolumeChart: '⚡️ Volumen',
  labelLastChange: 'ÚLTIMO CAMBIO',
  labelSubEstimated: 'estimado',
  labelSubVsPrev: 'vs sesión anterior',
  labelBestVolume: 'MEJOR VOLUMEN',
  labelSubPerSession: 'por sesión',
  labelBest: 'Mejor',
  labelDuration: 'Duración',
  labelTotalSets: 'Series totales',
  labelVolumeKg: 'Volumen kg',
  fallbackExercise: 'Ejercicio',

  // ── Sesión de entrenamiento ───────────────────────────────────────────────
  alertFinishTitle: '¿Terminar entrenamiento?',
  alertFinishCancel: 'Cancelar',
  alertFinishConfirm: 'Terminar',
  alertAbandonContinue: 'Seguir entrenando',
  alertAbandonConfirm: 'Abandonar',

  // ── Nutrición ─────────────────────────────────────────────────────────────
  labelCalories: 'Calorías',
  labelProtein: 'Proteína',
  labelCarbs: 'Carbohidratos',
  labelFat: 'Grasa',
  labelProteinG: 'Proteína (g)',
  labelCarbsG: 'Carbohidratos (g)',
  labelFatG: 'Grasa (g)',
  labelCal: 'Cal',

  // Comidas por defecto (coach)
  mealBreakfast: 'Desayuno',
  mealLunch: 'Comida',
  mealDinner: 'Cena',
  mealSnack: 'Merienda',

  labelDescription: 'DESCRIPCIÓN',
  placeholderMealName: 'Nombre de la comida',
  placeholderMealNotes: 'Notas',

  alertDeletePlanTitle: 'Eliminar plan',
  alertDeletePlanMessage: (name: string) => `¿Eliminar "${name}"? Esta acción no se puede deshacer.`,
  alertDeleteCancel: 'Cancelar',
  alertDeleteConfirm: 'Eliminar',

  // ── Clientes (Coach) ──────────────────────────────────────────────────────
  labelRoutines: 'Rutinas',
  labelSessions: 'Sesiones',
  labelLastWorkout: 'Último entrenamiento',
  labelAssigned: (date: string) => `Asignado ${date}`,
  labelInProgress: 'En curso',

  alertUnassignRoutineTitle: 'Desasignar rutina',
  alertUnassignRoutineMessage: (routineName: string, athleteName: string) =>
    `¿Quitar "${routineName}" de ${athleteName}?`,
  alertUnassignCancel: 'Cancelar',
  alertUnassignConfirm: 'Quitar',

  // ── Errores de autenticación ──────────────────────────────────────────────
  errorInvalidCredentials: 'Email o contraseña incorrectos.',
  errorEmailInUse: 'Ya existe una cuenta con este email.',
  errorNetwork: 'Sin conexión a internet. Inténtalo de nuevo.',
  errorUnknown: 'Ha ocurrido un error inesperado. Inténtalo de nuevo.',
  errorLoginFailed: 'Error al iniciar sesión',
  errorRegistrationFailed: 'Error al registrarse',
  errorLogoutFailed: 'Error al cerrar sesión',

  // ── Errores de stores ─────────────────────────────────────────────────────
  errorFailedLoadHistory: 'Error al cargar el historial',
  errorFailedLoadProgression: 'Error al cargar la progresión',
  errorFailedLoadPersonalBests: 'Error al cargar los récords personales',
  errorFailedLoadPlans: 'Error al cargar los planes',
  errorFailedCreatePlan: 'Error al crear el plan',
  errorFailedAssignPlan: 'Error al asignar el plan',
  errorFailedDeletePlan: 'Error al eliminar el plan',
  errorFailedLoadPlan: 'Error al cargar el plan',
  errorFailedLoadDailySummary: 'Error al cargar el resumen diario',
  errorFailedLogMeal: 'Error al registrar la comida',
  errorFailedStartSession: 'Error al iniciar la sesión',
  errorNoActiveSession: 'No hay sesión activa',
  errorFailedLogSet: 'Error al registrar la serie',
  errorFailedFinishSession: 'Error al terminar la sesión',
  errorFailedAbandonSession: 'Error al abandonar la sesión',
  errorFailedLoadRoutines: 'Error al cargar las rutinas',
  errorFailedLoadRoutine: 'Error al cargar la rutina',
  errorFailedCreateRoutine: 'Error al crear la rutina',
  errorFailedAssignRoutine: 'Error al asignar la rutina',
  errorFailedUnassignRoutine: 'Error al desasignar la rutina',

  // ── Borrar rutina ─────────────────────────────────────────────────────────
  alertDeleteRoutineTitle: 'Eliminar rutina',
  alertDeleteRoutineMessage: (name: string) =>
    `¿Eliminar "${name}"? Se borrarán todos sus días y ejercicios. Esta acción no se puede deshacer.`,
  alertDeleteRoutineCancel: 'Cancelar',
  alertDeleteRoutineConfirm: 'Eliminar',
  errorRoutineHasAssignments:
    'No se puede eliminar esta rutina porque está asignada a uno o más clientes. Desasígnala primero.',
  errorFailedDeleteRoutine: 'Error al eliminar la rutina',

  // ── Asignar rutina a cliente ──────────────────────────────────────────────
  assignRoutineTitle: 'Asignar a cliente',
  assignRoutineSubtitle: 'Selecciona el atleta al que quieres asignar esta rutina',
  assignRoutineAlreadyAssigned: 'Ya asignada',
  assignRoutineSuccess: (athleteName: string) => `Rutina asignada a ${athleteName}`,
  assignRoutineEmpty: 'No tienes clientes todavía',
  errorFailedLoadClients: 'Error al cargar los clientes',
  errorFailedAssignRoutineToAthlete: 'Error al asignar la rutina',

  // ── Errores de dominio / validación ──────────────────────────────────────
  errorInvalidEmail: 'Dirección de email no válida',
  errorPasswordTooShort: 'La contraseña debe tener al menos 8 caracteres',
  errorPasswordTooLong: 'La contraseña es demasiado larga',
  errorWeightMustBePositive: 'El peso debe ser positivo',
  errorWeightCannotBeNegative: 'El peso no puede ser negativo',
  errorRepsMustBeAtLeastOne: 'Las repeticiones deben ser al menos 1',
  errorDurationAtLeastOneSecond: 'La duración debe ser al menos 1 segundo',
  errorSetsCannotBeNegative: 'Las series no pueden ser negativas',
  errorRepsCannotBeNegative: 'Las repeticiones no pueden ser negativas',
  errorInvalidPlanId: 'ID de plan no válido',
  errorInvalidAthleteId: 'ID de atleta no válido',
  errorInvalidRoutineId: 'ID de rutina no válido',
  errorNutritionPlanNotFound: 'Plan de nutrición no encontrado',
  errorNoUserReturned: 'No se recibió usuario',
  errorProfileNotFound: 'Perfil no encontrado',
  errorRegistrationFailed2: 'El registro ha fallado',
  errorFailedCreateProfile: 'Error al crear el perfil',
  errorActiveSessionExists:
    'Ya tienes una sesión activa. Termínala o abandónala primero.',
  errorSessionNotFound: 'Sesión no encontrada',
  errorSessionNotActive: 'La sesión no está activa',
  errorCannotLogSetsInactiveSession:
    'No se pueden registrar series en una sesión inactiva',
  errorCanOnlySaveCompletedSessions:
    'Solo se pueden guardar registros de sesiones completadas',
} as const;
