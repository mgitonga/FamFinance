"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  error?: string;
  success?: boolean;
  data?: unknown;
};

type Category = {
  id: string;
  household_id: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
  color: string | null;
  type: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  children?: Category[];
};

/**
 * Get all categories for the current household (with children nested)
 */
export async function getCategories() {
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

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .eq("household_id", profile.household_id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return { error: error.message, data: [] };
  }

  // Nest children under parents
  const parentCategories = categories.filter((c) => !c.parent_id);
  const childCategories = categories.filter((c) => c.parent_id);

  const nestedCategories: Category[] = parentCategories.map((parent) => ({
    ...parent,
    children: childCategories.filter((child) => child.parent_id === parent.id),
  }));

  return { data: nestedCategories };
}

/**
 * Get flat list of all categories (for dropdowns)
 */
export async function getCategoriesFlat() {
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

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .eq("household_id", profile.household_id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: categories };
}

/**
 * Create a new category
 */
export async function createCategory(formData: FormData): Promise<ActionResult> {
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
    return { error: "Only admins can create categories" };
  }

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const parentId = formData.get("parentId") as string | null;
  const icon = formData.get("icon") as string | null;
  const color = formData.get("color") as string | null;

  if (!name || !type) {
    return { error: "Name and type are required" };
  }

  const { error } = await supabase.from("categories").insert({
    household_id: profile.household_id,
    name,
    type,
    parent_id: parentId || null,
    icon: icon || null,
    color: color || null,
    is_active: true,
    sort_order: 0,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/categories");
  return { success: true };
}

/**
 * Update a category
 */
export async function updateCategory(formData: FormData): Promise<ActionResult> {
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
    return { error: "Only admins can update categories" };
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const icon = formData.get("icon") as string | null;
  const color = formData.get("color") as string | null;

  if (!id || !name || !type) {
    return { error: "ID, name, and type are required" };
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      type,
      icon: icon || null,
      color: color || null,
    })
    .eq("id", id)
    .eq("household_id", profile.household_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/categories");
  return { success: true };
}

/**
 * Deactivate a category (soft delete)
 */
export async function deleteCategory(formData: FormData): Promise<ActionResult> {
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
    return { error: "Only admins can delete categories" };
  }

  const id = formData.get("id") as string;

  if (!id) {
    return { error: "Category ID is required" };
  }

  // Always soft delete to preserve transaction history
  const { error } = await supabase
    .from("categories")
    .update({ is_active: false })
    .eq("id", id)
    .eq("household_id", profile.household_id);

  if (error) {
    return { error: error.message };
  }

  // Also deactivate children
  await supabase
    .from("categories")
    .update({ is_active: false })
    .eq("parent_id", id)
    .eq("household_id", profile.household_id);

  revalidatePath("/settings/categories");
  return { success: true };
}
