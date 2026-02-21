"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TransactionRow } from "@/lib/supabase/types";

export type ActionResult = {
  error?: string;
  success?: boolean;
  data?: unknown;
};

export type TransactionFilters = {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  accountId?: string;
  type?: "income" | "expense";
  userId?: string;
  paymentMethod?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "date" | "amount" | "category";
  sortOrder?: "asc" | "desc";
};

export type TransactionWithDetails = TransactionRow & {
  category?: { id: string; name: string; color: string | null };
  account?: { id: string; name: string; type: string };
  user?: { id: string; name: string };
};

/**
 * Get transactions with filtering, pagination, and sorting
 */
export async function getTransactions(filters: TransactionFilters = {}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", data: [], total: 0 };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    return { error: "No household found", data: [], total: 0 };
  }

  const {
    startDate,
    endDate,
    categoryId,
    accountId,
    type,
    userId,
    paymentMethod,
    search,
    page = 1,
    pageSize = 20,
    sortBy = "date",
    sortOrder = "desc",
  } = filters;

  // Build query
  let query = supabase
    .from("transactions")
    .select(
      `
      *,
      category:categories(id, name, color),
      account:accounts(id, name, type),
      user:users(id, name)
    `,
      { count: "exact" }
    )
    .eq("household_id", profile.household_id);

  // Apply filters
  if (startDate) {
    query = query.gte("date", startDate);
  }
  if (endDate) {
    query = query.lte("date", endDate);
  }
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  if (accountId) {
    query = query.eq("account_id", accountId);
  }
  if (type) {
    query = query.eq("type", type);
  }
  if (userId) {
    query = query.eq("user_id", userId);
  }
  if (paymentMethod) {
    query = query.eq("payment_method", paymentMethod);
  }
  if (search) {
    query = query.or(
      `description.ilike.%${search}%,merchant.ilike.%${search}%`
    );
  }

  // Apply sorting
  const sortColumn = sortBy === "category" ? "category_id" : sortBy;
  query = query.order(sortColumn, { ascending: sortOrder === "asc" });

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return { error: error.message, data: [], total: 0 };
  }

  return {
    data: data as TransactionWithDetails[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Get a single transaction by ID
 */
export async function getTransactionById(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", data: null };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    return { error: "No household found", data: null };
  }

  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      *,
      category:categories(id, name, color),
      account:accounts(id, name, type),
      user:users(id, name)
    `
    )
    .eq("id", id)
    .eq("household_id", profile.household_id)
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data: data as TransactionWithDetails };
}

/**
 * Create a new transaction
 */
export async function createTransaction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    return { error: "No household found" };
  }

  const type = formData.get("type") as "income" | "expense";
  const amount = parseFloat(formData.get("amount") as string);
  const date = formData.get("date") as string;
  const categoryId = formData.get("categoryId") as string;
  const accountId = formData.get("accountId") as string;
  const description = formData.get("description") as string | null;
  const merchant = formData.get("merchant") as string | null;
  const paymentMethod = formData.get("paymentMethod") as string | null;
  const notes = formData.get("notes") as string | null;
  const receiptUrl = formData.get("receiptUrl") as string | null;
  const tagsString = formData.get("tags") as string | null;
  const tags = tagsString ? tagsString.split(",").map((t) => t.trim()).filter(Boolean) : null;

  // Validation
  if (!type || !amount || !date || !categoryId || !accountId) {
    return { error: "Type, amount, date, category, and account are required" };
  }
  if (amount <= 0) {
    return { error: "Amount must be greater than 0" };
  }

  // Create transaction
  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({
      household_id: profile.household_id,
      user_id: user.id,
      type,
      amount,
      date,
      category_id: categoryId,
      account_id: accountId,
      description: description || null,
      merchant: merchant || null,
      payment_method: paymentMethod || null,
      notes: notes || null,
      receipt_url: receiptUrl || null,
      tags: tags,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Update account balance
  const balanceChange = type === "income" ? amount : -amount;
  await supabase.rpc("update_account_balance", {
    p_account_id: accountId,
    p_amount: balanceChange,
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true, data: transaction };
}

/**
 * Update a transaction
 */
export async function updateTransaction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("household_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    return { error: "No household found" };
  }

  const id = formData.get("id") as string;
  const type = formData.get("type") as "income" | "expense";
  const amount = parseFloat(formData.get("amount") as string);
  const date = formData.get("date") as string;
  const categoryId = formData.get("categoryId") as string;
  const accountId = formData.get("accountId") as string;
  const description = formData.get("description") as string | null;
  const merchant = formData.get("merchant") as string | null;
  const paymentMethod = formData.get("paymentMethod") as string | null;
  const notes = formData.get("notes") as string | null;
  const receiptUrl = formData.get("receiptUrl") as string | null;
  const tagsString = formData.get("tags") as string | null;
  const tags = tagsString ? tagsString.split(",").map((t) => t.trim()).filter(Boolean) : null;

  if (!id) {
    return { error: "Transaction ID is required" };
  }

  // Get original transaction to check ownership and calculate balance diff
  const { data: original, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("household_id", profile.household_id)
    .single();

  if (fetchError || !original) {
    return { error: "Transaction not found" };
  }

  // Check permission (admin can edit all, contributors only their own)
  if (profile.role !== "admin" && original.user_id !== user.id) {
    return { error: "You can only edit your own transactions" };
  }

  // Update transaction
  const { error } = await supabase
    .from("transactions")
    .update({
      type,
      amount,
      date,
      category_id: categoryId,
      account_id: accountId,
      description: description || null,
      merchant: merchant || null,
      payment_method: paymentMethod || null,
      notes: notes || null,
      receipt_url: receiptUrl || null,
      tags: tags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("household_id", profile.household_id);

  if (error) {
    return { error: error.message };
  }

  // Adjust account balances if amount/type/account changed
  const oldEffect = original.type === "income" ? original.amount : -original.amount;
  const newEffect = type === "income" ? amount : -amount;

  if (original.account_id === accountId) {
    // Same account - adjust difference
    const diff = newEffect - oldEffect;
    if (diff !== 0) {
      await supabase.rpc("update_account_balance", {
        p_account_id: accountId,
        p_amount: diff,
      });
    }
  } else {
    // Different account - reverse old, apply new
    await supabase.rpc("update_account_balance", {
      p_account_id: original.account_id,
      p_amount: -oldEffect,
    });
    await supabase.rpc("update_account_balance", {
      p_account_id: accountId,
      p_amount: newEffect,
    });
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("household_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    return { error: "No household found" };
  }

  const id = formData.get("id") as string;
  if (!id) {
    return { error: "Transaction ID is required" };
  }

  // Get transaction to check ownership and for balance adjustment
  const { data: transaction, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("household_id", profile.household_id)
    .single();

  if (fetchError || !transaction) {
    return { error: "Transaction not found" };
  }

  // Check permission
  if (profile.role !== "admin" && transaction.user_id !== user.id) {
    return { error: "You can only delete your own transactions" };
  }

  // Delete transaction
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("household_id", profile.household_id);

  if (error) {
    return { error: error.message };
  }

  // Reverse the balance effect
  const balanceEffect = transaction.type === "income" ? -transaction.amount : transaction.amount;
  await supabase.rpc("update_account_balance", {
    p_account_id: transaction.account_id,
    p_amount: balanceEffect,
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Upload receipt image
 */
export async function uploadReceipt(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    return { error: "No household found" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No file provided" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Invalid file type. Allowed: JPG, PNG, PDF" };
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: "File too large. Maximum size: 5MB" };
  }

  // Generate unique filename
  const ext = file.name.split(".").pop();
  const filename = `${profile.household_id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("receipts")
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return { error: error.message };
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(data.path);

  return { success: true, data: { url: urlData.publicUrl, path: data.path } };
}

/**
 * Delete receipt from storage
 */
export async function deleteReceipt(path: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase.storage.from("receipts").remove([path]);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Get transaction summary for dashboard
 */
export async function getTransactionSummary(month: number, year: number) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", data: null };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    return { error: "No household found", data: null };
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("type, amount")
    .eq("household_id", profile.household_id)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    return { error: error.message, data: null };
  }

  const summary = {
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    transactionCount: transactions.length,
  };

  for (const t of transactions) {
    if (t.type === "income") {
      summary.totalIncome += Number(t.amount);
    } else {
      summary.totalExpenses += Number(t.amount);
    }
  }

  summary.netSavings = summary.totalIncome - summary.totalExpenses;

  return { data: summary };
}
