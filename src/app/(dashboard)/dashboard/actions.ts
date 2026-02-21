"use server";

import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  totalBalance: number;
  incomeChange: number;
  expenseChange: number;
}

export interface CategorySpending {
  name: string;
  amount: number;
  color: string;
  icon: string;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}

export interface RecentTransaction {
  id: string;
  description: string;
  category: string;
  categoryIcon: string;
  amount: number;
  type: "income" | "expense";
  date: string;
}

export interface AccountBalance {
  id: string;
  name: string;
  type: string;
  balance: number;
  icon: string;
}

/**
 * Get dashboard summary for current month
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netSavings: 0,
      totalBalance: 0,
      incomeChange: 0,
      expenseChange: 0,
    };
  }

  // Get user's household
  const { data: profile } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netSavings: 0,
      totalBalance: 0,
      incomeChange: 0,
      expenseChange: 0,
    };
  }

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // Current month totals
  const { data: currentMonthData } = await supabase
    .from("transactions")
    .select("amount, type")
    .eq("household_id", profile.household_id)
    .gte("date", format(currentMonthStart, "yyyy-MM-dd"))
    .lte("date", format(currentMonthEnd, "yyyy-MM-dd"));

  // Last month totals for comparison
  const { data: lastMonthData } = await supabase
    .from("transactions")
    .select("amount, type")
    .eq("household_id", profile.household_id)
    .gte("date", format(lastMonthStart, "yyyy-MM-dd"))
    .lte("date", format(lastMonthEnd, "yyyy-MM-dd"));

  // Total account balances
  const { data: accounts } = await supabase
    .from("accounts")
    .select("balance")
    .eq("household_id", profile.household_id)
    .eq("is_active", true);

  // Calculate current month totals
  const currentIncome = (currentMonthData || [])
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const currentExpenses = (currentMonthData || [])
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Calculate last month totals
  const lastIncome = (lastMonthData || [])
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const lastExpenses = (lastMonthData || [])
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Calculate total balance
  const totalBalance = (accounts || []).reduce((sum, a) => sum + Number(a.balance), 0);

  // Calculate percentage change
  const incomeChange = lastIncome > 0 
    ? ((currentIncome - lastIncome) / lastIncome) * 100 
    : currentIncome > 0 ? 100 : 0;
  
  const expenseChange = lastExpenses > 0 
    ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 
    : currentExpenses > 0 ? 100 : 0;

  return {
    totalIncome: currentIncome,
    totalExpenses: currentExpenses,
    netSavings: currentIncome - currentExpenses,
    totalBalance,
    incomeChange: Math.round(incomeChange),
    expenseChange: Math.round(expenseChange),
  };
}

/**
 * Get spending by category for current month
 */
export async function getSpendingByCategory(): Promise<CategorySpending[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile) return [];

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Get expense transactions with categories
  const { data: transactions } = await supabase
    .from("transactions")
    .select(`
      amount,
      categories (
        id,
        name,
        icon,
        color,
        parent_id
      )
    `)
    .eq("household_id", profile.household_id)
    .eq("type", "expense")
    .gte("date", format(monthStart, "yyyy-MM-dd"))
    .lte("date", format(monthEnd, "yyyy-MM-dd"));

  if (!transactions || transactions.length === 0) return [];

  // Group by parent category (or category if no parent)
  const categoryMap = new Map<string, { name: string; amount: number; color: string; icon: string }>();

  for (const t of transactions) {
    const cat = t.categories as unknown as { id: string; name: string; icon: string; color: string; parent_id: string | null } | null;
    if (!cat) continue;

    const key = cat.parent_id || cat.id;
    const existing = categoryMap.get(key);
    
    if (existing) {
      existing.amount += Number(t.amount);
    } else {
      // If this is a subcategory, we'd need to fetch parent info
      // For now, use the category's own info
      categoryMap.set(key, {
        name: cat.name,
        amount: Number(t.amount),
        color: cat.color || "#6B7280",
        icon: cat.icon || "📦",
      });
    }
  }

  // Calculate total for percentages
  const total = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.amount, 0);

  // Convert to array and sort by amount
  const categories: CategorySpending[] = Array.from(categoryMap.values())
    .map(c => ({
      ...c,
      percentage: total > 0 ? Math.round((c.amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8); // Top 8 categories

  return categories;
}

/**
 * Get monthly income vs expense trend (last 6 months)
 */
export async function getMonthlyTrend(): Promise<MonthlyTrend[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile) return [];

  const now = new Date();
  const trends: MonthlyTrend[] = [];

  // Get last 6 months of data
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, type")
      .eq("household_id", profile.household_id)
      .gte("date", format(monthStart, "yyyy-MM-dd"))
      .lte("date", format(monthEnd, "yyyy-MM-dd"));

    const income = (transactions || [])
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = (transactions || [])
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    trends.push({
      month: format(monthDate, "MMM"),
      income,
      expenses,
    });
  }

  return trends;
}

/**
 * Get recent transactions
 */
export async function getRecentTransactions(limit = 5): Promise<RecentTransaction[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile) return [];

  const { data: transactions } = await supabase
    .from("transactions")
    .select(`
      id,
      description,
      amount,
      type,
      date,
      categories (
        name,
        icon
      )
    `)
    .eq("household_id", profile.household_id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!transactions) return [];

  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const yesterday = format(subMonths(now, 0), "yyyy-MM-dd").slice(0, 8); // Just for logic

  return transactions.map(t => {
    const cat = t.categories as unknown as { name: string; icon: string } | null;
    let dateLabel = format(new Date(t.date), "dd MMM");
    
    if (t.date === today) {
      dateLabel = "Today";
    } else if (t.date === format(new Date(now.getTime() - 86400000), "yyyy-MM-dd")) {
      dateLabel = "Yesterday";
    }

    return {
      id: t.id,
      description: t.description || "No description",
      category: cat?.name || "Uncategorized",
      categoryIcon: cat?.icon || "📦",
      amount: Number(t.amount),
      type: t.type as "income" | "expense",
      date: dateLabel,
    };
  });
}

/**
 * Get account balances
 */
export async function getAccountBalances(): Promise<AccountBalance[]> {
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
    .select("id, name, type, balance, icon")
    .eq("household_id", profile.household_id)
    .eq("is_active", true)
    .order("sort_order");

  if (!accounts) return [];

  return accounts.map(a => ({
    id: a.id,
    name: a.name,
    type: a.type,
    balance: Number(a.balance),
    icon: a.icon || "💳",
  }));
}
