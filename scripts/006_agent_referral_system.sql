-- Agent Referral System
-- All new users are tracked under founder (aams1969) until they qualify

-- Update agent_referrals table to track qualification status
ALTER TABLE agent_referrals 
ADD COLUMN IF NOT EXISTS is_qualified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS qualification_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS qualification_criteria_met JSONB DEFAULT '{}'::jsonb;

-- Create trigger to auto-assign new users to founder
CREATE OR REPLACE FUNCTION assign_to_founder_agent()
RETURNS TRIGGER AS $$
DECLARE
  founder_id UUID;
BEGIN
  -- Get founder user ID
  SELECT id INTO founder_id FROM users WHERE username = 'aams1969' AND role = 'admin';
  
  -- If founder exists and new user is rider or driver, auto-assign
  IF founder_id IS NOT NULL AND NEW.role IN ('rider', 'driver') THEN
    INSERT INTO agent_referrals (
      agent_id,
      referred_user_id,
      referral_type,
      is_qualified,
      created_at
    ) VALUES (
      founder_id,
      NEW.id,
      NEW.role,
      FALSE,
      NOW()
    ) ON CONFLICT (agent_id, referred_user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_assign_founder_agent ON users;
CREATE TRIGGER auto_assign_founder_agent
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION assign_to_founder_agent();

-- Function to check agent qualification criteria
CREATE OR REPLACE FUNCTION check_agent_qualification(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  trip_count INTEGER;
  total_referrals INTEGER;
  referral_trips INTEGER;
BEGIN
  -- Criteria for becoming independent agent:
  -- 1. Must complete at least 50 trips as driver
  -- 2. Must refer at least 10 new users
  -- 3. Referred users must complete at least 100 combined trips
  
  SELECT COUNT(*) INTO trip_count
  FROM trips
  WHERE driver_id = user_uuid AND status = 'completed';
  
  SELECT COUNT(DISTINCT referred_user_id) INTO total_referrals
  FROM agent_referrals
  WHERE agent_id = user_uuid;
  
  SELECT COUNT(*) INTO referral_trips
  FROM trips t
  INNER JOIN agent_referrals ar ON t.rider_id = ar.referred_user_id OR t.driver_id = ar.referred_user_id
  WHERE ar.agent_id = user_uuid AND t.status = 'completed';
  
  RETURN (trip_count >= 50 AND total_referrals >= 10 AND referral_trips >= 100);
END;
$$ LANGUAGE plpgsql;

-- Update user to independent agent when qualified
CREATE OR REPLACE FUNCTION promote_qualified_agents()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT ar.referred_user_id
    FROM agent_referrals ar
    WHERE ar.is_qualified = FALSE
  LOOP
    IF check_agent_qualification(user_record.referred_user_id) THEN
      -- Update referral record
      UPDATE agent_referrals
      SET 
        is_qualified = TRUE,
        qualification_date = NOW(),
        qualification_criteria_met = jsonb_build_object(
          'trips_completed', (SELECT COUNT(*) FROM trips WHERE driver_id = user_record.referred_user_id AND status = 'completed'),
          'referrals_made', (SELECT COUNT(*) FROM agent_referrals WHERE agent_id = user_record.referred_user_id),
          'qualified_at', NOW()
        )
      WHERE referred_user_id = user_record.referred_user_id;
      
      -- Update user role to agent
      UPDATE users
      SET role = 'agent', updated_at = NOW()
      WHERE id = user_record.referred_user_id AND role = 'driver';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Commission distribution view
CREATE OR REPLACE VIEW agent_commission_summary AS
SELECT 
  u.id as agent_id,
  u.username as agent_username,
  ar.is_qualified,
  COUNT(DISTINCT ar.referred_user_id) as total_referrals,
  COUNT(DISTINCT CASE WHEN ar.referral_type = 'rider' THEN ar.referred_user_id END) as rider_referrals,
  COUNT(DISTINCT CASE WHEN ar.referral_type = 'driver' THEN ar.referred_user_id END) as driver_referrals,
  ar.total_trips,
  ar.total_commission,
  CASE 
    WHEN ar.is_qualified THEN 'Independent Agent'
    WHEN u.username = 'aams1969' THEN 'Founder Agent'
    ELSE 'Under Training'
  END as agent_status
FROM users u
LEFT JOIN agent_referrals ar ON u.id = ar.agent_id
WHERE u.role IN ('agent', 'admin')
GROUP BY u.id, u.username, ar.is_qualified, ar.total_trips, ar.total_commission;

-- Insert founder as primary agent if not exists
INSERT INTO users (pi_uid, username, role, status)
VALUES ('aams1969', 'aams1969', 'admin', 'active')
ON CONFLICT (username) DO UPDATE SET role = 'admin';

COMMENT ON TABLE agent_referrals IS 'Tracks all user referrals. New users start under aams1969 until qualified.';
COMMENT ON FUNCTION check_agent_qualification IS 'Checks if user meets criteria: 50 trips, 10 referrals, 100 referral trips';
COMMENT ON FUNCTION promote_qualified_agents IS 'Automatically promotes qualified users to independent agents';
