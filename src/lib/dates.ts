/**
 * Date formatting utilities for FamFin
 * Format: DD/MM/YYYY as per spec NFR-14
 */

import { format, parseISO, isValid, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";

/**
 * Format a date to DD/MM/YYYY
 * @param date - Date object or ISO string
 * @returns Formatted string like "21/02/2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "dd/MM/yyyy");
}

/**
 * Format a date to a readable format
 * @param date - Date object or ISO string
 * @returns Formatted string like "21 Feb 2026"
 */
export function formatDateReadable(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "dd MMM yyyy");
}

/**
 * Format a date to month and year
 * @param date - Date object or ISO string
 * @returns Formatted string like "February 2026"
 */
export function formatMonthYear(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "MMMM yyyy");
}

/**
 * Format a date to short month and year
 * @param date - Date object or ISO string
 * @returns Formatted string like "Feb 2026"
 */
export function formatShortMonthYear(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "MMM yyyy");
}

/**
 * Get the start of the current month
 */
export function getMonthStart(date: Date = new Date()): Date {
  return startOfMonth(date);
}

/**
 * Get the end of the current month
 */
export function getMonthEnd(date: Date = new Date()): Date {
  return endOfMonth(date);
}

/**
 * Get date range for the past N months
 * @param months - Number of months to go back
 * @returns Object with start and end dates
 */
export function getPastMonthsRange(months: number): { start: Date; end: Date } {
  const end = endOfMonth(new Date());
  const start = startOfMonth(subMonths(new Date(), months - 1));
  return { start, end };
}

/**
 * Calculate days remaining until a target date
 * @param targetDate - The target date
 * @returns Number of days remaining (negative if past)
 */
export function daysUntil(targetDate: Date | string): number {
  const target = typeof targetDate === "string" ? parseISO(targetDate) : targetDate;
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get month and year from a date for budget lookups
 * @param date - Date object
 * @returns Object with month (1-12) and year
 */
export function getMonthYear(date: Date = new Date()): { month: number; year: number } {
  return {
    month: date.getMonth() + 1, // 1-12
    year: date.getFullYear(),
  };
}

/**
 * Create a date from month and year
 * @param month - Month (1-12)
 * @param year - Year
 * @returns Date object for the first of that month
 */
export function dateFromMonthYear(month: number, year: number): Date {
  return new Date(year, month - 1, 1);
}

/**
 * Get an array of the past N months for reporting
 * @param count - Number of months to return
 * @returns Array of { month, year } objects
 */
export function getPastMonths(count: number): Array<{ month: number; year: number }> {
  const result: Array<{ month: number; year: number }> = [];
  let current = new Date();
  
  for (let i = 0; i < count; i++) {
    result.push(getMonthYear(current));
    current = subMonths(current, 1);
  }
  
  return result.reverse();
}
