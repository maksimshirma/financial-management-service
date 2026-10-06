import { CategoriesTable, CategoryType } from "../../../domain/index.js";
import { CategoryRepository } from "../../ports/index.js";

export function createMockCategoryRepository(): jest.Mocked<CategoryRepository> {
  return {
    findById: jest.fn(),
    findByName: jest.fn(),
    listAllByHousehold: jest.fn(),
    listArchivedByHousehold: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
  };
}

export function buildCategory(overrides: Partial<CategoriesTable> = {}): CategoriesTable {
  return {
    category_id: 1,
    household_id: "h_demo",
    name: "Groceries",
    type: CategoryType.EXPENSE,
    is_archived: false,
    ...overrides,
  };
}
