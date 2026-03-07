import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * Local SQLite schema (DrizzleORM).
 * Mirrors the Supabase schema for offline-first operation.
 * All timestamps are stored as ISO strings for SQLite compatibility.
 */

export const workoutSessions = sqliteTable('workout_sessions', {
  id:           text('id').primaryKey(),
  athleteId:    text('athlete_id').notNull(),
  routineId:    text('routine_id'),
  routineDayId: text('routine_day_id'),
  status:       text('status', { enum: ['active', 'completed', 'abandoned'] }).notNull().default('active'),
  notes:        text('notes'),
  startedAt:    text('started_at').notNull(),
  finishedAt:   text('finished_at'),
  syncedAt:     text('synced_at'),
  createdAt:    text('created_at').notNull(),
});

export const exerciseSets = sqliteTable('exercise_sets', {
  id:                 text('id').primaryKey(),
  sessionId:          text('session_id').notNull(),
  exerciseId:         text('exercise_id').notNull(),
  setNumber:          integer('set_number').notNull(),
  setType:            text('set_type', { enum: ['reps', 'isometric'] }).notNull(),
  // reps-based
  reps:               integer('reps'),
  weightKg:           real('weight_kg'),
  // isometric
  durationSeconds:    integer('duration_seconds'),
  restAfterSeconds:   integer('rest_after_seconds').notNull().default(0),
  completedAt:        text('completed_at').notNull(),
});

export type WorkoutSessionRow   = typeof workoutSessions.$inferSelect;
export type ExerciseSetRow      = typeof exerciseSets.$inferSelect;
export type InsertWorkoutSession = typeof workoutSessions.$inferInsert;
export type InsertExerciseSet    = typeof exerciseSets.$inferInsert;
