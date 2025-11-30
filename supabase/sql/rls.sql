-- Enable RLS on rides and basic policies
ALTER TABLE IF EXISTS rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow insert for authenticated users" ON rides
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Allow select for owner" ON rides
  FOR SELECT
  USING (user_id = auth.uid());

-- Example: allow server role to perform admin tasks (service_role must be used server-side)
