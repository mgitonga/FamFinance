"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  error?: string;
  success?: boolean;
};

/**
 * Get current user profile
 */
export async function getProfile() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", data: null };
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("*, households(name, primary_currency)")
    .eq("id", user.id)
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data: { ...profile, email: user.email } };
}

/**
 * Update user profile
 */
export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const name = formData.get("name") as string;

  if (!name) {
    return { error: "Name is required" };
  }

  const { error } = await supabase
    .from("users")
    .update({ name })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/profile");
  return { success: true };
}
