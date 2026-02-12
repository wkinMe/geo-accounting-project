export default {
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@src/(.*)$": "<rootDir>/src/$1",
    "^@types/(.*)$": "<rootDir>/types/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
  },
};
