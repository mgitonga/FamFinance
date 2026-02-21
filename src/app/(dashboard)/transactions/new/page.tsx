import { getCategoriesFlat } from "../../settings/categories/actions";
import { getAccounts } from "../../settings/accounts/actions";
import { TransactionForm } from "../transaction-form";

export default async function NewTransactionPage() {
  const [categoriesResult, accountsResult] = await Promise.all([
    getCategoriesFlat(),
    getAccounts(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Transaction</h1>
        <p className="text-muted-foreground">
          Record a new income or expense
        </p>
      </div>

      <TransactionForm
        categories={categoriesResult.data || []}
        accounts={accountsResult.data || []}
      />
    </div>
  );
}
