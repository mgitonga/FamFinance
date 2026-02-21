/**
 * Zod validation schemas for FamFin
 * Based on data model from spec Section 5.2
 */

import { z } from "zod";

// Enums matching database schema
export const UserRole = z.enum(["admin", "contributor"]);
export const AccountType = z.enum(["bank", "mobile_money", "cash", "credit_card", "other"]);
export const CategoryType = z.enum(["expense", "income", "both"]);
export const TransactionType = z.enum(["income", "expense"]);
export const PaymentMethod = z.enum(["cash", "card", "mobile_money", "bank_transfer", "other"]);
export const RecurringFrequency = z.enum(["monthly"]);
export const DebtType = z.enum(["mortgage", "car_loan", "personal_loan", "credit_card", "student_loan", "other"]);
export const NotificationMethod = z.enum(["in_app", "email", "both"]);
export const NotificationType = z.enum([
  "bill_reminder",
  "budget_warning", 
  "budget_exceeded",
  "goal_milestone",
  "recurring_due",
  "system",
]);

// Base schemas
export const UUIDSchema = z.string().uuid();
export const PositiveAmountSchema = z.number().positive("Amount must be greater than 0");
export const MonthSchema = z.number().int().min(1).max(12);
export const DayOfMonthSchema = z.number().int().min(1).max(31);
export const YearSchema = z.number().int().min(2000).max(2100);

// User schemas
export const UserSchema = z.object({
  id: UUIDSchema,
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100),
  role: UserRole,
  household_id: UUIDSchema,
  avatar_url: z.string().url().nullable().optional(),
  created_at: z.string().datetime(),
});

export const CreateUserSchema = UserSchema.omit({ id: true, created_at: true });

// Household schemas
export const HouseholdSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1, "Household name is required").max(100),
  primary_currency: z.string().length(3).default("KES"),
  created_at: z.string().datetime(),
});

export const CreateHouseholdSchema = HouseholdSchema.omit({ id: true, created_at: true });

// Account schemas
export const AccountSchema = z.object({
  id: UUIDSchema,
  household_id: UUIDSchema,
  name: z.string().min(1, "Account name is required").max(100),
  type: AccountType,
  balance: z.number().default(0),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
});

export const CreateAccountSchema = AccountSchema.omit({ id: true, created_at: true, household_id: true });
export const UpdateAccountSchema = CreateAccountSchema.partial();

// Category schemas
export const CategorySchema = z.object({
  id: UUIDSchema,
  household_id: UUIDSchema,
  name: z.string().min(1, "Category name is required").max(100),
  parent_id: UUIDSchema.nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").nullable().optional(),
  type: CategoryType.default("expense"),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
  created_at: z.string().datetime(),
});

export const CreateCategorySchema = CategorySchema.omit({ id: true, created_at: true, household_id: true });
export const UpdateCategorySchema = CreateCategorySchema.partial();

// Transaction schemas
export const TransactionSchema = z.object({
  id: UUIDSchema,
  household_id: UUIDSchema,
  account_id: UUIDSchema,
  category_id: UUIDSchema,
  user_id: UUIDSchema,
  type: TransactionType,
  amount: PositiveAmountSchema,
  date: z.string().date(),
  description: z.string().max(500).nullable().optional(),
  merchant: z.string().max(200).nullable().optional(),
  payment_method: PaymentMethod.nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  receipt_url: z.string().url().nullable().optional(),
  is_recurring: z.boolean().default(false),
  recurring_id: UUIDSchema.nullable().optional(),
  split_with: UUIDSchema.nullable().optional(),
  split_ratio: z.number().min(0).max(1).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateTransactionSchema = TransactionSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true,
  household_id: true,
  user_id: true,
});
export const UpdateTransactionSchema = CreateTransactionSchema.partial();

// Budget schemas
export const BudgetSchema = z.object({
  id: UUIDSchema,
  household_id: UUIDSchema,
  category_id: UUIDSchema,
  amount: PositiveAmountSchema,
  month: MonthSchema,
  year: YearSchema,
  created_at: z.string().datetime(),
});

export const CreateBudgetSchema = BudgetSchema.omit({ id: true, created_at: true, household_id: true });
export const UpdateBudgetSchema = z.object({ amount: PositiveAmountSchema });

// Overall Budget schemas
export const OverallBudgetSchema = z.object({
  id: UUIDSchema,
  household_id: UUIDSchema,
  amount: PositiveAmountSchema,
  month: MonthSchema,
  year: YearSchema,
  created_at: z.string().datetime(),
});

export const CreateOverallBudgetSchema = OverallBudgetSchema.omit({ id: true, created_at: true, household_id: true });

// Recurring Transaction schemas
export const RecurringTransactionSchema = z.object({
  id: UUIDSchema,
  household_id: UUIDSchema,
  category_id: UUIDSchema,
  account_id: UUIDSchema,
  type: TransactionType,
  amount: PositiveAmountSchema,
  frequency: RecurringFrequency.default("monthly"),
  day_of_month: DayOfMonthSchema,
  next_due_date: z.string().date(),
  description: z.string().min(1).max(200),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
});

export const CreateRecurringTransactionSchema = RecurringTransactionSchema.omit({ 
  id: true, 
  created_at: true, 
  household_id: true,
  next_due_date: true,
});
export const UpdateRecurringTransactionSchema = CreateRecurringTransactionSchema.partial();

