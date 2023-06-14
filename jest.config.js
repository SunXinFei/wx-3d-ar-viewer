// const { defaults } = require('jest-config');
module.exports = {
  roots: ['<rootDir>/src'],
  testTimeout: 15000, // timeout of a test in milliseconds.
  setupFiles: ['<rootDir>/src/setupTests.js'],
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'
  ],
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    // '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
    '[/\\\\]node_modules/minizip-asm.js[/\\\\].+\\.(js|jsx|ts|tsx)$',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  modulePaths: [],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/jest/mocks/fileMock.js',
    '^react-native$': 'react-native-web',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^lodash-es$': 'lodash',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: [
    'web.js',
    'js',
    'web.ts',
    'ts',
    'web.tsx',
    'tsx',
    'json',
    'web.jsx',
    'jsx',
    'node'
  ],
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './report',
        filename: 'jest-unit-report.html',
        hideIcon: true,
        expand: true,
        openReport: false
      }
    ]
  ]
};
