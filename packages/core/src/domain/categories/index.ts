export enum CategoryType {
  INCOME = "income",
  EXPENSE = "expense",
}

export interface CategoriesTable {
  category_id: number;
  name: string;
  type: CategoryType;
  is_archived: boolean;
}

export type NewCategory = Omit<CategoriesTable, "category_id">;
