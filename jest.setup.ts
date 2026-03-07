/**
 * Jest setup — runs once per test suite before any tests.
 *
 * Mocks every native module that Jest can't execute in a Node environment.
 * Keep this file minimal: only add mocks that cause import errors.
 */

// ── expo-sqlite ───────────────────────────────────────────────────────────────
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
  })),
}));

// ── expo-crypto ───────────────────────────────────────────────────────────────
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
}));

// ── @react-native-community/netinfo ───────────────────────────────────────────
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
  addEventListener: jest.fn(() => jest.fn()),
}));

// ── @supabase/supabase-js ─────────────────────────────────────────────────────
// Tests that need Supabase mock their own repo — this prevents the client
// singleton from crashing on import when env vars are missing.
jest.mock('./src/infrastructure/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

// ── react-native-svg ──────────────────────────────────────────────────────────
jest.mock('react-native-svg', () => {
  const React = require('react');
  const mock = (name: string) => {
    const Comp = ({ children, ...props }: any) => React.createElement(name, props, children);
    Comp.displayName = name;
    return Comp;
  };
  return {
    __esModule: true,
    default: mock('Svg'),
    Svg: mock('Svg'),
    Circle: mock('Circle'),
    Path: mock('Path'),
    Line: mock('Line'),
    Rect: mock('Rect'),
    Text: mock('SvgText'),
    Defs: mock('Defs'),
    LinearGradient: mock('LinearGradient'),
    Stop: mock('Stop'),
  };
});

// ── Silence noisy console.warn in tests ───────────────────────────────────────
const originalWarn = console.warn.bind(console);
beforeAll(() => {
  console.warn = (msg: string, ...args: any[]) => {
    // Suppress known React Native + Expo test warnings
    if (
      typeof msg === 'string' &&
      (msg.includes('act(') ||
       msg.includes('ReactDOM.render') ||
       msg.includes('NativeWind'))
    ) return;
    originalWarn(msg, ...args);
  };
});
afterAll(() => {
  console.warn = originalWarn;
});
