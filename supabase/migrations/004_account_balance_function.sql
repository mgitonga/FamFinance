-- FamFin Database Migration
-- Version: 004
-- Description: Account balance update function

-- Function to update account balance atomically
CREATE OR REPLACE FUNCTION update_account_balance(
  p_account_id UUID,
  p_amount DECIMAL(15,2)
)
RETURNS VOID AS $$
BEGIN
  UPDATE accounts
  SET balance = balance + p_amount
  WHERE id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION update_account_balance(UUID, DECIMAL) TO authenticated;
