/** @type {import('jest').Config} */
module.exports = {
preset: 'ts-jest',
testEnvironment: 'node',
rootDir: 'src',
testRegex: '.*\\.spec\\.ts$',
extensionsToTreatAsEsm: ['.ts'],
transform: {
  '^.+\\.(t|j)s$': [
    'ts-jest',
    {
      tsconfig: '<rootDir>/../tsconfig.json',
      useESM: true,
    },
  ],
},
moduleNameMapper: {
  '^(\\.{1,2}/.*)\\.js$': '$1',
},
moduleFileExtensions: ['js', 'json', 'ts'],
collectCoverageFrom: ['**/*.(t|j)s'],
coverageDirectory: '../coverage',
};
