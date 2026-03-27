/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.ts',
    enableFindRelatedTests: true,
  },
  mutate: [
    'src/application/coach/VideoUseCases.ts',
    'src/domain/entities/Video.ts',
  ],
  coverageAnalysis: 'perTest',
  disableTypeChecks: '{src,__tests__}/**/*.ts',
  thresholds: {
    high: 80,
    low: 70,
    break: 70,
  },
  reporters: ['progress', 'clear-text'],
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
  concurrency: 4,
  timeoutMS: 30000,
  timeoutFactor: 1.5,
};
