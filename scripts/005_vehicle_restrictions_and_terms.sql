-- TEOSPITAXI Vehicle Restrictions and Terms Acceptance

-- Update driver_profiles to enforce vehicle year restrictions and add vehicle sizes
ALTER TABLE driver_profiles ADD COLUMN IF NOT EXISTS vehicle_year INTEGER;
ALTER TABLE driver_profiles ADD COLUMN IF NOT EXISTS vehicle_size TEXT CHECK (vehicle_size IN ('small', 'medium', 'large', 'bike'));
ALTER TABLE driver_profiles ADD COLUMN IF NOT EXISTS vehicle_category TEXT CHECK (vehicle_category IN ('car', 'bike', 'scooter'));

-- Add constraint to ensure vehicles are 2020 or newer
ALTER TABLE driver_profiles ADD CONSTRAINT vehicle_year_check CHECK (vehicle_year >= 2020);

-- Terms and conditions acceptance
CREATE TABLE IF NOT EXISTS terms_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  terms_type TEXT NOT NULL CHECK (terms_type IN ('service_terms', 'privacy_policy', 'patent_agreement', 'elmahrosa_membership')),
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  UNIQUE(user_id, terms_type, terms_version)
);

CREATE INDEX idx_terms_user_id ON terms_acceptance(user_id);

-- Elmahrosa project profiles (civic engagement tracking)
CREATE TABLE IF NOT EXISTS elmahrosa_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  civic_score INTEGER DEFAULT 0,
  total_contributions INTEGER DEFAULT 0,
  verified_civic_identity BOOLEAN DEFAULT false,
  profile_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User onboarding checklist
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  profile_completed BOOLEAN DEFAULT false,
  terms_accepted BOOLEAN DEFAULT false,
  patent_signed BOOLEAN DEFAULT false,
  pi_wallet_connected BOOLEAN DEFAULT false,
  elmahrosa_joined BOOLEAN DEFAULT false,
  verification_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patent/IP agreement document tracking
CREATE TABLE IF NOT EXISTS patent_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agreement_type TEXT NOT NULL DEFAULT 'platform_ip',
  agreement_version TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signature_hash TEXT,
  ip_address TEXT,
  metadata JSONB,
  UNIQUE(user_id, agreement_type, agreement_version)
);

-- Enable RLS
ALTER TABLE terms_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE elmahrosa_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE patent_agreements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own terms acceptance"
  ON terms_acceptance FOR SELECT
  USING (auth.uid()::text = (SELECT pi_uid FROM users WHERE id = user_id));

CREATE POLICY "Users can insert own terms acceptance"
  ON terms_acceptance FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT pi_uid FROM users WHERE id = user_id));

CREATE POLICY "Users can view own elmahrosa profile"
  ON elmahrosa_profiles FOR SELECT
  USING (auth.uid()::text = (SELECT pi_uid FROM users WHERE id = user_id));

CREATE POLICY "Users can update own elmahrosa profile"
  ON elmahrosa_profiles FOR UPDATE
  USING (auth.uid()::text = (SELECT pi_uid FROM users WHERE id = user_id));
