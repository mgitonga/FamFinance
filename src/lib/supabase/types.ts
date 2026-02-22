/**
 * Database types for Supabase
 * 
 * TODO: Generate this file using Supabase CLI after setting up the database:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
 * 
 * For now, this provides placeholder types based on the data model in the spec.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number | null
          created_at: string | null
          household_id: string
          id: string
          is_active: boolean | null
          name: string
          type: Database["public"]["Enums"]["account_type"]
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          household_id: string
          id?: string
          is_active?: boolean | null
          name: string
          type: Database["public"]["Enums"]["account_type"]
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          household_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["account_type"]
        }
        Relationships: [
          {
            foreignKeyName: "accounts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_reminders: {
        Row: {
          amount: number | null
          category_id: string
          created_at: string | null
          due_day: number
          household_id: string
          id: string
          is_active: boolean | null
          name: string
          notification_method:
            | Database["public"]["Enums"]["notification_method"]
            | null
          reminder_days_before: number | null
        }
        Insert: {
          amount?: number | null
          category_id: string
          created_at?: string | null
          due_day: number
          household_id: string
          id?: string
          is_active?: boolean | null
          name: string
          notification_method?:
            | Database["public"]["Enums"]["notification_method"]
            | null
          reminder_days_before?: number | null
        }
        Update: {
          amount?: number | null
          category_id?: string
          created_at?: string | null
          due_day?: number
          household_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          notification_method?:
            | Database["public"]["Enums"]["notification_method"]
            | null
          reminder_days_before?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_reminders_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_reminders_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string
          created_at: string | null
          household_id: string
          id: string
          month: number
          year: number
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string | null
          household_id: string
          id?: string
          month: number
          year: number
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string | null
          household_id?: string
          id?: string
          month?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          household_id: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
          type: Database["public"]["Enums"]["category_type"] | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          household_id: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          type?: Database["public"]["Enums"]["category_type"] | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          household_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          type?: Database["public"]["Enums"]["category_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          created_at: string | null
          household_id: string
          id: string
          interest_rate: number | null
          is_active: boolean | null
          minimum_payment: number | null
          name: string
          original_amount: number
          outstanding_balance: number
          payment_day: number
          projected_payoff_date: string | null
          start_date: string
          type: Database["public"]["Enums"]["debt_type"]
        }
        Insert: {
          created_at?: string | null
          household_id: string
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          minimum_payment?: number | null
          name: string
          original_amount: number
          outstanding_balance: number
          payment_day: number
          projected_payoff_date?: string | null
          start_date: string
          type: Database["public"]["Enums"]["debt_type"]
        }
        Update: {
          created_at?: string | null
          household_id?: string
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          minimum_payment?: number | null
          name?: string
          original_amount?: number
          outstanding_balance?: number
          payment_day?: number
          projected_payoff_date?: string | null
          start_date?: string
          type?: Database["public"]["Enums"]["debt_type"]
        }
        Relationships: [
          {
            foreignKeyName: "debts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_contributions: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          goal_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          goal_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          goal_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string | null
          id: string
          name: string
          primary_currency: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          primary_currency?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          primary_currency?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          household_id: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          household_id: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          household_id?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      overall_budgets: {
        Row: {
          amount: number
          created_at: string | null
          household_id: string
          id: string
          month: number
          year: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          household_id: string
          id?: string
          month: number
          year: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          household_id?: string
          id?: string
          month?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "overall_budgets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string
          created_at: string | null
          day_of_month: number
          description: string
          frequency: Database["public"]["Enums"]["recurring_frequency"] | null
          household_id: string
          id: string
          is_active: boolean | null
          next_due_date: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          account_id: string
          amount: number
          category_id: string
          created_at?: string | null
          day_of_month: number
          description: string
          frequency?: Database["public"]["Enums"]["recurring_frequency"] | null
          household_id: string
          id?: string
          is_active?: boolean | null
          next_due_date: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string
          created_at?: string | null
          day_of_month?: number
          description?: string
          frequency?: Database["public"]["Enums"]["recurring_frequency"] | null
          household_id?: string
          id?: string
          is_active?: boolean | null
          next_due_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          color: string | null
          created_at: string | null
          current_amount: number | null
          household_id: string
          icon: string | null
          id: string
          is_completed: boolean | null
          name: string
          target_amount: number
          target_date: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          household_id: string
          icon?: string | null
          id?: string
          is_completed?: boolean | null
          name: string
          target_amount: number
          target_date: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          household_id?: string
          icon?: string | null
          id?: string
          is_completed?: boolean | null
          name?: string
          target_amount?: number
          target_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string
          created_at: string | null
          date: string
          description: string | null
          household_id: string
          id: string
          is_recurring: boolean | null
          merchant: string | null
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          receipt_url: string | null
          recurring_id: string | null
          split_ratio: number | null
          split_with: string | null
          tags: string[] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id: string
          created_at?: string | null
          date: string
          description?: string | null
          household_id: string
          id?: string
          is_recurring?: boolean | null
          merchant?: string | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          receipt_url?: string | null
          recurring_id?: string | null
          split_ratio?: number | null
          split_with?: string | null
          tags?: string[] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string
          created_at?: string | null
          date?: string
          description?: string | null
          household_id?: string
          id?: string
          is_recurring?: boolean | null
          merchant?: string | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          receipt_url?: string | null
          recurring_id?: string | null
          split_ratio?: number | null
          split_with?: string | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_recurring"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_split_with_fkey"
            columns: ["split_with"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          household_id: string | null
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          household_id?: string | null
          id: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          household_id?: string | null
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "users_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_to_household: {
        Args: {
          p_email: string
          p_household_id: string
          p_name: string
          p_role?: Database["public"]["Enums"]["user_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      get_user_household_id: { Args: never; Returns: string }
      is_user_admin: { Args: never; Returns: boolean }
      seed_default_categories: {
        Args: { p_household_id: string }
        Returns: undefined
      }
      update_account_balance: {
        Args: { p_account_id: string; p_amount: number }
        Returns: number
      }
    }
    Enums: {
      account_type: "bank" | "mobile_money" | "cash" | "credit_card" | "other"
      category_type: "expense" | "income" | "both"
      debt_type:
        | "mortgage"
        | "car_loan"
        | "personal_loan"
        | "credit_card"
        | "student_loan"
        | "other"
      notification_method: "in_app" | "email" | "both"
      notification_type:
        | "bill_reminder"
        | "budget_warning"
        | "budget_exceeded"
        | "goal_milestone"
        | "recurring_due"
        | "system"
      payment_method:
        | "cash"
        | "card"
        | "mobile_money"
        | "bank_transfer"
        | "other"
      recurring_frequency: "monthly"
      transaction_type: "income" | "expense"
      user_role: "admin" | "contributor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

type DBSchema = Omit<Database, "__InternalSupabase">

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof DBSchema },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DBSchema
  }
    ? keyof (DBSchema[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DBSchema[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DBSchema
}
  ? (DBSchema[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DBSchema[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof DBSchema },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DBSchema
  }
    ? keyof DBSchema[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DBSchema
}
  ? DBSchema[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof DBSchema },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DBSchema
  }
    ? keyof DBSchema[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DBSchema
}
  ? DBSchema[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof DBSchema },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DBSchema
  }
    ? keyof DBSchema[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DBSchema
}
  ? DBSchema[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof DBSchema },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DBSchema
  }
    ? keyof DBSchema[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DBSchema
}
  ? DBSchema[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// Convenience row-type aliases used across the app
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type HouseholdRow = Database["public"]["Tables"]["households"]["Row"];
export type AccountRow = Database["public"]["Tables"]["accounts"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
export type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];
export type OverallBudgetRow = Database["public"]["Tables"]["overall_budgets"]["Row"];
export type RecurringTransactionRow = Database["public"]["Tables"]["recurring_transactions"]["Row"];
export type SavingsGoalRow = Database["public"]["Tables"]["savings_goals"]["Row"];
export type GoalContributionRow = Database["public"]["Tables"]["goal_contributions"]["Row"];
export type DebtRow = Database["public"]["Tables"]["debts"]["Row"];
export type BillReminderRow = Database["public"]["Tables"]["bill_reminders"]["Row"];
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export const Constants = {
  public: {
    Enums: {
      account_type: ["bank", "mobile_money", "cash", "credit_card", "other"],
      category_type: ["expense", "income", "both"],
      debt_type: [
        "mortgage",
        "car_loan",
        "personal_loan",
        "credit_card",
        "student_loan",
        "other",
      ],
      notification_method: ["in_app", "email", "both"],
      notification_type: [
        "bill_reminder",
        "budget_warning",
        "budget_exceeded",
        "goal_milestone",
        "recurring_due",
        "system",
      ],
      payment_method: [
        "cash",
        "card",
        "mobile_money",
        "bank_transfer",
        "other",
      ],
      recurring_frequency: ["monthly"],
      transaction_type: ["income", "expense"],
      user_role: ["admin", "contributor"],
    },
  },
} as const
