-- FamFin Database Migration
-- Version: 004
-- Description: Account balance update function

-- Function to update account balance atomically
-- Returns the new balance after update
CREATE OR REPLACE FUNCTION update_account_balance(
  p_account_id UUID,
  p_amount DECIMAL(15,2)
)
RETURNS DECIMAL(15,2) AS $$
DECLARE
  v_new_balance DECIMAL(15,2);
BEGIN
  UPDATE accounts
  SET balance = balance + p_amount
  WHERE id = p_account_id
  RETURNING balance INTO v_new_balance;
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION update_account_balance(UUID, DECIMAL) TO authenticated;
