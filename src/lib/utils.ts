import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for merging Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a random UUID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Delay execution for a specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if code is running on the client side
 */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Check if code is running on the server side
 */
export function isServer(): boolean {
  return typeof window === "undefined";
}
