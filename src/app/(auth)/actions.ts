"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type AuthResult = {
  error?: string;
  success?: boolean;
};

/**
 * Register a new user with email and password
 * Creates a household and user profile automatically
 */
export async function register(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const householdName = formData.get("householdName") as string;

  // Validate inputs
  if (!email || !password || !name || !householdName) {
    return { error: "All fields are required" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  // Check password complexity
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (!hasNumber || !hasSpecial) {
    return { error: "Password must contain at least 1 number and 1 special character" };
  }

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        household_name: householdName,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Failed to create user" };
  }

  // Create household
  const { data: household, error: householdError } = await supabase
    .from("households")
    .insert({
      name: householdName,
      primary_currency: "KES",
    })
    .select()
    .single();

  if (householdError) {
    return { error: "Failed to create household: " + householdError.message };
  }

  // Create user profile with admin role (first user is admin)
  const { error: profileError } = await supabase.from("users").insert({
    id: authData.user.id,
    email,
    name,
    role: "admin",
    household_id: household.id,
  });

  if (profileError) {
    return { error: "Failed to create user profile: " + profileError.message };
  }

  // Seed default categories for the household
  await seedDefaultCategories(supabase, household.id);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Sign in with email and password
 */
export async function login(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Sign out the current user
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Send password reset email
 */
export async function forgotPassword(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Reset password with token
 */
export async function resetPassword(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { error: "Both password fields are required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (!hasNumber || !hasSpecial) {
    return { error: "Password must contain at least 1 number and 1 special character" };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Invite a user to the household
 */
export async function inviteUser(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  // Verify current user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, household_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can invite users" };
  }

  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const role = (formData.get("role") as string) || "contributor";

  if (!email || !name) {
    return { error: "Email and name are required" };
  }

  // Invite user via Supabase (sends invitation email)
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: {
      name,
      role,
      household_id: profile.household_id,
    },
  });

  if (inviteError) {
    return { error: "Failed to send invitation: " + inviteError.message };
  }

  // Create user profile
  if (inviteData.user) {
    await supabase.from("users").insert({
      id: inviteData.user.id,
      email,
      name,
      role: role as "admin" | "contributor",
      household_id: profile.household_id,
    });
  }

  return { success: true };
}

/**
 * Update user profile
 */
export async function updateProfile(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const name = formData.get("name") as string;
  const avatarUrl = formData.get("avatarUrl") as string | null;

  if (!name) {
    return { error: "Name is required" };
  }

  const { error } = await supabase
    .from("users")
    .update({
      name,
      avatar_url: avatarUrl || null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Change a user's role (admin only)
 */
export async function changeUserRole(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, household_id")
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

  // Prevent changing own role
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

  revalidatePath("/settings/users", "page");
  return { success: true };
}

// Helper function to seed default categories
async function seedDefaultCategories(supabase: Awaited<ReturnType<typeof createClient>>, householdId: string) {
  const categories = [
    // Expense categories with sub-categories
    { name: "Food & Groceries", type: "expense", icon: "shopping-cart", color: "#22C55E", children: ["Household Goods", "Fruit & Veg"] },
    { name: "Dining", type: "expense", icon: "utensils", color: "#F97316", children: ["Eating Out"] },
    { name: "Housing", type: "expense", icon: "home", color: "#3B82F6", children: ["Rent", "House Repairs", "Hosting"] },
    { name: "Transport", type: "expense", icon: "car", color: "#8B5CF6", children: ["Fuel", "Car Maintenance"] },
    { name: "Utilities", type: "expense", icon: "zap", color: "#EAB308", children: ["Water", "Electricity", "Internet"] },
    { name: "Entertainment", type: "expense", icon: "film", color: "#EC4899", children: [] },
    { name: "Healthcare", type: "expense", icon: "heart-pulse", color: "#EF4444", children: ["Medicine"] },
    { name: "Children", type: "expense", icon: "baby", color: "#14B8A6", children: ["Child Care", "School Fees", "School Supplies"] },
    { name: "Sports", type: "expense", icon: "dumbbell", color: "#6366F1", children: ["Sports Equipment"] },
    { name: "Giving", type: "expense", icon: "heart", color: "#F43F5E", children: ["EBC Giving"] },
    { name: "Loans", type: "expense", icon: "landmark", color: "#78716C", children: ["Qona Loan Repayment", "Stima Loan Repayment", "Lending"] },
    { name: "Investment", type: "expense", icon: "trending-up", color: "#0EA5E9", children: [] },
    // Income categories
    { name: "Salary", type: "income", icon: "briefcase", color: "#22C55E", children: [] },
    { name: "Side Income", type: "income", icon: "wallet", color: "#10B981", children: [] },
    { name: "Other Income", type: "income", icon: "plus-circle", color: "#06B6D4", children: [] },
    // Both
    { name: "Other", type: "both", icon: "more-horizontal", color: "#94A3B8", children: [] },
  ];

  for (const cat of categories) {
    // Insert parent category
    const { data: parent, error: parentError } = await supabase
      .from("categories")
      .insert({
        household_id: householdId,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        parent_id: null,
        is_active: true,
      })
      .select()
      .single();

    if (parentError || !parent) continue;

    // Insert child categories
    for (const childName of cat.children) {
      await supabase.from("categories").insert({
        household_id: householdId,
        name: childName,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        parent_id: parent.id,
        is_active: true,
      });
    }
  }
}
