import { UserSchema } from '../../../src/domain/entities/User';
import { ExerciseSetSchema } from '../../../src/domain/entities/ExerciseSet';
import { RoutineSchema } from '../../../src/domain/entities/Routine';
import { WorkoutSessionSchema } from '../../../src/domain/entities/WorkoutSession';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const NOW = new Date();

// ─── User ────────────────────────────────────────────────────────────────────

describe('UserSchema', () => {
  const validUser = {
    id: VALID_UUID,
    email: 'coach@example.com',
    fullName: 'John Doe',
    role: 'coach' as const,
    weightUnit: 'kg' as const,
    createdAt: NOW,
    updatedAt: NOW,
  };

  it('validates a correct coach user', () => {
    expect(() => UserSchema.parse(validUser)).not.toThrow();
  });

  it('validates a correct athlete user', () => {
    expect(() => UserSchema.parse({ ...validUser, role: 'athlete' })).not.toThrow();
  });

  it('rejects an invalid email address', () => {
    expect(() => UserSchema.parse({ ...validUser, email: 'not-an-email' })).toThrow();
  });

  it('rejects an empty full name', () => {
    expect(() => UserSchema.parse({ ...validUser, fullName: '' })).toThrow();
  });

  it('rejects an unknown role', () => {
    expect(() => UserSchema.parse({ ...validUser, role: 'admin' })).toThrow();
  });

  it('defaults weightUnit to kg when not provided', () => {
    const { weightUnit, ...withoutUnit } = validUser;
    const result = UserSchema.parse(withoutUnit);
    expect(result.weightUnit).toBe('kg');
  });
});

// ─── ExerciseSet ─────────────────────────────────────────────────────────────

describe('ExerciseSetSchema', () => {
  const validRepsSet = {
    id: VALID_UUID,
    sessionId: VALID_UUID,
    exerciseId: VALID_UUID,
    setNumber: 1,
    performance: { type: 'reps' as const, reps: 10, weightKg: 100 },
    restAfterSeconds: 90,
    completedAt: NOW,
  };

  const validIsometricSet = {
    ...validRepsSet,
    performance: { type: 'isometric' as const, durationSeconds: 60 },
  };

  it('validates a reps-based set', () => {
    expect(() => ExerciseSetSchema.parse(validRepsSet)).not.toThrow();
  });

  it('validates an isometric set with duration', () => {
    expect(() => ExerciseSetSchema.parse(validIsometricSet)).not.toThrow();
  });

  it('rejects a reps set with 0 reps', () => {
    const set = { ...validRepsSet, performance: { type: 'reps' as const, reps: 0, weightKg: 100 } };
    expect(() => ExerciseSetSchema.parse(set)).toThrow();
  });

  it('rejects an isometric set with 0 duration', () => {
    const set = { ...validRepsSet, performance: { type: 'isometric' as const, durationSeconds: 0 } };
    expect(() => ExerciseSetSchema.parse(set)).toThrow();
  });

  it('rejects a reps set with negative weight', () => {
    const set = { ...validRepsSet, performance: { type: 'reps' as const, reps: 10, weightKg: -5 } };
    expect(() => ExerciseSetSchema.parse(set)).toThrow();
  });

  it('rejects a set with setNumber of 0', () => {
    expect(() => ExerciseSetSchema.parse({ ...validRepsSet, setNumber: 0 })).toThrow();
  });

  it('defaults restAfterSeconds to 0 when not provided', () => {
    const { restAfterSeconds, ...withoutRest } = validRepsSet;
    const result = ExerciseSetSchema.parse(withoutRest);
    expect(result.restAfterSeconds).toBe(0);
  });
});

// ─── Routine ─────────────────────────────────────────────────────────────────

