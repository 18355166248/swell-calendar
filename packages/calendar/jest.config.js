export default {
  testEnvironment: 'jsdom',
  clearMocks: true,
  preset: 'ts-jest/presets/js-with-ts',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node', 'd.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css)$': '<rootDir>/src/test/cssFileMock.ts',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@stories/(.*)$': '<rootDir>/stories/$1',
  },
  transformIgnorePatterns: ['/node_modules/(?!(lodash-es)/)'],
  watchPathIgnorePatterns: ['<rootDir>/.storybook', '<rootDir>/.stories', '/node_modules/'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/playwright/'],
  setupFilesAfterEnv: [],
};
