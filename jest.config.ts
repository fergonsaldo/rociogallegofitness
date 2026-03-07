import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-expo',

  // Treat TS/TSX as ESM so imports resolve correctly
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Transform everything except native modules that ship pre-compiled CJS
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '(jest-)?react-native' +
      '|@react-native(-community)?' +
      '|expo(nent)?' +
      '|@expo(nent)?/.*' +
      '|@expo-google-fonts/.*' +
      '|react-navigation' +
      '|@react-navigation/.*' +
      '|@unimodules/.*' +
      '|unimodules' +
      '|sentry-expo' +
      '|native-base' +
      '|react-native-svg' +
      '|drizzle-orm' +
      '|@supabase/.*' +
    '))',
  ],

  // Path alias matching tsconfig
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Global mocks run before each test file
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Only pick up files inside __tests__
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],

  // Coverage config
  collectCoverageFrom: [
    'src/domain/**/*.ts',
    'src/application/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default config;
