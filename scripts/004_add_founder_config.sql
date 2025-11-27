-- Add founder and treasury configuration
-- Run this after initial setup to configure founder wallet

-- Insert founder/admin user (aams1969)
INSERT INTO users (id, pi_uid, username, role, is_verified, created_at)
VALUES (
  gen_random_uuid(),
  'aams1969',
  'aams1969',
  'admin',
  true,
  NOW()
)
ON CONFLICT (pi_uid) DO UPDATE
SET role = 'admin', is_verified = true;

-- Update treasury configuration
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Set TEOS Treasury wallet address
INSERT INTO system_config (key, value)
VALUES 
  ('treasury_wallet', 'aams1969'),
  ('founder_username', 'aams1969'),
  ('telegram_channel', 'https://t.me/teospitaxi'),
  ('whatsapp_channel', 'https://wa.me/message/TEOSPITAXI')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();

-- Grant admin privileges to founder
UPDATE users 
SET role = 'admin', is_verified = true
WHERE pi_uid = 'aams1969' OR username = 'aams1969';
