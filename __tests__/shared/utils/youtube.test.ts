import { extractYouTubeVideoId, isValidYouTubeUrl } from '../../../src/shared/utils/youtube';

// ── extractYouTubeVideoId ─────────────────────────────────────────────────────

describe('extractYouTubeVideoId', () => {
  describe('URLs válidas', () => {
    it('extrae el ID de una URL estándar youtube.com/watch?v=', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=rT7DgCr-3pg')).toBe('rT7DgCr-3pg');
    });

    it('extrae el ID de una URL sin www.', () => {
      expect(extractYouTubeVideoId('https://youtube.com/watch?v=rT7DgCr-3pg')).toBe('rT7DgCr-3pg');
    });

    it('extrae el ID de una URL corta youtu.be/', () => {
      expect(extractYouTubeVideoId('https://youtu.be/rT7DgCr-3pg')).toBe('rT7DgCr-3pg');
    });

    it('extrae el ID de una URL de embed', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/embed/rT7DgCr-3pg')).toBe('rT7DgCr-3pg');
    });

    it('extrae el ID de una URL de Shorts', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/shorts/rT7DgCr-3pg')).toBe('rT7DgCr-3pg');
    });

    it('maneja IDs con guiones y guiones bajos', () => {
      expect(extractYouTubeVideoId('https://youtu.be/AB_cd-EFghi')).toBe('AB_cd-EFghi');
    });

    it('ignora parámetros adicionales en la URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=rT7DgCr-3pg&t=30s')).toBe('rT7DgCr-3pg');
    });
  });

  describe('URLs inválidas', () => {
    it('devuelve null para una URL de Vimeo', () => {
      expect(extractYouTubeVideoId('https://vimeo.com/123456789')).toBeNull();
    });

    it('devuelve null para una URL de dominio desconocido', () => {
      expect(extractYouTubeVideoId('https://example.com/video')).toBeNull();
    });

    it('devuelve null para una cadena vacía', () => {
      expect(extractYouTubeVideoId('')).toBeNull();
    });

    it('devuelve null para un texto sin URL', () => {
      expect(extractYouTubeVideoId('esto no es una url')).toBeNull();
    });

    it('devuelve null para una URL de YouTube sin ID', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch')).toBeNull();
    });
  });
});

// ── isValidYouTubeUrl ─────────────────────────────────────────────────────────

describe('isValidYouTubeUrl', () => {
  it('devuelve true para una URL válida de YouTube', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=rT7DgCr-3pg')).toBe(true);
  });

  it('devuelve true para una URL corta youtu.be', () => {
    expect(isValidYouTubeUrl('https://youtu.be/rT7DgCr-3pg')).toBe(true);
  });

  it('devuelve false para una URL de Vimeo', () => {
    expect(isValidYouTubeUrl('https://vimeo.com/123456789')).toBe(false);
  });

  it('devuelve false para una cadena vacía', () => {
    expect(isValidYouTubeUrl('')).toBe(false);
  });

  it('devuelve false para texto libre', () => {
    expect(isValidYouTubeUrl('bench press tutorial')).toBe(false);
  });
});
