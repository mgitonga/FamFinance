import { notFound } from "next/navigation";
import { getTransactionById } from "../../actions";
import { getCategoriesFlat } from "../../../settings/categories/actions";
import { getAccounts } from "../../../settings/accounts/actions";
import { TransactionForm } from "../../transaction-form";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const [transactionResult, categoriesResult, accountsResult] = await Promise.all([
    getTransactionById(id),
    getCategoriesFlat(),
    getAccounts(),
  ]);

  if (transactionResult.error || !transactionResult.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Transaction</h1>
        <p className="text-muted-foreground">
          Update transaction details
        </p>
      </div>

      <TransactionForm
        transaction={transactionResult.data}
        categories={categoriesResult.data || []}
        accounts={accountsResult.data || []}
      />
    </div>
  );
}
