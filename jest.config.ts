export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/?(*.)+(test).ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  verbose: true,
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.test.json",
        diagnostics: {
          ignoreCodes: [151002],
        },
      },
    ],
  },
};
