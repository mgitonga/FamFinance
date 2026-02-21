"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKES } from "@/lib/currency";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  generateReport,
  exportToCSV,
  type ReportFilters,
  type ReportData,
} from "./actions";

interface ReportsClientProps {
  categories: { id: string; name: string; icon: string }[];
  accounts: { id: string; name: string; icon: string }[];
}

export function ReportsClient({ categories, accounts }: ReportsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    type: "all",
  });
  const [report, setReport] = useState<ReportData | null>(null);
  const [activeTab, setActiveTab] = useState<"transactions" | "categories" | "accounts">("transactions");

  // Load report on mount and filter change
  useEffect(() => {
    loadReport();
  }, []);

  function loadReport() {
    startTransition(async () => {
      const data = await generateReport(filters);
      setReport(data);
    });
  }

  function handleFilterChange(key: keyof ReportFilters, value: string) {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  }

  function applyFilters() {
    loadReport();
  }

  function setPreset(preset: "thisMonth" | "lastMonth" | "last3Months" | "last6Months") {
    const now = new Date();
    let startDate: Date;
    let endDate = endOfMonth(now);

    switch (preset) {
      case "thisMonth":
        startDate = startOfMonth(now);
        break;
      case "lastMonth":
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case "last3Months":
        startDate = startOfMonth(subMonths(now, 2));
        break;
      case "last6Months":
        startDate = startOfMonth(subMonths(now, 5));
        break;
    }

    setFilters(prev => ({
      ...prev,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    }));
  }

  async function handleExportCSV() {
    startTransition(async () => {
      const csv = await exportToCSV(filters);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `famfin-report-${filters.startDate}-to-${filters.endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select date range and filters for your report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Presets */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreset("thisMonth")}
            >
              This Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreset("lastMonth")}
            >
              Last Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreset("last3Months")}
            >
              Last 3 Months
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreset("last6Months")}
            >
              Last 6 Months
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.categoryId || ""}
                onChange={(e) => handleFilterChange("categoryId", e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <select
                id="account"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.accountId || ""}
                onChange={(e) => handleFilterChange("accountId", e.target.value)}
              >
                <option value="">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.icon} {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.type || "all"}
                onChange={(e) => handleFilterChange("type", e.target.value as "income" | "expense" | "all")}
              >
                <option value="all">All Types</option>
                <option value="income">Income Only</option>
                <option value="expense">Expenses Only</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={applyFilters} disabled={isPending}>
              {isPending ? "Loading..." : "Generate Report"}
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={isPending || !report}>
              📥 Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {report && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total Income</div>
              <div className="text-2xl font-bold text-success">
                {formatKES(report.totals.totalIncome)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total Expenses</div>
              <div className="text-2xl font-bold text-danger">
                {formatKES(report.totals.totalExpenses)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Net Savings</div>
              <div className={`text-2xl font-bold ${report.totals.netSavings >= 0 ? "text-success" : "text-danger"}`}>
                {formatKES(report.totals.netSavings)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Transactions</div>
              <div className="text-2xl font-bold">{report.totals.transactionCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Tabs */}
      {report && (
        <Card>
          <CardHeader>
            <div className="flex gap-4 border-b">
              <button
                className={`pb-2 text-sm font-medium ${activeTab === "transactions" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                onClick={() => setActiveTab("transactions")}
              >
                Transactions ({report.transactions.length})
              </button>
              <button
                className={`pb-2 text-sm font-medium ${activeTab === "categories" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                onClick={() => setActiveTab("categories")}
              >
                By Category ({report.categorySummary.length})
              </button>
              <button
                className={`pb-2 text-sm font-medium ${activeTab === "accounts" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                onClick={() => setActiveTab("accounts")}
              >
                By Account ({report.accountSummary.length})
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "transactions" && (
              <div className="overflow-x-auto">
                {report.transactions.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No transactions found for the selected filters.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium">Description</th>
                        <th className="pb-2 font-medium">Category</th>
                        <th className="pb-2 font-medium">Account</th>
                        <th className="pb-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.transactions.map((t) => (
                        <tr key={t.id} className="border-b">
                          <td className="py-2 text-muted-foreground">
                            {format(new Date(t.date), "dd/MM/yyyy")}
                          </td>
                          <td className="py-2">
                            <div>{t.description}</div>
                            {t.merchant && (
                              <div className="text-xs text-muted-foreground">{t.merchant}</div>
                            )}
                          </td>
                          <td className="py-2">
                            {t.category}
                            {t.subcategory && (
                              <span className="text-muted-foreground"> › {t.subcategory}</span>
                            )}
                          </td>
                          <td className="py-2 text-muted-foreground">{t.account}</td>
                          <td className={`py-2 text-right font-medium ${t.type === "income" ? "text-success" : "text-danger"}`}>
                            {t.type === "income" ? "+" : "-"}{formatKES(t.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === "categories" && (
              <div className="space-y-4">
                {report.categorySummary.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No category data found.
                  </p>
                ) : (
                  report.categorySummary.map((cat) => (
                    <div key={cat.categoryId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{cat.categoryIcon}</span>
                        <div>
                          <p className="font-medium">{cat.categoryName}</p>
                          <p className="text-sm text-muted-foreground">
                            {cat.transactionCount} transaction{cat.transactionCount !== 1 ? "s" : ""} • {cat.percentage}%
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold">{formatKES(cat.totalAmount)}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "accounts" && (
              <div className="space-y-4">
                {report.accountSummary.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No account data found.
                  </p>
                ) : (
                  report.accountSummary.map((acc) => (
                    <div key={acc.accountId} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{acc.accountIcon}</span>
                          <div>
                            <p className="font-medium">{acc.accountName}</p>
                            <p className="text-sm text-muted-foreground">
                              {acc.transactionCount} transaction{acc.transactionCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <span className={`font-semibold ${acc.netFlow >= 0 ? "text-success" : "text-danger"}`}>
                          {acc.netFlow >= 0 ? "+" : ""}{formatKES(acc.netFlow)}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Income:</span>{" "}
                          <span className="text-success">{formatKES(acc.totalIncome)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expenses:</span>{" "}
                          <span className="text-danger">{formatKES(acc.totalExpenses)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
