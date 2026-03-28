/**
 * Tests de la pantalla hub de librería — RF-E3-01a
 * Verifica la estructura y consistencia del catálogo de secciones.
 */

import { LIBRARY_CARDS } from '../../../app/(coach)/library/index';

describe('LIBRARY_CARDS', () => {
  it('contains exactly 5 sections', () => {
    expect(LIBRARY_CARDS).toHaveLength(5);
  });

  it('every card has a non-empty emoji, title and subtitle', () => {
    for (const card of LIBRARY_CARDS) {
      expect(card.emoji.length).toBeGreaterThan(0);
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.subtitle.length).toBeGreaterThan(0);
    }
  });

  it('every route starts with /(coach)/', () => {
    for (const card of LIBRARY_CARDS) {
      expect(card.route.startsWith('/(coach)/')).toBe(true);
    }
  });

  it('all routes are unique', () => {
    const routes = LIBRARY_CARDS.map((c) => c.route);
    const unique = new Set(routes);
    expect(unique.size).toBe(routes.length);
  });

  it('includes the routines section', () => {
    const card = LIBRARY_CARDS.find((c) => c.route === '/(coach)/routines');
    expect(card).toBeDefined();
  });

  it('includes the exercises section', () => {
    const card = LIBRARY_CARDS.find((c) => c.route === '/(coach)/exercises');
    expect(card).toBeDefined();
  });

  it('includes the cardios section', () => {
    const card = LIBRARY_CARDS.find((c) => c.route === '/(coach)/cardios');
    expect(card).toBeDefined();
  });

  it('includes the videos section', () => {
    const card = LIBRARY_CARDS.find((c) => c.route === '/(coach)/videos');
    expect(card).toBeDefined();
  });

  it('includes the nutrition section', () => {
    const card = LIBRARY_CARDS.find((c) => c.route === '/(coach)/nutrition');
    expect(card).toBeDefined();
  });
});
