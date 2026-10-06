import { hasScope } from "../scope.js";

describe("hasScope", () => {
  it("app:edit satisfies both view and edit", () => {
    expect(hasScope(["app:edit"], "view")).toBe(true);
    expect(hasScope(["app:edit"], "edit")).toBe(true);
  });

  it("app:view satisfies only view", () => {
    expect(hasScope(["app:view"], "view")).toBe(true);
    expect(hasScope(["app:view"], "edit")).toBe(false);
  });

  it("empty scope satisfies neither", () => {
    expect(hasScope([], "view")).toBe(false);
    expect(hasScope([], "edit")).toBe(false);
  });

  it("unrelated permission strings alongside app:view don't grant edit", () => {
    expect(hasScope(["app:view", "storage.own"], "edit")).toBe(false);
  });
});
