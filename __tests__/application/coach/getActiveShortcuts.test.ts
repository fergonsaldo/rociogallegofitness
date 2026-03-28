import {
  getActiveShortcuts,
  QUICK_ACCESS_CATALOG,
  DEFAULT_QUICK_ACCESS,
} from '../../../src/shared/constants/quickAccessCatalog';

describe('getActiveShortcuts', () => {
  it('returns only items whose key is in the selected array', () => {
    const result = getActiveShortcuts(['clients', 'nutrition']);
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.key)).toEqual(['clients', 'nutrition']);
  });

  it('preserves catalog order regardless of selected order', () => {
    const result = getActiveShortcuts(['nutrition', 'clients']);
    expect(result[0].key).toBe('clients');
    expect(result[1].key).toBe('nutrition');
  });

  it('returns empty array when selected is empty', () => {
    expect(getActiveShortcuts([])).toEqual([]);
  });

  it('ignores unknown keys silently', () => {
    const result = getActiveShortcuts(['clients', 'unknown_key']);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('clients');
  });

  it('returns all catalog items when all keys are selected', () => {
    const allKeys = QUICK_ACCESS_CATALOG.map((i) => i.key);
    expect(getActiveShortcuts(allKeys)).toHaveLength(QUICK_ACCESS_CATALOG.length);
  });

  it('DEFAULT_QUICK_ACCESS returns the expected 3 default shortcuts', () => {
    const result = getActiveShortcuts(DEFAULT_QUICK_ACCESS);
    expect(result).toHaveLength(3);
    expect(result.map((i) => i.key)).toEqual(expect.arrayContaining(['clients', 'routines', 'nutrition']));
  });

  it('each returned item has all required fields', () => {
    const result = getActiveShortcuts(['clients']);
    const item = result[0];
    expect(item).toHaveProperty('key');
    expect(item).toHaveProperty('emoji');
    expect(item).toHaveProperty('label');
    expect(item).toHaveProperty('route');
    expect(item).toHaveProperty('color');
    expect(item).toHaveProperty('subtle');
  });
});
