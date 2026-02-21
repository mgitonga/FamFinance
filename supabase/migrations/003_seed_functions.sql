-- FamFin Seed Data
-- Default categories based on spec Appendix A
-- This file is executed per-household when a new user registers

-- Function to seed default categories for a household
CREATE OR REPLACE FUNCTION seed_default_categories(p_household_id UUID)
RETURNS void AS $$
DECLARE
  v_food_id UUID;
  v_dining_id UUID;
  v_housing_id UUID;
  v_transport_id UUID;
  v_healthcare_id UUID;
  v_children_id UUID;
  v_sports_id UUID;
  v_giving_id UUID;
  v_loans_id UUID;
BEGIN
  -- Expense Categories with Sub-categories
  
  -- Food & Groceries
  INSERT INTO categories (id, household_id, name, type, icon, color, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Food & Groceries', 'expense', '🛒', '#22C55E', 1)
  RETURNING id INTO v_food_id;
  
  INSERT INTO categories (household_id, name, parent_id, type, icon, sort_order)
  VALUES 
    (p_household_id, 'Household Goods', v_food_id, 'expense', '🏠', 1),
    (p_household_id, 'Fruit & Veg', v_food_id, 'expense', '🍎', 2);

  -- Dining
  INSERT INTO categories (id, household_id, name, type, icon, color, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Dining', 'expense', '🍽️', '#F59E0B', 2)
  RETURNING id INTO v_dining_id;
  
  INSERT INTO categories (household_id, name, parent_id, type, icon, sort_order)
  VALUES (p_household_id, 'Eating Out', v_dining_id, 'expense', '🍔', 1);

  -- Housing
  INSERT INTO categories (id, household_id, name, type, icon, color, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Housing', 'expense', '🏡', '#3B82F6', 3)
  RETURNING id INTO v_housing_id;
  
  INSERT INTO categories (household_id, name, parent_id, type, icon, sort_order)
  VALUES 
    (p_household_id, 'Rent', v_housing_id, 'expense', '🔑', 1),
    (p_household_id, 'House Repairs', v_housing_id, 'expense', '🔧', 2),
    (p_household_id, 'Hosting', v_housing_id, 'expense', '🛋️', 3);

  -- Transport
  INSERT INTO categories (id, household_id, name, type, icon, color, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Transport', 'expense', '🚗', '#8B5CF6', 4)
  RETURNING id INTO v_transport_id;
  
  INSERT INTO categories (household_id, name, parent_id, type, icon, sort_order)
  VALUES 
    (p_household_id, 'Fuel', v_transport_id, 'expense', '⛽', 1),
    (p_household_id, 'Car Maintenance', v_transport_id, 'expense', '🔧', 2);

  -- Utilities (standalone)
  INSERT INTO categories (household_id, name, type, icon, color, sort_order)
  VALUES (p_household_id, 'Utilities', 'expense', '💡', '#EAB308', 5);

  -- Entertainment (standalone)
  INSERT INTO categories (household_id, name, type, icon, color, sort_order)
  VALUES (p_household_id, 'Entertainment', 'expense', '🎬', '#EC4899', 6);

  -- Healthcare
  INSERT INTO categories (id, household_id, name, type, icon, color, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Healthcare', 'expense', '🏥', '#EF4444', 7)
  RETURNING id INTO v_healthcare_id;
  
  INSERT INTO categories (household_id, name, parent_id, type, icon, sort_order)
  VALUES (p_household_id, 'Medicine', v_healthcare_id, 'expense', '💊', 1);

  -- Children
  INSERT INTO categories (id, household_id, name, type, icon, color, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Children', 'expense', '👶', '#06B6D4', 8)
  RETURNING id INTO v_children_id;
  
  INSERT INTO categories (household_id, name, parent_id, type, icon, sort_order)
  VALUES 
    (p_household_id, 'Child Care', v_children_id, 'expense', '🍼', 1),
    (p_household_id, 'School Fees', v_children_id, 'expense', '🎓', 2),
    (p_household_id, 'School Supplies', v_children_id, 'expense', '📚', 3);

  -- Sports
  INSERT INTO categories (id, household_id, name, type, icon, color, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Sports', 'expense', '⚽', '#10B981', 9)
  RETURNING id INTO v_sports_id;
  
  INSERT INTO categories (household_id, name, parent_id, type, icon, sort_order)
  VALUES (p_household_id, 'Sports Equipment', v_sports_id, 'expense', '🏋️', 1);

  -- Giving
  INSERT INTO categories (id, household_id, name, type, icon, color, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Giving', 'expense', '🎁', '#F472B6', 10)
  RETURNING id INTO v_giving_id;
  
  INSERT INTO categories (household_id, name, parent_id, type, icon, sort_order)
  VALUES (p_household_id, 'EBC Giving', v_giving_id, 'expense', '⛪', 1);

  -- Loans
  INSERT INTO categories (id, household_id, name, type, icon, color, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Loans', 'expense', '💳', '#64748B', 11)
  RETURNING id INTO v_loans_id;
  
  INSERT INTO categories (household_id, name, parent_id, type, icon, sort_order)
  VALUES 
    (p_household_id, 'Qona Loan Repayment', v_loans_id, 'expense', '📝', 1),
    (p_household_id, 'Stima Loan Repayment', v_loans_id, 'expense', '📝', 2),
    (p_household_id, 'Lending', v_loans_id, 'expense', '🤝', 3);

  -- Investment (standalone)
  INSERT INTO categories (household_id, name, type, icon, color, sort_order)
  VALUES (p_household_id, 'Investment', 'expense', '📈', '#0EA5E9', 12);

  -- Income Categories
  INSERT INTO categories (household_id, name, type, icon, color, sort_order)
  VALUES 
    (p_household_id, 'Salary', 'income', '💰', '#22C55E', 13),
    (p_household_id, 'Side Income', 'income', '💵', '#10B981', 14),
    (p_household_id, 'Other Income', 'income', '🎯', '#06B6D4', 15);

  -- Other (both income and expense)
  INSERT INTO categories (household_id, name, type, icon, color, sort_order)
  VALUES (p_household_id, 'Other', 'both', '📦', '#94A3B8', 16);

END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
-- Creates household and seeds categories for first user (admin)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_household_id UUID;
  v_household_name TEXT;
BEGIN
  -- Get household name from metadata or use default
  v_household_name := COALESCE(
    NEW.raw_user_meta_data->>'household_name',
    'My Household'
  );

  -- Create new household
  INSERT INTO households (name, primary_currency)
  VALUES (v_household_name, 'KES')
  RETURNING id INTO v_household_id;

  -- Create user profile
  INSERT INTO users (id, email, name, role, household_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'admin',
    v_household_id
  );

  -- Seed default categories
  PERFORM seed_default_categories(v_household_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to add invited user to existing household
CREATE OR REPLACE FUNCTION add_user_to_household(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_household_id UUID,
  p_role user_role DEFAULT 'contributor'
)
RETURNS void AS $$
BEGIN
  INSERT INTO users (id, email, name, role, household_id)
  VALUES (p_user_id, p_email, p_name, p_role, p_household_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
