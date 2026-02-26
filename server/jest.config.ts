// server/jest.config.ts
export default {
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  roots: [
    "<rootDir>/src",
    "<rootDir>/tests",
    "<rootDir>/../packages/shared", // Добавляем shared в корни
  ],
  moduleNameMapper: {
    "^@src/(.*)$": "<rootDir>/src/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
    "^@shared/(.*)$": "<rootDir>/../packages/shared/$1", // Добавляем алиас для shared
    "^@t/([^/]+)$": "<rootDir>/types/$1/index",
    "^@t/(.*)$": "<rootDir>/types/$1",
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
  // Добавляем пути для трансформации
  transformIgnorePatterns: [
    "/node_modules/",
    // Не игнорируем shared пакет
    "!/node_modules/@shared",
  ],
};
