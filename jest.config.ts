export default {
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@src/(.*)$": "<rootDir>/src/$1",
    "^@t/([^/]+)$": "<rootDir>/types/$1/index",
    "^@t/(.*)$": "<rootDir>/types/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
  },
  moduleFileExtensions: [
    "js",
    "mjs",
    "cjs",
    "jsx",
    "ts",
    "tsx",
    "json",
    "node",
    "d.ts",
  ],
};
