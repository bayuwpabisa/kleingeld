export type Budget = {
  id: string;
  category: string;
  limit: number;
  spent: number;
};

export type NewBudget = Omit<Budget, "id">;
