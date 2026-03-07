# FitCoach

App móvil de entrenamiento personal para coaches y atletas.
Construida con Expo + TypeScript + Supabase + SQLite (offline-first).

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Expo SDK 51 + React Native |
| Navegación | Expo Router 3 (file-based) |
| Backend / Auth | Supabase (PostgreSQL + RLS) |
| DB local | expo-sqlite + DrizzleORM |
| Estado global | Zustand |
| Validación | Zod |
| Tests | Jest + jest-expo |

---

## Setup rápido

### 1. Crear el proyecto Expo

```bash
npx create-expo-app fitcoach --template blank-typescript
cd fitcoach
```

### 2. Copiar los archivos del proyecto

Copia todos los archivos de este directorio dentro del proyecto recién creado,
sobreescribiendo los que ya existan.

### 3. Instalar dependencias

```bash
npm install
```

> Si hay conflictos de versiones con `react-native-svg`, fuerza la resolución:
> ```bash
> npm install react-native-svg@15.3.0 --legacy-peer-deps
> ```

### 4. Configurar Supabase

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 5. Aplicar el schema de base de datos

En el Dashboard de Supabase → SQL Editor, ejecuta el contenido de:

```
supabase/migrations/20240101000000_initial_schema.sql
```

También necesitas añadir las tablas de nutrición (ejecutar en SQL Editor):

```sql
-- Nutrition plans
CREATE TABLE nutrition_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  calories        INTEGER NOT NULL DEFAULT 0,
  protein_g       NUMERIC(6,1) NOT NULL DEFAULT 0,
  carbs_g         NUMERIC(6,1) NOT NULL DEFAULT 0,
  fat_g           NUMERIC(6,1) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE meals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrition_plan_id UUID NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  "order"           INTEGER NOT NULL,
  calories          INTEGER NOT NULL DEFAULT 0,
  protein_g         NUMERIC(6,1) NOT NULL DEFAULT 0,
  carbs_g           NUMERIC(6,1) NOT NULL DEFAULT 0,
  fat_g             NUMERIC(6,1) NOT NULL DEFAULT 0,
  notes             TEXT
);

CREATE TABLE nutrition_assignments (
  nutrition_plan_id UUID NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  athlete_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (nutrition_plan_id, athlete_id)
);

CREATE TABLE meal_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id     UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  athlete_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  calories    INTEGER NOT NULL DEFAULT 0,
  protein_g   NUMERIC(6,1) NOT NULL DEFAULT 0,
  carbs_g     NUMERIC(6,1) NOT NULL DEFAULT 0,
  fat_g       NUMERIC(6,1) NOT NULL DEFAULT 0,
  notes       TEXT
);

-- Progress records
CREATE TABLE progress_records (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id              UUID NOT NULL,
  session_id               UUID NOT NULL,
  recorded_at              TIMESTAMPTZ NOT NULL,
  best_weight_kg           NUMERIC(6,2),
  best_reps                INTEGER,
  estimated_one_rep_max_kg NUMERIC(6,2),
  total_volume_kg          NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- Workout sessions + sets (for Supabase sync)
CREATE TABLE IF NOT EXISTS workout_sessions (
  id              UUID PRIMARY KEY,
  athlete_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  routine_id      UUID REFERENCES routines(id),
  routine_day_id  UUID REFERENCES routine_days(id),
  status          TEXT NOT NULL DEFAULT 'active',
  notes           TEXT,
  started_at      TIMESTAMPTZ NOT NULL,
  finished_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exercise_sets (
  id                UUID PRIMARY KEY,
  session_id        UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id       UUID NOT NULL,
  set_number        INTEGER NOT NULL,
  set_type          TEXT NOT NULL,
  reps              INTEGER,
  weight_kg         NUMERIC(6,2),
  duration_seconds  INTEGER,
  rest_after_seconds INTEGER NOT NULL DEFAULT 0,
  completed_at      TIMESTAMPTZ NOT NULL
);
```

### 6. Arrancar la app

```bash
# iOS simulator
npx expo start --ios

# Android emulator
npx expo start --android

# Expo Go (escanea el QR)
npx expo start
```

### 7. Ejecutar los tests

```bash
npm test
# o con coverage
npm run test:coverage
```

---

## Arquitectura

```
fitcoach/
├── app/                        # Expo Router — pantallas
│   ├── _layout.tsx             # Root guard (auth + SQLite migrations)
│   ├── (auth)/                 # Login, Register
│   ├── (coach)/                # Dashboard, Routines, Nutrition, Clients
│   └── (athlete)/              # Dashboard, Workout, Progress, Nutrition
│
├── src/
│   ├── domain/                 # Entidades, value objects, interfaces de repo
│   ├── application/            # Casos de uso (sin dependencias de framework)
│   ├── infrastructure/         # Supabase repos, SQLite repo, SyncService
│   └── presentation/           # Stores Zustand, hooks, componentes UI
│
├── supabase/migrations/        # Schema SQL
└── __tests__/                  # Tests unitarios (87 casos)
```

## Roles

| Coach | Atleta |
|-------|--------|
| Crea rutinas con días y ejercicios | Ve sus rutinas asignadas |
| Asigna rutinas a atletas | Realiza entrenamientos activos |
| Crea planes de nutrición | Ve su plan de nutrición |
| Asigna planes de nutrición | Loguea comidas del día |
| — | Ve historial y progresión con gráficas |

## Offline-first

Todos los entrenamientos se escriben primero en SQLite local.
`SyncService` detecta conectividad y hace upsert a Supabase automáticamente
al finalizar cada sesión. Si falla, lo reintenta en la siguiente sesión.
