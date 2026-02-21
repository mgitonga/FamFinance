"use server";

import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";

export interface ReportFilters {
  startDate: string;
  endDate: string;
  categoryId?: string;
  accountId?: string;
  type?: "income" | "expense" | "all";
}

export interface TransactionReport {
  id: string;
  date: string;
  description: string;
  merchant: string | null;
  category: string;
  subcategory: string | null;
  account: string;
  type: "income" | "expense";
  amount: number;
  notes: string | null;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface AccountSummary {
  accountId: string;
  accountName: string;
  accountIcon: string;
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  transactionCount: number;
}

export interface MonthlyReport {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  topCategories: { name: string; amount: number }[];
}

export interface ReportData {
  transactions: TransactionReport[];
  categorySummary: CategorySummary[];
  accountSummary: AccountSummary[];
  totals: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    transactionCount: number;
  };
}

/**
 * Generate report data based on filters
 */
export async function generateReport(filters: ReportFilters): Promise<ReportData> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      transactions: [],
      categorySummary: [],
      accountSummary: [],
      totals: { totalIncome: 0, totalExpenses: 0, netSavings: 0, transactionCount: 0 },
    };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return {
      transactions: [],
      categorySummary: [],
      accountSummary: [],
      totals: { totalIncome: 0, totalExpenses: 0, netSavings: 0, transactionCount: 0 },
    };
  }

  // Build query
  let query = supabase
    .from("transactions")
    .select(`
      id,
      date,
      description,
      merchant,
      amount,
      type,
      notes,
      categories!inner (
        id,
        name,
        icon,
        parent_id,
        parent:categories!parent_id (name)
      ),
      accounts!inner (
        id,
        name,
        icon
      )
    `)
    .eq("household_id", profile.household_id)
    .gte("date", filters.startDate)
    .lte("date", filters.endDate)
    .order("date", { ascending: false });

  if (filters.categoryId) {
    query = query.or(`category_id.eq.${filters.categoryId},categories.parent_id.eq.${filters.categoryId}`);
  }

  if (filters.accountId) {
    query = query.eq("account_id", filters.accountId);
  }

  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  const { data: transactions, error } = await query;

  if (error || !transactions) {
    console.error("Report query error:", error);
    return {
      transactions: [],
      categorySummary: [],
      accountSummary: [],
      totals: { totalIncome: 0, totalExpenses: 0, netSavings: 0, transactionCount: 0 },
    };
  }

  // Transform transactions
  const reportTransactions: TransactionReport[] = transactions.map((t) => {
    const cat = t.categories as unknown as { id: string; name: string; icon: string; parent_id: string | null; parent: { name: string } | null };
    const acc = t.accounts as unknown as { id: string; name: string; icon: string };
    
    return {
      id: t.id,
      date: t.date,
      description: t.description || "",
      merchant: t.merchant,
      category: cat.parent ? cat.parent.name : cat.name,
      subcategory: cat.parent ? cat.name : null,
      account: acc.name,
      type: t.type as "income" | "expense",
      amount: Number(t.amount),
      notes: t.notes,
    };
  });

  // Calculate category summary
  const categoryMap = new Map<string, { name: string; icon: string; amount: number; count: number }>();
  
  for (const t of transactions) {
    const cat = t.categories as unknown as { id: string; name: string; icon: string; parent_id: string | null };
    const key = cat.parent_id || cat.id;
    
    const existing = categoryMap.get(key);
    if (existing) {
      existing.amount += Number(t.amount);
      existing.count += 1;
    } else {
      categoryMap.set(key, {
        name: cat.name,
        icon: cat.icon || "📦",
        amount: Number(t.amount),
        count: 1,
      });
    }
  }

  const totalCategoryAmount = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.amount, 0);
  
  const categorySummary: CategorySummary[] = Array.from(categoryMap.entries())
    .map(([id, data]) => ({
      categoryId: id,
      categoryName: data.name,
      categoryIcon: data.icon,
      totalAmount: data.amount,
      transactionCount: data.count,
      percentage: totalCategoryAmount > 0 ? Math.round((data.amount / totalCategoryAmount) * 100) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Calculate account summary
  const accountMap = new Map<string, { name: string; icon: string; income: number; expenses: number; count: number }>();
  
  for (const t of transactions) {
    const acc = t.accounts as unknown as { id: string; name: string; icon: string };
    
    const existing = accountMap.get(acc.id);
    const amount = Number(t.amount);
    
    if (existing) {
      if (t.type === "income") {
        existing.income += amount;
      } else {
        existing.expenses += amount;
      }
      existing.count += 1;
    } else {
      accountMap.set(acc.id, {
        name: acc.name,
        icon: acc.icon || "💳",
        income: t.type === "income" ? amount : 0,
        expenses: t.type === "expense" ? amount : 0,
        count: 1,
      });
    }
  }

  const accountSummary: AccountSummary[] = Array.from(accountMap.entries())
    .map(([id, data]) => ({
      accountId: id,
      accountName: data.name,
      accountIcon: data.icon,
      totalIncome: data.income,
      totalExpenses: data.expenses,
      netFlow: data.income - data.expenses,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.transactionCount - a.transactionCount);

  // Calculate totals
  const totalIncome = reportTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = reportTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    transactions: reportTransactions,
    categorySummary,
    accountSummary,
    totals: {
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      transactionCount: reportTransactions.length,
    },
  };
}

/**
 * Export transactions to CSV format
 */
export async function exportToCSV(filters: ReportFilters): Promise<string> {
  const report = await generateReport(filters);
  
  const headers = [
    "Date",
    "Description",
    "Merchant",
    "Category",
    "Subcategory",
    "Account",
    "Type",
    "Amount",
    "Notes",
  ];

  const rows = report.transactions.map(t => [
    format(parseISO(t.date), "dd/MM/yyyy"),
    `"${(t.description || "").replace(/"/g, '""')}"`,
    `"${(t.merchant || "").replace(/"/g, '""')}"`,
    `"${t.category}"`,
    `"${t.subcategory || ""}"`,
    `"${t.account}"`,
    t.type,
    t.amount.toFixed(2),
    `"${(t.notes || "").replace(/"/g, '""')}"`,
  ]);

  // Add summary rows
  rows.push([]);
  rows.push(["SUMMARY"]);
  rows.push(["Total Income", "", "", "", "", "", "income", report.totals.totalIncome.toFixed(2)]);
  rows.push(["Total Expenses", "", "", "", "", "", "expense", report.totals.totalExpenses.toFixed(2)]);
  rows.push(["Net Savings", "", "", "", "", "", "", report.totals.netSavings.toFixed(2)]);

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

/**
 * Get available categories for filter dropdown
 */
export async function getReportCategories(): Promise<{ id: string; name: string; icon: string }[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile) return [];

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, icon")
    .eq("household_id", profile.household_id)
    .is("parent_id", null)
    .order("sort_order");

  return categories || [];
}

/**
 * Get available accounts for filter dropdown
 */
export async function getReportAccounts(): Promise<{ id: string; name: string; icon: string }[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile) return [];

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, icon")
    .eq("household_id", profile.household_id)
    .eq("is_active", true)
    .order("sort_order");

  return accounts || [];
}
