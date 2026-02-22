"use server";

import { createClient } from "@/lib/supabase/server";
import { endOfMonth, format } from "date-fns";
import { getBudgetStatus } from "@/lib/currency";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  error?: string;
  success?: boolean;
  data?: unknown;
};

export type BudgetCategorySummary = {
  id: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
  color: string | null;
  budgetAmount: number | null;
  spentAmount: number;
  percentUsed: number;
  status: "safe" | "warning" | "danger";
};

export type OverallBudgetSummary = {
  budgetAmount: number | null;
  spentAmount: number;
  percentUsed: number;
  remainingAmount: number | null;
  status: "safe" | "warning" | "danger";
};

export type BudgetOverview = {
  month: number;
  year: number;
  isAdmin: boolean;
  categories: BudgetCategorySummary[];
  overall: OverallBudgetSummary;
  copiedFromPrevious: boolean;
  overallCopiedFromPrevious: boolean;
};

function getTargetMonthYear(month?: number, year?: number) {
  const now = new Date();
  return {
    month: month ?? now.getMonth() + 1,
    year: year ?? now.getFullYear(),
  };
}

function getMonthRange(month: number, year: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = format(endOfMonth(new Date(year, month - 1, 1)), "yyyy-MM-dd");
  return { startDate, endDate };
}

function getPreviousMonth(month: number, year: number) {
  const previous = new Date(year, month - 2, 1);
  return { month: previous.getMonth() + 1, year: previous.getFullYear() };
}

async function getUserProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("users")
    .select("household_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) return { user: null, profile: null };
  return { user, profile };
}

async function copyBudgetsFromPreviousMonthInternal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  month: number,
  year: number
) {
  const previous = getPreviousMonth(month, year);

  const { data: previousBudgets } = await supabase
    .from("budgets")
    .select("category_id, amount")
    .eq("household_id", householdId)
    .eq("month", previous.month)
    .eq("year", previous.year);

  if (!previousBudgets || previousBudgets.length === 0) {
    return false;
  }

  const insertRows = previousBudgets.map((budget) => ({
    household_id: householdId,
    category_id: budget.category_id,
    amount: Number(budget.amount),
    month,
    year,
  }));

  const { error } = await supabase
    .from("budgets")
    .upsert(insertRows, { onConflict: "household_id,category_id,month,year" });

  return !error;
}

async function copyOverallBudgetFromPreviousMonthInternal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  month: number,
  year: number
) {
  const previous = getPreviousMonth(month, year);

  const { data: previousOverall } = await supabase
    .from("overall_budgets")
    .select("amount")
    .eq("household_id", householdId)
    .eq("month", previous.month)
    .eq("year", previous.year)
    .single();

  if (!previousOverall) {
    return false;
  }

  const { error } = await supabase
    .from("overall_budgets")
    .upsert(
      {
        household_id: householdId,
        amount: Number(previousOverall.amount),
        month,
        year,
      },
      { onConflict: "household_id,month,year" }
    );

  return !error;
}

