"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  error?: string;
  success?: boolean;
  data?: unknown;
};

/**
 * Get all accounts for the current household
 */
export async function getAccounts() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", data: [] };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found", data: [] };
  }

  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("household_id", profile.household_id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: accounts };
}

/**
 * Create a new account
 */
export async function createAccount(formData: FormData): Promise<ActionResult> {
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

  if (!profile) {
    return { error: "Profile not found" };
  }

  if (profile.role !== "admin") {
    return { error: "Only admins can create accounts" };
  }

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const balance = parseFloat(formData.get("balance") as string) || 0;

  if (!name || !type) {
    return { error: "Name and type are required" };
  }

  const { error } = await supabase.from("accounts").insert({
    household_id: profile.household_id,
    name,
    type,
    balance,
    is_active: true,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/accounts");
  return { success: true };
}

/**
 * Update an account
 */
export async function updateAccount(formData: FormData): Promise<ActionResult> {
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

  if (!profile) {
    return { error: "Profile not found" };
  }

  if (profile.role !== "admin") {
    return { error: "Only admins can update accounts" };
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const balance = parseFloat(formData.get("balance") as string) || 0;

  if (!id || !name || !type) {
    return { error: "ID, name, and type are required" };
  }

  const { error } = await supabase
    .from("accounts")
    .update({ name, type, balance })
    .eq("id", id)
    .eq("household_id", profile.household_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/accounts");
  return { success: true };
}

/**
 * Deactivate an account (soft delete)
 */
export async function deleteAccount(formData: FormData): Promise<ActionResult> {
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

  if (!profile) {
    return { error: "Profile not found" };
  }

  if (profile.role !== "admin") {
    return { error: "Only admins can delete accounts" };
  }

  const id = formData.get("id") as string;

  if (!id) {
    return { error: "Account ID is required" };
  }

  // Check if account has transactions
  const { count } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("account_id", id);

  if (count && count > 0) {
    // Soft delete to preserve transaction history
    const { error } = await supabase
      .from("accounts")
      .update({ is_active: false })
      .eq("id", id)
      .eq("household_id", profile.household_id);

    if (error) {
      return { error: error.message };
    }
  } else {
    // Hard delete if no transactions
    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", id)
      .eq("household_id", profile.household_id);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/settings/accounts");
  return { success: true };
}

/**
 * Get account by ID
 */
export async function getAccountById(id: string) {
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

  if (!profile) {
    return { error: "Profile not found", data: null };
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .eq("household_id", profile.household_id)
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data };
}
