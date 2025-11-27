-- TEOSPITAXI Database Schema
-- Pi-Native Mobility dApp

-- Users table (riders, drivers, agents)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pi_uid TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('rider', 'driver', 'agent', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  pi_wallet_address TEXT,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_trips INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Driver profiles
CREATE TABLE IF NOT EXISTS driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('taxi', 'bike', 'scooter')),
  vehicle_model TEXT,
  vehicle_plate TEXT UNIQUE NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  license_expiry DATE,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  current_location JSONB,
  is_online BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT FALSE,
  total_earnings DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_number TEXT UNIQUE NOT NULL,
  rider_id UUID REFERENCES users(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('taxi', 'bike_delivery')),
  
  -- Location data
  pickup_location JSONB NOT NULL,
  dropoff_location JSONB NOT NULL,
  pickup_address TEXT,
  dropoff_address TEXT,
  
  -- Pricing
  distance_km DECIMAL(10,2),
  estimated_fare DECIMAL(10,2) NOT NULL,
  final_fare DECIMAL(10,2),
  surge_multiplier DECIMAL(3,2) DEFAULT 1.0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested', 'accepted', 'driver_arriving', 'in_progress', 
    'completed', 'cancelled', 'disputed'
  )),
  
  -- Payment
  payment_intent_id TEXT UNIQUE,
  escrow_amount DECIMAL(10,2),
  treasury_fee DECIMAL(10,2),
  agent_commission DECIMAL(10,2),
  driver_payout DECIMAL(10,2),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'escrowed', 'completed', 'refunded', 'disputed'
  )),
  
  -- Timestamps
  requested_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Ratings
  rider_rating INTEGER CHECK (rider_rating >= 1 AND rider_rating <= 5),
  driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
  rider_feedback TEXT,
  driver_feedback TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  payment_intent_id TEXT UNIQUE NOT NULL,
  pi_payment_id TEXT UNIQUE,
  
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'escrow_fund', 'driver_payout', 'treasury_fee', 'agent_commission', 
    'refund', 'dispute_resolution'
  )),
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'submitted', 'completed', 'failed', 'cancelled'
  )),
  
  pi_transaction_id TEXT,
  blockchain_txid TEXT,
  memo TEXT,
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Disputes
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  filed_by_id UUID REFERENCES users(id),
  filed_against_id UUID REFERENCES users(id),
  
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB,
  
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'under_review', 'resolved', 'rejected'
  )),
  
  resolution TEXT,
  resolved_by_id UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  
  refund_amount DECIMAL(10,2),
  refund_status TEXT CHECK (refund_status IN ('pending', 'approved', 'rejected', 'completed')),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agent referrals
CREATE TABLE IF NOT EXISTS agent_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referral_type TEXT NOT NULL CHECK (referral_type IN ('rider', 'driver')),
  
  total_trips INTEGER DEFAULT 0,
  total_commission DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(agent_id, referred_user_id)
);

-- Platform treasury
CREATE TABLE IF NOT EXISTS treasury_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'trip_fee', 'dispute_penalty', 'subscription', 'withdrawal'
  )),
  
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  
  description TEXT,
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transparency logs (public audit trail)
CREATE TABLE IF NOT EXISTS transparency_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  trip_id UUID REFERENCES trips(id),
  
  description TEXT NOT NULL,
  public_data JSONB NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_pi_uid ON users(pi_uid);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_trips_rider_id ON trips(rider_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_payment_intent_id ON trips(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_trip_id ON payment_transactions(trip_id);
CREATE INDEX IF NOT EXISTS idx_disputes_trip_id ON disputes(trip_id);
CREATE INDEX IF NOT EXISTS idx_agent_referrals_agent_id ON agent_referrals(agent_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE transparency_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transparency_logs (public read)
CREATE POLICY "Transparency logs are viewable by everyone"
  ON transparency_logs FOR SELECT
  USING (true);

-- RLS Policies for users (users can read their own data)
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = pi_uid OR role = 'admin');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = pi_uid);
