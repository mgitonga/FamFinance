"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addMonths, format, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatKES, getBudgetStatusBgColor, getBudgetStatusColor } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { BudgetOverview, BudgetCategorySummary } from "./actions";
import {
  copyBudgetsFromPreviousMonth,
  setCategoryBudget,
  setOverallBudget,
} from "./actions";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react";

const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function BudgetDonut({
  spentAmount,
  budgetAmount,
}: {
  spentAmount: number;
  budgetAmount: number | null;
}) {
  if (!budgetAmount || budgetAmount <= 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        Set an overall budget to see progress
      </div>
    );
  }

  const remaining = Math.max(budgetAmount - spentAmount, 0);
  const data = [
    { name: "Spent", value: spentAmount },
    { name: "Remaining", value: remaining },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          innerRadius={60}
          outerRadius={90}
          dataKey="value"
          stroke="transparent"
        >
          <Cell fill="#EF4444" />
          <Cell fill="#22C55E" />
        </Pie>
        <Tooltip
          formatter={(value: number) => formatKES(value)}
          contentStyle={{ borderRadius: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function BudgetRow({
  category,
  month,
  year,
  isAdmin,
  onSave,
  savingId,
}: {
  category: BudgetCategorySummary;
  month: number;
  year: number;
  isAdmin: boolean;
  onSave: (formData: FormData, categoryId: string) => Promise<void>;
  savingId: string | null;
}) {
  const progressWidth = Math.min(category.percentUsed, 100);
  const statusColor = getBudgetStatusBgColor(category.status);
  const textColor = getBudgetStatusColor(category.status);
  const isSaving = savingId === category.id;

  return (
    <div className={cn("grid gap-3 border-b px-4 py-4", category.parent_id ? "pl-10" : "")}> 
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xl">{category.icon || ""}</span>
          <div>
            <p className="font-medium">{category.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatKES(category.spentAmount)} spent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <form
              action={async (formData) => onSave(formData, category.id)}
              className="flex items-center gap-2"
            >
              <input type="hidden" name="categoryId" value={category.id} />
              <input type="hidden" name="month" value={month} />
              <input type="hidden" name="year" value={year} />
              <Input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Set budget"
                defaultValue={category.budgetAmount ?? ""}
                className="w-32"
              />
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? "Saving" : "Save"}
              </Button>
            </form>
          ) : (
            <div className="text-right">
              <p className="text-sm font-medium">
                {category.budgetAmount ? formatKES(category.budgetAmount) : "No budget"}
              </p>
              <p className={cn("text-xs", textColor)}>
                {category.budgetAmount ? `${category.percentUsed.toFixed(0)}% used` : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {category.budgetAmount ? formatKES(category.budgetAmount) : "Set a budget"}
          </span>
          <span className={cn("font-medium", textColor)}>
            {category.budgetAmount ? `${category.percentUsed.toFixed(0)}%` : ""}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className={cn("h-2 rounded-full", statusColor)}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function BudgetsClient({ overview }: { overview: BudgetOverview }) {
  const router = useRouter();
  const [overallError, setOverallError] = useState("");
  const [overallSaving, setOverallSaving] = useState(false);
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState("");
  const [copySaving, setCopySaving] = useState(false);

  const currentDate = useMemo(
    () => new Date(overview.year, overview.month - 1, 1),
    [overview.month, overview.year]
  );

  const handleMonthChange = (month: number, year: number) => {
    router.push(`/budgets?month=${month}&year=${year}`);
  };

  const handlePrevMonth = () => {
    const prev = subMonths(currentDate, 1);
    handleMonthChange(prev.getMonth() + 1, prev.getFullYear());
  };

  const handleNextMonth = () => {
    const next = addMonths(currentDate, 1);
    handleMonthChange(next.getMonth() + 1, next.getFullYear());
  };

  const handleOverallSubmit = async (formData: FormData) => {
    setOverallError("");
    setOverallSaving(true);
    formData.set("month", overview.month.toString());
    formData.set("year", overview.year.toString());

    try {
      const result = await setOverallBudget(formData);
      if (result.error) {
        setOverallError(result.error);
      } else {
        router.refresh();
      }
    } finally {
      setOverallSaving(false);
    }
  };

  const handleCategorySubmit = async (formData: FormData, categoryId: string) => {
    setSavingCategoryId(categoryId);
    formData.set("month", overview.month.toString());
    formData.set("year", overview.year.toString());

    try {
      const result = await setCategoryBudget(formData);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } finally {
      setSavingCategoryId(null);
    }
  };

  const handleCopyBudgets = async () => {
    setCopyError("");
    setCopySaving(true);

    const formData = new FormData();
    formData.set("month", overview.month.toString());
    formData.set("year", overview.year.toString());

    try {
      const result = await copyBudgetsFromPreviousMonth(formData);
      if (result.error) {
        setCopyError(result.error);
      } else {
        router.refresh();
      }
    } finally {
      setCopySaving(false);
    }
  };

  const overallStatusClass = getBudgetStatusColor(overview.overall.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-lg font-semibold">
              {format(currentDate, "MMMM yyyy")}
            </p>
            <p className="text-xs text-muted-foreground">Budget period</p>
          </div>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={overview.month}
            onChange={(event) =>
              handleMonthChange(
                parseInt(event.target.value, 10),
                overview.year
              )
            }
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {MONTH_OPTIONS.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={overview.year}
            onChange={(event) =>
              handleMonthChange(
                overview.month,
                parseInt(event.target.value, 10)
              )
            }
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {Array.from({ length: 6 }).map((_, idx) => {
              const year = new Date().getFullYear() - 2 + idx;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
          {overview.isAdmin && (
            <Button
              variant="outline"
              onClick={handleCopyBudgets}
              disabled={copySaving}
            >
              <Copy className="mr-2 h-4 w-4" />
              {copySaving ? "Copying" : "Copy last month"}
            </Button>
          )}
        </div>
      </div>

      {(overview.copiedFromPrevious || overview.overallCopiedFromPrevious) && (
        <Card>
          <CardContent className="py-3 text-sm text-muted-foreground">
            Budgets were copied from the previous month to get you started.
          </CardContent>
        </Card>
      )}

      {copyError && (
        <Card>
          <CardContent className="py-3 text-sm text-danger">
            {copyError}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Overall Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
              <div className="flex flex-col justify-center">
                <div className="text-3xl font-bold">
                  {formatKES(overview.overall.spentAmount)}
                </div>
                <p className="text-sm text-muted-foreground">
                  spent this month
                </p>
                <p className={cn("text-sm font-medium", overallStatusClass)}>
                  {overview.overall.budgetAmount
                    ? `${overview.overall.percentUsed.toFixed(0)}% of budget used`
                    : "No overall budget set"}
                </p>
                {overview.overall.budgetAmount && (
                  <p className="text-xs text-muted-foreground">
                    {formatKES(overview.overall.remainingAmount || 0)} remaining
                  </p>
                )}
              </div>
              <BudgetDonut
                spentAmount={overview.overall.spentAmount}
                budgetAmount={overview.overall.budgetAmount}
              />
            </div>

            {overview.isAdmin && (
              <form action={handleOverallSubmit} className="flex flex-wrap gap-2">
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Set overall budget"
                  defaultValue={overview.overall.budgetAmount ?? ""}
                  className="w-48"
                />
                <Button type="submit" disabled={overallSaving}>
                  {overallSaving ? "Saving" : "Save overall budget"}
                </Button>
                {overallError && (
                  <span className="text-sm text-danger">{overallError}</span>
                )}
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Under 70%</span>
              <span className="font-medium text-success">Safe</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">70% - 90%</span>
              <span className="font-medium text-warning">Warning</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Over 90%</span>
              <span className="font-medium text-danger">At risk</span>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              Alerts trigger at 80% and 100% spend thresholds.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Category Budgets</CardTitle>
          <span className="text-sm text-muted-foreground">
            {overview.categories.length} categories
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {overview.categories.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              No categories found. Add categories to start budgeting.
            </div>
          ) : (
            <div>
              {overview.categories.map((category) => (
                <BudgetRow
                  key={category.id}
                  category={category}
                  month={overview.month}
                  year={overview.year}
                  isAdmin={overview.isAdmin}
                  onSave={handleCategorySubmit}
                  savingId={savingCategoryId}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