describe('RoutineSchema', () => {
  const validRoutine = {
    id: VALID_UUID,
    coachId: VALID_UUID,
    name: 'Strength Program A',
    durationWeeks: 8,
    days: [
      {
        id: VALID_UUID,
        routineId: VALID_UUID,
        dayNumber: 1,
        name: 'Push Day',
        exercises: [],
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  };

  it('validates a correct routine', () => {
    expect(() => RoutineSchema.parse(validRoutine)).not.toThrow();
  });

  it('rejects a routine with an empty name', () => {
    expect(() => RoutineSchema.parse({ ...validRoutine, name: '' })).toThrow();
  });

  it('rejects a routine with no days', () => {
    expect(() => RoutineSchema.parse({ ...validRoutine, days: [] })).toThrow();
  });

  it('rejects a routine with durationWeeks exceeding 52', () => {
    expect(() => RoutineSchema.parse({ ...validRoutine, durationWeeks: 53 })).toThrow();
  });
});

// ─── WorkoutSession ───────────────────────────────────────────────────────────

describe('WorkoutSessionSchema', () => {
  const validSession = {
    id: VALID_UUID,
    athleteId: VALID_UUID,
    status: 'active' as const,
    sets: [],
    startedAt: NOW,
  };

  it('validates an active session without a routine', () => {
    expect(() => WorkoutSessionSchema.parse(validSession)).not.toThrow();
  });

  it('validates a completed session with a finishedAt date', () => {
    const session = { ...validSession, status: 'completed' as const, finishedAt: NOW };
    expect(() => WorkoutSessionSchema.parse(session)).not.toThrow();
  });

  it('rejects a session with an unknown status', () => {
    expect(() => WorkoutSessionSchema.parse({ ...validSession, status: 'paused' })).toThrow();
  });

  it('defaults status to active when not provided', () => {
    const { status, ...withoutStatus } = validSession;
    const result = WorkoutSessionSchema.parse(withoutStatus);
    expect(result.status).toBe('active');
  });
});

// ── isRepsPerformance / isIsometricPerformance ────────────────────────────────

import { isRepsPerformance, isIsometricPerformance, SetPerformance } from '../../../src/domain/entities/ExerciseSet';

describe('isRepsPerformance', () => {
  it('returns true for a reps performance', () => {
    const p: SetPerformance = { type: 'reps', reps: 10, weightKg: 80 };
    expect(isRepsPerformance(p)).toBe(true);
  });

  it('returns false for an isometric performance', () => {
    const p: SetPerformance = { type: 'isometric', durationSeconds: 30 };
    expect(isRepsPerformance(p)).toBe(false);
  });

  it('narrows type correctly: reps and weightKg are accessible after guard', () => {
    const p: SetPerformance = { type: 'reps', reps: 5, weightKg: 100 };
    if (isRepsPerformance(p)) {
      expect(p.reps).toBe(5);
      expect(p.weightKg).toBe(100);
    }
  });
});

describe('isIsometricPerformance', () => {
  it('returns true for an isometric performance', () => {
    const p: SetPerformance = { type: 'isometric', durationSeconds: 45 };
    expect(isIsometricPerformance(p)).toBe(true);
  });

  it('returns false for a reps performance', () => {
    const p: SetPerformance = { type: 'reps', reps: 10, weightKg: 80 };
    expect(isIsometricPerformance(p)).toBe(false);
  });

  it('narrows type correctly: durationSeconds is accessible after guard', () => {
    const p: SetPerformance = { type: 'isometric', durationSeconds: 60 };
    if (isIsometricPerformance(p)) {
      expect(p.durationSeconds).toBe(60);
    }
  });
});


// ── Exercise ──────────────────────────────────────────────────────────────────
import { ExerciseSchema } from '../../../src/domain/entities/Exercise';

describe('ExerciseSchema', () => {
  const valid = {
    id: '00000000-0000-4000-a000-000000000001',
    name: 'Bench Press',
    primaryMuscles: ['chest'] as const,
    secondaryMuscles: ['triceps'] as const,
    category: 'strength' as const,
    isIsometric: false,
  };

  it('parses a valid exercise', () => {
    const result = ExerciseSchema.parse(valid);
    expect(result.name).toBe('Bench Press');
    expect(result.isIsometric).toBe(false);
  });

  it('defaults secondaryMuscles to empty array', () => {
    const { secondaryMuscles, ...without } = valid;
    const result = ExerciseSchema.parse(without);
    expect(result.secondaryMuscles).toEqual([]);
  });

  it('defaults isIsometric to false', () => {
    const { isIsometric, ...without } = valid;
    const result = ExerciseSchema.parse(without);
    expect(result.isIsometric).toBe(false);
  });

  it('rejects empty name', () => {
    expect(() => ExerciseSchema.parse({ ...valid, name: '' })).toThrow();
  });

  it('rejects empty primaryMuscles', () => {
    expect(() => ExerciseSchema.parse({ ...valid, primaryMuscles: [] })).toThrow();
  });

  it('rejects invalid category', () => {
    expect(() => ExerciseSchema.parse({ ...valid, category: 'yoga' })).toThrow();
  });
});

// ── ProgressRecord ────────────────────────────────────────────────────────────
import { ProgressRecordSchema } from '../../../src/domain/entities/ProgressRecord';

describe('ProgressRecordSchema', () => {
  const valid = {
    id:                   '00000000-0000-4000-a000-000000000001',
    athleteId:            '00000000-0000-4000-a000-000000000002',
    exerciseId:           '00000000-0000-4000-a000-000000000003',
    recordedAt:           new Date('2025-01-01'),
    totalVolumeKg:        1000,
    sessionId:            '00000000-0000-4000-a000-000000000004',
  };

  it('parses a valid progress record', () => {
    const result = ProgressRecordSchema.parse(valid);
    expect(result.totalVolumeKg).toBe(1000);
  });

  it('accepts optional fields', () => {
    const result = ProgressRecordSchema.parse({
      ...valid,
      bestWeightKg: 100,
      bestReps: 5,
      estimatedOneRepMaxKg: 115,
    });
    expect(result.bestWeightKg).toBe(100);
    expect(result.estimatedOneRepMaxKg).toBe(115);
  });

  it('rejects negative totalVolumeKg', () => {
    expect(() => ProgressRecordSchema.parse({ ...valid, totalVolumeKg: -1 })).toThrow();
  });

  it('rejects invalid UUID for athleteId', () => {
    expect(() => ProgressRecordSchema.parse({ ...valid, athleteId: 'bad' })).toThrow();
  });
});

// ── BodyMetric ────────────────────────────────────────────────────────────────
import { BodyMetricSchema, CreateBodyMetricSchema } from '../../../src/domain/entities/BodyMetric';

describe('BodyMetricSchema', () => {
  const valid = {
    id:        '00000000-0000-4000-a000-000000000001',
    athleteId: '00000000-0000-4000-a000-000000000002',
    recordedAt: new Date('2025-01-01'),
    weightKg:  80,
    createdAt:  new Date('2025-01-01'),
  };

  it('parses a valid body metric with at least one measurement', () => {
    const result = BodyMetricSchema.parse(valid);
    expect(result.weightKg).toBe(80);
  });

  it('throws when no measurement field is provided', () => {
    const { weightKg, ...noMetrics } = valid;
    expect(() => BodyMetricSchema.parse(noMetrics)).toThrow('Al menos una métrica debe tener valor');
  });

  it('accepts metric with only waistCm', () => {
    const { weightKg, ...rest } = valid;
    const result = BodyMetricSchema.parse({ ...rest, waistCm: 85 });
    expect(result.waistCm).toBe(85);
  });
});

describe('CreateBodyMetricSchema', () => {
  const valid = {
    athleteId:  '00000000-0000-4000-a000-000000000002',
    recordedAt: new Date('2025-01-01'),
    weightKg:   80,
  };

  it('parses valid create input', () => {
    const result = CreateBodyMetricSchema.parse(valid);
    expect(result.athleteId).toBeDefined();
  });

  it('rejects when no measurement is provided', () => {
    const { weightKg, ...noMetrics } = valid;
    expect(() => CreateBodyMetricSchema.parse(noMetrics)).toThrow();
  });
});
