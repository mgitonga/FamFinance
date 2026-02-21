import { Suspense } from "react";
import { getTransactions, type TransactionFilters } from "./actions";
import { getCategoriesFlat } from "../settings/categories/actions";
import { getAccounts } from "../settings/accounts/actions";
import { TransactionsClient } from "./transactions-client";

type SearchParams = {
  page?: string;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  accountId?: string;
  type?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  
  const filters: TransactionFilters = {
    page: params.page ? parseInt(params.page) : 1,
    startDate: params.startDate,
    endDate: params.endDate,
    categoryId: params.categoryId,
    accountId: params.accountId,
    type: params.type as "income" | "expense" | undefined,
    search: params.search,
    sortBy: (params.sortBy as "date" | "amount" | "category") || "date",
    sortOrder: (params.sortOrder as "asc" | "desc") || "desc",
  };

  const [transactionsResult, categoriesResult, accountsResult] = await Promise.all([
    getTransactions(filters),
    getCategoriesFlat(),
    getAccounts(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            View and manage all your income and expenses
          </p>
        </div>
      </div>

      {transactionsResult.error && (
        <div className="rounded-md bg-danger/10 p-4 text-sm text-danger">
          {transactionsResult.error}
        </div>
      )}

      <Suspense fallback={<div>Loading...</div>}>
        <TransactionsClient
          initialTransactions={transactionsResult.data || []}
          totalTransactions={transactionsResult.total || 0}
          currentPage={transactionsResult.page || 1}
          totalPages={transactionsResult.totalPages || 1}
          categories={categoriesResult.data || []}
          accounts={accountsResult.data || []}
          currentFilters={filters}
        />
      </Suspense>
    </div>
  );
}
