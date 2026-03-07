import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

/**
 * Opens (or creates) the local SQLite database.
 * The drizzle instance is the single entry point for all local queries.
 *
 * Call `runMigrations()` once at app startup (before any queries).
 */
const sqlite = SQLite.openDatabaseSync('fitcoach.db');
export const db = drizzle(sqlite, { schema });

/**
 * Creates local tables if they don't exist yet.
 * Run this in the root layout before rendering any screens.
 *
 * In production you would use drizzle-kit migrations instead,
 * but this inline approach works well for development and avoids
 * the need for a separate migration runner.
 */
export async function runMigrations(): Promise<void> {
  await sqlite.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id              TEXT PRIMARY KEY,
      athlete_id      TEXT NOT NULL,
      routine_id      TEXT,
      routine_day_id  TEXT,
      status          TEXT NOT NULL DEFAULT 'active',
      notes           TEXT,
      started_at      TEXT NOT NULL,
      finished_at     TEXT,
      synced_at       TEXT,
      created_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercise_sets (
      id                TEXT PRIMARY KEY,
      session_id        TEXT NOT NULL,
      exercise_id       TEXT NOT NULL,
      set_number        INTEGER NOT NULL,
      set_type          TEXT NOT NULL,
      reps              INTEGER,
      weight_kg         REAL,
      duration_seconds  INTEGER,
      rest_after_seconds INTEGER NOT NULL DEFAULT 0,
      completed_at      TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_athlete
      ON workout_sessions(athlete_id);

    CREATE INDEX IF NOT EXISTS idx_sessions_status
      ON workout_sessions(athlete_id, status);

    CREATE INDEX IF NOT EXISTS idx_sets_session
      ON exercise_sets(session_id);
  `);
}
