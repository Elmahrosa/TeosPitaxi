-- Seed data for TEOSPITAXI

-- Insert TEOS Treasury admin account
INSERT INTO users (pi_uid, username, email, role, status)
VALUES 
  ('TEOS_TREASURY', 'teos_treasury', 'treasury@teospitaxi.com', 'admin', 'active'),
  ('admin_001', 'admin', 'admin@teospitaxi.com', 'admin', 'active')
ON CONFLICT (pi_uid) DO NOTHING;

-- Initialize treasury ledger
INSERT INTO treasury_ledger (transaction_type, amount, balance_after, description)
VALUES ('subscription', 0, 0, 'Treasury initialized')
ON CONFLICT DO NOTHING;

-- Add transparency log for platform launch
INSERT INTO transparency_logs (event_type, description, public_data)
VALUES (
  'platform_launch',
  'TEOSPITAXI platform officially launched',
  jsonb_build_object(
    'version', '1.0.0',
    'launch_date', NOW(),
    'treasury_fee_percentage', 10,
    'agent_commission_percentage', 5
  )
);
