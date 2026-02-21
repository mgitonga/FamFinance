/**
 * Currency formatting utilities for FamFin
 * Primary currency: KES (Kenyan Shilling)
 */

const KES_FORMATTER = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const KES_COMPACT_FORMATTER = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  notation: "compact",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/**
 * Format a number as KES currency
 * @param amount - The amount to format
 * @returns Formatted string like "KES 1,500.00"
 */
export function formatKES(amount: number): string {
  return KES_FORMATTER.format(amount);
}

/**
 * Format a number as compact KES currency (for large numbers)
 * @param amount - The amount to format
 * @returns Formatted string like "KES 1.5K" or "KES 1.2M"
 */
export function formatKESCompact(amount: number): string {
  return KES_COMPACT_FORMATTER.format(amount);
}

/**
 * Parse a KES currency string back to a number
 * @param value - The currency string to parse
 * @returns The numeric value
 */
export function parseKES(value: string): number {
  // Remove currency symbol, commas, and spaces
  const cleaned = value.replace(/[KES\s,]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a number as a percentage
 * @param value - The decimal value (e.g., 0.75 for 75%)
 * @returns Formatted string like "75%"
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Calculate budget status based on spent vs. budget
 * @param spent - Amount spent
 * @param budget - Budget limit
 * @returns "safe" (<70%), "warning" (70-90%), or "danger" (>90%)
 */
export function getBudgetStatus(
  spent: number,
  budget: number
): "safe" | "warning" | "danger" {
  if (budget <= 0) return "safe";
  const percentage = spent / budget;
  if (percentage < 0.7) return "safe";
  if (percentage < 0.9) return "warning";
  return "danger";
}

/**
 * Get the color class for a budget status
 * @param status - The budget status
 * @returns Tailwind color class
 */
export function getBudgetStatusColor(
  status: "safe" | "warning" | "danger"
): string {
  switch (status) {
    case "safe":
      return "text-success";
    case "warning":
      return "text-warning";
    case "danger":
      return "text-danger";
  }
}

/**
 * Get the background color class for a budget status
 * @param status - The budget status
 * @returns Tailwind background color class
 */
export function getBudgetStatusBgColor(
  status: "safe" | "warning" | "danger"
): string {
  switch (status) {
    case "safe":
      return "bg-success";
    case "warning":
      return "bg-warning";
    case "danger":
      return "bg-danger";
  }
}
