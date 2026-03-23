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
  clientsLastActivityNever: 'Sin actividad',
  clientsLastActivityToday: 'Hoy',
  clientsLastActivityYesterday: 'Ayer',
  clientsLastActivityDaysAgo: (d: number) => `Hace ${d} días`,
  clientsLastActivityWeeksAgo: (w: number) => `Hace ${w} sem.`,
  clientsRoutineCount: (n: number) => `${n} ${n === 1 ? 'rutina' : 'rutinas'}`,

  clientsSearchPlaceholder: 'Buscar por nombre o email...',
  clientsNoResults: 'Sin resultados',
  clientsNoResultsSubtitle: (query: string) => `No hay clientes que coincidan con "${query}"`,

  tabClientsActive: 'Activos',
  tabClientsArchived: 'Archivados',

  alertArchiveClientTitle: 'Archivar cliente',
  alertArchiveClientMessage: (name: string) =>
    `¿Archivar a ${name}? Podrás restaurarlo desde la pestaña Archivados.`,
  alertArchiveCancel: 'Cancelar',
  alertArchiveConfirm: 'Archivar',

  alertRestoreClientTitle: 'Restaurar cliente',
  alertRestoreClientMessage: (name: string) => `¿Restaurar a ${name} como cliente activo?`,
  alertRestoreCancel: 'Cancelar',
  alertRestoreConfirm: 'Restaurar',

  alertDeleteClientTitle: 'Eliminar cliente',
  alertDeleteClientMessage: (name: string) =>
    `¿Eliminar a ${name} definitivamente? Esta acción no se puede deshacer.`,

  errorFailedArchiveClient: 'Error al archivar el cliente',
  errorFailedRestoreClient: 'Error al restaurar el cliente',

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
  errorFailedLoadDashboard: 'Error al cargar el resumen del dashboard',
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

  // ── Catálogo de rutinas (RF-E4-02) ───────────────────────────────────────
  routineNewButton: '+ Nueva',
  routineSearchPlaceholder: 'Buscar rutina...',
  routineSubtitle: (n: number) => `${n} ${n === 1 ? 'rutina' : 'rutinas'}`,
  routineSelectionCount: (n: number) => `${n} seleccionada${n !== 1 ? 's' : ''}`,
  routineBulkAssignButton: 'Asignar seleccionadas',
  routineBulkAssignSuccess: (n: number, athleteName: string) =>
    `${n} ${n === 1 ? 'rutina asignada' : 'rutinas asignadas'} a ${athleteName}`,
  routineEmptyTitle: 'Sin rutinas todavía',
  routineEmptySubtitle: 'Crea tu primer programa de entrenamiento',
  routineEmptyButton: 'Crear rutina',
  routineEmptySearch: 'Sin resultados',
  routineEmptySearchSubtitle: (q: string) => `No hay rutinas que coincidan con "${q}"`,
  routineLongPressHint: 'Mantén pulsado para seleccionar',

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

  // Librería de ejercicios
  tabExercises: 'Ejercicios',
  exerciseLibraryTitle: 'Librería de ejercicios',
  exerciseLibrarySearchPlaceholder: 'Buscar ejercicio...',
  exerciseLibraryFilterAll: 'Todos',
  exerciseVideoButton: 'Ver técnica',
  exerciseVideoTitle: 'Demostración',
  exerciseVideoClose: 'Cerrar',
  exerciseVideoUnavailable: 'Vídeo no disponible',
  exercisePrimaryMuscles: 'Músculos principales',
  exerciseSecondaryMuscles: 'Músculos secundarios',
  exerciseCategoryStrength: 'Fuerza',
  exerciseCategoryCardio: 'Cardio',
  exerciseCategoryFlexibility: 'Flexibilidad',
  exerciseCategoryIsometric: 'Isométrico',

  // Ejercicios personalizados del coach
  coachExerciseLibraryTitle: 'Mis ejercicios',
  coachExerciseLibraryEmpty: 'Aún no has creado ejercicios personalizados',
  coachExerciseNewButton: '+ Nuevo ejercicio',
  exerciseFormTitle: 'Nuevo ejercicio',
  exerciseFormName: 'Nombre',
  exerciseFormNamePlaceholder: 'Ej. Press banca con agarre estrecho',
  exerciseFormCategory: 'Categoría',
  exerciseFormDescription: 'Descripción (opcional)',
  exerciseFormDescriptionPlaceholder: 'Instrucciones de ejecución o notas...',
  exerciseFormVideoUrl: 'URL de vídeo (YouTube)',
  exerciseFormVideoUrlPlaceholder: 'https://www.youtube.com/watch?v=...',
  exerciseFormIsometricHint: 'Los ejercicios isométricos se registran por duración (segundos)',
  exerciseFormSubmit: 'Crear ejercicio',
  exerciseFormCancel: 'Cancelar',
  exerciseFormSuccess: 'Ejercicio creado correctamente',
  exercisePickerMyExercises: 'Mis ejercicios',
  exercisePickerCatalog: 'Catálogo base',
  exercisePickerNewExercise: '+ Crear nuevo ejercicio',

  // Editar / eliminar ejercicios personalizados
  exerciseFormEditTitle: 'Editar ejercicio',
  exerciseFormEditSubmit: 'Guardar cambios',
  exerciseDeleteConfirmTitle: 'Eliminar ejercicio',
  exerciseDeleteConfirmMessage: '¿Seguro que quieres eliminar este ejercicio? Esta acción no se puede deshacer.',
  exerciseDeleteConfirm: 'Eliminar',
  exerciseDeleteCancel: 'Cancelar',
  exerciseDeleteInUseError: 'No se puede eliminar un ejercicio que está en uso en una rutina activa',

  // Métricas corporales
  bodyMetricsTitle: 'Métricas corporales',
  bodyMetricsEmpty: 'Sin registros aún. Añade tu primera medición.',
  bodyMetricsAdd: '+ Añadir medición',
  bodyMetricWeight: 'Peso',
  bodyMetricWaist: 'Cintura',
  bodyMetricHip: 'Cadera',
  bodyMetricFat: '% Grasa',
  bodyMetricDate: 'Fecha',
  bodyMetricNotes: 'Notas (opcional)',
  bodyMetricSave: 'Guardar medición',
  bodyMetricDeleteConfirm: '¿Eliminar esta medición?',
  bodyMetricUnitKg: 'kg',
  bodyMetricUnitCm: 'cm',
  bodyMetricUnitPercent: '%',
  bodyMetricInitial: 'Inicial',
  bodyMetricCurrent: 'Actual',
  bodyMetricChange: 'Cambio',

  // Consistencia
  consistencyTitle: 'Consistencia',

  // Fotos de progreso
  progressPhotosTitle: 'Fotos de progreso',
  progressPhotosEmpty: 'Sin fotos aún. Añade tu primera foto.',
  progressPhotosAdd: '+ Añadir foto',
  progressPhotoTag: 'Posición',
  progressPhotoDate: 'Fecha',
  progressPhotoNotes: 'Notas (opcional)',
  progressPhotoSave: 'Guardar foto',
  progressPhotoDelete: 'Eliminar foto',
  progressPhotoCompare: 'Comparar',
  progressPhotoSelectBefore: 'Selecciona foto "Antes"',
  progressPhotoSelectAfter: 'Selecciona foto "Después"',
  progressPhotoComparing: 'Comparando',

  // ── Etiquetas de clientes (RF-E2-05a) ────────────────────────────────────────
  tagsTitle: 'Etiquetas',
  tagsSubtitle: (n: number) => `${n} ${n === 1 ? 'etiqueta' : 'etiquetas'}`,
  tagsEmpty: 'Sin etiquetas todavía',
  tagsEmptySubtitle: 'Crea etiquetas para organizar tus clientes',
  tagsNewButton: '+ Nueva etiqueta',
  tagClients: (n: number) => `${n} ${n === 1 ? 'cliente' : 'clientes'}`,
  tagNoAutomations: 'Sin automatizaciones',

  tagPickerTitle: 'Gestionar etiquetas',
  tagPickerDone: 'Listo',
  tagPickerEmpty: 'Sin etiquetas. Crea una desde la pantalla de etiquetas.',
  tagManageButton: 'Gestionar etiquetas',
  sectionTags: 'ETIQUETAS',
  errorFailedAssignTag: 'Error al asignar la etiqueta',
  errorFailedRemoveTag: 'Error al quitar la etiqueta',
  errorFailedLoadAthleteTagss: 'Error al cargar las etiquetas del cliente',

  tagFormCreateTitle: 'Nueva etiqueta',
  tagFormEditTitle: 'Editar etiqueta',
  tagFormNameLabel: 'Nombre',
  tagFormNamePlaceholder: 'Ej. VIP, En riesgo, Nuevo...',
  tagFormColorLabel: 'Color',
  tagFormSubmitCreate: 'Crear etiqueta',
  tagFormSubmitEdit: 'Guardar cambios',
  tagFormCancel: 'Cancelar',

  alertDeleteTagTitle: 'Eliminar etiqueta',
  alertDeleteTagMessage: (name: string, count: number) =>
    count > 0
      ? `¿Eliminar "${name}"? Se quitará de ${count} ${count === 1 ? 'cliente' : 'clientes'}.`
      : `¿Eliminar "${name}"? Esta acción no se puede deshacer.`,
  alertDeleteTagCancel: 'Cancelar',
  alertDeleteTagConfirm: 'Eliminar',

  errorFailedLoadTags: 'Error al cargar las etiquetas',
  errorFailedCreateTag: 'Error al crear la etiqueta',
  errorFailedUpdateTag: 'Error al actualizar la etiqueta',
  errorFailedDeleteTag: 'Error al eliminar la etiqueta',
  errorTagNameDuplicate: 'Ya existe una etiqueta con ese nombre',

  // ── Calendario del coach (RF-E8-01 + RF-E8-03) ────────────────────────────
  calendarTitle: 'Agenda',
  calendarWidgetTitle: 'Mi agenda',
  calendarWidgetEmpty: 'Sin sesiones este mes',
  calendarWidgetViewAll: 'Ver agenda',
  calendarNoSessions: 'Sin sesiones este día',
  calendarNewSession: '+ Nueva sesión',
  calendarDeleteSessionTitle: 'Eliminar sesión',
  calendarDeleteSessionMessage: (title: string) =>
    `¿Eliminar la sesión "${title}"? Esta acción no se puede deshacer.`,
  calendarDeleteCancel: 'Cancelar',
  calendarDeleteConfirm: 'Eliminar',

  sessionFormTitle: 'Nueva sesión',
  sessionFormLabelTitle: 'Título (opcional)',
  sessionFormPlaceholderTitle: 'Ej. Sesión de fuerza, Revisión online...',
  sessionFormLabelType: 'Tipo',
  sessionFormLabelModality: 'Modalidad',
  sessionFormModalityOnline: 'Online',
  sessionFormModalityInPerson: 'Presencial',
  sessionFormLabelAthlete: 'Cliente (opcional)',
  sessionFormAthleteNone: 'Sin cliente asignado',
  sessionFormLabelDate: 'Fecha',
  sessionFormLabelTime: 'Hora',
  sessionFormLabelDuration: 'Duración',
  sessionFormDurationMinutes: (m: number) => `${m} min`,
  sessionFormLabelNotes: 'Notas (opcional)',
  sessionFormPlaceholderNotes: 'Indicaciones, preparación...',
  sessionFormSubmit: 'Crear sesión',
  sessionFormCancel: 'Cancelar',
  sessionTypeEntrenamiento: 'Entrenamiento',
  sessionTypeEvaluacion: 'Evaluación',
  sessionTypeSeguimiento: 'Seguimiento',
  sessionTypeNutricion: 'Nutrición',

  errorFailedLoadSessions: 'Error al cargar las sesiones',
  errorFailedCreateSession: 'Error al crear la sesión',
  errorFailedDeleteSession: 'Error al eliminar la sesión',
  errorSessionOverlap: 'La sesión se solapa con otra ya programada',

  // ── Lista de sesiones (RF-E8-02) ──────────────────────────────────────────
  calendarTabCalendar: 'Calendario',
  calendarTabList: 'Lista',
  listSubtabList: 'Lista',
  listSubtabMetrics: 'Métricas',
  listRangeFrom: 'Desde',
  listRangeTo: 'Hasta',
  listFilterType: 'Tipo',
  listFilterModality: 'Modalidad',
  listEmpty: 'Sin sesiones en el rango y filtros seleccionados',
  listMetricsTotalSessions: 'Sesiones',
  listMetricsTotalHours: 'Horas totales',
  listMetricsByType: 'Por tipo',
  listMetricsByModality: 'Por modalidad',
  listMetricsOnline: 'Online',
  listMetricsInPerson: 'Presencial',

  // ── Catálogo de cardios (RF-E4-04) ───────────────────────────────────────
  cardioTitle: 'Cardio',
  cardioSubtitle: (n: number) => `${n} ${n === 1 ? 'sesión' : 'sesiones'}`,
  cardioNewButton: '+ Nueva',
  cardioSearchPlaceholder: 'Buscar cardio...',
  cardioEmptyTitle: 'Sin cardios todavía',
  cardioEmptySubtitle: 'Crea tu primera sesión de cardio',
  cardioEmptyButton: 'Crear cardio',
  cardioEmptySearch: 'Sin resultados',
  cardioEmptySearchSubtitle: (q: string) => `No hay cardios que coincidan con "${q}"`,
  cardioSelectionCount: (n: number) => `${n} seleccionado${n !== 1 ? 's' : ''}`,
  cardioBulkAssignButton: 'Asignar seleccionados',
  cardioBulkAssignSuccess: (n: number, athleteName: string) =>
    `${n} ${n === 1 ? 'cardio asignado' : 'cardios asignados'} a ${athleteName}`,
  cardioDeleteConfirmTitle: 'Eliminar cardio',
  cardioDeleteConfirmMessage: (name: string) =>
    `¿Eliminar "${name}"? Esta acción no se puede deshacer.`,
  cardioDeleteConfirm: 'Eliminar',
  cardioDeleteCancel: 'Cancelar',

  // Tipos de cardio
  cardioTypeRunning:      'Correr',
  cardioTypeCycling:      'Ciclismo',
  cardioTypeSwimming:     'Natación',
  cardioTypeElliptical:   'Elíptica',
  cardioTypeRowing:       'Remo',
  cardioTypeJumpRope:     'Comba',
  cardioTypeWalking:      'Caminar',
  cardioTypeStairClimbing:'Escaleras',
  cardioTypeOther:        'Otro',

  // Intensidades
  cardioIntensityLow:    'Baja',
  cardioIntensityMedium: 'Media',
  cardioIntensityHigh:   'Alta',

  // Formulario
  cardioFormTitle:               'Nuevo cardio',
  cardioFormLabelName:           'Nombre',
  cardioFormPlaceholderName:     'Ej. Carrera continua 30 min...',
  cardioFormLabelType:           'Tipo',
  cardioFormLabelIntensity:      'Intensidad',
  cardioFormLabelDurationMin:    'Duración mínima (min)',
  cardioFormLabelDurationMax:    'Duración máxima (min)',
  cardioFormLabelDescription:    'Descripción (opcional)',
  cardioFormPlaceholderDesc:     'Instrucciones, notas...',
  cardioFormSubmit:              'Crear cardio',
  cardioFormCancel:              'Cancelar',
  cardioFormSuccess:             'Cardio creado correctamente',
  cardioFormErrorDurationRange:  'La duración máxima debe ser mayor o igual a la mínima',

  // Errores de store
  errorFailedLoadCardios:   'Error al cargar los cardios',
  errorFailedCreateCardio:  'Error al crear el cardio',
  errorFailedDeleteCardio:  'Error al eliminar el cardio',
  errorFailedAssignCardio:  'Error al asignar el cardio',

  // ── Biblioteca de vídeos (RF-E5-01) ──────────────────────────────────────
  videoTitle:              'Vídeos',
  videoSubtitle:           (n: number) => `${n} ${n === 1 ? 'vídeo' : 'vídeos'}`,
  videoNewButton:          '+ Nuevo',
  videoSearchPlaceholder:  'Buscar por título o descripción…',
  videoEmptyTitle:         'Sin vídeos todavía',
  videoEmptySubtitle:      'Añade tus primeros vídeos de YouTube',
  videoEmptyButton:        'Añadir vídeo',
  videoEmptySearch:        'Sin resultados',
  videoEmptySearchSubtitle:(q: string) => `Ningún vídeo coincide con "${q}"`,
  videoDeleteConfirmTitle:  'Eliminar vídeo',
  videoDeleteConfirmMessage:(title: string) => `¿Eliminar "${title}"? Esta acción no se puede deshacer.`,
  videoDeleteCancel:        'Cancelar',
  videoDeleteConfirm:       'Eliminar',
  videoFormTitle:           'Nuevo vídeo',
  videoFormCancel:          'Cancelar',
  videoFormLabelTitle:      'Título',
  videoFormPlaceholderTitle:'Nombre del vídeo',
  videoFormLabelUrl:        'URL de YouTube',
  videoFormPlaceholderUrl:  'https://www.youtube.com/watch?v=…',
  videoFormLabelTags:       'Etiquetas',
  videoFormPlaceholderTag:  'Añadir etiqueta…',
  videoFormAddTag:          'Añadir',
  videoFormLabelDescription:'Descripción (opcional)',
  videoFormPlaceholderDesc: 'Descripción del vídeo…',
  videoFormSubmit:          'Guardar vídeo',
  videoFormSuccess:         'Vídeo guardado correctamente',
  videoFormErrorTitle:      'El título es obligatorio',
  videoFormErrorUrl:        'La URL debe ser de YouTube',
  // Errores de store
  errorFailedLoadVideos:    'Error al cargar los vídeos',
  errorFailedCreateVideo:   'Error al crear el vídeo',
  errorFailedDeleteVideo:   'Error al eliminar el vídeo',

  // ── Mensajería ──────────────────────────────────────────────────────────────
  tabMessages: 'Mensajes',
  messagesTitle: 'Mensajes',
  messagesEmpty: 'No tienes conversaciones aún',
  messagesEmptySubtitle: 'Inicia una conversación desde el perfil de un atleta',
  messageInputPlaceholder: 'Escribe un mensaje…',
  messageSendButton: 'Enviar',
  messageToday: 'Hoy',
  messageYesterday: 'Ayer',
  messageAthleteEmptySubtitle: 'Tu coach puede enviarte mensajes aquí',
  errorSendMessage: 'No se pudo enviar el mensaje',
  errorLoadMessages: 'Error al cargar los mensajes',
  errorLoadConversations: 'Error al cargar las conversaciones',
  buttonMessage: 'Mensaje',
} as const;
