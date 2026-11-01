export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
};

export type NewTransaction = Omit<Transaction, "id">;
