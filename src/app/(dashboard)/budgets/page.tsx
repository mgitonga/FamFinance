import { getBudgetOverview } from "./actions";
import { BudgetsClient } from "./budgets-client";
import { format } from "date-fns";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams?: { month?: string; year?: string };
}) {
  const monthParam = searchParams?.month ? parseInt(searchParams.month, 10) : undefined;
  const yearParam = searchParams?.year ? parseInt(searchParams.year, 10) : undefined;

  const overview = await getBudgetOverview({
    month: monthParam,
    year: yearParam,
  });

  const currentLabel = format(
    new Date(overview.year, overview.month - 1, 1),
    "MMMM yyyy"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
        <p className="text-muted-foreground">
          Track category and overall budgets for {currentLabel}
        </p>
      </div>

      <BudgetsClient overview={overview} />
    </div>
  );
}
