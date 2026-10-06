export type ScopeLevel = "view" | "edit";

/** "app:edit" satisfies both view and edit (edit implies view); "app:view" satisfies only view. */
export function hasScope(scope: string[], required: ScopeLevel): boolean {
  if (scope.includes("app:edit")) return true;
  if (required === "view") return scope.includes("app:view");
  return false;
}
