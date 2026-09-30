import { getEnv } from "../src/get-env";

const KEY = "POSTGRES_USER" as const;
const ORIGINAL = process.env[KEY];

afterEach(() => {
  if (ORIGINAL === undefined) {
    delete process.env[KEY];
  } else {
    process.env[KEY] = ORIGINAL;
  }
});

test("returns the value when the variable is set", () => {
  process.env[KEY] = "test-value";
  expect(getEnv(KEY)).toBe("test-value");
});

test("warns and returns undefined when the variable is not set", () => {
  delete process.env[KEY];
  const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

  expect(getEnv(KEY)).toBeUndefined();
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toContain(KEY);

  warn.mockRestore();
});