// Savings Goal schemas
export const SavingsGoalSchema = z.object({
  id: UUIDSchema,
  household_id: UUIDSchema,
  name: z.string().min(1, "Goal name is required").max(100),
  target_amount: PositiveAmountSchema,
  current_amount: z.number().min(0).default(0),
  target_date: z.string().date(),
  icon: z.string().max(50).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  is_completed: z.boolean().default(false),
  created_at: z.string().datetime(),
});

export const CreateSavingsGoalSchema = SavingsGoalSchema.omit({ 
  id: true, 
  created_at: true, 
  household_id: true,
  current_amount: true,
  is_completed: true,
});
export const UpdateSavingsGoalSchema = CreateSavingsGoalSchema.partial();

// Goal Contribution schemas
export const GoalContributionSchema = z.object({
  id: UUIDSchema,
  goal_id: UUIDSchema,
  user_id: UUIDSchema,
  amount: PositiveAmountSchema,
  date: z.string().date(),
  notes: z.string().max(500).nullable().optional(),
  created_at: z.string().datetime(),
});

export const CreateGoalContributionSchema = GoalContributionSchema.omit({ 
  id: true, 
  created_at: true,
  user_id: true,
});

// Debt schemas
export const DebtSchema = z.object({
  id: UUIDSchema,
  household_id: UUIDSchema,
  name: z.string().min(1, "Debt name is required").max(100),
  type: DebtType,
  original_amount: PositiveAmountSchema,
  outstanding_balance: z.number().min(0),
  interest_rate: z.number().min(0).max(100).nullable().optional(),
  minimum_payment: PositiveAmountSchema.nullable().optional(),
  payment_day: DayOfMonthSchema,
  start_date: z.string().date(),
  projected_payoff_date: z.string().date().nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
});

export const CreateDebtSchema = DebtSchema.omit({ 
  id: true, 
  created_at: true, 
  household_id: true,
  projected_payoff_date: true,
});
export const UpdateDebtSchema = CreateDebtSchema.partial();

// Bill Reminder schemas
export const BillReminderSchema = z.object({
  id: UUIDSchema,
  household_id: UUIDSchema,
  name: z.string().min(1, "Bill name is required").max(100),
  amount: PositiveAmountSchema.nullable().optional(),
  due_day: DayOfMonthSchema,
  category_id: UUIDSchema,
  reminder_days_before: z.number().int().min(0).max(30).default(3),
  notification_method: NotificationMethod.default("both"),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
});

export const CreateBillReminderSchema = BillReminderSchema.omit({ 
  id: true, 
  created_at: true, 
  household_id: true,
});
export const UpdateBillReminderSchema = CreateBillReminderSchema.partial();

// Notification schemas
export const NotificationSchema = z.object({
  id: UUIDSchema,
  household_id: UUIDSchema,
  user_id: UUIDSchema,
  type: NotificationType,
  title: z.string().max(200),
  message: z.string(),
  is_read: z.boolean().default(false),
  action_url: z.string().url().nullable().optional(),
  created_at: z.string().datetime(),
});

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least 1 number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least 1 special character"),
  name: z.string().min(1, "Name is required").max(100),
  household_name: z.string().min(1, "Household name is required").max(100),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const InviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: UserRole.default("contributor"),
});

// Type exports
export type UserRole = z.infer<typeof UserRole>;
export type AccountType = z.infer<typeof AccountType>;
export type CategoryType = z.infer<typeof CategoryType>;
export type TransactionType = z.infer<typeof TransactionType>;
export type PaymentMethod = z.infer<typeof PaymentMethod>;
export type RecurringFrequency = z.infer<typeof RecurringFrequency>;
export type DebtType = z.infer<typeof DebtType>;
export type NotificationMethod = z.infer<typeof NotificationMethod>;
export type NotificationType = z.infer<typeof NotificationType>;

export type User = z.infer<typeof UserSchema>;
export type Household = z.infer<typeof HouseholdSchema>;
export type Account = z.infer<typeof AccountSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type Budget = z.infer<typeof BudgetSchema>;
export type OverallBudget = z.infer<typeof OverallBudgetSchema>;
export type RecurringTransaction = z.infer<typeof RecurringTransactionSchema>;
export type SavingsGoal = z.infer<typeof SavingsGoalSchema>;
export type GoalContribution = z.infer<typeof GoalContributionSchema>;
export type Debt = z.infer<typeof DebtSchema>;
export type BillReminder = z.infer<typeof BillReminderSchema>;
export type Notification = z.infer<typeof NotificationSchema>;

export type CreateAccount = z.infer<typeof CreateAccountSchema>;
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;
export type CreateBudget = z.infer<typeof CreateBudgetSchema>;
export type CreateRecurringTransaction = z.infer<typeof CreateRecurringTransactionSchema>;
export type CreateSavingsGoal = z.infer<typeof CreateSavingsGoalSchema>;
export type CreateGoalContribution = z.infer<typeof CreateGoalContributionSchema>;
export type CreateDebt = z.infer<typeof CreateDebtSchema>;
export type CreateBillReminder = z.infer<typeof CreateBillReminderSchema>;