export async function getBudgetOverview(params?: { month?: number; year?: number }): Promise<BudgetOverview> {
  const supabase = await createClient();
  const { month, year } = getTargetMonthYear(params?.month, params?.year);

  const { user, profile } = await getUserProfile(supabase);
  if (!user || !profile) {
    return {
      month,
      year,
      isAdmin: false,
      categories: [],
      overall: {
        budgetAmount: null,
        spentAmount: 0,
        percentUsed: 0,
        remainingAmount: null,
        status: "safe",
      },
      copiedFromPrevious: false,
      overallCopiedFromPrevious: false,
    };
  }

  const isAdmin = profile.role === "admin";

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, parent_id, icon, color, type, sort_order")
    .eq("household_id", profile.household_id)
    .eq("is_active", true)
    .in("type", ["expense", "both"])
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  let { data: budgets } = await supabase
    .from("budgets")
    .select("category_id, amount")
    .eq("household_id", profile.household_id)
    .eq("month", month)
    .eq("year", year);

  let copiedFromPrevious = false;

  if (isAdmin && (!budgets || budgets.length === 0)) {
    copiedFromPrevious = await copyBudgetsFromPreviousMonthInternal(
      supabase,
      profile.household_id,
      month,
      year
    );

    if (copiedFromPrevious) {
      const { data: refreshedBudgets } = await supabase
        .from("budgets")
        .select("category_id, amount")
        .eq("household_id", profile.household_id)
        .eq("month", month)
        .eq("year", year);

      budgets = refreshedBudgets || [];
    }
  }

  let { data: overallBudget } = await supabase
    .from("overall_budgets")
    .select("amount")
    .eq("household_id", profile.household_id)
    .eq("month", month)
    .eq("year", year)
    .single();

  let overallCopiedFromPrevious = false;

  if (isAdmin && !overallBudget) {
    overallCopiedFromPrevious = await copyOverallBudgetFromPreviousMonthInternal(
      supabase,
      profile.household_id,
      month,
      year
    );

    if (overallCopiedFromPrevious) {
      const { data: refreshedOverall } = await supabase
        .from("overall_budgets")
        .select("amount")
        .eq("household_id", profile.household_id)
        .eq("month", month)
        .eq("year", year)
        .single();

      overallBudget = refreshedOverall || null;
    }
  }

  const { startDate, endDate } = getMonthRange(month, year);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, category_id")
    .eq("household_id", profile.household_id)
    .eq("type", "expense")
    .gte("date", startDate)
    .lte("date", endDate);

  const spentByCategory = new Map<string, number>();
  let totalSpent = 0;

  (transactions || []).forEach((transaction) => {
    const amount = Number(transaction.amount);
    totalSpent += amount;
    const current = spentByCategory.get(transaction.category_id) || 0;
    spentByCategory.set(transaction.category_id, current + amount);
  });

  const budgetMap = new Map<string, number>();
  (budgets || []).forEach((budget) => {
    budgetMap.set(budget.category_id, Number(budget.amount));
  });

  const categorySummaries: BudgetCategorySummary[] = (categories || []).map((category) => {
    const budgetAmount = budgetMap.get(category.id) ?? null;
    const spentAmount = spentByCategory.get(category.id) || 0;
    const percentUsed = budgetAmount && budgetAmount > 0
      ? Math.min((spentAmount / budgetAmount) * 100, 200)
      : 0;

    const status = budgetAmount
      ? getBudgetStatus(spentAmount, budgetAmount)
      : "safe";

    return {
      id: category.id,
      name: category.name,
      parent_id: category.parent_id,
      icon: category.icon,
      color: category.color,
      budgetAmount,
      spentAmount,
      percentUsed,
      status,
    };
  });

  const parentCategories: BudgetCategorySummary[] = [];
  const childGroups = new Map<string, BudgetCategorySummary[]>();

  categorySummaries.forEach((category) => {
    if (category.parent_id) {
      const group = childGroups.get(category.parent_id) || [];
      group.push(category);
      childGroups.set(category.parent_id, group);
    } else {
      parentCategories.push(category);
    }
  });

  const orderedCategories: BudgetCategorySummary[] = [];
  parentCategories.forEach((parent) => {
    orderedCategories.push(parent);
    const children = childGroups.get(parent.id) || [];
    orderedCategories.push(...children);
  });

  const finalCategories = orderedCategories.length > 0
    ? orderedCategories
    : categorySummaries;


  const overallBudgetAmount = overallBudget ? Number(overallBudget.amount) : null;
  const overallPercent = overallBudgetAmount && overallBudgetAmount > 0
    ? Math.min((totalSpent / overallBudgetAmount) * 100, 200)
    : 0;

  const overallStatus = overallBudgetAmount
    ? getBudgetStatus(totalSpent, overallBudgetAmount)
    : "safe";

  const overallRemaining = overallBudgetAmount !== null
    ? Math.max(overallBudgetAmount - totalSpent, 0)
    : null;

  return {
    month,
    year,
    isAdmin,
    categories: finalCategories,
    overall: {
      budgetAmount: overallBudgetAmount,
      spentAmount: totalSpent,
      percentUsed: overallPercent,
      remainingAmount: overallRemaining,
      status: overallStatus,
    },
    copiedFromPrevious,
    overallCopiedFromPrevious,
  };
}

export async function setCategoryBudget(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile(supabase);
  if (!user || !profile) {
    return { error: "Not authenticated" };
  }

  if (profile.role !== "admin") {
    return { error: "Only admins can set budgets" };
  }

  const categoryId = formData.get("categoryId") as string;
  const amountValue = formData.get("amount") as string;
  const month = parseInt(formData.get("month") as string, 10);
  const year = parseInt(formData.get("year") as string, 10);

  const amount = Number(amountValue);

  if (!categoryId || !month || !year) {
    return { error: "Missing budget details" };
  }

  if (!amount || amount <= 0) {
    return { error: "Budget amount must be greater than 0" };
  }

  const { error } = await supabase
    .from("budgets")
    .upsert(
      {
        household_id: profile.household_id,
        category_id: categoryId,
        amount,
        month,
        year,
      },
      { onConflict: "household_id,category_id,month,year" }
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function setOverallBudget(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile(supabase);
  if (!user || !profile) {
    return { error: "Not authenticated" };
  }

  if (profile.role !== "admin") {
    return { error: "Only admins can set budgets" };
  }

  const amountValue = formData.get("amount") as string;
  const month = parseInt(formData.get("month") as string, 10);
  const year = parseInt(formData.get("year") as string, 10);

  const amount = Number(amountValue);

  if (!month || !year) {
    return { error: "Missing budget details" };
  }

  if (!amount || amount <= 0) {
    return { error: "Budget amount must be greater than 0" };
  }

  const { error } = await supabase
    .from("overall_budgets")
    .upsert(
      {
        household_id: profile.household_id,
        amount,
        month,
        year,
      },
      { onConflict: "household_id,month,year" }
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function copyBudgetsFromPreviousMonth(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile(supabase);
  if (!user || !profile) {
    return { error: "Not authenticated" };
  }

  if (profile.role !== "admin") {
    return { error: "Only admins can copy budgets" };
  }

  const month = parseInt(formData.get("month") as string, 10);
  const year = parseInt(formData.get("year") as string, 10);

  if (!month || !year) {
    return { error: "Missing budget details" };
  }

  const copied = await copyBudgetsFromPreviousMonthInternal(
    supabase,
    profile.household_id,
    month,
    year
  );

  const overallCopied = await copyOverallBudgetFromPreviousMonthInternal(
    supabase,
    profile.household_id,
    month,
    year
  );

  if (!copied && !overallCopied) {
    return { error: "No budgets found for previous month" };
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");

  return { success: true };
}
