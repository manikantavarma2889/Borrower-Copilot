/** Jest configuration for Borrower Copilot */
const tsJest = require('ts-jest');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    '^.+\\.[ts]x?$': ['ts-jest', {
      tsconfig: {
        strict: true,
        module: 'ESNext',
        target: 'ES2020',
      }
    }],
  },
  verbose: true,
}
