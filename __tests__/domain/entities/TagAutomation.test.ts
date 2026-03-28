/**
 * TagAutomation entity schema tests — RF-E2-06a
 */

import { SaveTagAutomationSchema, TagAutomationSchema } from '../../../src/domain/entities/TagAutomation';

const VALID_UUID = '00000000-0000-4000-b000-000000000001';
const NOW        = new Date();

// ── TagAutomationSchema ───────────────────────────────────────────────────────

describe('TagAutomationSchema', () => {
  it('parses a full valid automation', () => {
    expect(() => TagAutomationSchema.parse({
      id:              VALID_UUID,
      tagId:           VALID_UUID,
      routineId:       VALID_UUID,
      cardioId:        VALID_UUID,
      nutritionPlanId: VALID_UUID,
      createdAt:       NOW,
    })).not.toThrow();
  });

  it('accepts null for all optional content ids', () => {
    expect(() => TagAutomationSchema.parse({
      id:              VALID_UUID,
      tagId:           VALID_UUID,
      routineId:       null,
      cardioId:        null,
      nutritionPlanId: null,
      createdAt:       NOW,
    })).not.toThrow();
  });

  it('rejects invalid UUID for id', () => {
    expect(() => TagAutomationSchema.parse({
      id:        'not-a-uuid',
      tagId:     VALID_UUID,
      createdAt: NOW,
    })).toThrow();
  });

  it('rejects invalid UUID for tagId', () => {
    expect(() => TagAutomationSchema.parse({
      id:        VALID_UUID,
      tagId:     'not-a-uuid',
      createdAt: NOW,
    })).toThrow();
  });

  it('rejects invalid UUID for routineId', () => {
    expect(() => TagAutomationSchema.parse({
      id:        VALID_UUID,
      tagId:     VALID_UUID,
      routineId: 'not-a-uuid',
      createdAt: NOW,
    })).toThrow();
  });
});

// ── SaveTagAutomationSchema ───────────────────────────────────────────────────

describe('SaveTagAutomationSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    expect(() => SaveTagAutomationSchema.parse({})).not.toThrow();
  });

  it('accepts only routineId', () => {
    expect(() => SaveTagAutomationSchema.parse({ routineId: VALID_UUID })).not.toThrow();
  });

  it('accepts only cardioId', () => {
    expect(() => SaveTagAutomationSchema.parse({ cardioId: VALID_UUID })).not.toThrow();
  });

  it('accepts only nutritionPlanId', () => {
    expect(() => SaveTagAutomationSchema.parse({ nutritionPlanId: VALID_UUID })).not.toThrow();
  });

  it('accepts all three ids', () => {
    expect(() => SaveTagAutomationSchema.parse({
      routineId:       VALID_UUID,
      cardioId:        VALID_UUID,
      nutritionPlanId: VALID_UUID,
    })).not.toThrow();
  });

  it('accepts null to clear routineId', () => {
    expect(() => SaveTagAutomationSchema.parse({ routineId: null })).not.toThrow();
  });

  it('accepts null to clear cardioId', () => {
    expect(() => SaveTagAutomationSchema.parse({ cardioId: null })).not.toThrow();
  });

  it('accepts null to clear nutritionPlanId', () => {
    expect(() => SaveTagAutomationSchema.parse({ nutritionPlanId: null })).not.toThrow();
  });

  it('rejects invalid UUID for routineId', () => {
    expect(() => SaveTagAutomationSchema.parse({ routineId: 'bad-uuid' })).toThrow();
  });

  it('rejects invalid UUID for cardioId', () => {
    expect(() => SaveTagAutomationSchema.parse({ cardioId: 'bad-uuid' })).toThrow();
  });

  it('rejects invalid UUID for nutritionPlanId', () => {
    expect(() => SaveTagAutomationSchema.parse({ nutritionPlanId: 'bad-uuid' })).toThrow();
  });
});
