/**
 * AthleteGroup entity schema tests — RF-E2-04a
 */

import {
  CreateAthleteGroupSchema,
  UpdateAthleteGroupSchema,
  AthleteGroupSchema,
} from '../../../src/domain/entities/AthleteGroup';

const VALID_UUID = '00000000-0000-4000-b000-000000000001';
const NOW        = new Date();

// ── CreateAthleteGroupSchema ──────────────────────────────────────────────────

describe('CreateAthleteGroupSchema', () => {
  it('accepts valid input with name only', () => {
    expect(() => CreateAthleteGroupSchema.parse({ coachId: VALID_UUID, name: 'Principiantes' })).not.toThrow();
  });

  it('accepts valid input with name and description', () => {
    expect(() => CreateAthleteGroupSchema.parse({
      coachId: VALID_UUID, name: 'Avanzados', description: 'Atletas de alto rendimiento',
    })).not.toThrow();
  });

  it('accepts null description', () => {
    expect(() => CreateAthleteGroupSchema.parse({
      coachId: VALID_UUID, name: 'VIPs', description: null,
    })).not.toThrow();
  });

  it('rejects empty name', () => {
    const result = CreateAthleteGroupSchema.safeParse({ coachId: VALID_UUID, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.errors[0].message).toBe('El nombre es obligatorio');
  });

  it('rejects name longer than 100 characters', () => {
    expect(() => CreateAthleteGroupSchema.parse({
      coachId: VALID_UUID, name: 'a'.repeat(101),
    })).toThrow();
  });

  it('rejects description longer than 300 characters', () => {
    expect(() => CreateAthleteGroupSchema.parse({
      coachId: VALID_UUID, name: 'OK', description: 'x'.repeat(301),
    })).toThrow();
  });

  it('rejects invalid coachId UUID', () => {
    expect(() => CreateAthleteGroupSchema.parse({ coachId: 'not-a-uuid', name: 'Test' })).toThrow();
  });

  it('rejects missing coachId', () => {
    expect(() => CreateAthleteGroupSchema.parse({ name: 'Test' })).toThrow();
  });
});

// ── UpdateAthleteGroupSchema ──────────────────────────────────────────────────

describe('UpdateAthleteGroupSchema', () => {
  it('accepts empty object (no fields required)', () => {
    expect(() => UpdateAthleteGroupSchema.parse({})).not.toThrow();
  });

  it('accepts update with only name', () => {
    expect(() => UpdateAthleteGroupSchema.parse({ name: 'Nuevo nombre' })).not.toThrow();
  });

  it('accepts update with only description', () => {
    expect(() => UpdateAthleteGroupSchema.parse({ description: 'Nueva desc' })).not.toThrow();
  });

  it('accepts null description to clear it', () => {
    expect(() => UpdateAthleteGroupSchema.parse({ description: null })).not.toThrow();
  });

  it('rejects empty name', () => {
    const result = UpdateAthleteGroupSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.errors[0].message).toBe('El nombre es obligatorio');
  });

  it('rejects name longer than 100 characters', () => {
    expect(() => UpdateAthleteGroupSchema.parse({ name: 'x'.repeat(101) })).toThrow();
  });
});

// ── AthleteGroupSchema ────────────────────────────────────────────────────────

describe('AthleteGroupSchema', () => {
  it('parses a complete valid group', () => {
    expect(() => AthleteGroupSchema.parse({
      id: VALID_UUID, coachId: VALID_UUID, name: 'Grupo A',
      description: null, memberCount: 5, createdAt: NOW,
    })).not.toThrow();
  });

  it('defaults memberCount to 0 when not provided', () => {
    const result = AthleteGroupSchema.parse({
      id: VALID_UUID, coachId: VALID_UUID, name: 'Grupo B',
      description: null, createdAt: NOW,
    });
    expect(result.memberCount).toBe(0);
  });

  it('rejects negative memberCount', () => {
    expect(() => AthleteGroupSchema.parse({
      id: VALID_UUID, coachId: VALID_UUID, name: 'X',
      description: null, memberCount: -1, createdAt: NOW,
    })).toThrow();
  });
});
