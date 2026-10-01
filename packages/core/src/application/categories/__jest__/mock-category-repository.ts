import { CategoriesTable, CategoryType } from "../../../domain";
import { CategoryRepository } from "../../ports";

export function createMockCategoryRepository(): jest.Mocked<CategoryRepository> {
  return {
    findById: jest.fn(),
    findByName: jest.fn(),
    listAll: jest.fn(),
    listArchived: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
  };
}

export function buildCategory(overrides: Partial<CategoriesTable> = {}): CategoriesTable {
  return {
    category_id: 1,
    name: "Groceries",
    type: CategoryType.EXPENSE,
    is_archived: false,
    ...overrides,
  };
}
