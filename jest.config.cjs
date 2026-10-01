const swcTransform = [
  "@swc/jest",
  {
    jsc: { target: "es2022", parser: { syntax: "typescript" } },
    module: { type: "commonjs" },
  },
];

// Source now uses NodeNext-style explicit ".js" specifiers (e.g. `from "./x.js"`)
// even though the files on disk are still ".ts" — swc transpiles the import to a
// require() call but leaves the specifier text untouched, so Jest must strip the
// ".js" back off before resolving against the real ".ts" file.
const stripJsExtension = { "^(\\.{1,2}/.*)\\.js$": "$1" };

module.exports = {
  // integration suites share one Postgres database (finances_test) and
  // truncate it in beforeEach — running test files in parallel workers would
  // let one file's truncate wipe rows another file is mid-test with.
  maxWorkers: 1,
  projects: [
    {
      displayName: "@fms/core",
      rootDir: "<rootDir>/packages/core",
      testEnvironment: "node",
      testMatch: ["<rootDir>/src/**/__jest__/**/*.test.ts"],
      transform: { "^.+\\.(t|j)s$": swcTransform },
      moduleNameMapper: stripJsExtension,
    },
    {
      displayName: "@fms/config",
      rootDir: "<rootDir>/packages/config",
      testEnvironment: "node",
      testMatch: ["<rootDir>/__jest__/**/*.test.ts"],
      transform: { "^.+\\.(t|j)s$": swcTransform },
      moduleNameMapper: stripJsExtension,
    },
    {
      displayName: "@fms/db",
      rootDir: "<rootDir>/packages/db",
      testEnvironment: "node",
      testMatch: ["<rootDir>/__jest__/**/*.test.ts"],
      transform: { "^.+\\.(t|j)s$": swcTransform },
      moduleNameMapper: stripJsExtension,
      // pnpm nests real packages under node_modules/.pnpm/<pkg>@<version>/node_modules/<pkg>,
      // so a plain "node_modules/(?!kysely)" never matches the .pnpm layer.
      transformIgnorePatterns: ["node_modules/\\.pnpm/(?!(kysely@))"],
      globalSetup: "<rootDir>/__jest__/integration/global-setup.ts",
    },
  ],
};
