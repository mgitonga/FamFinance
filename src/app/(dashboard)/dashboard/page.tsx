import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKES } from "@/lib/currency";
import { format } from "date-fns";
import Link from "next/link";
import {
  getDashboardSummary,
  getSpendingByCategory,
  getMonthlyTrend,
  getRecentTransactions,
  getAccountBalances,
} from "./actions";
import { SpendingPieChart, TrendBarChart, TrendLegend } from "./charts";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const [summary, spending, trend, transactions, accounts] = await Promise.all([
    getDashboardSummary(),
    getSpendingByCategory(),
    getMonthlyTrend(),
    getRecentTransactions(5),
    getAccountBalances(),
  ]);

  const currentMonth = format(new Date(), "MMMM yyyy");
  const savingsRate = summary.totalIncome > 0 
    ? Math.round((summary.netSavings / summary.totalIncome) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}! 👋</h1>
        <p className="text-muted-foreground">
          Here&apos;s your financial overview for {currentMonth}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatKES(summary.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.incomeChange >= 0 ? "+" : ""}{summary.incomeChange}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <span className="text-2xl">💸</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">
              {formatKES(summary.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.expenseChange >= 0 ? "+" : ""}{summary.expenseChange}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netSavings >= 0 ? "text-success" : "text-danger"}`}>
              {summary.netSavings >= 0 ? "" : "-"}{formatKES(Math.abs(summary.netSavings))}
            </div>
            <p className="text-xs text-muted-foreground">
              {savingsRate}% savings rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <span className="text-2xl">🏦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatKES(summary.totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Spending by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>
              Where your money went this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SpendingPieChart data={spending} />
          </CardContent>
        </Card>

        {/* Income vs Expenses Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>
              Last 6 months trend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrendBarChart data={trend} />
            <TrendLegend />
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Account Balances */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Your latest activity
              </CardDescription>
            </div>
            <Link 
              href="/transactions" 
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No transactions yet.{" "}
                <Link href="/transactions/new" className="text-primary hover:underline">
                  Add one
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{t.categoryIcon}</span>
                      <div>
                        <p className="font-medium">{t.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {t.category} • {t.date}
                        </p>
                      </div>
                    </div>
                    <span className={t.type === "income" ? "font-semibold text-success" : "font-semibold text-danger"}>
                      {t.type === "income" ? "+" : "-"}{formatKES(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Balances */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Account Balances</CardTitle>
              <CardDescription>
                Your connected accounts
              </CardDescription>
            </div>
            <Link 
              href="/settings/accounts" 
              className="text-sm text-primary hover:underline"
            >
              Manage
            </Link>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No accounts yet.{" "}
                <Link href="/settings/accounts" className="text-primary hover:underline">
                  Add one
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{account.icon}</span>
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm capitalize text-muted-foreground">
                          {account.type.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${account.balance >= 0 ? "" : "text-danger"}`}>
                      {formatKES(account.balance)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/transactions/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              ➕ Add Transaction
            </Link>
            <Link
              href="/import"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              📥 Import CSV
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              📊 View Reports
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
