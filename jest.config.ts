import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-expo',

  extensionsToTreatAsEsm: ['.ts', '.tsx'],

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

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  testMatch: ['**/__tests__/**/*.test.ts?(x)'],

  // Coverage config — excluye ficheros de configuración/infraestructura sin lógica
  collectCoverageFrom: [
    'src/domain/**/*.ts',
    'src/application/**/*.ts',
    'src/infrastructure/**/*.ts',
    '!src/**/*.d.ts',
    '!src/infrastructure/supabase/database.types.ts',
    '!src/infrastructure/supabase/client.ts',
    '!src/infrastructure/database/client.ts',
    '!src/infrastructure/database/schema.ts',
  ],
  coverageThresholds: {
    global: {
      branches:   95,
      functions:  95,
      lines:      95,
      statements: 95,
    },
  },
};

export default config;
