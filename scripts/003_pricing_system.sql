-- TEOSPITAXI Dynamic Pricing System

-- Pricing Configurations table
CREATE TABLE IF NOT EXISTS pricing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  
  -- Base pricing
  base_fare DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
  per_km_rate DECIMAL(10, 2) NOT NULL DEFAULT 2.00,
  per_minute_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.50,
  minimum_fare DECIMAL(10, 2) NOT NULL DEFAULT 8.00,
  
  -- Fee splits
  treasury_fee_percent DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
  agent_commission_percent DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
  
  -- Promotional settings
  is_promotional BOOLEAN DEFAULT false,
  promotional_discount_percent DECIMAL(5, 2) DEFAULT 0.00,
  promotional_message TEXT,
  
  -- Vehicle type multipliers
  economy_multiplier DECIMAL(5, 2) DEFAULT 1.00,
  comfort_multiplier DECIMAL(5, 2) DEFAULT 1.50,
  premium_multiplier DECIMAL(5, 2) DEFAULT 2.00,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  notes TEXT
);

-- Create index on active pricing
CREATE INDEX idx_pricing_active ON pricing_configs(is_active, valid_from, valid_until);

-- Insert default pricing config
INSERT INTO pricing_configs (
  name, 
  is_active, 
  base_fare, 
  per_km_rate, 
  per_minute_rate, 
  minimum_fare,
  treasury_fee_percent,
  agent_commission_percent,
  notes
) VALUES (
  'Alexandria Standard Pricing',
  true,
  5.00,
  2.00,
  0.50,
  8.00,
  10.00,
  5.00,
  'Default pricing configuration for Alexandria market'
);

-- Insert first month promotional pricing
INSERT INTO pricing_configs (
  name,
  is_active,
  valid_from,
  valid_until,
  base_fare,
  per_km_rate,
  per_minute_rate,
  minimum_fare,
  treasury_fee_percent,
  agent_commission_percent,
  is_promotional,
  promotional_discount_percent,
  promotional_message,
  notes
) VALUES (
  'Launch Month Special - 30% Off',
  false, -- Admin can activate when ready
  NOW(),
  NOW() + INTERVAL '30 days',
  3.50, -- 30% discount on base
  1.40, -- 30% discount per km
  0.35, -- 30% discount per minute
  5.60, -- 30% discount on minimum
  10.00,
  5.00,
  true,
  30.00,
  'Launch Special! Get 30% off all rides for your first month.',
  'First month promotional pricing to drive user adoption'
);

-- Pricing history for audit
CREATE TABLE IF NOT EXISTS pricing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_config_id UUID REFERENCES pricing_configs(id),
  action TEXT NOT NULL, -- 'created', 'activated', 'deactivated', 'updated'
  changed_by TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  previous_values JSONB,
  new_values JSONB,
  notes TEXT
);

-- Function to get active pricing config
CREATE OR REPLACE FUNCTION get_active_pricing()
RETURNS TABLE (
  id UUID,
  name TEXT,
  base_fare DECIMAL,
  per_km_rate DECIMAL,
  per_minute_rate DECIMAL,
  minimum_fare DECIMAL,
  treasury_fee_percent DECIMAL,
  agent_commission_percent DECIMAL,
  is_promotional BOOLEAN,
  promotional_discount_percent DECIMAL,
  promotional_message TEXT,
  economy_multiplier DECIMAL,
  comfort_multiplier DECIMAL,
  premium_multiplier DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.name,
    pc.base_fare,
    pc.per_km_rate,
    pc.per_minute_rate,
    pc.minimum_fare,
    pc.treasury_fee_percent,
    pc.agent_commission_percent,
    pc.is_promotional,
    pc.promotional_discount_percent,
    pc.promotional_message,
    pc.economy_multiplier,
    pc.comfort_multiplier,
    pc.premium_multiplier
  FROM pricing_configs pc
  WHERE pc.is_active = true
    AND pc.valid_from <= NOW()
    AND (pc.valid_until IS NULL OR pc.valid_until > NOW())
  ORDER BY pc.is_promotional DESC, pc.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
