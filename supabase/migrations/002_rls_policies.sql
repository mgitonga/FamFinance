-- FamFin Row Level Security Policies
-- Version: 002
-- Description: RLS policies for data isolation by household

-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE overall_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's household_id
CREATE OR REPLACE FUNCTION get_user_household_id()
RETURNS UUID AS $$
  SELECT household_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Households policies
CREATE POLICY "Users can view their own household"
  ON households FOR SELECT
  USING (id = get_user_household_id());

CREATE POLICY "Admins can update their household"
  ON households FOR UPDATE
  USING (id = get_user_household_id() AND is_user_admin());

-- Users policies
CREATE POLICY "Users can view members of their household"
  ON users FOR SELECT
  USING (household_id = get_user_household_id());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can update any user in their household"
  ON users FOR UPDATE
  USING (household_id = get_user_household_id() AND is_user_admin());

CREATE POLICY "System can insert new users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Accounts policies
CREATE POLICY "Users can view accounts in their household"
  ON accounts FOR SELECT
  USING (household_id = get_user_household_id());

CREATE POLICY "Admins can create accounts"
  ON accounts FOR INSERT
  WITH CHECK (household_id = get_user_household_id() AND is_user_admin());

CREATE POLICY "Admins can update accounts"
  ON accounts FOR UPDATE
  USING (household_id = get_user_household_id() AND is_user_admin());

CREATE POLICY "Admins can delete accounts"
  ON accounts FOR DELETE
  USING (household_id = get_user_household_id() AND is_user_admin());

-- Categories policies
CREATE POLICY "Users can view categories in their household"
  ON categories FOR SELECT
  USING (household_id = get_user_household_id());

CREATE POLICY "Admins can create categories"
  ON categories FOR INSERT
  WITH CHECK (household_id = get_user_household_id() AND is_user_admin());

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  USING (household_id = get_user_household_id() AND is_user_admin());

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  USING (household_id = get_user_household_id() AND is_user_admin());

-- Transactions policies
CREATE POLICY "Users can view transactions in their household"
  ON transactions FOR SELECT
  USING (household_id = get_user_household_id());

CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (household_id = get_user_household_id());

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (household_id = get_user_household_id() AND (user_id = auth.uid() OR is_user_admin()));

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (household_id = get_user_household_id() AND (user_id = auth.uid() OR is_user_admin()));

-- Budgets policies
CREATE POLICY "Users can view budgets in their household"
  ON budgets FOR SELECT
  USING (household_id = get_user_household_id());

CREATE POLICY "Admins can manage budgets"
  ON budgets FOR ALL
  USING (household_id = get_user_household_id() AND is_user_admin());

-- Overall budgets policies
CREATE POLICY "Users can view overall budgets in their household"
  ON overall_budgets FOR SELECT
  USING (household_id = get_user_household_id());

CREATE POLICY "Admins can manage overall budgets"
  ON overall_budgets FOR ALL
  USING (household_id = get_user_household_id() AND is_user_admin());

-- Recurring transactions policies
CREATE POLICY "Users can view recurring transactions in their household"
  ON recurring_transactions FOR SELECT
  USING (household_id = get_user_household_id());

CREATE POLICY "Admins can manage recurring transactions"
  ON recurring_transactions FOR ALL
  USING (household_id = get_user_household_id() AND is_user_admin());

-- Savings goals policies
CREATE POLICY "Users can view savings goals in their household"
  ON savings_goals FOR SELECT
  USING (household_id = get_user_household_id());

CREATE POLICY "Admins can manage savings goals"
  ON savings_goals FOR ALL
  USING (household_id = get_user_household_id() AND is_user_admin());

-- Goal contributions policies
CREATE POLICY "Users can view contributions in their household"
  ON goal_contributions FOR SELECT
  USING (goal_id IN (SELECT id FROM savings_goals WHERE household_id = get_user_household_id()));

CREATE POLICY "Users can add contributions"
  ON goal_contributions FOR INSERT
  WITH CHECK (goal_id IN (SELECT id FROM savings_goals WHERE household_id = get_user_household_id()));

-- Debts policies
CREATE POLICY "Users can view debts in their household"
  ON debts FOR SELECT
  USING (household_id = get_user_household_id());

CREATE POLICY "Admins can manage debts"
  ON debts FOR ALL
  USING (household_id = get_user_household_id() AND is_user_admin());

-- Bill reminders policies
CREATE POLICY "Users can view bill reminders in their household"
  ON bill_reminders FOR SELECT
  USING (household_id = get_user_household_id());

CREATE POLICY "Admins can manage bill reminders"
  ON bill_reminders FOR ALL
  USING (household_id = get_user_household_id() AND is_user_admin());

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);
