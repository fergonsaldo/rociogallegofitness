/**
 * CoachSession entity schema tests — RF-E8-08
 */

import { UpdateCoachSessionSchema } from '../../../src/domain/entities/CoachSession';

const VALID_DATE = new Date('2026-03-22T10:00:00Z');

// ── UpdateCoachSessionSchema — partial updates ────────────────────────────────

describe('UpdateCoachSessionSchema — partial updates', () => {
  it('accepts empty object (no fields required)', () => {
    expect(() => UpdateCoachSessionSchema.parse({})).not.toThrow();
  });

  it('accepts update with only title', () => {
    expect(() => UpdateCoachSessionSchema.parse({ title: 'Nueva sesión' })).not.toThrow();
  });

  it('accepts null title (clear the title)', () => {
    expect(() => UpdateCoachSessionSchema.parse({ title: null })).not.toThrow();
  });

  it('accepts update with only sessionType', () => {
    expect(() => UpdateCoachSessionSchema.parse({ sessionType: 'Evaluación' })).not.toThrow();
  });

  it('accepts update with only modality', () => {
    expect(() => UpdateCoachSessionSchema.parse({ modality: 'online' })).not.toThrow();
  });

  it('accepts update with only scheduledAt', () => {
    expect(() => UpdateCoachSessionSchema.parse({ scheduledAt: VALID_DATE })).not.toThrow();
  });

  it('accepts update with only durationMinutes', () => {
    expect(() => UpdateCoachSessionSchema.parse({ durationMinutes: 90 })).not.toThrow();
  });

  it('accepts update with only athleteId', () => {
    expect(() => UpdateCoachSessionSchema.parse({
      athleteId: '00000000-0000-4000-b000-000000000001',
    })).not.toThrow();
  });

  it('accepts null athleteId (remove athlete assignment)', () => {
    expect(() => UpdateCoachSessionSchema.parse({ athleteId: null })).not.toThrow();
  });

  it('accepts update with all fields', () => {
    expect(() => UpdateCoachSessionSchema.parse({
      athleteId:       null,
      title:           'Sesión editada',
      sessionType:     'Seguimiento',
      modality:        'in_person',
      scheduledAt:     VALID_DATE,
      durationMinutes: 45,
      notes:           'Notas actualizadas',
    })).not.toThrow();
  });

  it('rejects durationMinutes of 0', () => {
    const result = UpdateCoachSessionSchema.safeParse({ durationMinutes: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('La duración mínima es 1 minuto');
    }
  });

  it('rejects durationMinutes greater than 480', () => {
    expect(() => UpdateCoachSessionSchema.parse({ durationMinutes: 481 })).toThrow();
  });

  it('rejects empty sessionType', () => {
    expect(() => UpdateCoachSessionSchema.parse({ sessionType: '' })).toThrow();
  });

  it('rejects invalid modality value', () => {
    expect(() => UpdateCoachSessionSchema.parse({ modality: 'presencial' as any })).toThrow();
  });

  it('rejects invalid UUID for athleteId', () => {
    expect(() => UpdateCoachSessionSchema.parse({ athleteId: 'not-a-uuid' })).toThrow();
  });
});
