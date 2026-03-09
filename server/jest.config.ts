// server/jest.config.ts
export default {
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests", "<rootDir>/../packages/shared"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@src/(.*)$": "<rootDir>/src/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
    "^@shared/(.*)$": "<rootDir>/../packages/shared/$1",
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
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  transformIgnorePatterns: [
    "/node_modules/",
    // Не игнорируем shared пакет
    "!/node_modules/@shared",
  ],
};
