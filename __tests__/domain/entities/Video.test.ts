/**
 * Video entity schema tests — RF-E5
 */

import { CreateVideoSchema, VideoSchema, UpdateVideoSchema } from '../../../src/domain/entities/Video';

const VALID_BASE = {
  coachId:     '00000000-0000-4000-b000-000000000001',
  title:       'Press de banca tutorial',
  url:         'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  tags:        ['fuerza'],
  description: 'Tutorial',
  visibleToClients: false,
};

// ── CreateVideoSchema — URL validation ────────────────────────────────────────

describe('CreateVideoSchema — URL validation', () => {
  it('accepts standard youtube.com watch URL', () => {
    expect(() => CreateVideoSchema.parse(VALID_BASE)).not.toThrow();
  });

  it('accepts youtu.be short URL', () => {
    expect(() => CreateVideoSchema.parse({
      ...VALID_BASE,
      url: 'https://youtu.be/dQw4w9WgXcQ',
    })).not.toThrow();
  });

  it('accepts http:// (non-https) YouTube URL', () => {
    expect(() => CreateVideoSchema.parse({
      ...VALID_BASE,
      url: 'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
    })).not.toThrow();
  });

  it('accepts youtube.com/embed/ URL', () => {
    expect(() => CreateVideoSchema.parse({
      ...VALID_BASE,
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    })).not.toThrow();
  });

  it('accepts youtube.com/shorts/ URL', () => {
    expect(() => CreateVideoSchema.parse({
      ...VALID_BASE,
      url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    })).not.toThrow();
  });

  it('rejects URL with content before https', () => {
    const result = CreateVideoSchema.safeParse({
      ...VALID_BASE,
      url: 'extra https://www.youtube.com/watch?v=abc',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('La URL debe ser de YouTube');
    }
  });

  it('rejects Vimeo URL', () => {
    const result = CreateVideoSchema.safeParse({
      ...VALID_BASE,
      url: 'https://vimeo.com/12345',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('La URL debe ser de YouTube');
    }
  });

  it('rejects empty URL', () => {
    expect(() => CreateVideoSchema.parse({ ...VALID_BASE, url: '' })).toThrow();
  });
});

// ── CreateVideoSchema — field validation ─────────────────────────────────────

describe('CreateVideoSchema — field validation', () => {
  it('rejects empty title with correct message', () => {
    const result = CreateVideoSchema.safeParse({ ...VALID_BASE, title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('El título es obligatorio');
    }
  });

  it('rejects invalid coachId UUID with correct message', () => {
    const result = CreateVideoSchema.safeParse({ ...VALID_BASE, coachId: 'not-a-uuid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid coach ID');
    }
  });

  it('defaults tags to empty array when omitted', () => {
    const { tags: _, ...withoutTags } = VALID_BASE;
    const result = CreateVideoSchema.parse(withoutTags);
    expect(result.tags).toEqual([]);
  });

  it('defaults visibleToClients to false when omitted', () => {
    const { visibleToClients: _, ...withoutVisibility } = VALID_BASE;
    const result = CreateVideoSchema.parse(withoutVisibility);
    expect(result.visibleToClients).toBe(false);
  });
});

// ── VideoSchema — structure ───────────────────────────────────────────────────

describe('VideoSchema — structure', () => {
  const FULL_VIDEO = {
    id:               '11111111-0000-4000-b000-000000000002',
    coachId:          '00000000-0000-4000-b000-000000000001',
    title:            'Tutorial',
    url:              'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    tags:             ['fuerza'],
    createdAt:        new Date(),
    visibleToClients: false,
  };

  it('parses a valid video object', () => {
    expect(() => VideoSchema.parse(FULL_VIDEO)).not.toThrow();
  });

  it('requires id field', () => {
    const { id: _, ...withoutId } = FULL_VIDEO;
    expect(() => VideoSchema.parse(withoutId)).toThrow();
  });

  it('requires createdAt field', () => {
    const { createdAt: _, ...withoutDate } = FULL_VIDEO;
    expect(() => VideoSchema.parse(withoutDate)).toThrow();
  });

  it('requires coachId field', () => {
    const { coachId: _, ...withoutCoach } = FULL_VIDEO;
    expect(() => VideoSchema.parse(withoutCoach)).toThrow();
  });
});

// ── UpdateVideoSchema ─────────────────────────────────────────────────────────

describe('UpdateVideoSchema — partial updates', () => {
  it('accepts empty object (no fields required)', () => {
    expect(() => UpdateVideoSchema.parse({})).not.toThrow();
  });

  it('accepts partial update with only title', () => {
    expect(() => UpdateVideoSchema.parse({ title: 'Nuevo título' })).not.toThrow();
  });

  it('accepts partial update with only url', () => {
    expect(() => UpdateVideoSchema.parse({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    })).not.toThrow();
  });

  it('accepts partial update with only tags', () => {
    expect(() => UpdateVideoSchema.parse({ tags: ['fuerza'] })).not.toThrow();
  });

  it('accepts partial update with only visibleToClients', () => {
    expect(() => UpdateVideoSchema.parse({ visibleToClients: true })).not.toThrow();
  });

  it('rejects empty title when title is provided', () => {
    const result = UpdateVideoSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('El título es obligatorio');
    }
  });

  it('rejects non-YouTube URL when url is provided', () => {
    const result = UpdateVideoSchema.safeParse({ url: 'https://vimeo.com/123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('La URL debe ser de YouTube');
    }
  });

  it('accepts all fields simultaneously', () => {
    expect(() => UpdateVideoSchema.parse({
      title:            'Actualizado',
      url:              'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      tags:             ['fuerza'],
      description:      'Nueva descripción',
      visibleToClients: true,
    })).not.toThrow();
  });
});
