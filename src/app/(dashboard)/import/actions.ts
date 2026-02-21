"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  error?: string;
  success?: boolean;
  data?: unknown;
};

export type ParsedTransaction = {
  date: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  subCategory?: string;
  account: string;
  description?: string;
  merchant?: string;
  paymentMethod?: string;
  notes?: string;
  isValid: boolean;
  errors: string[];
  categoryId?: string;
  accountId?: string;
};

/**
 * Download CSV template
 */
export async function getCSVTemplate(): Promise<string> {
  const headers = [
    "date",
    "type",
    "amount",
    "category",
    "sub_category",
    "account",
    "description",
    "merchant",
    "payment_method",
    "notes",
  ];

  const exampleRows = [
    "15/01/2026,expense,2500,Food & Groceries,Household Goods,Joint Account,Weekly shopping,Naivas,mobile_money,",
    "01/01/2026,income,150000,Salary,,Joint Account,January salary,Employer,bank_transfer,",
  ];

  return [headers.join(","), ...exampleRows].join("\n");
}

/**
 * Parse and validate CSV data
 */
export async function parseCSV(csvContent: string): Promise<{
  data: ParsedTransaction[];
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", data: [] };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("household_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) {
    return { error: "No household found", data: [] };
  }

  if (profile.role !== "admin") {
    return { error: "Only admins can import data", data: [] };
  }

  // Get categories and accounts for validation
  const [categoriesResult, accountsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, parent_id, type")
      .eq("household_id", profile.household_id)
      .eq("is_active", true),
    supabase
      .from("accounts")
      .select("id, name")
      .eq("household_id", profile.household_id)
      .eq("is_active", true),
  ]);

  const categories = categoriesResult.data || [];
  const accounts = accountsResult.data || [];

  // Parse CSV
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) {
    return { error: "CSV must contain at least a header row and one data row", data: [] };
  }

  const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const requiredHeaders = ["date", "type", "amount", "category", "account"];
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

  if (missingHeaders.length > 0) {
    return { error: `Missing required columns: ${missingHeaders.join(", ")}`, data: [] };
  }

  const parsed: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || "";
    });

    const errors: string[] = [];
    let isValid = true;

    // Parse and validate date (DD/MM/YYYY format)
    let parsedDate = "";
    if (!row.date) {
      errors.push("Date is required");
      isValid = false;
    } else {
      const dateMatch = row.date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        parsedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        const dateObj = new Date(parsedDate);
        if (isNaN(dateObj.getTime())) {
          errors.push("Invalid date");
          isValid = false;
        }
      } else {
        // Try ISO format
        const isoDate = new Date(row.date);
        if (!isNaN(isoDate.getTime())) {
          parsedDate = isoDate.toISOString().split("T")[0];
        } else {
          errors.push("Invalid date format. Use DD/MM/YYYY");
          isValid = false;
        }
      }
    }

    // Validate type
    const type = row.type?.toLowerCase();
    if (!type || (type !== "income" && type !== "expense")) {
      errors.push("Type must be 'income' or 'expense'");
      isValid = false;
    }

    // Validate amount
    const amount = parseFloat(row.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push("Amount must be a positive number");
      isValid = false;
    }

    // Validate category
    let categoryId: string | undefined;
    const categoryName = row.category?.toLowerCase();
    const subCategoryName = row.sub_category?.toLowerCase();

    if (!categoryName) {
      errors.push("Category is required");
      isValid = false;
    } else {
      // Find parent category
      const parentCat = categories.find(
        (c) => c.name.toLowerCase() === categoryName && !c.parent_id
      );
      
      if (parentCat) {
        if (subCategoryName) {
          // Find sub-category
          const subCat = categories.find(
            (c) => c.name.toLowerCase() === subCategoryName && c.parent_id === parentCat.id
          );
          categoryId = subCat?.id || parentCat.id;
          if (!subCat) {
            errors.push(`Sub-category "${row.sub_category}" not found, using parent category`);
          }
        } else {
          categoryId = parentCat.id;
        }
      } else {
        // Try finding any category with that name
        const anyCat = categories.find((c) => c.name.toLowerCase() === categoryName);
        if (anyCat) {
          categoryId = anyCat.id;
        } else {
          errors.push(`Category "${row.category}" not found`);
          isValid = false;
        }
      }
    }

    // Validate account
    let accountId: string | undefined;
    const accountName = row.account?.toLowerCase();

    if (!accountName) {
      errors.push("Account is required");
      isValid = false;
    } else {
      const account = accounts.find((a) => a.name.toLowerCase() === accountName);
      if (account) {
        accountId = account.id;
      } else {
        errors.push(`Account "${row.account}" not found`);
        isValid = false;
      }
    }

    // Validate payment method
    const validPaymentMethods = ["cash", "card", "mobile_money", "bank_transfer", "other"];
    const paymentMethod = row.payment_method?.toLowerCase();
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      errors.push(`Invalid payment method. Use: ${validPaymentMethods.join(", ")}`);
    }

    parsed.push({
      date: parsedDate,
      type: (type as "income" | "expense") || "expense",
      amount: amount || 0,
      category: row.category || "",
      subCategory: row.sub_category || undefined,
      account: row.account || "",
      description: row.description || undefined,
      merchant: row.merchant || undefined,
      paymentMethod: paymentMethod || undefined,
      notes: row.notes || undefined,
      isValid,
      errors,
      categoryId,
      accountId,
    });
  }

  return { data: parsed };
}

/**
 * Import validated transactions
 */
export async function importTransactions(
  transactions: ParsedTransaction[]
): Promise<ActionResult> {
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

  if (profile.role !== "admin") {
    return { error: "Only admins can import data" };
  }

  // Filter only valid transactions
  const validTransactions = transactions.filter((t) => t.isValid && t.categoryId && t.accountId);

  if (validTransactions.length === 0) {
    return { error: "No valid transactions to import" };
  }

  // Prepare insert data
  const insertData = validTransactions.map((t) => ({
    household_id: profile.household_id,
    user_id: user.id,
    type: t.type,
    amount: t.amount,
    date: t.date,
    category_id: t.categoryId!,
    account_id: t.accountId!,
    description: t.description || null,
    merchant: t.merchant || null,
    payment_method: t.paymentMethod || null,
    notes: t.notes || null,
  }));

  // Insert transactions
  const { error } = await supabase.from("transactions").insert(insertData);

  if (error) {
    return { error: error.message };
  }

  // Update account balances
  const accountBalanceChanges: Record<string, number> = {};
  for (const t of validTransactions) {
    const change = t.type === "income" ? t.amount : -t.amount;
    accountBalanceChanges[t.accountId!] = (accountBalanceChanges[t.accountId!] || 0) + change;
  }

  for (const [accountId, change] of Object.entries(accountBalanceChanges)) {
    await supabase.rpc("update_account_balance", {
      p_account_id: accountId,
      p_amount: change,
    });
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return {
    success: true,
    data: { imported: validTransactions.length, skipped: transactions.length - validTransactions.length },
  };
}

// Helper function to parse CSV line (handles quoted values)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
