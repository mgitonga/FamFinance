/**
 * Supabase server client for server-side operations
 * Use this in Server Components, Server Actions, and Route Handlers
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Get the currently authenticated user from a server context
 * @returns User object or null if not authenticated
 */
export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export type UserProfile = Database["public"]["Tables"]["users"]["Row"];

/**
 * Get the current user's profile from the users table
 * @returns User profile or null
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return null;
  }
  
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  
  if (profileError || !profile) {
    return null;
  }
  
  return profile;
}

/**
 * Check if the current user is an admin
 * @returns boolean
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === "admin";
}
