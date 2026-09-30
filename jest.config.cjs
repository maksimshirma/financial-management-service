const swcTransform = [
  "@swc/jest",
  {
    jsc: { target: "es2022", parser: { syntax: "typescript" } },
    module: { type: "commonjs" },
  },
];

module.exports = {
  // integration suites share one Postgres database (finances_test) and
  // truncate it in beforeEach — running test files in parallel workers would
  // let one file's truncate wipe rows another file is mid-test with.
  maxWorkers: 1,
  projects: [
    {
      displayName: "@fms/db",
      rootDir: "<rootDir>/packages/db",
      testEnvironment: "node",
      testMatch: ["<rootDir>/__jest__/**/*.test.ts"],
      transform: { "^.+\\.(t|j)s$": swcTransform },
      // pnpm nests real packages under node_modules/.pnpm/<pkg>@<version>/node_modules/<pkg>,
      // so a plain "node_modules/(?!kysely)" never matches the .pnpm layer.
      transformIgnorePatterns: ["node_modules/\\.pnpm/(?!(kysely@))"],
      globalSetup: "<rootDir>/__jest__/integration/global-setup.ts",
    },
  ],
};
