import { getReportCategories, getReportAccounts } from "./actions";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
  const [categories, accounts] = await Promise.all([
    getReportCategories(),
    getReportAccounts(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate and export financial reports
        </p>
      </div>

      <ReportsClient categories={categories} accounts={accounts} />
    </div>
  );
}
