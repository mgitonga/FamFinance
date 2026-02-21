"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  error?: string;
  success?: boolean;
};

/**
 * Get all users in the household
 */
export async function getHouseholdUsers() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", data: [], currentUserId: null };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("household_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found", data: [], currentUserId: null };
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .eq("household_id", profile.household_id)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: error.message, data: [], currentUserId: null };
  }

  return { 
    data: users, 
    currentUserId: user.id, 
    isAdmin: profile.role === "admin" 
  };
}

/**
 * Change a user's role
 */
export async function changeUserRole(formData: FormData): Promise<ActionResult> {
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

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can change user roles" };
  }

  const userId = formData.get("userId") as string;
  const newRole = formData.get("role") as "admin" | "contributor";

  if (!userId || !newRole) {
    return { error: "User ID and role are required" };
  }

  if (userId === user.id) {
    return { error: "You cannot change your own role" };
  }

  const { error } = await supabase
    .from("users")
    .update({ role: newRole })
    .eq("id", userId)
    .eq("household_id", profile.household_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/users");
  return { success: true };
}

/**
 * Remove a user from the household
 */
export async function removeUser(formData: FormData): Promise<ActionResult> {
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

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can remove users" };
  }

  const userId = formData.get("userId") as string;

  if (!userId) {
    return { error: "User ID is required" };
  }

  if (userId === user.id) {
    return { error: "You cannot remove yourself" };
  }

  // Remove user from household (set household_id to null)
  const { error } = await supabase
    .from("users")
    .update({ household_id: null })
    .eq("id", userId)
    .eq("household_id", profile.household_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/users");
  return { success: true };
}
