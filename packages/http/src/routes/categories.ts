import { Router } from "express";
import {
  archiveCategory,
  createCategory,
  listArchivedCategories,
  listCategories,
  updateCategory,
  type CategoryRepository,
} from "@fms/core";
import { CategoryIdParams, CreateCategoryBody, UpdateCategoryBody } from "../dto/schemas.js";
import { requireHousehold } from "../middleware/require-household.js";
import { requireScope } from "../middleware/require-scope.js";

export function createCategoriesRouter(deps: { categoryRepo: CategoryRepository }): Router {
  const router = Router();
  router.use(requireHousehold);

  router.post("/", requireScope("edit"), async (req, res) => {
    const input = CreateCategoryBody.parse(req.body);
    const category = await createCategory(deps, { householdId: req.auth.hid!, ...input });
    res.status(201).json(category);
  });

  router.patch("/:categoryId", requireScope("edit"), async (req, res) => {
    const { categoryId } = CategoryIdParams.parse(req.params);
    const { name } = UpdateCategoryBody.parse(req.body);
    await updateCategory(deps, { categoryId, name });
    res.status(204).end();
  });

  router.post("/:categoryId/archive", requireScope("edit"), async (req, res) => {
    const { categoryId } = CategoryIdParams.parse(req.params);
    await archiveCategory(deps, categoryId);
    res.status(204).end();
  });

  router.get("/archived", requireScope("view"), async (req, res) => {
    res.json(await listArchivedCategories(deps, req.auth.hid!));
  });

  router.get("/", requireScope("view"), async (req, res) => {
    res.json(await listCategories(deps, req.auth.hid!));
  });

  return router;
}
