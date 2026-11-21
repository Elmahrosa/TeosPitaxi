-- TEOS PiTaxi — revision 2e release-candidate implementation artifact
-- Consolidated foundation correction migration.
-- Status: not executed; requires explicit migration approval before execution.
-- Frozen migrations 001-006 are not modified by this file. Legacy functions
-- from the frozen set are backed up and replaced only after a dependency check;
-- a dependent object aborts this migration rather than being silently dropped.
-- No credentials are embedded. One CSRF secret is generated inside the database.
-- Business policy/config rows are intentionally not seeded: owner-supplied scale,
-- evidence references, thresholds, pricing bindings, and webhook secrets remain
-- pending. Policy-dependent paths fail closed until that bootstrap is supplied.

BEGIN;

DO $rev2e_preflight$
DECLARE
  r name;
  u name;
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Migration owner must be postgres; current role is %', current_user;
  END IF;

  IF NOT COALESCE((SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user), false) THEN
    RAISE EXCEPTION 'Migration owner must have BYPASSRLS';
  END IF;

  FOREACH u IN ARRAY ARRAY['anon','authenticated','service_role','authenticator']::name[] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = u) THEN
      RAISE EXCEPTION 'Required Supabase role % does not exist', u;
    END IF;
  END LOOP;

  FOREACH r IN ARRAY ARRAY[
    'teospitaxi_payment_verifier',
    'teospitaxi_route_metrics',
    'teospitaxi_maintenance'
  ]::name[] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_roles WHERE rolname = r AND rolcanlogin
    ) THEN
      RAISE EXCEPTION 'Required dedicated LOGIN role % does not exist', r;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = 'teospitaxi_payment_writer'
      AND rolcanlogin = false
      AND rolsuper = false
      AND rolbypassrls = false
      AND rolcreaterole = false
      AND rolcreatedb = false
  ) THEN
    RAISE EXCEPTION 'teospitaxi_payment_writer must exist as NOLOGIN, non-superuser, without BYPASSRLS or object-creation privileges';
  END IF;

  IF has_schema_privilege('teospitaxi_payment_writer', 'public', 'CREATE') THEN
    RAISE EXCEPTION 'teospitaxi_payment_writer must not have CREATE privilege in public';
  END IF;

  FOREACH u IN ARRAY ARRAY['anon','authenticated','service_role','authenticator']::name[] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = u)
       AND pg_has_role(u, 'teospitaxi_payment_writer', 'MEMBER') THEN
      RAISE EXCEPTION 'Role % must not be a member of teospitaxi_payment_writer', u;
    END IF;
  END LOOP;

  FOREACH r IN ARRAY ARRAY[
    'teospitaxi_payment_writer','teospitaxi_payment_verifier',
    'teospitaxi_route_metrics','teospitaxi_maintenance'
  ]::name[] LOOP
    IF (SELECT rolinherit FROM pg_roles WHERE rolname = r) THEN
      RAISE EXCEPTION 'Managed role % must be created with NOINHERIT', r;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_roles p
      WHERE p.rolname <> r
        AND (p.rolsuper OR p.rolbypassrls OR p.rolcreaterole OR p.rolcreatedb)
        AND pg_has_role(r, p.rolname, 'MEMBER')
    ) THEN
      RAISE EXCEPTION 'Managed role % must not inherit from a privileged role', r;
    END IF;
  END LOOP;

  IF to_regprocedure('extensions.digest(text,text)') IS NULL THEN
    RAISE EXCEPTION 'extensions.digest(text,text) is required';
  END IF;

  IF to_regprocedure('extensions.hmac(bytea,bytea,text)') IS NULL THEN
    RAISE EXCEPTION 'extensions.hmac(bytea,bytea,text) is required';
  END IF;

  IF to_regprocedure('extensions.gen_random_bytes(integer)') IS NULL THEN
    RAISE EXCEPTION 'extensions.gen_random_bytes(integer) is required';
  END IF;
END
$rev2e_preflight$;

DO $rev2e_object_preflight$
DECLARE
  obj text;
  fn text;
  managed_tables text[] := ARRAY[
    'rev2e_legacy_backup','rev2e_payment_audit_events','rev2e_payment_config',
    'rev2e_pi_amount_policy','rev2e_route_provider_policy','rev2e_agent_policy',
    'rev2e_service_pricing_policy','rev2e_secret_store','rev2e_rate_limit_events',
    'rev2e_writer_function_allowlist','rev2e_payout_state','pi_browse_evidence',
    'pi_sessions','pi_driver_presence','pi_trip_metrics','pi_route_metric_evidence',
    'pi_payment_quotes','pi_provider_verifications','pi_payment_approvals',
    'pi_payment_settlements','pi_payment_ledger_entries','pi_webhook_secrets',
    'pi_webhook_events'
  ]::text[];
BEGIN
  FOREACH obj IN ARRAY managed_tables LOOP
    IF to_regclass('public.' || obj) IS NOT NULL THEN
      RAISE EXCEPTION 'Managed object public.% already exists; migration aborts on drift', obj;
    END IF;
  END LOOP;

  FOREACH fn IN ARRAY ARRAY[
    'public.rev2e_sha256_hex(text)',
    'public.rev2e_hmac_hex(text,bytea)',
    'public.rev2e_random_hex(integer)',
    'public.rev2e_advisory_key(text,text)',
    'public.rev2e_advisory_lock(text,text)',
    'public.rev2e_assert_session_role(name[])',
    'public.rev2e_active_csrf_secret()',
    'public.rev2e_rotate_csrf_secret()',
    'public.rev2e_assert_role_membership_graph()',
    'public.rev2e_assert_writer_function_inventory()',
    'public.rev2e_pi_payment_quotes_guard()',
    'public.rev2e_pi_payment_quotes_supersede_check()',
    'public.rev2e_append_only_guard()',
    'public.rev2e_pi_payment_approvals_guard()',
    'public.rev2e_pi_webhook_events_guard()',
    'public.rev2e_audit_event(text,text,uuid,text,jsonb)',
    'public.record_pi_browse_evidence(text,timestamptz)',
    'public.create_pi_session(text,text,timestamptz,uuid)',
    'public.rotate_pi_session_with_browse(text,text,timestamptz,uuid)',
    'public.revoke_pi_session(text)',
    'public.rotate_pi_session_csrf(text,bigint)',
    'public.set_pi_session_csrf_hash(text,bigint)',
    'public.verify_pi_session(text)',
    'public.authorize_pi_mutation(text,text,bigint)',
    'public.update_driver_presence(text,boolean,bigint,text,bigint)',
    'public.enforce_rate_limit(text,text,integer,integer)',
    'public.cleanup_rate_limit_events(integer)',
    'public.record_pi_trip_metrics(uuid,text,text,jsonb,text,timestamptz)',
    'public.rev2e_agent_qualifies_for_payment(uuid)',
    'public.create_pi_payment_quote(text,text,bigint,uuid,bigint)',
    'public.record_pi_provider_verification(text,text,text,text,text,bigint,integer,text,text,text)',
    'public.create_pi_payment_approval(text,text,uuid,uuid)',
    'public.claim_pi_payment_completion_lease(text)',
    'public.release_pi_payment_completion_lease(text,uuid)',
    'public.consume_pi_payment_approval(text,uuid,text,uuid,text)',
    'public.mark_pi_payment_quote_expired(uuid)',
    'public.record_pi_webhook_event(text,text,text,text,text,text,text)',
    'public.claim_pi_webhook_event()',
    'public.complete_pi_webhook_event(uuid,uuid)',
    'public.fail_pi_webhook_event(uuid,uuid,text)'
  ]::text[] LOOP
    IF to_regprocedure(fn) IS NOT NULL THEN
      RAISE EXCEPTION 'Managed function % already exists; migration aborts on drift', fn;
    END IF;
  END LOOP;

  FOREACH obj IN ARRAY ARRAY[
    'rev2e_payment_audit_events_intent_idx','rev2e_rate_limit_events_lookup_idx',
    'rev2e_rate_limit_events_cleanup_idx','rev2e_service_pricing_policy_active_key',
    'pi_sessions_one_active_per_user','pi_trip_metrics_current_key',
    'pi_route_metric_evidence_response_key','pi_payment_quotes_quote_hash_key',
    'pi_payment_quotes_one_active_key','pi_provider_verifications_event_key',
    'pi_webhook_events_provider_event_key','pi_webhook_events_claim_idx',
    'pi_webhook_events_payload_key','rev2e_webhook_secret_one_active'
  ]::text[] LOOP
    IF to_regclass('public.' || obj) IS NOT NULL THEN
      RAISE EXCEPTION 'Managed index public.% already exists; migration aborts on drift', obj;
    END IF;
  END LOOP;

  FOREACH obj IN ARRAY ARRAY[
    'rev2e_pi_payment_quotes_guard_trg','rev2e_pi_payment_quotes_supersede_ck',
    'rev2e_provider_verifications_append_trg','rev2e_settlements_append_trg',
    'rev2e_ledger_append_trg','rev2e_legacy_backup_append_trg',
    'rev2e_pi_payment_approvals_guard_trg','rev2e_pi_webhook_events_guard_trg'
  ]::text[] LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_trigger tr
      JOIN pg_class c ON c.oid = tr.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND tr.tgname = obj AND NOT tr.tgisinternal
    ) THEN
      RAISE EXCEPTION 'Managed trigger % already exists; migration aborts on drift', obj;
    END IF;
  END LOOP;

  FOREACH obj IN ARRAY managed_tables LOOP
    FOREACH fn IN ARRAY ARRAY['read','insert','update','delete']::text[] LOOP
      IF EXISTS (
        SELECT 1 FROM pg_policy p
        JOIN pg_class c ON c.oid = p.polrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = obj
          AND p.polname = format('rev2e_writer_%s_%s', fn, obj)
      ) THEN
        RAISE EXCEPTION 'Managed policy % already exists; migration aborts on drift', format('rev2e_writer_%s_%s', fn, obj);
      END IF;
    END LOOP;
  END LOOP;
END
$rev2e_object_preflight$;

DO $rev2e_column_preflight$
DECLARE
  spec record;
  c name;
BEGIN
  FOR spec IN
    SELECT * FROM (VALUES
      ('public.users','id','uuid'),
      ('public.users','pi_uid','text'),
      ('public.users','role','text'),
      ('public.users','status','text'),
      ('public.trips','id','uuid'),
      ('public.trips','rider_id','uuid'),
      ('public.trips','driver_id','uuid'),
      ('public.trips','agent_id','uuid'),
      ('public.trips','service_type','text'),
      ('public.trips','status','text'),
      ('public.trips','distance_km','numeric'),
      ('public.trips','estimated_fare','numeric'),
      ('public.trips','payment_intent_id','text'),
      ('public.trips','payment_status','text'),
      ('public.payment_transactions','id','uuid'),
      ('public.payment_transactions','trip_id','uuid'),
      ('public.payment_transactions','payment_intent_id','text'),
      ('public.payment_transactions','pi_payment_id','text'),
      ('public.payment_transactions','from_user_id','uuid'),
      ('public.payment_transactions','to_user_id','uuid'),
      ('public.payment_transactions','amount','numeric'),
      ('public.payment_transactions','transaction_type','text'),
      ('public.payment_transactions','status','text'),
      ('public.payment_transactions','blockchain_txid','text'),
      ('public.payment_transactions','memo','text'),
      ('public.payment_transactions','metadata','jsonb'),
      ('public.payment_transactions','created_at','timestamp without time zone'),
      ('public.payment_transactions','completed_at','timestamp without time zone'),
      ('public.pricing_configs','id','uuid'),
      ('public.pricing_configs','is_active','boolean'),
      ('public.pricing_configs','is_promotional','boolean'),
      ('public.pricing_configs','base_fare','numeric'),
      ('public.pricing_configs','per_km_rate','numeric'),
      ('public.pricing_configs','per_minute_rate','numeric'),
      ('public.pricing_configs','minimum_fare','numeric'),
      ('public.pricing_configs','valid_from','timestamp with time zone'),
      ('public.pricing_configs','valid_until','timestamp with time zone'),
      ('public.pricing_configs','economy_multiplier','numeric'),
      ('public.pricing_configs','comfort_multiplier','numeric'),
      ('public.pricing_configs','premium_multiplier','numeric'),
      ('public.agent_referrals','agent_id','uuid'),
      ('public.agent_referrals','referred_user_id','uuid'),
      ('public.agent_referrals','created_at','timestamp without time zone'),
      ('public.trips','updated_at','timestamp without time zone')
    ) AS v(table_name, column_name, data_type)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = split_part(spec.table_name, '.', 2)
        AND c.column_name = spec.column_name
        AND c.data_type = spec.data_type
    ) THEN
      RAISE EXCEPTION 'Schema drift: expected column %.% of type %', spec.table_name, spec.column_name, spec.data_type;
    END IF;
  END LOOP;

  IF to_regprocedure('public.check_agent_qualification(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Frozen qualification function public.check_agent_qualification(uuid) is missing';
  END IF;

  FOREACH c IN ARRAY ARRAY[
    'escrow_amount_minor','treasury_fee_minor','agent_commission_minor','driver_payout_minor','payment_minor_unit_scale'
  ]::name[] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = c
    ) THEN
      RAISE EXCEPTION 'Managed column public.trips.% already exists; migration aborts on drift', c;
    END IF;
  END LOOP;

  FOREACH c IN ARRAY ARRAY['amount_minor','minor_unit_scale']::name[] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'payment_transactions' AND column_name = c
    ) THEN
      RAISE EXCEPTION 'Managed column public.payment_transactions.% already exists; migration aborts on drift', c;
    END IF;
  END LOOP;
END
$rev2e_column_preflight$;

CREATE TABLE public.rev2e_legacy_backup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type text NOT NULL CHECK (object_type = 'FUNCTION'),
  object_identity text NOT NULL,
  definition text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rev2e_legacy_backup_unique UNIQUE (object_type, object_identity)
);

DO $backup_legacy_functions$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid AS fn_oid, p.oid::regprocedure AS sig, pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY(ARRAY[
        'promote_qualified_agents',
        'create_pi_payment_quote',
        'create_pi_payment_approval',
        'consume_pi_payment_approval',
        'complete_pi_payment_approval',
        'release_pi_payment_completion_lease',
        'claim_pi_payment_completion_lease',
        'release_pi_payment_approval_lease',
        'mark_pi_payment_approval_approved',
        'record_pi_provider_verification'
      ]::text[])
    ORDER BY p.oid::regprocedure::text
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_depend d
      WHERE d.refobjid = r.fn_oid
        AND d.deptype NOT IN ('i','e')
    ) THEN
      RAISE EXCEPTION
        'Legacy function % has dependent objects; migration aborts instead of dropping them',
        r.sig;
    END IF;

    INSERT INTO public.rev2e_legacy_backup (object_type, object_identity, definition)
    VALUES ('FUNCTION', r.sig::text, r.definition)
    ON CONFLICT (object_type, object_identity) DO NOTHING;

    EXECUTE format('DROP FUNCTION %s', r.sig);
  END LOOP;
END
$backup_legacy_functions$;

CREATE TABLE public.rev2e_payment_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code text NOT NULL CHECK (event_code ~ '^[A-Z][A-Z0-9_]{3,80}$'),
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  trip_id uuid,
  payment_intent_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rev2e_payment_audit_events_intent_idx
  ON public.rev2e_payment_audit_events (payment_intent_id, created_at DESC);

CREATE TABLE public.rev2e_payment_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  config_version uuid NOT NULL DEFAULT gen_random_uuid(),
  minor_unit_scale integer NOT NULL CHECK (minor_unit_scale BETWEEN 0 AND 6),
  quote_max_age_seconds bigint NOT NULL CHECK (quote_max_age_seconds > 0),
  completion_lease_seconds bigint NOT NULL CHECK (completion_lease_seconds > 0),
  webhook_lease_seconds bigint NOT NULL CHECK (webhook_lease_seconds > 0),
  webhook_max_attempts integer NOT NULL CHECK (webhook_max_attempts > 0),
  webhook_replay_tolerance_seconds bigint NOT NULL CHECK (webhook_replay_tolerance_seconds > 0),
  payment_webhook_event_type text NOT NULL CHECK (length(payment_webhook_event_type) BETWEEN 3 AND 80),
  completion_webhook_event_type text NOT NULL CHECK (length(completion_webhook_event_type) BETWEEN 3 AND 80),
  csrf_secret_retention_days integer NOT NULL CHECK (csrf_secret_retention_days > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rev2e_payment_config_webhook_event_types CHECK (
    payment_webhook_event_type <> completion_webhook_event_type
  )
);

CREATE TABLE public.rev2e_pi_amount_policy (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  minor_unit_scale integer NOT NULL CHECK (minor_unit_scale BETWEEN 0 AND 6),
  contract_source text NOT NULL CHECK (contract_source ~ '^[A-Z][A-Z0-9_-]{3,20}:[A-Za-z0-9_.:/-]{8,200}$'),
  approval_evidence_ref text NOT NULL CHECK (length(approval_evidence_ref) >= 8),
  contract_verified_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.rev2e_route_provider_policy (
  provider_key text PRIMARY KEY CHECK (provider_key ~ '^[a-z][a-z0-9_.-]{2,63}$'),
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 2 AND 100),
  is_active boolean NOT NULL DEFAULT true,
  canonical_response_schema text NOT NULL CHECK (canonical_response_schema = 'rev2e_route_v1'),
  max_metrics_age_seconds bigint NOT NULL CHECK (max_metrics_age_seconds > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.rev2e_agent_policy (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  min_driver_trips integer NOT NULL CHECK (min_driver_trips >= 0),
  min_referrals integer NOT NULL CHECK (min_referrals >= 0),
  min_referral_trips integer NOT NULL CHECK (min_referral_trips >= 0),
  effective_from timestamptz NOT NULL,
  approval_evidence_ref text NOT NULL CHECK (length(approval_evidence_ref) >= 8),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.rev2e_service_pricing_policy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type text NOT NULL CHECK (service_type IN ('taxi','bike_delivery')),
  pricing_config_id uuid NOT NULL REFERENCES public.pricing_configs(id) ON DELETE RESTRICT,
  multiplier_key text NOT NULL CHECK (multiplier_key IN ('economy_multiplier','comfort_multiplier','premium_multiplier')),
  is_active boolean NOT NULL DEFAULT true,
  effective_from timestamptz NOT NULL,
  approval_evidence_ref text NOT NULL CHECK (length(approval_evidence_ref) >= 8),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX rev2e_service_pricing_policy_active_key
  ON public.rev2e_service_pricing_policy (service_type)
  WHERE is_active = true;

CREATE TABLE public.rev2e_secret_store (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_type text NOT NULL CHECK (secret_type = 'csrf_hmac'),
  version integer NOT NULL CHECK (version > 0),
  secret bytea NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz,
  CONSTRAINT rev2e_secret_store_version_key UNIQUE (secret_type, version),
  CONSTRAINT rev2e_secret_store_state CHECK (
    (is_active = true AND retired_at IS NULL)
    OR (is_active = false AND retired_at IS NOT NULL)
  )
);

CREATE TABLE public.rev2e_rate_limit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  subject_hash text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rev2e_rate_limit_fields CHECK (
    length(scope) BETWEEN 3 AND 80
    AND subject_hash ~ '^[0-9a-f]{64}$'
  )
);

CREATE INDEX rev2e_rate_limit_events_lookup_idx
  ON public.rev2e_rate_limit_events (scope, subject_hash, occurred_at DESC);

CREATE INDEX rev2e_rate_limit_events_cleanup_idx
  ON public.rev2e_rate_limit_events (occurred_at);

CREATE TABLE public.rev2e_writer_function_allowlist (
  function_identity text PRIMARY KEY,
  purpose text NOT NULL,
  allowed_roles name[] NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rev2e_writer_function_allowlist_roles CHECK (
    cardinality(allowed_roles) > 0
    AND 'teospitaxi_payment_writer' = ANY(allowed_roles)
  )
);

INSERT INTO public.rev2e_writer_function_allowlist (function_identity, purpose, allowed_roles) VALUES
  ('public.rev2e_assert_session_role(name[])', 'Assert a dedicated database LOGIN identity', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier','teospitaxi_route_metrics','teospitaxi_maintenance']::name[]),
  ('public.rev2e_active_csrf_secret()', 'Read the single active CSRF HMAC secret', ARRAY['teospitaxi_payment_writer']::name[]),
  ('public.rev2e_rotate_csrf_secret()', 'Rotate CSRF HMAC secret and prune rate-limit history', ARRAY['teospitaxi_payment_writer','teospitaxi_maintenance']::name[]),
  ('public.rev2e_audit_event(text,text,uuid,text,jsonb)', 'Append payment audit events', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier','teospitaxi_route_metrics','teospitaxi_maintenance']::name[]),
  ('public.record_pi_browse_evidence(text,timestamptz)', 'Persist browse-first evidence', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier']::name[]),
  ('public.create_pi_session(text,text,timestamptz,uuid)', 'Create rider session from verified Pi identity', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier']::name[]),
  ('public.rotate_pi_session_with_browse(text,text,timestamptz,uuid)', 'Rotate rider session with fresh browse evidence', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier']::name[]),
  ('public.revoke_pi_session(text)', 'Revoke rider session', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier']::name[]),
  ('public.rotate_pi_session_csrf(text,bigint)', 'Authoritative CSRF rotation', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier']::name[]),
  ('public.set_pi_session_csrf_hash(text,bigint)', 'Compatibility wrapper over authoritative CSRF rotation', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier']::name[]),
  ('public.verify_pi_session(text)', 'Authenticate a Pi session without granting mutation authority', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier','teospitaxi_route_metrics','teospitaxi_maintenance']::name[]),
  ('public.authorize_pi_mutation(text,text,bigint)', 'Authorize a mutation with CSRF and session state', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier','teospitaxi_route_metrics','teospitaxi_maintenance']::name[]),
  ('public.update_driver_presence(text,boolean,bigint,text,bigint)', 'Bind driver presence to an active CSRF-authorized session', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier']::name[]),
  ('public.enforce_rate_limit(text,text,integer,integer)', 'Sliding-window rate-limit check', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier','teospitaxi_route_metrics','teospitaxi_maintenance']::name[]),
  ('public.cleanup_rate_limit_events(integer)', 'Maintenance-only rate-limit cleanup', ARRAY['teospitaxi_payment_writer','teospitaxi_maintenance']::name[]),
  ('public.record_pi_trip_metrics(uuid,text,text,jsonb,text,timestamptz)', 'Record controlled route metrics', ARRAY['teospitaxi_payment_writer','teospitaxi_route_metrics']::name[]),
  ('public.rev2e_agent_qualifies_for_payment(uuid)', 'Evaluate frozen-006 qualification semantics under approved policy', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier','teospitaxi_route_metrics']::name[]),
  ('public.create_pi_payment_quote(text,text,bigint,uuid,bigint)', 'Create rider payment quotes', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier']::name[]),
  ('public.record_pi_provider_verification(text,text,text,text,text,bigint,integer,text,text,text)', 'Append provider verification evidence', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier']::name[]),
  ('public.create_pi_payment_approval(text,text,uuid,uuid)', 'Create verified payment approvals', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier']::name[]),
  ('public.claim_pi_payment_completion_lease(text)', 'Recover completion leases', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier','teospitaxi_maintenance']::name[]),
  ('public.release_pi_payment_completion_lease(text,uuid)', 'Release active completion leases', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier','teospitaxi_maintenance']::name[]),
  ('public.consume_pi_payment_approval(text,uuid,text,uuid,text)', 'Complete verified payments and post settlement', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier']::name[]),
  ('public.mark_pi_payment_quote_expired(uuid)', 'Move stale quotes to expired state', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier','teospitaxi_maintenance']::name[]),
  ('public.record_pi_webhook_event(text,text,text,text,text,text,text)', 'Append verified webhook events', ARRAY['teospitaxi_payment_writer','teospitaxi_payment_verifier']::name[]),
  ('public.claim_pi_webhook_event()', 'Claim recoverable webhook work', ARRAY['teospitaxi_payment_writer','teospitaxi_maintenance']::name[]),
  ('public.complete_pi_webhook_event(uuid,uuid)', 'Complete webhook work', ARRAY['teospitaxi_payment_writer','teospitaxi_maintenance']::name[]),
  ('public.fail_pi_webhook_event(uuid,uuid,text)', 'Fail or requeue webhook work', ARRAY['teospitaxi_payment_writer','teospitaxi_maintenance']::name[]);

DO $rev2e_writer_function_preflight$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT * FROM public.rev2e_writer_function_allowlist WHERE is_active LOOP
    IF to_regprocedure(r.function_identity) IS NOT NULL THEN
      RAISE EXCEPTION 'Managed writer function % already exists; migration aborts on drift', r.function_identity;
    END IF;
  END LOOP;
END
$rev2e_writer_function_preflight$;

CREATE TABLE public.pi_browse_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  browse_nonce_hash text NOT NULL UNIQUE,
  pi_uid text,
  observed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pi_browse_evidence_hash CHECK (browse_nonce_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT pi_browse_evidence_validity CHECK (expires_at > observed_at)
);

CREATE TABLE public.pi_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  pi_uid text NOT NULL,
  role text NOT NULL CHECK (role IN ('rider','driver','agent','admin')),
  session_token_hash text NOT NULL UNIQUE,
  csrf_hash text NOT NULL,
  csrf_epoch bigint NOT NULL DEFAULT 1 CHECK (csrf_epoch > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired','rotated')),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  -- Rotation retires the old row before inserting its successor, so this
  -- self-reference is checked at commit after the successor row exists.
  successor_id uuid REFERENCES public.pi_sessions(id) ON DELETE SET NULL
    DEFERRABLE INITIALLY DEFERRED,
  browse_evidence_id uuid NOT NULL REFERENCES public.pi_browse_evidence(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pi_sessions_token_hash CHECK (session_token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT pi_sessions_csrf_hash CHECK (csrf_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT pi_sessions_validity CHECK (expires_at > created_at),
  CONSTRAINT pi_sessions_terminal_state CHECK (
    (status = 'active' AND revoked_at IS NULL)
    OR (status IN ('revoked','expired','rotated') AND revoked_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX pi_sessions_one_active_per_user
  ON public.pi_sessions (user_id)
  WHERE status = 'active';

CREATE TABLE public.pi_driver_presence (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE RESTRICT,
  session_id uuid NOT NULL REFERENCES public.pi_sessions(id) ON DELETE RESTRICT,
  is_online boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pi_driver_presence_validity CHECK (expires_at > last_seen_at)
);

CREATE TABLE public.pi_trip_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
  route_provider text NOT NULL,
  provider_response_id text NOT NULL,
  distance_km numeric(10,2) NOT NULL,
  duration_minutes numeric(10,2) NOT NULL,
  metrics_hash text NOT NULL,
  observed_at timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  superseded_at timestamptz,
  CONSTRAINT pi_trip_metrics_range CHECK (
    distance_km >= 0 AND distance_km <= 1000
    AND duration_minutes >= 0 AND duration_minutes <= 10080
  ),
  CONSTRAINT pi_trip_metrics_hash CHECK (metrics_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT pi_trip_metrics_response_id CHECK (provider_response_id ~ '^[A-Za-z0-9_.:-]{8,128}$'),
  CONSTRAINT pi_trip_metrics_validity CHECK (valid_until > observed_at)
);

CREATE UNIQUE INDEX pi_trip_metrics_current_key
  ON public.pi_trip_metrics (trip_id)
  WHERE superseded_at IS NULL;

CREATE TABLE public.pi_route_metric_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id uuid NOT NULL UNIQUE REFERENCES public.pi_trip_metrics(id) ON DELETE RESTRICT,
  provider text NOT NULL,
  provider_response_id text NOT NULL,
  canonical_response jsonb NOT NULL,
  raw_response_hash text NOT NULL,
  observed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pi_route_metric_evidence_hash CHECK (raw_response_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT pi_route_metric_evidence_id CHECK (provider_response_id ~ '^[A-Za-z0-9_.:-]{8,128}$')
);

CREATE UNIQUE INDEX pi_route_metric_evidence_response_key
  ON public.pi_route_metric_evidence (provider, provider_response_id);

CREATE TABLE public.pi_payment_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  pi_uid text NOT NULL,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
  service_type text NOT NULL CHECK (service_type IN ('taxi','bike_delivery')),
  agent_user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT,
  pricing_config_id uuid NOT NULL REFERENCES public.pricing_configs(id) ON DELETE RESTRICT,
  service_pricing_policy_id uuid NOT NULL REFERENCES public.rev2e_service_pricing_policy(id) ON DELETE RESTRICT,
  metrics_id uuid NOT NULL REFERENCES public.pi_trip_metrics(id) ON DELETE RESTRICT,
  metric_evidence_id uuid NOT NULL REFERENCES public.pi_route_metric_evidence(id) ON DELETE RESTRICT,
  payment_intent_id text NOT NULL UNIQUE CHECK (payment_intent_id ~ '^piq_[0-9a-f]{32}$'),
  amount_minor bigint NOT NULL CHECK (amount_minor > 0 AND amount_minor <= 1000000000000),
  driver_amount_minor bigint NOT NULL,
  treasury_amount_minor bigint NOT NULL,
  agent_amount_minor bigint NOT NULL,
  minor_unit_scale integer NOT NULL CHECK (minor_unit_scale BETWEEN 0 AND 6),
  amount_display numeric(38,6) NOT NULL,
  driver_amount_display numeric(38,6) NOT NULL,
  treasury_amount_display numeric(38,6) NOT NULL,
  agent_amount_display numeric(38,6) NOT NULL,
  amount_policy_contract_source text NOT NULL,
  amount_policy_evidence_ref text NOT NULL,
  amount_policy_verified_at timestamptz NOT NULL,
  payment_config_version uuid NOT NULL,
  quote_max_age_seconds bigint NOT NULL CHECK (quote_max_age_seconds > 0),
  quote_hash text NOT NULL CHECK (quote_hash ~ '^[0-9a-f]{64}$'),
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL,
  approved_at timestamptz,
  completed_at timestamptz,
  consumed_at timestamptz,
  failed_at timestamptz,
  superseded_at timestamptz,
  -- Quote replacement retires the old row before inserting its successor;
  -- the deferred cycle-check trigger and this FK are both evaluated at commit.
  replaced_by uuid REFERENCES public.pi_payment_quotes(id) ON DELETE RESTRICT
    DEFERRABLE INITIALLY DEFERRED,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pi_payment_quotes_minor_sum CHECK (
    driver_amount_minor + treasury_amount_minor + agent_amount_minor = amount_minor
  ),
  CONSTRAINT pi_payment_quotes_policy_split CHECK (
    (
      (agent_user_id IS NULL AND amount_minor % 10 = 0)
      OR (agent_user_id IS NOT NULL AND amount_minor % 20 = 0)
    )
    AND treasury_amount_minor = amount_minor / 10
    AND agent_amount_minor = CASE WHEN agent_user_id IS NULL THEN 0 ELSE amount_minor / 20 END
    AND driver_amount_minor = amount_minor - treasury_amount_minor - agent_amount_minor
    AND driver_amount_minor > 0
  ),
  CONSTRAINT pi_payment_quotes_agent_amount CHECK (
    (agent_user_id IS NULL AND agent_amount_minor = 0 AND agent_amount_display = 0)
    OR (agent_user_id IS NOT NULL AND agent_amount_minor > 0 AND agent_amount_display > 0)
  ),
  CONSTRAINT pi_payment_quotes_display_exact CHECK (
    amount_minor = round(amount_display * power(10::numeric, minor_unit_scale))::bigint
    AND driver_amount_minor = round(driver_amount_display * power(10::numeric, minor_unit_scale))::bigint
    AND treasury_amount_minor = round(treasury_amount_display * power(10::numeric, minor_unit_scale))::bigint
    AND agent_amount_minor = round(agent_amount_display * power(10::numeric, minor_unit_scale))::bigint
  ),
  CONSTRAINT pi_payment_quotes_status CHECK (
    status IN ('active','expired','superseded','approved','completed','failed')
  ),
  CONSTRAINT pi_payment_quotes_expiry CHECK (expires_at > created_at),
  CONSTRAINT pi_payment_quotes_state_timestamps CHECK (
    (status = 'active' AND approved_at IS NULL AND completed_at IS NULL AND consumed_at IS NULL AND failed_at IS NULL AND superseded_at IS NULL AND replaced_by IS NULL)
    OR (status = 'expired' AND approved_at IS NULL AND completed_at IS NULL AND consumed_at IS NULL AND failed_at IS NULL AND superseded_at IS NULL AND replaced_by IS NULL)
    OR (status = 'superseded' AND superseded_at IS NOT NULL AND replaced_by IS NOT NULL AND replaced_by <> id AND approved_at IS NULL AND completed_at IS NULL AND consumed_at IS NULL AND failed_at IS NULL)
    OR (status = 'approved' AND approved_at IS NOT NULL AND consumed_at IS NOT NULL AND completed_at IS NULL AND failed_at IS NULL AND superseded_at IS NULL AND replaced_by IS NULL)
    OR (status = 'completed' AND approved_at IS NOT NULL AND consumed_at IS NOT NULL AND completed_at IS NOT NULL AND failed_at IS NULL AND superseded_at IS NULL AND replaced_by IS NULL)
    OR (status = 'failed' AND failed_at IS NOT NULL AND approved_at IS NULL AND completed_at IS NULL AND consumed_at IS NULL AND superseded_at IS NULL AND replaced_by IS NULL)
  )
);

CREATE UNIQUE INDEX pi_payment_quotes_quote_hash_key ON public.pi_payment_quotes (quote_hash);
CREATE UNIQUE INDEX pi_payment_quotes_one_active_key ON public.pi_payment_quotes (trip_id) WHERE status = 'active';

CREATE TABLE public.pi_provider_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'pi' CHECK (provider = 'pi'),
  verification_type text NOT NULL CHECK (verification_type IN ('payment','completion')),
  quote_id uuid NOT NULL REFERENCES public.pi_payment_quotes(id) ON DELETE RESTRICT,
  payment_intent_id text NOT NULL,
  provider_payment_id text NOT NULL,
  provider_event_id text,
  payer_uid text,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  minor_unit_scale integer NOT NULL CHECK (minor_unit_scale BETWEEN 0 AND 6),
  blockchain_txid text,
  payload_hash text NOT NULL CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  raw_body_hash text NOT NULL CHECK (raw_body_hash ~ '^[0-9a-f]{64}$'),
  verified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pi_provider_verifications_ids CHECK (
    length(payment_intent_id) >= 8 AND length(provider_payment_id) >= 8
  )
);

CREATE UNIQUE INDEX pi_provider_verifications_event_key
  ON public.pi_provider_verifications (provider, verification_type, provider_payment_id);

CREATE TABLE public.pi_payment_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL UNIQUE REFERENCES public.pi_payment_quotes(id) ON DELETE RESTRICT,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
  payment_intent_id text NOT NULL UNIQUE,
  request_id uuid NOT NULL,
  rider_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  pi_uid text NOT NULL,
  amount_minor bigint NOT NULL,
  minor_unit_scale integer NOT NULL,
  provider_payment_id text NOT NULL,
  payment_verification_id uuid NOT NULL REFERENCES public.pi_provider_verifications(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('approved','completed','failed','cancelled')),
  completion_lease_token uuid,
  completion_lease_expires_at timestamptz,
  completion_lease_generation bigint NOT NULL DEFAULT 0,
  approved_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pi_payment_approvals_lease CHECK (
    (completion_lease_token IS NULL AND completion_lease_expires_at IS NULL)
    OR (completion_lease_token IS NOT NULL AND completion_lease_expires_at IS NOT NULL)
  ),
  CONSTRAINT pi_payment_approvals_terminal CHECK (
    (status = 'approved' AND completed_at IS NULL AND failed_at IS NULL AND cancelled_at IS NULL)
    OR (status = 'completed' AND completed_at IS NOT NULL AND failed_at IS NULL AND cancelled_at IS NULL)
    OR (status = 'failed' AND failed_at IS NOT NULL AND completed_at IS NULL AND cancelled_at IS NULL)
    OR (status = 'cancelled' AND cancelled_at IS NOT NULL AND completed_at IS NULL AND failed_at IS NULL)
  )
);

CREATE TABLE public.pi_payment_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id uuid NOT NULL UNIQUE REFERENCES public.pi_payment_approvals(id) ON DELETE RESTRICT,
  quote_id uuid NOT NULL UNIQUE REFERENCES public.pi_payment_quotes(id) ON DELETE RESTRICT,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
  payment_intent_id text NOT NULL UNIQUE,
  provider_payment_id text NOT NULL,
  completion_verification_id uuid NOT NULL REFERENCES public.pi_provider_verifications(id) ON DELETE RESTRICT,
  agent_user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT,
  blockchain_txid text NOT NULL,
  amount_minor bigint NOT NULL,
  driver_amount_minor bigint NOT NULL,
  treasury_amount_minor bigint NOT NULL,
  agent_amount_minor bigint NOT NULL,
  minor_unit_scale integer NOT NULL,
  payout_status text NOT NULL DEFAULT 'not_executed' CHECK (payout_status = 'not_executed'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pi_payment_settlements_sum CHECK (
    driver_amount_minor + treasury_amount_minor + agent_amount_minor = amount_minor
  ),
  CONSTRAINT pi_payment_settlements_split CHECK (
    (
      (agent_user_id IS NULL AND amount_minor % 10 = 0)
      OR (agent_user_id IS NOT NULL AND amount_minor % 20 = 0)
    )
    AND treasury_amount_minor = amount_minor / 10
    AND agent_amount_minor = CASE WHEN agent_user_id IS NULL THEN 0 ELSE amount_minor / 20 END
    AND driver_amount_minor = amount_minor - treasury_amount_minor - agent_amount_minor
    AND driver_amount_minor > 0
  )
);

CREATE TABLE public.pi_payment_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id uuid NOT NULL REFERENCES public.pi_payment_settlements(id) ON DELETE RESTRICT,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
  entry_type text NOT NULL CHECK (entry_type IN ('driver_share','treasury_share','agent_share')),
  payee_user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT,
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  minor_unit_scale integer NOT NULL CHECK (minor_unit_scale BETWEEN 0 AND 6),
  payout_status text NOT NULL DEFAULT 'not_executed' CHECK (payout_status = 'not_executed'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pi_payment_ledger_entries_unique UNIQUE (settlement_id, entry_type)
);

-- Append-only ledgers never change payout state. Mutable payout review state is
-- isolated here; automated transfers remain disabled.
CREATE TABLE public.rev2e_payout_state (
  settlement_id uuid NOT NULL UNIQUE REFERENCES public.pi_payment_settlements(id) ON DELETE RESTRICT,
  ledger_entry_id uuid NOT NULL UNIQUE REFERENCES public.pi_payment_ledger_entries(id) ON DELETE RESTRICT,
  payout_status text NOT NULL DEFAULT 'not_executed' CHECK (payout_status IN ('not_executed','pending_review','executed')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pi_webhook_secrets (
  secret_id text PRIMARY KEY,
  secret bytea NOT NULL,
  signature_encoding text NOT NULL CHECK (signature_encoding IN ('hex','base64')),
  signed_payload_template text NOT NULL CHECK (signed_payload_template IN ('raw_body','timestamp_dot_raw_body')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz,
  CONSTRAINT pi_webhook_secrets_state CHECK (
    (is_active = true AND retired_at IS NULL)
    OR (is_active = false AND retired_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX rev2e_webhook_secret_one_active
  ON public.pi_webhook_secrets ((is_active)) WHERE is_active;

CREATE TABLE public.pi_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'pi' CHECK (provider = 'pi'),
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  payment_intent_id text NOT NULL,
  provider_payment_id text NOT NULL,
  payload_hash text NOT NULL CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  raw_body_hash text NOT NULL CHECK (raw_body_hash ~ '^[0-9a-f]{64}$'),
  signature_hash text NOT NULL CHECK (signature_hash ~ '^[0-9a-f]{64}$'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','dead')),
  lease_token uuid,
  lease_expires_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT pi_webhook_events_lease CHECK (
    (lease_token IS NULL AND lease_expires_at IS NULL)
    OR (lease_token IS NOT NULL AND lease_expires_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX pi_webhook_events_provider_event_key ON public.pi_webhook_events (provider, provider_event_id);
CREATE UNIQUE INDEX pi_webhook_events_payload_key ON public.pi_webhook_events (provider, payload_hash);
CREATE INDEX pi_webhook_events_claim_idx ON public.pi_webhook_events (status, lease_expires_at, created_at, id);

-- Provider verification rows are inseparable from an HMAC-verified webhook event.
ALTER TABLE public.pi_provider_verifications
  ADD COLUMN webhook_event_id uuid NOT NULL REFERENCES public.pi_webhook_events(id) ON DELETE RESTRICT;

ALTER TABLE public.trips
  ADD COLUMN escrow_amount_minor bigint,
  ADD COLUMN treasury_fee_minor bigint,
  ADD COLUMN agent_commission_minor bigint,
  ADD COLUMN driver_payout_minor bigint,
  ADD COLUMN payment_minor_unit_scale integer,
  ADD CONSTRAINT trips_payment_minor_scale CHECK (
    payment_minor_unit_scale IS NULL OR payment_minor_unit_scale BETWEEN 0 AND 6
  ),
  ADD CONSTRAINT trips_payment_minor_presence CHECK (
    (escrow_amount_minor IS NULL AND treasury_fee_minor IS NULL AND agent_commission_minor IS NULL AND driver_payout_minor IS NULL AND payment_minor_unit_scale IS NULL)
    OR (escrow_amount_minor IS NOT NULL AND treasury_fee_minor IS NOT NULL AND agent_commission_minor IS NOT NULL AND driver_payout_minor IS NOT NULL AND payment_minor_unit_scale IS NOT NULL)
  );

ALTER TABLE public.payment_transactions
  ADD COLUMN amount_minor bigint,
  ADD COLUMN minor_unit_scale integer,
  ADD CONSTRAINT payment_transactions_minor_scale CHECK (
    minor_unit_scale IS NULL OR minor_unit_scale BETWEEN 0 AND 6
  ),
  ADD CONSTRAINT payment_transactions_minor_presence CHECK (
    (amount_minor IS NULL AND minor_unit_scale IS NULL)
    OR (amount_minor IS NOT NULL AND minor_unit_scale IS NOT NULL)
  );

-- Database-generated CSRF secret: the secret never appears in this artifact and
-- is never returned to a caller. Owner-supplied business policies stay unseeded.
INSERT INTO public.rev2e_secret_store (secret_type, version, secret, is_active)
VALUES ('csrf_hmac', 1, extensions.gen_random_bytes(32), true);

DO $enable_rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'rev2e_legacy_backup','rev2e_payment_audit_events','rev2e_payment_config',
    'rev2e_pi_amount_policy','rev2e_route_provider_policy','rev2e_agent_policy',
    'rev2e_service_pricing_policy','rev2e_secret_store','rev2e_rate_limit_events',
    'rev2e_writer_function_allowlist','rev2e_payout_state','pi_browse_evidence','pi_sessions',
    'pi_driver_presence','pi_trip_metrics','pi_route_metric_evidence',
    'pi_payment_quotes','pi_provider_verifications','pi_payment_approvals',
    'pi_payment_settlements','pi_payment_ledger_entries','pi_webhook_secrets',
    'pi_webhook_events'
  ]::text[] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated, service_role', t);
  END LOOP;
END
$enable_rls$;

GRANT SELECT, INSERT ON TABLE public.rev2e_legacy_backup TO teospitaxi_payment_writer;
GRANT SELECT, INSERT ON TABLE public.rev2e_payment_audit_events TO teospitaxi_payment_writer;
GRANT SELECT ON TABLE public.rev2e_payment_config TO teospitaxi_payment_writer;
GRANT SELECT ON TABLE public.rev2e_pi_amount_policy TO teospitaxi_payment_writer;
GRANT SELECT ON TABLE public.rev2e_route_provider_policy TO teospitaxi_payment_writer;
GRANT SELECT ON TABLE public.rev2e_agent_policy TO teospitaxi_payment_writer;
GRANT SELECT ON TABLE public.rev2e_service_pricing_policy TO teospitaxi_payment_writer;
GRANT SELECT, INSERT, UPDATE ON TABLE public.rev2e_secret_store TO teospitaxi_payment_writer;
GRANT SELECT, INSERT, DELETE ON TABLE public.rev2e_rate_limit_events TO teospitaxi_payment_writer;
GRANT SELECT ON TABLE public.rev2e_writer_function_allowlist TO teospitaxi_payment_writer;
GRANT SELECT, INSERT, UPDATE ON TABLE public.pi_browse_evidence TO teospitaxi_payment_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pi_sessions TO teospitaxi_payment_writer;
GRANT SELECT, INSERT, UPDATE ON TABLE public.pi_driver_presence TO teospitaxi_payment_writer;
GRANT SELECT, INSERT, UPDATE ON TABLE public.pi_trip_metrics TO teospitaxi_payment_writer;
GRANT SELECT, INSERT ON TABLE public.pi_route_metric_evidence TO teospitaxi_payment_writer;
GRANT SELECT, INSERT, UPDATE ON TABLE public.pi_payment_quotes TO teospitaxi_payment_writer;
GRANT SELECT, INSERT ON TABLE public.pi_provider_verifications TO teospitaxi_payment_writer;
GRANT SELECT, INSERT, UPDATE ON TABLE public.pi_payment_approvals TO teospitaxi_payment_writer;
GRANT SELECT, INSERT ON TABLE public.pi_payment_settlements TO teospitaxi_payment_writer;
GRANT SELECT, INSERT ON TABLE public.pi_payment_ledger_entries TO teospitaxi_payment_writer;
GRANT SELECT, INSERT ON TABLE public.pi_webhook_events TO teospitaxi_payment_writer;
GRANT SELECT, INSERT, UPDATE ON TABLE public.rev2e_payout_state TO teospitaxi_payment_writer;
GRANT SELECT ON TABLE public.pi_webhook_secrets TO teospitaxi_payment_writer;

-- Frozen tables: writer-owned definer functions need these privileges; direct
-- application/service-role DML remains revoked by the role graph.
GRANT SELECT ON TABLE public.users TO teospitaxi_payment_writer;
GRANT SELECT, UPDATE ON TABLE public.trips TO teospitaxi_payment_writer;
GRANT SELECT ON TABLE public.agent_referrals TO teospitaxi_payment_writer;
GRANT SELECT ON TABLE public.pricing_configs TO teospitaxi_payment_writer;
GRANT SELECT, INSERT ON TABLE public.payment_transactions TO teospitaxi_payment_writer;

DO $writer_rls_policies$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'rev2e_legacy_backup','rev2e_payment_audit_events','rev2e_payment_config',
    'rev2e_pi_amount_policy','rev2e_route_provider_policy','rev2e_agent_policy',
    'rev2e_service_pricing_policy','rev2e_secret_store','rev2e_rate_limit_events',
    'rev2e_writer_function_allowlist','rev2e_payout_state','pi_browse_evidence','pi_sessions',
    'pi_driver_presence','pi_trip_metrics','pi_route_metric_evidence',
    'pi_payment_quotes','pi_provider_verifications','pi_payment_approvals',
    'pi_payment_settlements','pi_payment_ledger_entries','pi_webhook_secrets','pi_webhook_events',
    'users','trips','agent_referrals','pricing_configs','payment_transactions'
  ]::text[] LOOP
    EXECUTE format(
      'CREATE POLICY rev2e_writer_read_%I ON public.%I FOR SELECT TO teospitaxi_payment_writer USING (true)',
      t, t
    );
  END LOOP;

  FOREACH t IN ARRAY ARRAY[
    'rev2e_legacy_backup','rev2e_payment_audit_events','rev2e_rate_limit_events',
    'rev2e_secret_store','rev2e_payout_state',
    'pi_browse_evidence','pi_sessions','pi_driver_presence',
    'pi_trip_metrics','pi_route_metric_evidence',
    'pi_payment_quotes','pi_provider_verifications','pi_payment_approvals',
    'pi_payment_settlements','pi_payment_ledger_entries','pi_webhook_events',
    'payment_transactions'
  ]::text[] LOOP
    EXECUTE format(
      'CREATE POLICY rev2e_writer_insert_%I ON public.%I FOR INSERT TO teospitaxi_payment_writer WITH CHECK (true)',
      t, t
    );
  END LOOP;

  FOREACH t IN ARRAY ARRAY[
    'rev2e_secret_store','rev2e_payout_state','pi_browse_evidence','pi_sessions',
    'pi_driver_presence','pi_trip_metrics','pi_payment_quotes',
    'pi_payment_approvals','pi_webhook_events','trips'
  ]::text[] LOOP
    EXECUTE format(
      'CREATE POLICY rev2e_writer_update_%I ON public.%I FOR UPDATE TO teospitaxi_payment_writer USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;

  FOREACH t IN ARRAY ARRAY['pi_sessions','rev2e_rate_limit_events']::text[] LOOP
    EXECUTE format(
      'CREATE POLICY rev2e_writer_delete_%I ON public.%I FOR DELETE TO teospitaxi_payment_writer USING (true)',
      t, t
    );
  END LOOP;
END
$writer_rls_policies$;

-- ---------------------------------------------------------------------------
-- Cryptographic and administrative helpers (owned by migration owner)
-- ---------------------------------------------------------------------------

CREATE FUNCTION public.rev2e_sha256_hex(p_value text)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
SET search_path = pg_catalog, public, extensions
AS $fn$
  SELECT encode(extensions.digest(convert_to(p_value, 'UTF8'), 'sha256'), 'hex');
$fn$;

CREATE FUNCTION public.rev2e_hmac_hex(p_message text, p_secret bytea)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
SET search_path = pg_catalog, public, extensions
AS $fn$
  SELECT encode(extensions.hmac(convert_to(p_message, 'UTF8'), p_secret, 'sha256'), 'hex');
$fn$;

CREATE FUNCTION public.rev2e_random_hex(p_bytes integer)
RETURNS text
LANGUAGE sql VOLATILE STRICT PARALLEL UNSAFE
SET search_path = pg_catalog, public, extensions
AS $fn$
  SELECT encode(extensions.gen_random_bytes(least(greatest(p_bytes, 16), 64)), 'hex');
$fn$;

CREATE FUNCTION public.rev2e_advisory_key(p_domain text, p_value text)
RETURNS bigint
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
SET search_path = pg_catalog, public, extensions
AS $fn$
  SELECT ('x' || substr(public.rev2e_sha256_hex(p_domain || '|' || p_value), 1, 16))::bit(64)::bigint;
$fn$;

CREATE FUNCTION public.rev2e_advisory_lock(p_domain text, p_value text)
RETURNS void
LANGUAGE plpgsql VOLATILE STRICT
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  h bigint := public.rev2e_advisory_key(p_domain, p_value);
BEGIN
  PERFORM pg_advisory_xact_lock(
    (h >> 32)::bigint::int,
    CASE
      WHEN (h & 4294967295) > 2147483647 THEN ((h & 4294967295) - 4294967296)::int
      ELSE (h & 4294967295)::int
    END
  );
END
$fn$;

-- Dedicated LOGIN identities only. SET ROLE cannot change session_user, so
-- shared PostgREST, pooler, service-role, application, and postgres identities
-- fail closed even inside SECURITY DEFINER functions.
CREATE FUNCTION public.rev2e_assert_session_role(p_allowed name[])
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
BEGIN
  IF p_allowed IS NULL OR cardinality(p_allowed) = 0 THEN
    RAISE EXCEPTION 'No caller identities are allowed';
  END IF;

  IF session_user IS NULL OR NOT (session_user = ANY(p_allowed)) THEN
    RAISE EXCEPTION 'Dedicated database LOGIN identity required; session_user is %', session_user;
  END IF;
END
$fn$;

CREATE FUNCTION public.rev2e_active_csrf_secret()
RETURNS bytea
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  secret_count integer;
  result bytea;
BEGIN
  PERFORM public.rev2e_assert_session_role(
    ARRAY['teospitaxi_payment_verifier','teospitaxi_route_metrics','teospitaxi_maintenance']::name[]
  );

  SELECT count(*) INTO secret_count
  FROM public.rev2e_secret_store
  WHERE secret_type = 'csrf_hmac' AND is_active = true;

  IF secret_count <> 1 THEN
    RAISE EXCEPTION 'Exactly one active csrf_hmac secret is required; found %', secret_count;
  END IF;

  SELECT secret INTO result
  FROM public.rev2e_secret_store
  WHERE secret_type = 'csrf_hmac' AND is_active = true;

  RETURN result;
END
$fn$;

-- Restricted secret rotation. Returns only a digest, never the secret itself.
CREATE FUNCTION public.rev2e_rotate_csrf_secret()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_config public.rev2e_payment_config%ROWTYPE;
  v_version integer;
  v_secret bytea;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_maintenance']::name[]);

  SELECT * INTO v_config FROM public.rev2e_payment_config WHERE id = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment configuration is missing';
  END IF;

  PERFORM public.rev2e_advisory_lock('csrf_secret', 'rotate');

  SELECT coalesce(max(version), 0) + 1 INTO v_version
  FROM public.rev2e_secret_store
  WHERE secret_type = 'csrf_hmac';
  v_secret := extensions.gen_random_bytes(32);

  UPDATE public.rev2e_secret_store
  SET is_active = false, retired_at = now()
  WHERE secret_type = 'csrf_hmac' AND is_active = true;

  INSERT INTO public.rev2e_secret_store (secret_type, version, secret, is_active)
  VALUES ('csrf_hmac', v_version, v_secret, true);

  DELETE FROM public.rev2e_rate_limit_events
  WHERE occurred_at < now() - (v_config.csrf_secret_retention_days || ' days')::interval;

  -- Retired secrets stay valid for the configured grace window so live sessions
  -- do not lose CSRF authority the instant a secret is rotated.
  DELETE FROM public.rev2e_secret_store
  WHERE secret_type = 'csrf_hmac'
    AND is_active = false
    AND retired_at < now() - (v_config.csrf_secret_retention_days || ' days')::interval;

  RETURN jsonb_build_object(
    'version', v_version,
    'secret_digest', public.rev2e_sha256_hex(encode(v_secret, 'hex'))
  );
END
$fn$;

REVOKE ALL ON FUNCTION public.rev2e_sha256_hex(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rev2e_hmac_hex(text,bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rev2e_random_hex(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rev2e_advisory_key(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rev2e_advisory_lock(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rev2e_active_csrf_secret() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.rev2e_sha256_hex(text) TO teospitaxi_payment_writer;
GRANT EXECUTE ON FUNCTION public.rev2e_hmac_hex(text,bytea) TO teospitaxi_payment_writer;
GRANT EXECUTE ON FUNCTION public.rev2e_random_hex(integer) TO teospitaxi_payment_writer;
GRANT EXECUTE ON FUNCTION public.rev2e_advisory_key(text,text) TO teospitaxi_payment_writer;
GRANT EXECUTE ON FUNCTION public.rev2e_advisory_lock(text,text) TO teospitaxi_payment_writer;
GRANT EXECUTE ON FUNCTION public.rev2e_active_csrf_secret() TO teospitaxi_payment_writer;

-- ---------------------------------------------------------------------------
-- Enforceable role graph and writer-owned function inventory
-- ---------------------------------------------------------------------------

CREATE FUNCTION public.rev2e_assert_role_membership_graph()
RETURNS void
LANGUAGE plpgsql VOLATILE
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  r name;
  u name;
BEGIN
  FOREACH r IN ARRAY ARRAY[
    'teospitaxi_payment_writer','teospitaxi_payment_verifier',
    'teospitaxi_route_metrics','teospitaxi_maintenance'
  ]::name[] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      RAISE EXCEPTION 'Required role % is missing', r;
    END IF;

    IF r <> 'teospitaxi_payment_writer' THEN
      IF NOT (SELECT rolcanlogin FROM pg_roles WHERE rolname = r) THEN
        RAISE EXCEPTION 'Role % must be LOGIN', r;
      END IF;
    ELSE
      IF (SELECT rolcanlogin FROM pg_roles WHERE rolname = r) THEN
        RAISE EXCEPTION 'teospitaxi_payment_writer must be NOLOGIN';
      END IF;
    END IF;

    IF (SELECT rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb FROM pg_roles WHERE rolname = r) THEN
      RAISE EXCEPTION 'Role % must not be superuser, BYPASSRLS, CREATEROLE, or CREATEDB', r;
    END IF;

    IF (SELECT rolinherit FROM pg_roles WHERE rolname = r) THEN
      RAISE EXCEPTION 'Role % must be created with NOINHERIT', r;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_roles p
      WHERE p.rolname <> r
        AND (p.rolsuper OR p.rolbypassrls OR p.rolcreaterole OR p.rolcreatedb)
        AND pg_has_role(r, p.rolname, 'MEMBER')
    ) THEN
      RAISE EXCEPTION 'Role % must not inherit from a privileged role', r;
    END IF;

    IF has_schema_privilege(r, 'public', 'CREATE') THEN
      RAISE EXCEPTION 'Role % must not have CREATE on public', r;
    END IF;
  END LOOP;

  FOREACH u IN ARRAY ARRAY['anon','authenticated','service_role','authenticator']::name[] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = u) THEN
      CONTINUE;
    END IF;

    FOREACH r IN ARRAY ARRAY[
      'teospitaxi_payment_writer','teospitaxi_payment_verifier',
      'teospitaxi_route_metrics','teospitaxi_maintenance'
    ]::name[] LOOP
      IF pg_has_role(u, r, 'MEMBER') THEN
        RAISE EXCEPTION 'Role % must not be a direct or indirect member of %', u, r;
      END IF;
    END LOOP;
  END LOOP;
END
$fn$;

CREATE FUNCTION public.rev2e_assert_writer_function_inventory()
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  r record;
  p oid;
  owner_name name;
  is_definer boolean;
  cfg text;
  opt text;
  src text;
  granted name;
  forbidden name;
BEGIN
  FOR r IN SELECT * FROM public.rev2e_writer_function_allowlist WHERE is_active LOOP
    SELECT pr.oid, ro.rolname, pr.prosecdef, array_to_string(pr.proconfig, ','), pr.prosrc
      INTO p, owner_name, is_definer, cfg, src
    FROM pg_proc pr
    JOIN pg_namespace ns ON ns.oid = pr.pronamespace
    JOIN pg_roles ro ON ro.oid = pr.proowner
    WHERE ns.nspname = 'public'
      AND pr.oid = to_regprocedure(r.function_identity);

    IF p IS NULL THEN
      RAISE EXCEPTION 'Allowlisted function % does not exist', r.function_identity;
    END IF;
    IF owner_name <> 'teospitaxi_payment_writer' THEN
      RAISE EXCEPTION 'Function % owner is %, expected teospitaxi_payment_writer', r.function_identity, owner_name;
    END IF;
    IF NOT is_definer THEN
      RAISE EXCEPTION 'Function % must be SECURITY DEFINER', r.function_identity;
    END IF;
    SELECT setting_value INTO opt
    FROM pg_proc p2, unnest(p2.proconfig) AS setting_value
    WHERE p2.oid = p AND setting_value LIKE 'search_path=%'
    LIMIT 1;

    IF opt IS DISTINCT FROM 'search_path=pg_catalog, public, extensions' THEN
      RAISE EXCEPTION 'Function % has unsafe or missing search_path: %', r.function_identity, coalesce(opt, cfg);
    END IF;

    IF r.function_identity = 'public.rev2e_assert_session_role(name[])' THEN
      IF src NOT LIKE '%session_user%' THEN
        RAISE EXCEPTION 'Session identity helper % does not check session_user', r.function_identity;
      END IF;
    ELSIF src NOT LIKE '%rev2e_assert_session_role%' THEN
      RAISE EXCEPTION 'Function % is missing the dedicated LOGIN identity guard', r.function_identity;
    END IF;

    FOREACH granted IN ARRAY r.allowed_roles LOOP
      IF NOT has_function_privilege(granted, p, 'EXECUTE') THEN
        RAISE EXCEPTION 'Function % is not executable by required role %', r.function_identity, granted;
      END IF;
    END LOOP;

    FOREACH forbidden IN ARRAY ARRAY['anon','authenticated','service_role']::name[] LOOP
      IF has_function_privilege(forbidden, p, 'EXECUTE') THEN
        RAISE EXCEPTION 'Function % must not be executable by %', r.function_identity, forbidden;
      END IF;
    END LOOP;

    IF EXISTS (
      SELECT 1 FROM aclexplode((SELECT proacl FROM pg_proc WHERE oid = p)) a
      WHERE a.grantee = 0 AND a.privilege_type = 'EXECUTE'
    ) THEN
      RAISE EXCEPTION 'Function % must not grant EXECUTE to PUBLIC', r.function_identity;
    END IF;

    p := NULL;
  END LOOP;

  FOR r IN
    SELECT pr.oid AS function_oid
    FROM pg_proc pr
    JOIN pg_namespace ns ON ns.oid = pr.pronamespace
    JOIN pg_roles ro ON ro.oid = pr.proowner
    WHERE ns.nspname = 'public' AND ro.rolname = 'teospitaxi_payment_writer'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.rev2e_writer_function_allowlist
      WHERE to_regprocedure(function_identity) = r.function_oid AND is_active
    ) THEN
      RAISE EXCEPTION 'Writer-owned function % is not allowlisted', r.function_oid::regprocedure;
    END IF;
  END LOOP;
END
$fn$;

REVOKE ALL ON FUNCTION public.rev2e_assert_role_membership_graph() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rev2e_assert_writer_function_inventory() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rev2e_assert_role_membership_graph() TO teospitaxi_maintenance;
GRANT EXECUTE ON FUNCTION public.rev2e_assert_writer_function_inventory() TO teospitaxi_maintenance;

-- ---------------------------------------------------------------------------
-- Fail-closed replacement for frozen automatic promotion
-- ---------------------------------------------------------------------------

CREATE FUNCTION public.promote_qualified_agents()
RETURNS void
LANGUAGE plpgsql VOLATILE
SET search_path = pg_catalog, public
AS $fn$
BEGIN
  RAISE EXCEPTION 'Automatic agent promotion is disabled under revision 2e; use the approved qualification policy path';
END
$fn$;

REVOKE ALL ON FUNCTION public.promote_qualified_agents() FROM PUBLIC, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Immutability and lifecycle guard triggers
-- ---------------------------------------------------------------------------

CREATE FUNCTION public.rev2e_pi_payment_quotes_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  col text;
  immutable text[] := ARRAY[
    'id','rider_user_id','pi_uid','trip_id','service_type','agent_user_id',
    'pricing_config_id','service_pricing_policy_id','metrics_id','metric_evidence_id',
    'payment_intent_id','amount_minor','driver_amount_minor','treasury_amount_minor',
    'agent_amount_minor','minor_unit_scale','amount_display','driver_amount_display',
    'treasury_amount_display','agent_amount_display','amount_policy_contract_source',
    'amount_policy_evidence_ref','amount_policy_verified_at','payment_config_version',
    'quote_max_age_seconds','quote_hash','expires_at','created_at'
  ];
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Payment quotes are append-only';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    FOREACH col IN ARRAY immutable LOOP
      IF to_jsonb(OLD) -> col IS DISTINCT FROM to_jsonb(NEW) -> col THEN
        RAISE EXCEPTION 'Quote column % is immutable', col;
      END IF;
    END LOOP;

    IF OLD.status NOT IN ('active','approved') THEN
      RAISE EXCEPTION 'Quote in terminal state % cannot transition', OLD.status;
    END IF;

    IF OLD.status = 'active' AND NEW.status NOT IN ('active','expired','superseded','failed','approved') THEN
      RAISE EXCEPTION 'Invalid quote transition % -> %', OLD.status, NEW.status;
    END IF;

    IF OLD.status = 'approved' AND NEW.status <> 'completed' THEN
      RAISE EXCEPTION 'Invalid quote transition % -> %', OLD.status, NEW.status;
    END IF;

    IF NEW.status = 'expired' AND now() < OLD.expires_at THEN
      RAISE EXCEPTION 'Active quote cannot be expired before its expiry time';
    END IF;

    IF NEW.status = 'approved'
       AND (NEW.approved_at IS NULL OR NEW.consumed_at IS NULL) THEN
      RAISE EXCEPTION 'Approved quote must carry approval and consumption timestamps';
    END IF;

    IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
      RAISE EXCEPTION 'Completed quote must carry completion timestamp';
    END IF;
  END IF;

  RETURN NEW;
END
$fn$;

CREATE FUNCTION public.rev2e_pi_payment_quotes_supersede_check()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public, extensions
AS $fn$
BEGIN
  IF NEW.status = 'superseded' THEN
    IF NEW.superseded_at IS NULL OR NEW.replaced_by IS NULL OR NEW.replaced_by = OLD.id THEN
      RAISE EXCEPTION 'Superseded quote requires a distinct successor';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.pi_payment_quotes q
      WHERE q.id = NEW.replaced_by
        AND q.status = 'active'
        AND q.trip_id = OLD.trip_id
        AND q.rider_user_id = OLD.rider_user_id
        AND q.replaced_by IS NULL
        AND q.created_at >= OLD.created_at
    ) THEN
      RAISE EXCEPTION 'Quote replacement is invalid or creates a cycle';
    END IF;
  END IF;

  RETURN NULL;
END
$fn$;

CREATE CONSTRAINT TRIGGER rev2e_pi_payment_quotes_supersede_ck
  AFTER UPDATE ON public.pi_payment_quotes
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.rev2e_pi_payment_quotes_supersede_check();

CREATE TRIGGER rev2e_pi_payment_quotes_guard_trg
  BEFORE UPDATE OR DELETE ON public.pi_payment_quotes
  FOR EACH ROW EXECUTE FUNCTION public.rev2e_pi_payment_quotes_guard();

CREATE FUNCTION public.rev2e_append_only_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $fn$
BEGIN
  RAISE EXCEPTION 'Table %.% is append-only under revision 2e', TG_TABLE_SCHEMA, TG_TABLE_NAME;
END
$fn$;

CREATE TRIGGER rev2e_provider_verifications_append_trg
  BEFORE UPDATE OR DELETE ON public.pi_provider_verifications
  FOR EACH ROW EXECUTE FUNCTION public.rev2e_append_only_guard();

CREATE TRIGGER rev2e_settlements_append_trg
  BEFORE UPDATE OR DELETE ON public.pi_payment_settlements
  FOR EACH ROW EXECUTE FUNCTION public.rev2e_append_only_guard();

CREATE TRIGGER rev2e_ledger_append_trg
  BEFORE UPDATE OR DELETE ON public.pi_payment_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.rev2e_append_only_guard();

CREATE TRIGGER rev2e_legacy_backup_append_trg
  BEFORE UPDATE OR DELETE ON public.rev2e_legacy_backup
  FOR EACH ROW EXECUTE FUNCTION public.rev2e_append_only_guard();

CREATE FUNCTION public.rev2e_pi_payment_approvals_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $fn$
DECLARE
  col text;
  immutable text[] := ARRAY[
    'id','quote_id','trip_id','payment_intent_id','request_id','rider_user_id',
    'pi_uid','amount_minor','minor_unit_scale','provider_payment_id',
    'payment_verification_id','approved_at','created_at'
  ];
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Payment approvals are append-only';
  END IF;

  FOREACH col IN ARRAY immutable LOOP
    IF to_jsonb(OLD) -> col IS DISTINCT FROM to_jsonb(NEW) -> col THEN
      RAISE EXCEPTION 'Approval column % is immutable', col;
    END IF;
  END LOOP;

  IF OLD.status <> 'approved' THEN
    RAISE EXCEPTION 'Approval in terminal state % cannot transition', OLD.status;
  END IF;

  IF NEW.status NOT IN ('approved','completed','failed','cancelled') THEN
    RAISE EXCEPTION 'Invalid approval status %', NEW.status;
  END IF;

  RETURN NEW;
END
$fn$;

CREATE TRIGGER rev2e_pi_payment_approvals_guard_trg
  BEFORE UPDATE OR DELETE ON public.pi_payment_approvals
  FOR EACH ROW EXECUTE FUNCTION public.rev2e_pi_payment_approvals_guard();

CREATE FUNCTION public.rev2e_pi_webhook_events_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $fn$
DECLARE
  col text;
  immutable text[] := ARRAY[
    'id','provider','provider_event_id','event_type','payment_intent_id',
    'provider_payment_id','payload_hash','raw_body_hash','signature_hash','created_at'
  ];
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Webhook events are append-only';
  END IF;

  FOREACH col IN ARRAY immutable LOOP
    IF to_jsonb(OLD) -> col IS DISTINCT FROM to_jsonb(NEW) -> col THEN
      RAISE EXCEPTION 'Webhook event column % is immutable', col;
    END IF;
  END LOOP;

  IF OLD.status = 'completed' OR OLD.status = 'dead' THEN
    RAISE EXCEPTION 'Webhook event in terminal state % cannot transition', OLD.status;
  END IF;

  RETURN NEW;
END
$fn$;

CREATE TRIGGER rev2e_pi_webhook_events_guard_trg
  BEFORE UPDATE OR DELETE ON public.pi_webhook_events
  FOR EACH ROW EXECUTE FUNCTION public.rev2e_pi_webhook_events_guard();

-- ---------------------------------------------------------------------------
-- Writer-owned functions. Ownership, grants, and PUBLIC revocation are applied
-- uniformly after all functions have been created; restricted helpers and
-- guard/trigger functions are revoked in the same finalization pass.
-- ---------------------------------------------------------------------------

CREATE FUNCTION public.rev2e_audit_event(
  p_event_code text,
  p_severity text,
  p_trip_id uuid,
  p_payment_intent_id text,
  p_details jsonb
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_id uuid;
BEGIN
  PERFORM public.rev2e_assert_session_role(
    ARRAY['teospitaxi_payment_verifier','teospitaxi_route_metrics','teospitaxi_maintenance']::name[]
  );

  INSERT INTO public.rev2e_payment_audit_events
    (event_code, severity, trip_id, payment_intent_id, details)
  VALUES
    (p_event_code, p_severity, p_trip_id, p_payment_intent_id, coalesce(p_details, '{}'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END
$fn$;

CREATE FUNCTION public.record_pi_browse_evidence(
  p_browse_nonce text,
  p_observed_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_hash text;
  v_id uuid;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_payment_verifier']::name[]);

  IF p_browse_nonce IS NULL OR length(p_browse_nonce) < 32 OR length(p_browse_nonce) > 512 THEN
    RAISE EXCEPTION 'Invalid browse nonce';
  END IF;

  IF p_observed_at IS NULL
     OR p_observed_at < now() - interval '5 minutes'
     OR p_observed_at > now() + interval '1 minute' THEN
    RAISE EXCEPTION 'Browse observation timestamp is outside the accepted window';
  END IF;

  v_hash := public.rev2e_sha256_hex(p_browse_nonce);

  PERFORM public.rev2e_advisory_lock('browse_nonce', v_hash);

  IF EXISTS (
    SELECT 1 FROM public.pi_browse_evidence
    WHERE browse_nonce_hash = v_hash AND consumed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Browse nonce has already been consumed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.pi_browse_evidence
    WHERE browse_nonce_hash = v_hash AND expires_at > now() AND consumed_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Browse nonce is already pending';
  END IF;

  INSERT INTO public.pi_browse_evidence
    (browse_nonce_hash, observed_at, expires_at)
  VALUES
    (v_hash, p_observed_at, p_observed_at + interval '10 minutes')
  RETURNING id INTO v_id;

  PERFORM public.rev2e_audit_event(
    'PI_BROWSE_EVIDENCE_RECORDED', 'info', NULL, NULL,
    jsonb_build_object('browse_evidence_id', v_id, 'observed_at', p_observed_at)
  );

  RETURN v_id;
END
$fn$;

CREATE FUNCTION public.create_pi_session(
  p_pi_uid text,
  p_session_token text,
  p_expires_at timestamptz,
  p_browse_evidence_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_user public.users%ROWTYPE;
  v_token_hash text;
  v_csrf_token text;
  v_csrf_hash text;
  v_epoch bigint := 1;
  v_secret bytea;
  v_id uuid;
  v_browse public.pi_browse_evidence%ROWTYPE;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_payment_verifier']::name[]);

  IF p_pi_uid IS NULL OR length(p_pi_uid) < 3 OR length(p_pi_uid) > 256 THEN
    RAISE EXCEPTION 'Invalid Pi UID';
  END IF;
  IF p_session_token IS NULL OR length(p_session_token) < 32 OR length(p_session_token) > 512 THEN
    RAISE EXCEPTION 'Invalid session token';
  END IF;
  IF p_expires_at IS NULL OR p_expires_at <= now() THEN
    RAISE EXCEPTION 'Session expiry must be in the future';
  END IF;

  v_token_hash := public.rev2e_sha256_hex(p_session_token);

  PERFORM public.rev2e_advisory_lock('session_token', v_token_hash);

  SELECT * INTO v_user FROM public.users WHERE pi_uid = p_pi_uid AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active user maps to the verified Pi UID';
  END IF;

  PERFORM public.rev2e_advisory_lock('driver', v_user.id::text);
  PERFORM public.rev2e_advisory_lock('browse_evidence', p_browse_evidence_id::text);

  SELECT * INTO v_browse FROM public.pi_browse_evidence WHERE id = p_browse_evidence_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Browse evidence is missing';
  END IF;
  IF v_browse.consumed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Browse evidence has already been consumed';
  END IF;
  IF v_browse.expires_at <= now() THEN
    RAISE EXCEPTION 'Browse evidence has expired';
  END IF;
  IF v_browse.pi_uid IS NOT NULL AND v_browse.pi_uid <> p_pi_uid THEN
    RAISE EXCEPTION 'Browse evidence belongs to a different Pi identity';
  END IF;

  UPDATE public.pi_browse_evidence
  SET pi_uid = p_pi_uid, consumed_at = now()
  WHERE id = p_browse_evidence_id;

  UPDATE public.pi_sessions
  SET status = 'revoked', revoked_at = now(), updated_at = now()
  WHERE user_id = v_user.id AND status = 'active';

  v_secret := public.rev2e_active_csrf_secret();
  v_csrf_token := public.rev2e_hmac_hex(
    'teospitaxi-csrf:v2|' || v_token_hash || '|' || v_epoch::text,
    v_secret
  );
  v_csrf_hash := public.rev2e_sha256_hex(v_csrf_token);

  INSERT INTO public.pi_sessions
    (user_id, pi_uid, role, session_token_hash, csrf_hash, csrf_epoch,
     status, expires_at, browse_evidence_id)
  VALUES
    (v_user.id, p_pi_uid, v_user.role, v_token_hash, v_csrf_hash, v_epoch,
     'active', p_expires_at, p_browse_evidence_id)
  RETURNING id INTO v_id;

  PERFORM public.rev2e_audit_event(
    'PI_SESSION_CREATED', 'info', NULL, NULL,
    jsonb_build_object('session_id', v_id, 'user_id', v_user.id, 'role', v_user.role)
  );

  RETURN jsonb_build_object(
    'session_id', v_id,
    'csrf_token', v_csrf_token,
    'csrf_epoch', v_epoch,
    'expires_at', p_expires_at,
    'role', v_user.role
  );
END
$fn$;

CREATE FUNCTION public.rotate_pi_session_with_browse(
  p_old_session_token text,
  p_new_session_token text,
  p_expires_at timestamptz,
  p_browse_evidence_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_old public.pi_sessions%ROWTYPE;
  v_user public.users%ROWTYPE;
  v_browse public.pi_browse_evidence%ROWTYPE;
  v_old_hash text;
  v_new_hash text;
  v_csrf_token text;
  v_csrf_hash text;
  v_epoch bigint;
  v_secret bytea;
  v_new_id uuid;
  v_driver_key uuid;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_payment_verifier']::name[]);

  IF p_old_session_token IS NULL OR length(p_old_session_token) < 32 THEN
    RAISE EXCEPTION 'Invalid current session token';
  END IF;
  IF p_new_session_token IS NULL OR length(p_new_session_token) < 32 THEN
    RAISE EXCEPTION 'Invalid replacement session token';
  END IF;
  IF p_expires_at IS NULL OR p_expires_at <= now() THEN
    RAISE EXCEPTION 'Session expiry must be in the future';
  END IF;

  v_old_hash := public.rev2e_sha256_hex(p_old_session_token);
  v_new_hash := public.rev2e_sha256_hex(p_new_session_token);

  IF v_old_hash = v_new_hash THEN
    RAISE EXCEPTION 'Session rotation requires a new token hash';
  END IF;

  PERFORM public.rev2e_advisory_lock('session_token', v_old_hash);
  PERFORM public.rev2e_advisory_lock('new_session_token', v_new_hash);
  PERFORM public.rev2e_advisory_lock('browse_evidence', p_browse_evidence_id::text);

  SELECT user_id INTO v_driver_key
  FROM public.pi_sessions
  WHERE session_token_hash = v_old_hash;
  IF v_driver_key IS NOT NULL THEN
    PERFORM public.rev2e_advisory_lock('driver', v_driver_key::text);
  END IF;

  SELECT * INTO v_old FROM public.pi_sessions WHERE session_token_hash = v_old_hash FOR UPDATE;
  IF NOT FOUND OR v_old.status <> 'active' OR v_old.expires_at <= now() THEN
    RAISE EXCEPTION 'Current session is not active';
  END IF;

  IF EXISTS (SELECT 1 FROM public.pi_sessions WHERE session_token_hash = v_new_hash) THEN
    RAISE EXCEPTION 'Replacement token hash is already in use';
  END IF;

  SELECT * INTO v_user FROM public.users WHERE id = v_old.user_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session user is no longer active';
  END IF;

  SELECT * INTO v_browse FROM public.pi_browse_evidence WHERE id = p_browse_evidence_id FOR UPDATE;
  IF NOT FOUND OR v_browse.consumed_at IS NOT NULL OR v_browse.expires_at <= now() THEN
    RAISE EXCEPTION 'Fresh browse evidence is required for rotation';
  END IF;
  IF v_browse.pi_uid IS NOT NULL AND v_browse.pi_uid <> v_old.pi_uid THEN
    RAISE EXCEPTION 'Browse evidence belongs to a different Pi identity';
  END IF;

  UPDATE public.pi_browse_evidence
  SET pi_uid = v_old.pi_uid, consumed_at = now()
  WHERE id = p_browse_evidence_id;

  UPDATE public.pi_driver_presence
  SET is_online = false, expires_at = now(), updated_at = now()
  WHERE user_id = v_old.user_id;

  v_epoch := v_old.csrf_epoch + 1;
  v_secret := public.rev2e_active_csrf_secret();
  v_csrf_token := public.rev2e_hmac_hex(
    'teospitaxi-csrf:v2|' || v_new_hash || '|' || v_epoch::text,
    v_secret
  );
  v_csrf_hash := public.rev2e_sha256_hex(v_csrf_token);

  -- Retire the old active row before inserting the successor so the partial
  -- unique index pi_sessions_one_active_per_user is never violated.
  v_new_id := gen_random_uuid();

  UPDATE public.pi_sessions
  SET status = 'rotated', revoked_at = now(), updated_at = now(), successor_id = v_new_id
  WHERE id = v_old.id;

  INSERT INTO public.pi_sessions
    (id, user_id, pi_uid, role, session_token_hash, csrf_hash, csrf_epoch,
     status, expires_at, browse_evidence_id)
  VALUES
    (v_new_id, v_old.user_id, v_old.pi_uid, v_old.role, v_new_hash, v_csrf_hash, v_epoch,
     'active', p_expires_at, p_browse_evidence_id);

  PERFORM public.rev2e_audit_event(
    'PI_SESSION_ROTATED', 'info', NULL, NULL,
    jsonb_build_object('old_session_id', v_old.id, 'new_session_id', v_new_id)
  );

  RETURN jsonb_build_object(
    'session_id', v_new_id,
    'csrf_token', v_csrf_token,
    'csrf_epoch', v_epoch,
    'expires_at', p_expires_at,
    'role', v_old.role
  );
END
$fn$;

CREATE FUNCTION public.revoke_pi_session(p_session_token text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_hash text;
  v_row public.pi_sessions%ROWTYPE;
  v_driver_key uuid;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_payment_verifier']::name[]);

  IF p_session_token IS NULL OR length(p_session_token) < 32 THEN
    RAISE EXCEPTION 'Invalid session token';
  END IF;

  v_hash := public.rev2e_sha256_hex(p_session_token);
  PERFORM public.rev2e_advisory_lock('session_token', v_hash);

  SELECT user_id INTO v_driver_key
  FROM public.pi_sessions
  WHERE session_token_hash = v_hash;
  IF v_driver_key IS NOT NULL THEN
    PERFORM public.rev2e_advisory_lock('driver', v_driver_key::text);
  END IF;

  SELECT * INTO v_row FROM public.pi_sessions WHERE session_token_hash = v_hash FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_row.status = 'active' THEN
    UPDATE public.pi_sessions
    SET status = 'revoked', revoked_at = now(), updated_at = now()
    WHERE id = v_row.id;
  END IF;

  UPDATE public.pi_driver_presence
  SET is_online = false, expires_at = now(), updated_at = now()
  WHERE user_id = v_row.user_id;

  PERFORM public.rev2e_audit_event(
    'PI_SESSION_REVOKED', 'info', NULL, NULL,
    jsonb_build_object('session_id', v_row.id)
  );

  RETURN true;
END
$fn$;

CREATE FUNCTION public.rotate_pi_session_csrf(
  p_session_token text,
  p_expected_epoch bigint
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_row public.pi_sessions%ROWTYPE;
  v_hash text;
  v_new_epoch bigint;
  v_token text;
  v_secret bytea;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_payment_verifier']::name[]);

  IF p_session_token IS NULL OR length(p_session_token) < 32 THEN
    RAISE EXCEPTION 'Invalid session token';
  END IF;
  IF p_expected_epoch IS NULL OR p_expected_epoch < 1 THEN
    RAISE EXCEPTION 'Invalid CSRF epoch';
  END IF;

  v_hash := public.rev2e_sha256_hex(p_session_token);
  PERFORM public.rev2e_advisory_lock('session_token', v_hash);

  SELECT * INTO v_row FROM public.pi_sessions WHERE session_token_hash = v_hash FOR UPDATE;
  IF NOT FOUND OR v_row.status <> 'active' OR v_row.expires_at <= now() THEN
    RAISE EXCEPTION 'Session is not active';
  END IF;
  IF v_row.csrf_epoch <> p_expected_epoch THEN
    RAISE EXCEPTION 'CSRF epoch mismatch';
  END IF;

  v_new_epoch := v_row.csrf_epoch + 1;
  v_secret := public.rev2e_active_csrf_secret();
  v_token := public.rev2e_hmac_hex(
    'teospitaxi-csrf:v2|' || v_hash || '|' || v_new_epoch::text,
    v_secret
  );

  UPDATE public.pi_sessions
  SET csrf_hash = public.rev2e_sha256_hex(v_token),
      csrf_epoch = v_new_epoch,
      updated_at = now()
  WHERE id = v_row.id;

  PERFORM public.rev2e_audit_event(
    'PI_CSRF_ROTATED', 'info', NULL, NULL,
    jsonb_build_object('session_id', v_row.id, 'from_epoch', p_expected_epoch, 'to_epoch', v_new_epoch)
  );

  RETURN jsonb_build_object('csrf_token', v_token, 'csrf_epoch', v_new_epoch);
END
$fn$;

CREATE FUNCTION public.set_pi_session_csrf_hash(
  p_session_token text,
  p_expected_epoch bigint
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_payment_verifier']::name[]);

  RETURN public.rotate_pi_session_csrf(p_session_token, p_expected_epoch);
END
$fn$;

CREATE FUNCTION public.verify_pi_session(p_session_token text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_row public.pi_sessions%ROWTYPE;
  v_user public.users%ROWTYPE;
  v_browse public.pi_browse_evidence%ROWTYPE;
  v_hash text;
BEGIN
  PERFORM public.rev2e_assert_session_role(
    ARRAY['teospitaxi_payment_verifier','teospitaxi_route_metrics','teospitaxi_maintenance']::name[]
  );

  IF p_session_token IS NULL OR length(p_session_token) < 32 THEN
    RAISE EXCEPTION 'Invalid session token';
  END IF;

  v_hash := public.rev2e_sha256_hex(p_session_token);

  SELECT * INTO v_row FROM public.pi_sessions WHERE session_token_hash = v_hash;
  IF NOT FOUND OR v_row.status <> 'active' OR v_row.expires_at <= now() THEN
    RAISE EXCEPTION 'Pi session is not active';
  END IF;

  SELECT * INTO v_user FROM public.users WHERE id = v_row.user_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session user is not active';
  END IF;

  SELECT * INTO v_browse FROM public.pi_browse_evidence WHERE id = v_row.browse_evidence_id;
  IF NOT FOUND OR v_browse.consumed_at IS NULL OR v_browse.expires_at <= now() THEN
    RAISE EXCEPTION 'Session browse evidence is invalid';
  END IF;

  RETURN jsonb_build_object(
    'session_id', v_row.id,
    'user_id', v_row.user_id,
    'pi_uid', v_row.pi_uid,
    'role', v_row.role,
    'csrf_epoch', v_row.csrf_epoch,
    'expires_at', v_row.expires_at
  );
END
$fn$;

CREATE FUNCTION public.authorize_pi_mutation(
  p_session_token text,
  p_csrf_token text,
  p_csrf_epoch bigint
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_auth jsonb;
  v_hash text;
  v_row public.pi_sessions%ROWTYPE;
  v_expected text;
  v_candidate record;
  v_matched boolean := false;
  v_retention_days integer;
  v_token_digest text;
BEGIN
  PERFORM public.rev2e_assert_session_role(
    ARRAY['teospitaxi_payment_verifier','teospitaxi_route_metrics','teospitaxi_maintenance']::name[]
  );

  SELECT csrf_secret_retention_days INTO v_retention_days
  FROM public.rev2e_payment_config WHERE id = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment configuration is missing';
  END IF;

  v_hash := public.rev2e_sha256_hex(p_session_token);
  PERFORM public.rev2e_advisory_lock('session_token', v_hash);

  SELECT * INTO v_row FROM public.pi_sessions WHERE session_token_hash = v_hash FOR UPDATE;
  IF NOT FOUND OR v_row.status <> 'active' OR v_row.expires_at <= now() THEN
    RAISE EXCEPTION 'Pi session is not active';
  END IF;

  v_auth := public.verify_pi_session(p_session_token);

  IF p_csrf_epoch IS NULL OR p_csrf_epoch <> v_row.csrf_epoch THEN
    RAISE EXCEPTION 'CSRF epoch mismatch';
  END IF;

  IF p_csrf_token IS NULL OR p_csrf_token !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invalid CSRF token format';
  END IF;

  v_token_digest := public.rev2e_sha256_hex(p_csrf_token);
  IF public.rev2e_sha256_hex(v_row.csrf_hash)
     IS DISTINCT FROM public.rev2e_sha256_hex(v_token_digest) THEN
    RAISE EXCEPTION 'CSRF verification failed';
  END IF;

  FOR v_candidate IN
    SELECT secret
    FROM public.rev2e_secret_store
    WHERE secret_type = 'csrf_hmac'
      AND (
        is_active
        OR (
          is_active = false
          AND retired_at IS NOT NULL
          AND retired_at >= now() - (v_retention_days || ' days')::interval
        )
      )
  LOOP
    v_expected := public.rev2e_hmac_hex(
      'teospitaxi-csrf:v2|' || v_hash || '|' || v_row.csrf_epoch::text,
      v_candidate.secret
    );
    IF public.rev2e_sha256_hex(p_csrf_token)
       IS NOT DISTINCT FROM public.rev2e_sha256_hex(v_expected) THEN
      v_matched := true;
      EXIT;
    END IF;
  END LOOP;

  IF NOT v_matched THEN
    RAISE EXCEPTION 'CSRF verification failed';
  END IF;

  RETURN (v_auth ->> 'session_id')::uuid;
END
$fn$;

CREATE FUNCTION public.update_driver_presence(
  p_session_token text,
  p_is_online boolean,
  p_freshness_seconds bigint,
  p_csrf_token text,
  p_csrf_epoch bigint
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_auth jsonb;
  v_expires_at timestamptz;
  v_session_id uuid;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_payment_verifier']::name[]);

  IF p_freshness_seconds IS NULL OR p_freshness_seconds < 30 OR p_freshness_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid presence freshness window';
  END IF;

  v_session_id := public.authorize_pi_mutation(
    p_session_token, p_csrf_token, p_csrf_epoch
  );
  v_auth := public.verify_pi_session(p_session_token);
  IF v_auth ->> 'role' <> 'driver' OR v_session_id <> (v_auth ->> 'session_id')::uuid THEN
    RAISE EXCEPTION 'Only driver sessions may update presence';
  END IF;

  PERFORM public.rev2e_advisory_lock('driver', v_auth ->> 'user_id');

  v_expires_at := now() + (p_freshness_seconds || ' seconds')::interval;

  INSERT INTO public.pi_driver_presence
    (user_id, session_id, is_online, last_seen_at, expires_at, updated_at)
  VALUES
    ((v_auth ->> 'user_id')::uuid, (v_auth ->> 'session_id')::uuid,
     coalesce(p_is_online, false), now(), v_expires_at, now())
  ON CONFLICT (user_id) DO UPDATE SET
    session_id = EXCLUDED.session_id,
    is_online = EXCLUDED.is_online,
    last_seen_at = EXCLUDED.last_seen_at,
    expires_at = EXCLUDED.expires_at,
    updated_at = EXCLUDED.updated_at;
END
$fn$;

CREATE FUNCTION public.enforce_rate_limit(
  p_scope text,
  p_subject text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_subject_hash text;
  v_count bigint;
  v_secret bytea;
BEGIN
  PERFORM public.rev2e_assert_session_role(
    ARRAY['teospitaxi_payment_verifier','teospitaxi_route_metrics','teospitaxi_maintenance']::name[]
  );

  IF p_scope IS NULL OR length(p_scope) NOT BETWEEN 3 AND 80 THEN
    RAISE EXCEPTION 'Invalid rate-limit scope';
  END IF;
  IF p_subject IS NULL OR length(p_subject) NOT BETWEEN 1 AND 512 THEN
    RAISE EXCEPTION 'Invalid rate-limit subject';
  END IF;
  IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 10000 THEN
    RAISE EXCEPTION 'Invalid rate-limit limit';
  END IF;
  IF p_window_seconds IS NULL OR p_window_seconds NOT BETWEEN 1 AND 86400 THEN
    RAISE EXCEPTION 'Invalid rate-limit window';
  END IF;

  v_secret := public.rev2e_active_csrf_secret();
  v_subject_hash := public.rev2e_hmac_hex(p_scope || '|' || p_subject, v_secret);

  PERFORM public.rev2e_advisory_lock('rate_limit', v_subject_hash);

  INSERT INTO public.rev2e_rate_limit_events (scope, subject_hash, occurred_at)
  VALUES (p_scope, v_subject_hash, now());

  SELECT count(*) INTO v_count
  FROM public.rev2e_rate_limit_events
  WHERE scope = p_scope
    AND subject_hash = v_subject_hash
    AND occurred_at > now() - (p_window_seconds || ' seconds')::interval;

  RETURN v_count <= p_limit;
END
$fn$;

CREATE FUNCTION public.cleanup_rate_limit_events(p_retention_days integer)
RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_deleted bigint;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_maintenance']::name[]);

  IF p_retention_days IS NULL OR p_retention_days NOT BETWEEN 1 AND 365 THEN
    RAISE EXCEPTION 'Invalid rate-limit retention window';
  END IF;

  DELETE FROM public.rev2e_rate_limit_events
  WHERE occurred_at < now() - (p_retention_days || ' days')::interval;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END
$fn$;

-- ---------------------------------------------------------------------------
-- Server-derived route metrics and agent qualification
-- ---------------------------------------------------------------------------

CREATE FUNCTION public.record_pi_trip_metrics(
  p_trip_id uuid,
  p_provider_key text,
  p_provider_response_id text,
  p_canonical_response jsonb,
  p_raw_response_hash text,
  p_observed_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_policy public.rev2e_route_provider_policy%ROWTYPE;
  v_distance numeric;
  v_duration numeric;
  v_hash text;
  v_metric_id uuid;
  v_response_id text;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_route_metrics']::name[]);

  IF p_trip_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.trips WHERE id = p_trip_id) THEN
    RAISE EXCEPTION 'Trip does not exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.rev2e_route_provider_policy
    WHERE provider_key = p_provider_key AND is_active = true
  ) THEN
    RAISE EXCEPTION 'No active route provider policy for %', p_provider_key;
  END IF;

  SELECT * INTO v_policy
  FROM public.rev2e_route_provider_policy
  WHERE provider_key = p_provider_key AND is_active = true;

  IF p_canonical_response IS NULL
     OR jsonb_typeof(p_canonical_response) <> 'object'
     OR NOT (p_canonical_response ?& ARRAY['response_id','distance_km','duration_minutes']) THEN
    RAISE EXCEPTION 'Canonical route response is missing required fields';
  END IF;

  v_response_id := p_canonical_response ->> 'response_id';
  IF v_response_id IS DISTINCT FROM p_provider_response_id THEN
    RAISE EXCEPTION 'Provider response identity does not match canonical payload';
  END IF;

  IF (p_canonical_response ->> 'distance_km') !~ '^[0-9]+(\.[0-9]+)?$'
     OR (p_canonical_response ->> 'duration_minutes') !~ '^[0-9]+(\.[0-9]+)?$' THEN
    RAISE EXCEPTION 'Canonical route metrics must be non-negative decimal strings';
  END IF;

  v_distance := (p_canonical_response ->> 'distance_km')::numeric;
  v_duration := (p_canonical_response ->> 'duration_minutes')::numeric;

  IF v_distance IS NULL OR v_duration IS NULL
     OR v_distance < 0 OR v_distance > 1000
     OR v_duration < 0 OR v_duration > 10080 THEN
    RAISE EXCEPTION 'Canonical route metrics are outside accepted bounds';
  END IF;

  IF p_raw_response_hash IS NULL OR p_raw_response_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Raw response hash must be lowercase hex SHA-256';
  END IF;

  IF p_observed_at IS NULL
     OR p_observed_at > now() + interval '1 minute'
     OR p_observed_at < now() - (v_policy.max_metrics_age_seconds || ' seconds')::interval THEN
    RAISE EXCEPTION 'Route observation timestamp is outside the accepted window';
  END IF;

  v_hash := public.rev2e_sha256_hex(
    'rev2e_route_v1|' || p_provider_key || '|' || p_provider_response_id || '|' || p_canonical_response::text
  );

  PERFORM public.rev2e_advisory_lock('trip', p_trip_id::text);
  PERFORM public.rev2e_advisory_lock('trip_metrics', p_trip_id::text);
  PERFORM public.rev2e_advisory_lock('provider_response', p_provider_key || '|' || p_provider_response_id);

  UPDATE public.pi_trip_metrics
  SET superseded_at = now()
  WHERE trip_id = p_trip_id AND superseded_at IS NULL;

  INSERT INTO public.pi_trip_metrics
    (trip_id, route_provider, provider_response_id, distance_km, duration_minutes,
     metrics_hash, observed_at, valid_until)
  VALUES
    (p_trip_id, p_provider_key, p_provider_response_id, v_distance, v_duration,
     v_hash, p_observed_at,
     greatest(p_observed_at + interval '10 minutes', now() + interval '5 minutes'))
  RETURNING id INTO v_metric_id;

  INSERT INTO public.pi_route_metric_evidence
    (metric_id, provider, provider_response_id, canonical_response, raw_response_hash, observed_at)
  VALUES
    (v_metric_id, p_provider_key, p_provider_response_id, p_canonical_response, p_raw_response_hash, p_observed_at);

  PERFORM public.rev2e_audit_event(
    'PI_ROUTE_METRICS_RECORDED', 'info', p_trip_id, NULL,
    jsonb_build_object(
      'metric_id', v_metric_id,
      'provider', p_provider_key,
      'provider_response_id', p_provider_response_id,
      'metrics_hash', v_hash,
      'raw_response_hash', p_raw_response_hash
    )
  );

  RETURN v_metric_id;
END
$fn$;

CREATE FUNCTION public.rev2e_agent_qualifies_for_payment(p_agent_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_policy_count integer;
  v_min_trips integer;
  v_min_referrals integer;
  v_min_referral_trips integer;
  v_trip_count integer;
  v_referral_count integer;
  v_referral_trip_count integer;
  v_user public.users%ROWTYPE;
BEGIN
  PERFORM public.rev2e_assert_session_role(
    ARRAY['teospitaxi_payment_verifier','teospitaxi_route_metrics']::name[]
  );

  IF p_agent_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT count(*) INTO v_policy_count
  FROM public.rev2e_agent_policy
  WHERE id = true AND effective_from <= now() AND length(approval_evidence_ref) >= 8;

  IF v_policy_count <> 1 THEN
    RAISE EXCEPTION 'Approved agent qualification policy is missing or ambiguous';
  END IF;

  SELECT * INTO v_user FROM public.users WHERE id = p_agent_user_id AND status = 'active';
  IF NOT FOUND OR v_user.role NOT IN ('agent','admin') THEN
    RETURN false;
  END IF;

  SELECT min_driver_trips, min_referrals, min_referral_trips
  INTO v_min_trips, v_min_referrals, v_min_referral_trips
  FROM public.rev2e_agent_policy WHERE id = true;

  SELECT COUNT(*) INTO v_trip_count
  FROM public.trips
  WHERE driver_id = p_agent_user_id AND status = 'completed';

  SELECT COUNT(DISTINCT referred_user_id) INTO v_referral_count
  FROM public.agent_referrals
  WHERE agent_id = p_agent_user_id;

  SELECT COUNT(DISTINCT t.id) INTO v_referral_trip_count
  FROM public.trips t
  INNER JOIN public.agent_referrals ar
    ON t.rider_id = ar.referred_user_id OR t.driver_id = ar.referred_user_id
  WHERE ar.agent_id = p_agent_user_id AND t.status = 'completed';

  RETURN (
    v_trip_count >= v_min_trips
    AND v_referral_count >= v_min_referrals
    AND v_referral_trip_count >= v_min_referral_trips
  );
END
$fn$;

-- ---------------------------------------------------------------------------
-- Quote creation with complete financial and policy snapshot immutability
-- ---------------------------------------------------------------------------

CREATE FUNCTION public.create_pi_payment_quote(
  p_session_token text,
  p_csrf_token text,
  p_csrf_epoch bigint,
  p_trip_id uuid,
  p_client_request_seq bigint
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_session_id uuid;
  v_auth jsonb;
  v_trip public.trips%ROWTYPE;
  v_metric public.pi_trip_metrics%ROWTYPE;
  v_evidence public.pi_route_metric_evidence%ROWTYPE;
  v_provider public.rev2e_route_provider_policy%ROWTYPE;
  v_amount_policy public.rev2e_pi_amount_policy%ROWTYPE;
  v_config public.rev2e_payment_config%ROWTYPE;
  v_pricing public.pricing_configs%ROWTYPE;
  v_service_policy public.rev2e_service_pricing_policy%ROWTYPE;
  v_policy_count integer;
  v_agent_id uuid;
  v_scale integer;
  v_multiplier numeric;
  v_raw_amount numeric;
  v_amount_minor bigint;
  v_treasury_minor bigint;
  v_agent_minor bigint;
  v_driver_minor bigint;
  v_now timestamptz := now();
  v_expires_at timestamptz;
  v_quote_id uuid := gen_random_uuid();
  v_intent_id text;
  v_quote_hash text;
  v_hash_input jsonb;
  v_old_quote uuid;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_payment_verifier']::name[]);

  -- Take every advisory lock before any row lock. authorize_pi_mutation
  -- re-takes the session-token lock reentrantly after authorization.
  PERFORM public.rev2e_advisory_lock('session_token', public.rev2e_sha256_hex(p_session_token));
  PERFORM public.rev2e_advisory_lock('trip', p_trip_id::text);

  v_session_id := public.authorize_pi_mutation(p_session_token, p_csrf_token, p_csrf_epoch);
  v_auth := public.verify_pi_session(p_session_token);

  SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trip does not exist';
  END IF;
  IF v_trip.rider_id <> (v_auth ->> 'user_id')::uuid THEN
    RAISE EXCEPTION 'Trip does not belong to the authenticated rider';
  END IF;
  IF v_trip.status NOT IN ('requested','accepted') THEN
    RAISE EXCEPTION 'Trip is not in a quotable state';
  END IF;

  SELECT count(*) INTO v_policy_count
  FROM public.rev2e_payment_config WHERE id = true;
  IF v_policy_count <> 1 THEN
    RAISE EXCEPTION 'Payment configuration is missing or ambiguous';
  END IF;
  SELECT * INTO v_config FROM public.rev2e_payment_config WHERE id = true;

  SELECT count(*) INTO v_policy_count
  FROM public.rev2e_pi_amount_policy
  WHERE id = true AND is_active = true AND contract_verified_at <= now()
    AND length(approval_evidence_ref) >= 8;
  IF v_policy_count <> 1 THEN
    RAISE EXCEPTION 'Verified Pi amount policy is missing or ambiguous';
  END IF;
  SELECT * INTO v_amount_policy FROM public.rev2e_pi_amount_policy WHERE id = true;
  IF v_amount_policy.minor_unit_scale <> v_config.minor_unit_scale THEN
    RAISE EXCEPTION 'Pi amount policy scale does not match payment configuration';
  END IF;
  v_scale := v_config.minor_unit_scale;

  SELECT count(*) INTO v_policy_count
  FROM public.rev2e_service_pricing_policy
  WHERE service_type = v_trip.service_type AND is_active = true AND effective_from <= now();
  IF v_policy_count <> 1 THEN
    RAISE EXCEPTION 'No unique active service pricing policy for %', v_trip.service_type;
  END IF;
  SELECT * INTO v_service_policy
  FROM public.rev2e_service_pricing_policy
  WHERE service_type = v_trip.service_type AND is_active = true AND effective_from <= now();

  SELECT * INTO v_pricing FROM public.pricing_configs WHERE id = v_service_policy.pricing_config_id;
  IF NOT FOUND OR v_pricing.is_active IS NOT TRUE OR v_pricing.is_promotional IS TRUE
     OR v_pricing.valid_from > v_now
     OR (v_pricing.valid_until IS NOT NULL AND v_pricing.valid_until <= v_now) THEN
    RAISE EXCEPTION 'Service pricing configuration is inactive, promotional, or outside its validity window';
  END IF;

  SELECT * INTO v_metric
  FROM public.pi_trip_metrics
  WHERE trip_id = p_trip_id AND superseded_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Server-derived route metrics are required';
  END IF;

  SELECT * INTO v_provider
  FROM public.rev2e_route_provider_policy
  WHERE provider_key = v_metric.route_provider AND is_active = true;
  IF NOT FOUND OR v_metric.valid_until <= v_now
     OR v_metric.observed_at < v_now - (v_provider.max_metrics_age_seconds || ' seconds')::interval THEN
    RAISE EXCEPTION 'Route metrics are stale or from an inactive provider';
  END IF;

  SELECT * INTO v_evidence
  FROM public.pi_route_metric_evidence
  WHERE metric_id = v_metric.id;
  IF NOT FOUND
     OR v_evidence.provider <> v_provider.provider_key
     OR v_evidence.provider_response_id <> v_metric.provider_response_id
     OR v_evidence.observed_at <> v_metric.observed_at THEN
    RAISE EXCEPTION 'Canonical route evidence does not match the active metric';
  END IF;

  SELECT ar.agent_id INTO v_agent_id
  FROM public.agent_referrals ar
  JOIN public.users au ON au.id = ar.agent_id
  WHERE ar.referred_user_id = v_trip.rider_id
    AND au.status = 'active'
    AND public.rev2e_agent_qualifies_for_payment(ar.agent_id)
  ORDER BY ar.created_at, ar.agent_id
  LIMIT 1;

  v_multiplier := CASE v_service_policy.multiplier_key
    WHEN 'economy_multiplier' THEN v_pricing.economy_multiplier
    WHEN 'comfort_multiplier' THEN v_pricing.comfort_multiplier
    WHEN 'premium_multiplier' THEN v_pricing.premium_multiplier
    ELSE NULL
  END;
  IF v_multiplier IS NULL OR v_multiplier <= 0 THEN
    RAISE EXCEPTION 'Service pricing multiplier is invalid';
  END IF;

  v_raw_amount := greatest(
    (v_pricing.base_fare
      + v_pricing.per_km_rate * v_metric.distance_km
      + v_pricing.per_minute_rate * v_metric.duration_minutes) * v_multiplier,
    v_pricing.minimum_fare
  );

  v_amount_minor := round(v_raw_amount * power(10::numeric, v_scale))::bigint;
  IF v_amount_minor IS NULL OR v_amount_minor <= 0 OR v_amount_minor > 1000000000000 THEN
    RAISE EXCEPTION 'Calculated Pi amount is outside the accepted range';
  END IF;

  -- Integer minor units are authoritative; require exact divisibility so the
  -- 10%/5% shares need no rounding and the driver receives the remainder.
  IF (v_agent_id IS NULL AND v_amount_minor % 10 <> 0)
     OR (v_agent_id IS NOT NULL AND v_amount_minor % 20 <> 0) THEN
    RAISE EXCEPTION 'Calculated Pi amount is not divisible for an exact policy split';
  END IF;

  v_treasury_minor := v_amount_minor / 10;
  v_agent_minor := CASE WHEN v_agent_id IS NULL THEN 0 ELSE v_amount_minor / 20 END;
  v_driver_minor := v_amount_minor - v_treasury_minor - v_agent_minor;
  IF v_driver_minor <= 0 THEN
    RAISE EXCEPTION 'Calculated driver settlement is invalid';
  END IF;
  IF v_amount_minor::numeric / power(10::numeric, v_scale) > 99999999.99 THEN
    RAISE EXCEPTION 'Calculated Pi amount exceeds the frozen payment_transactions display column';
  END IF;

  v_expires_at := v_now + (v_config.quote_max_age_seconds || ' seconds')::interval;
  v_intent_id := 'piq_' || public.rev2e_random_hex(16);

  v_hash_input := jsonb_build_object(
    'schema', 'rev2e_quote_v1',
    'payment_intent_id', v_intent_id,
    'rider_user_id', v_trip.rider_id,
    'pi_uid', v_auth ->> 'pi_uid',
    'trip_id', p_trip_id,
    'service_type', v_trip.service_type,
    'agent_user_id', v_agent_id,
    'pricing_config_id', v_pricing.id,
    'service_pricing_policy_id', v_service_policy.id,
    'multiplier_key', v_service_policy.multiplier_key,
    'metrics_id', v_metric.id,
    'metric_evidence_id', v_evidence.id,
    'amount_minor', v_amount_minor,
    'driver_amount_minor', v_driver_minor,
    'treasury_amount_minor', v_treasury_minor,
    'agent_amount_minor', v_agent_minor,
    'minor_unit_scale', v_scale,
    'amount_policy_contract_source', v_amount_policy.contract_source,
    'amount_policy_evidence_ref', v_amount_policy.approval_evidence_ref,
    'amount_policy_verified_at', v_amount_policy.contract_verified_at,
    'payment_config_version', v_config.config_version,
    'quote_max_age_seconds', v_config.quote_max_age_seconds,
    'expires_at', v_expires_at,
    'client_request_seq', p_client_request_seq
  );
  v_quote_hash := public.rev2e_sha256_hex(v_hash_input::text);

  SELECT id INTO v_old_quote
  FROM public.pi_payment_quotes
  WHERE trip_id = p_trip_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_old_quote IS NOT NULL THEN
    UPDATE public.pi_payment_quotes
    SET status = 'superseded', superseded_at = v_now, replaced_by = v_quote_id
    WHERE id = v_old_quote;
  END IF;

  INSERT INTO public.pi_payment_quotes
    (id, rider_user_id, pi_uid, trip_id, service_type, agent_user_id,
     pricing_config_id, service_pricing_policy_id, metrics_id, metric_evidence_id,
     payment_intent_id, amount_minor, driver_amount_minor, treasury_amount_minor,
     agent_amount_minor, minor_unit_scale,
     amount_display, driver_amount_display, treasury_amount_display, agent_amount_display,
     amount_policy_contract_source, amount_policy_evidence_ref, amount_policy_verified_at,
     payment_config_version, quote_max_age_seconds, quote_hash, status, expires_at, created_at)
  VALUES
    (v_quote_id, v_trip.rider_id, v_auth ->> 'pi_uid', p_trip_id, v_trip.service_type, v_agent_id,
     v_pricing.id, v_service_policy.id, v_metric.id, v_evidence.id,
     v_intent_id, v_amount_minor, v_driver_minor, v_treasury_minor, v_agent_minor, v_scale,
     v_amount_minor::numeric / power(10::numeric, v_scale),
     v_driver_minor::numeric / power(10::numeric, v_scale),
     v_treasury_minor::numeric / power(10::numeric, v_scale),
     v_agent_minor::numeric / power(10::numeric, v_scale),
     v_amount_policy.contract_source, v_amount_policy.approval_evidence_ref,
     v_amount_policy.contract_verified_at, v_config.config_version,
     v_config.quote_max_age_seconds, v_quote_hash, 'active', v_expires_at, v_now);

  UPDATE public.trips
  SET distance_km = v_metric.distance_km,
      estimated_fare = v_amount_minor::numeric / power(10::numeric, v_scale),
      payment_intent_id = v_intent_id,
      updated_at = v_now
  WHERE id = p_trip_id;

  PERFORM public.rev2e_audit_event(
    'PI_QUOTE_CREATED', 'info', p_trip_id, v_intent_id,
    jsonb_build_object(
      'quote_id', v_quote_id,
      'quote_hash', v_quote_hash,
      'amount_minor', v_amount_minor,
      'minor_unit_scale', v_scale,
      'agent_user_id', v_agent_id,
      'superseded_quote_id', v_old_quote,
      'session_id', v_session_id
    )
  );

  RETURN jsonb_build_object(
    'quote_id', v_quote_id,
    'payment_intent_id', v_intent_id,
    'amount_minor', v_amount_minor,
    'minor_unit_scale', v_scale,
    'amount_display', v_amount_minor::numeric / power(10::numeric, v_scale),
    'driver_amount_minor', v_driver_minor,
    'treasury_amount_minor', v_treasury_minor,
    'agent_amount_minor', v_agent_minor,
    'agent_user_id', v_agent_id,
    'expires_at', v_expires_at,
    'quote_hash', v_quote_hash
  );
END
$fn$;

CREATE FUNCTION public.mark_pi_payment_quote_expired(p_quote_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_quote public.pi_payment_quotes%ROWTYPE;
BEGIN
  PERFORM public.rev2e_assert_session_role(
    ARRAY['teospitaxi_payment_verifier','teospitaxi_maintenance']::name[]
  );

  PERFORM public.rev2e_advisory_lock('quote', p_quote_id::text);

  SELECT * INTO v_quote FROM public.pi_payment_quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_quote.status = 'active' AND now() >= v_quote.expires_at THEN
    UPDATE public.pi_payment_quotes SET status = 'expired' WHERE id = p_quote_id;
    PERFORM public.rev2e_audit_event(
      'PI_QUOTE_EXPIRED', 'info', v_quote.trip_id, v_quote.payment_intent_id,
      jsonb_build_object('quote_id', p_quote_id)
    );
    RETURN true;
  END IF;

  RETURN false;
END
$fn$;

-- ---------------------------------------------------------------------------
-- Append-only provider verification evidence
-- ---------------------------------------------------------------------------

CREATE FUNCTION public.record_pi_provider_verification(
  p_payment_intent_id text,
  p_provider_payment_id text,
  p_provider_event_id text,
  p_payer_uid text,
  p_blockchain_txid text,
  p_amount_minor bigint,
  p_minor_unit_scale integer,
  p_payload_hash text,
  p_raw_body_hash text,
  p_verification_type text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_quote public.pi_payment_quotes%ROWTYPE;
  v_existing public.pi_provider_verifications%ROWTYPE;
  v_webhook public.pi_webhook_events%ROWTYPE;
  v_config public.rev2e_payment_config%ROWTYPE;
  v_event_type text;
  v_id uuid;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_payment_verifier']::name[]);

  IF p_payment_intent_id IS NULL OR length(p_payment_intent_id) < 8 THEN
    RAISE EXCEPTION 'Invalid payment intent';
  END IF;
  IF p_provider_payment_id IS NULL OR length(p_provider_payment_id) < 8 THEN
    RAISE EXCEPTION 'Invalid provider payment id';
  END IF;
  IF p_verification_type NOT IN ('payment','completion') THEN
    RAISE EXCEPTION 'Invalid verification type';
  END IF;
  IF p_payload_hash !~ '^[0-9a-f]{64}$' OR p_raw_body_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Verification hashes must be lowercase hex SHA-256';
  END IF;
  IF p_amount_minor IS NULL OR p_amount_minor <= 0
     OR p_minor_unit_scale IS NULL OR p_minor_unit_scale NOT BETWEEN 0 AND 6 THEN
    RAISE EXCEPTION 'Invalid verified amount';
  END IF;

  PERFORM public.rev2e_advisory_lock('payment_intent', p_payment_intent_id);
  PERFORM public.rev2e_advisory_lock('provider_payment', p_provider_payment_id);

  SELECT * INTO v_quote
  FROM public.pi_payment_quotes
  WHERE payment_intent_id = p_payment_intent_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote for payment intent does not exist';
  END IF;

  IF v_quote.status NOT IN ('active','approved') THEN
    RAISE EXCEPTION 'Quote is not in a verifiable state';
  END IF;
  IF v_quote.status = 'active' AND v_quote.expires_at <= now() THEN
    RAISE EXCEPTION 'Quote has expired';
  END IF;
  IF v_quote.amount_minor <> p_amount_minor OR v_quote.minor_unit_scale <> p_minor_unit_scale THEN
    RAISE EXCEPTION 'Verified amount does not match the quote';
  END IF;
  IF v_quote.pi_uid IS DISTINCT FROM p_payer_uid THEN
    RAISE EXCEPTION 'Verified payer does not match the quoted Pi identity';
  END IF;

  SELECT * INTO v_config FROM public.rev2e_payment_config WHERE id = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment configuration is missing';
  END IF;

  v_event_type := CASE p_verification_type
    WHEN 'payment' THEN v_config.payment_webhook_event_type
    WHEN 'completion' THEN v_config.completion_webhook_event_type
  END;

  SELECT * INTO v_webhook
  FROM public.pi_webhook_events
  WHERE provider = 'pi'
    AND provider_event_id IS NOT DISTINCT FROM p_provider_event_id
    AND event_type = v_event_type
    AND payment_intent_id = p_payment_intent_id
    AND provider_payment_id = p_provider_payment_id
    AND payload_hash = p_payload_hash
    AND raw_body_hash = p_raw_body_hash
    AND status = 'completed';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'HMAC-verified webhook evidence is required for provider verification';
  END IF;

  SELECT * INTO v_existing
  FROM public.pi_provider_verifications
  WHERE provider = 'pi'
    AND verification_type = p_verification_type
    AND provider_payment_id = p_provider_payment_id;

  IF FOUND THEN
    IF v_existing.quote_id = v_quote.id
       AND v_existing.payment_intent_id = p_payment_intent_id
       AND v_existing.provider_event_id IS NOT DISTINCT FROM p_provider_event_id
       AND v_existing.payer_uid IS NOT DISTINCT FROM p_payer_uid
       AND v_existing.amount_minor = p_amount_minor
       AND v_existing.minor_unit_scale = p_minor_unit_scale
       AND v_existing.blockchain_txid IS NOT DISTINCT FROM p_blockchain_txid
       AND v_existing.payload_hash = p_payload_hash
       AND v_existing.raw_body_hash = p_raw_body_hash
       AND v_existing.webhook_event_id = v_webhook.id THEN
      PERFORM public.rev2e_audit_event(
        'PI_VERIFICATION_DUPLICATE_IDENTICAL', 'info', v_quote.trip_id, p_payment_intent_id,
        jsonb_build_object('verification_id', v_existing.id, 'verification_type', p_verification_type)
      );
      RETURN jsonb_build_object(
        'status', 'duplicate_identical',
        'verification_id', v_existing.id
      );
    END IF;

    PERFORM public.rev2e_audit_event(
      'PI_VERIFICATION_CONFLICT', 'critical', v_quote.trip_id, p_payment_intent_id,
      jsonb_build_object(
        'verification_id', v_existing.id,
        'verification_type', p_verification_type,
        'provider_payment_id', p_provider_payment_id
      )
    );
    RETURN jsonb_build_object('status', 'conflict', 'verification_id', v_existing.id);
  END IF;

  INSERT INTO public.pi_provider_verifications
    (quote_id, payment_intent_id, provider_payment_id, provider_event_id, payer_uid,
     amount_minor, minor_unit_scale, blockchain_txid, payload_hash, raw_body_hash,
     webhook_event_id, verification_type)
  VALUES
    (v_quote.id, p_payment_intent_id, p_provider_payment_id, p_provider_event_id, p_payer_uid,
     p_amount_minor, p_minor_unit_scale, p_blockchain_txid, p_payload_hash, p_raw_body_hash,
     v_webhook.id, p_verification_type)
  RETURNING id INTO v_id;

  PERFORM public.rev2e_audit_event(
    'PI_VERIFICATION_RECORDED', 'info', v_quote.trip_id, p_payment_intent_id,
    jsonb_build_object('verification_id', v_id, 'verification_type', p_verification_type)
  );

  RETURN jsonb_build_object('status', 'recorded', 'verification_id', v_id);
END
$fn$;

-- ---------------------------------------------------------------------------
-- Approval, completion leases, atomic settlement, and ledger posting
-- ---------------------------------------------------------------------------

CREATE FUNCTION public.create_pi_payment_approval(
  p_payment_intent_id text,
  p_provider_payment_id text,
  p_quote_id uuid,
  p_verification_id uuid
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_quote public.pi_payment_quotes%ROWTYPE;
  v_verification public.pi_provider_verifications%ROWTYPE;
  v_existing public.pi_payment_approvals%ROWTYPE;
  v_webhook_complete boolean;
  v_approval_id uuid;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_payment_verifier']::name[]);

  PERFORM public.rev2e_advisory_lock('payment_intent', p_payment_intent_id);
  PERFORM public.rev2e_advisory_lock('quote', p_quote_id::text);

  SELECT * INTO v_quote FROM public.pi_payment_quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND OR v_quote.payment_intent_id <> p_payment_intent_id THEN
    RAISE EXCEPTION 'Quote and payment intent do not match';
  END IF;
  IF v_quote.status <> 'active' OR v_quote.expires_at <= now() THEN
    RAISE EXCEPTION 'Quote is not approvable';
  END IF;

  SELECT * INTO v_verification FROM public.pi_provider_verifications WHERE id = p_verification_id;
  IF NOT FOUND
     OR v_verification.verification_type <> 'payment'
     OR v_verification.quote_id <> p_quote_id
     OR v_verification.payment_intent_id <> p_payment_intent_id
     OR v_verification.provider_payment_id <> p_provider_payment_id
     OR v_verification.amount_minor <> v_quote.amount_minor
     OR v_verification.minor_unit_scale <> v_quote.minor_unit_scale
     OR v_verification.payer_uid IS DISTINCT FROM v_quote.pi_uid THEN
    RAISE EXCEPTION 'Payment verification does not match the quote';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.pi_webhook_events e
    WHERE e.id = v_verification.webhook_event_id
      AND e.status = 'completed'
  ) INTO v_webhook_complete;
  IF NOT v_webhook_complete THEN
    RAISE EXCEPTION 'HMAC-verified webhook evidence is not complete';
  END IF;

  SELECT * INTO v_existing FROM public.pi_payment_approvals WHERE quote_id = p_quote_id;
  IF FOUND THEN
    IF v_existing.payment_verification_id = p_verification_id
       AND v_existing.provider_payment_id = p_provider_payment_id
       AND v_existing.payment_intent_id = p_payment_intent_id THEN
      RETURN v_existing.id;
    END IF;
    RAISE EXCEPTION 'Conflicting approval already exists for quote';
  END IF;

  INSERT INTO public.pi_payment_approvals
    (quote_id, trip_id, payment_intent_id, request_id, rider_user_id, pi_uid,
     amount_minor, minor_unit_scale, provider_payment_id, payment_verification_id,
     status, approved_at)
  VALUES
    (p_quote_id, v_quote.trip_id, p_payment_intent_id, gen_random_uuid(),
     v_quote.rider_user_id, v_quote.pi_uid, v_quote.amount_minor, v_quote.minor_unit_scale,
     p_provider_payment_id, p_verification_id, 'approved', now())
  RETURNING id INTO v_approval_id;

  UPDATE public.pi_payment_quotes
  SET status = 'approved', approved_at = now(), consumed_at = now()
  WHERE id = p_quote_id;

  PERFORM public.rev2e_audit_event(
    'PI_PAYMENT_APPROVAL_CREATED', 'info', v_quote.trip_id, p_payment_intent_id,
    jsonb_build_object(
      'approval_id', v_approval_id,
      'quote_id', p_quote_id,
      'provider_payment_id', p_provider_payment_id
    )
  );

  RETURN v_approval_id;
END
$fn$;

CREATE FUNCTION public.claim_pi_payment_completion_lease(p_payment_intent_id text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_approval public.pi_payment_approvals%ROWTYPE;
  v_config public.rev2e_payment_config%ROWTYPE;
  v_token uuid;
  v_expires_at timestamptz;
BEGIN
  PERFORM public.rev2e_assert_session_role(
    ARRAY['teospitaxi_payment_verifier','teospitaxi_maintenance']::name[]
  );

  IF p_payment_intent_id IS NULL OR length(p_payment_intent_id) < 8 THEN
    RAISE EXCEPTION 'Invalid payment intent';
  END IF;

  PERFORM public.rev2e_advisory_lock('payment_intent', p_payment_intent_id);

  SELECT * INTO v_config FROM public.rev2e_payment_config WHERE id = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment configuration is missing';
  END IF;

  SELECT * INTO v_approval
  FROM public.pi_payment_approvals
  WHERE payment_intent_id = p_payment_intent_id FOR UPDATE;
  IF NOT FOUND OR v_approval.status <> 'approved' THEN
    RAISE EXCEPTION 'Approval is not in an approved state';
  END IF;

  IF v_approval.completion_lease_token IS NOT NULL
     AND v_approval.completion_lease_expires_at > now() THEN
    RETURN jsonb_build_object(
      'status', 'busy',
      'lease_expires_at', v_approval.completion_lease_expires_at
    );
  END IF;

  v_token := gen_random_uuid();
  v_expires_at := now() + (v_config.completion_lease_seconds || ' seconds')::interval;

  UPDATE public.pi_payment_approvals
  SET completion_lease_token = v_token,
      completion_lease_expires_at = v_expires_at,
      completion_lease_generation = completion_lease_generation + 1
  WHERE id = v_approval.id;

  RETURN jsonb_build_object(
    'status', 'leased',
    'lease_token', v_token,
    'lease_expires_at', v_expires_at,
    'lease_generation', v_approval.completion_lease_generation + 1
  );
END
$fn$;

CREATE FUNCTION public.release_pi_payment_completion_lease(
  p_payment_intent_id text,
  p_lease_token uuid
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_approval public.pi_payment_approvals%ROWTYPE;
BEGIN
  PERFORM public.rev2e_assert_session_role(
    ARRAY['teospitaxi_payment_verifier','teospitaxi_maintenance']::name[]
  );

  PERFORM public.rev2e_advisory_lock('payment_intent', p_payment_intent_id);

  SELECT * INTO v_approval
  FROM public.pi_payment_approvals
  WHERE payment_intent_id = p_payment_intent_id FOR UPDATE;
  IF NOT FOUND OR p_lease_token IS NULL THEN
    RETURN false;
  END IF;

  IF v_approval.status <> 'approved'
     OR v_approval.completion_lease_token IS DISTINCT FROM p_lease_token THEN
    RETURN false;
  END IF;

  UPDATE public.pi_payment_approvals
  SET completion_lease_token = NULL, completion_lease_expires_at = NULL
  WHERE id = v_approval.id;

  RETURN true;
END
$fn$;

CREATE FUNCTION public.consume_pi_payment_approval(
  p_payment_intent_id text,
  p_approval_id uuid,
  p_completion_lease_token text,
  p_completion_verification_id uuid,
  p_blockchain_txid text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_approval public.pi_payment_approvals%ROWTYPE;
  v_quote public.pi_payment_quotes%ROWTYPE;
  v_verification public.pi_provider_verifications%ROWTYPE;
  v_settlement public.pi_payment_settlements%ROWTYPE;
  v_settlement_id uuid;
  v_trip public.trips%ROWTYPE;
  v_token uuid;
  v_webhook_complete boolean;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_payment_verifier']::name[]);

  IF p_completion_lease_token IS NULL OR length(p_completion_lease_token) <> 36 THEN
    RAISE EXCEPTION 'Invalid completion lease token';
  END IF;
  IF p_blockchain_txid IS NULL OR length(p_blockchain_txid) < 8 THEN
    RAISE EXCEPTION 'Invalid blockchain transaction id';
  END IF;

  BEGIN
    v_token := p_completion_lease_token::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'Invalid completion lease token';
  END;

  PERFORM public.rev2e_advisory_lock('payment_intent', p_payment_intent_id);
  PERFORM public.rev2e_advisory_lock('approval', p_approval_id::text);
  PERFORM public.rev2e_advisory_lock('verification', p_completion_verification_id::text);

  SELECT * INTO v_settlement
  FROM public.pi_payment_settlements
  WHERE approval_id = p_approval_id;
  IF FOUND THEN
    PERFORM public.rev2e_audit_event(
      'PI_SETTLEMENT_DUPLICATE_IDENTICAL', 'info', v_settlement.trip_id, p_payment_intent_id,
      jsonb_build_object('settlement_id', v_settlement.id, 'approval_id', p_approval_id)
    );
    RETURN jsonb_build_object('status', 'duplicate_identical', 'settlement_id', v_settlement.id);
  END IF;

  SELECT * INTO v_approval
  FROM public.pi_payment_approvals
  WHERE id = p_approval_id AND payment_intent_id = p_payment_intent_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approval does not match payment intent';
  END IF;
  IF v_approval.status <> 'approved'
     OR v_approval.completion_lease_token IS DISTINCT FROM v_token
     OR v_approval.completion_lease_expires_at <= now() THEN
    RAISE EXCEPTION 'Completion lease is missing, stale, or already consumed';
  END IF;

  SELECT * INTO v_verification
  FROM public.pi_provider_verifications
  WHERE id = p_completion_verification_id;
  IF NOT FOUND
     OR v_verification.verification_type <> 'completion'
     OR v_verification.quote_id <> v_approval.quote_id
     OR v_verification.payment_intent_id <> p_payment_intent_id
     OR v_verification.provider_payment_id <> v_approval.provider_payment_id
     OR v_verification.amount_minor <> v_approval.amount_minor
     OR v_verification.minor_unit_scale <> v_approval.minor_unit_scale
     OR v_verification.payer_uid IS DISTINCT FROM v_approval.pi_uid THEN
    RAISE EXCEPTION 'Completion verification does not match the approved payment';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.pi_webhook_events e
    WHERE e.id = v_verification.webhook_event_id
      AND e.status = 'completed'
  ) INTO v_webhook_complete;
  IF NOT v_webhook_complete THEN
    RAISE EXCEPTION 'HMAC-verified completion webhook evidence is not complete';
  END IF;

  SELECT * INTO v_quote FROM public.pi_payment_quotes WHERE id = v_approval.quote_id FOR UPDATE;
  IF NOT FOUND OR v_quote.status <> 'approved' THEN
    RAISE EXCEPTION 'Quote is not in an approved state';
  END IF;

  SELECT * INTO v_trip FROM public.trips WHERE id = v_approval.trip_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trip does not exist';
  END IF;

  INSERT INTO public.pi_payment_settlements
    (approval_id, quote_id, trip_id, payment_intent_id, provider_payment_id,
     completion_verification_id, agent_user_id, blockchain_txid,
     amount_minor, driver_amount_minor, treasury_amount_minor, agent_amount_minor,
     minor_unit_scale, payout_status)
  VALUES
    (v_approval.id, v_quote.id, v_trip.id, v_quote.payment_intent_id,
     v_approval.provider_payment_id, v_verification.id, v_quote.agent_user_id,
     p_blockchain_txid, v_quote.amount_minor, v_quote.driver_amount_minor,
     v_quote.treasury_amount_minor, v_quote.agent_amount_minor,
     v_quote.minor_unit_scale, 'not_executed')
  RETURNING id INTO v_settlement_id;

  INSERT INTO public.pi_payment_ledger_entries
    (settlement_id, trip_id, entry_type, payee_user_id, amount_minor, minor_unit_scale)
  VALUES
    (v_settlement_id, v_trip.id, 'driver_share', v_trip.driver_id,
     v_quote.driver_amount_minor, v_quote.minor_unit_scale),
    (v_settlement_id, v_trip.id, 'treasury_share', NULL,
     v_quote.treasury_amount_minor, v_quote.minor_unit_scale),
    (v_settlement_id, v_trip.id, 'agent_share', v_quote.agent_user_id,
     v_quote.agent_amount_minor, v_quote.minor_unit_scale);

  INSERT INTO public.rev2e_payout_state (settlement_id, ledger_entry_id, payout_status)
  SELECT v_settlement_id, le.id, 'not_executed'
  FROM public.pi_payment_ledger_entries le
  WHERE le.settlement_id = v_settlement_id;

  UPDATE public.pi_payment_approvals
  SET status = 'completed', completed_at = now(),
      completion_lease_token = NULL, completion_lease_expires_at = NULL
  WHERE id = v_approval.id;

  UPDATE public.pi_payment_quotes
  SET status = 'completed', completed_at = now()
  WHERE id = v_quote.id;

  UPDATE public.trips
  SET escrow_amount_minor = v_quote.amount_minor,
      treasury_fee_minor = v_quote.treasury_amount_minor,
      agent_commission_minor = v_quote.agent_amount_minor,
      driver_payout_minor = v_quote.driver_amount_minor,
      payment_minor_unit_scale = v_quote.minor_unit_scale,
      payment_status = 'completed',
      updated_at = now()
  WHERE id = v_trip.id;

  INSERT INTO public.payment_transactions
    (trip_id, payment_intent_id, pi_payment_id, from_user_id, to_user_id,
     amount, transaction_type, status, blockchain_txid, memo, metadata,
     amount_minor, minor_unit_scale, created_at, completed_at)
  VALUES
    (v_trip.id, v_quote.payment_intent_id, v_approval.provider_payment_id,
     v_quote.rider_user_id, v_trip.driver_id,
     v_quote.amount_minor::numeric / power(10::numeric, v_quote.minor_unit_scale),
     'escrow_fund', 'completed', p_blockchain_txid,
     'Verified Pi payment settlement',
     jsonb_build_object(
       'settlement_id', v_settlement_id,
       'quote_id', v_quote.id,
       'quote_hash', v_quote.quote_hash,
       'approval_id', v_approval.id,
       'completion_verification_id', v_verification.id,
       'driver_amount_minor', v_quote.driver_amount_minor,
       'treasury_amount_minor', v_quote.treasury_amount_minor,
       'agent_amount_minor', v_quote.agent_amount_minor
     ),
     v_quote.amount_minor, v_quote.minor_unit_scale, now(), now());

  PERFORM public.rev2e_audit_event(
    'PI_SETTLEMENT_RECORDED', 'info', v_trip.id, v_quote.payment_intent_id,
    jsonb_build_object(
      'settlement_id', v_settlement_id,
      'approval_id', v_approval.id,
      'amount_minor', v_quote.amount_minor,
      'driver_amount_minor', v_quote.driver_amount_minor,
      'treasury_amount_minor', v_quote.treasury_amount_minor,
      'agent_amount_minor', v_quote.agent_amount_minor
    )
  );

  RETURN jsonb_build_object('status', 'settled', 'settlement_id', v_settlement_id);
END
$fn$;

-- ---------------------------------------------------------------------------
-- Durable webhook event lifecycle
-- ---------------------------------------------------------------------------

CREATE FUNCTION public.record_pi_webhook_event(
  p_provider_event_id text,
  p_event_type text,
  p_payment_intent_id text,
  p_provider_payment_id text,
  p_raw_body text,
  p_signature text,
  p_signature_timestamp text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_secret public.pi_webhook_secrets%ROWTYPE;
  v_config public.rev2e_payment_config%ROWTYPE;
  v_existing public.pi_webhook_events%ROWTYPE;
  v_id uuid;
  v_payload_hash text;
  v_signature_hash text;
  v_message text;
  v_expected_hex text;
  v_expected_b64 text;
  v_signature_normalized text;
  v_timestamp_epoch bigint;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_payment_verifier']::name[]);

  IF p_provider_event_id IS NULL OR length(p_provider_event_id) NOT BETWEEN 8 AND 256 THEN
    RAISE EXCEPTION 'Invalid provider event id';
  END IF;
  IF p_event_type IS NULL OR length(p_event_type) NOT BETWEEN 3 AND 80 THEN
    RAISE EXCEPTION 'Invalid webhook event type';
  END IF;
  IF p_payment_intent_id IS NULL OR length(p_payment_intent_id) < 8 THEN
    RAISE EXCEPTION 'Invalid payment intent';
  END IF;
  IF p_provider_payment_id IS NULL OR length(p_provider_payment_id) < 8 THEN
    RAISE EXCEPTION 'Invalid provider payment id';
  END IF;
  IF p_raw_body IS NULL OR octet_length(p_raw_body) NOT BETWEEN 2 AND 262144 THEN
    RAISE EXCEPTION 'Invalid webhook raw body';
  END IF;
  IF p_signature IS NULL OR length(p_signature) NOT BETWEEN 32 AND 512 THEN
    RAISE EXCEPTION 'Invalid webhook signature';
  END IF;

  SELECT * INTO v_secret
  FROM public.pi_webhook_secrets
  WHERE is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active Pi webhook secret is configured';
  END IF;

  SELECT * INTO v_config FROM public.rev2e_payment_config WHERE id = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment configuration is missing';
  END IF;

  v_payload_hash := public.rev2e_sha256_hex(p_raw_body);
  v_signature_hash := public.rev2e_sha256_hex(p_signature);
  v_message := p_raw_body;

  IF v_secret.signed_payload_template = 'timestamp_dot_raw_body' THEN
    IF p_signature_timestamp IS NULL OR p_signature_timestamp !~ '^[0-9]{10}$' THEN
      RAISE EXCEPTION 'Webhook signature timestamp is required and must be Unix seconds';
    END IF;
    v_timestamp_epoch := p_signature_timestamp::bigint;
    IF abs(extract(epoch from now())::bigint - v_timestamp_epoch)
       > v_config.webhook_replay_tolerance_seconds THEN
      RAISE EXCEPTION 'Webhook signature timestamp is outside the replay tolerance';
    END IF;
    v_message := p_signature_timestamp || '.' || p_raw_body;
  END IF;

  v_expected_hex := encode(extensions.hmac(convert_to(v_message, 'UTF8'), v_secret.secret, 'sha256'), 'hex');
  v_expected_b64 := encode(extensions.hmac(convert_to(v_message, 'UTF8'), v_secret.secret, 'sha256'), 'base64');
  v_signature_normalized := CASE
    WHEN v_secret.signature_encoding = 'hex' THEN lower(p_signature)
    ELSE rtrim(translate(p_signature, '-_', '+/') || '===', '=')
  END;

  IF v_secret.signature_encoding = 'base64' THEN
    v_signature_normalized := v_signature_normalized
      || repeat('=', (4 - (length(v_signature_normalized) % 4)) % 4);
  END IF;

  IF public.rev2e_sha256_hex(v_signature_normalized)
     IS DISTINCT FROM public.rev2e_sha256_hex(
       CASE WHEN v_secret.signature_encoding = 'hex' THEN v_expected_hex ELSE v_expected_b64 END
     ) THEN
    RAISE EXCEPTION 'Webhook signature verification failed';
  END IF;

  PERFORM public.rev2e_advisory_lock('webhook_event', p_provider_event_id);
  PERFORM public.rev2e_advisory_lock('webhook_payload', v_payload_hash);
  PERFORM public.rev2e_advisory_lock('payment_intent', p_payment_intent_id);

  SELECT * INTO v_existing
  FROM public.pi_webhook_events
  WHERE provider = 'pi' AND provider_event_id = p_provider_event_id;

  IF FOUND THEN
    IF v_existing.event_type = p_event_type
       AND v_existing.payment_intent_id = p_payment_intent_id
       AND v_existing.provider_payment_id = p_provider_payment_id
       AND v_existing.payload_hash = v_payload_hash
       AND v_existing.raw_body_hash = v_payload_hash
       AND v_existing.signature_hash = v_signature_hash THEN
      PERFORM public.rev2e_audit_event(
        'PI_WEBHOOK_DUPLICATE_IDENTICAL', 'info', NULL, p_payment_intent_id,
        jsonb_build_object('webhook_event_id', v_existing.id, 'provider_event_id', p_provider_event_id)
      );
      RETURN jsonb_build_object('status', 'duplicate_identical', 'webhook_event_id', v_existing.id);
    END IF;

    PERFORM public.rev2e_audit_event(
      'PI_WEBHOOK_CONFLICT', 'critical', NULL, p_payment_intent_id,
      jsonb_build_object('webhook_event_id', v_existing.id, 'provider_event_id', p_provider_event_id)
    );
    RETURN jsonb_build_object('status', 'conflict', 'webhook_event_id', v_existing.id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.pi_webhook_events
    WHERE provider = 'pi' AND payload_hash = v_payload_hash
  ) THEN
    PERFORM public.rev2e_audit_event(
      'PI_WEBHOOK_PAYLOAD_REPLAY', 'critical', NULL, p_payment_intent_id,
      jsonb_build_object('provider_event_id', p_provider_event_id, 'payload_hash', v_payload_hash)
    );
    RETURN jsonb_build_object('status', 'conflict', 'reason', 'payload_replay');
  END IF;

  INSERT INTO public.pi_webhook_events
    (provider_event_id, event_type, payment_intent_id, provider_payment_id,
     payload_hash, raw_body_hash, signature_hash, status, attempts)
  VALUES
    (p_provider_event_id, p_event_type, p_payment_intent_id, p_provider_payment_id,
     v_payload_hash, v_payload_hash, v_signature_hash, 'pending', 0)
  RETURNING id INTO v_id;

  PERFORM public.rev2e_audit_event(
    'PI_WEBHOOK_RECORDED', 'info', NULL, p_payment_intent_id,
    jsonb_build_object('webhook_event_id', v_id, 'provider_event_id', p_provider_event_id)
  );

  RETURN jsonb_build_object('status', 'recorded', 'webhook_event_id', v_id);
END
$fn$;

CREATE FUNCTION public.claim_pi_webhook_event()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_event public.pi_webhook_events%ROWTYPE;
  v_config public.rev2e_payment_config%ROWTYPE;
  v_token uuid;
  v_expires_at timestamptz;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_maintenance']::name[]);

  SELECT * INTO v_config FROM public.rev2e_payment_config WHERE id = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment configuration is missing';
  END IF;

  SELECT * INTO v_event
  FROM public.pi_webhook_events
  WHERE status = 'pending'
     OR (status IN ('processing','failed')
         AND (lease_expires_at IS NULL OR lease_expires_at <= now()))
  ORDER BY created_at, id
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'empty');
  END IF;

  IF v_event.attempts + 1 > v_config.webhook_max_attempts THEN
    UPDATE public.pi_webhook_events
    SET status = 'dead', lease_token = NULL, lease_expires_at = NULL,
        last_error_code = 'MAX_ATTEMPTS_EXCEEDED'
    WHERE id = v_event.id;
    RETURN jsonb_build_object('status', 'dead', 'webhook_event_id', v_event.id);
  END IF;

  v_token := gen_random_uuid();
  v_expires_at := now() + (v_config.webhook_lease_seconds || ' seconds')::interval;

  UPDATE public.pi_webhook_events
  SET status = 'processing',
      lease_token = v_token,
      lease_expires_at = v_expires_at,
      attempts = attempts + 1
  WHERE id = v_event.id;

  RETURN jsonb_build_object(
    'status', 'leased',
    'webhook_event_id', v_event.id,
    'lease_token', v_token,
    'lease_expires_at', v_expires_at,
    'attempts', v_event.attempts + 1,
    'provider_event_id', v_event.provider_event_id,
    'event_type', v_event.event_type,
    'payment_intent_id', v_event.payment_intent_id,
    'provider_payment_id', v_event.provider_payment_id,
    'payload_hash', v_event.payload_hash,
    'raw_body_hash', v_event.raw_body_hash,
    'signature_hash', v_event.signature_hash
  );
END
$fn$;

CREATE FUNCTION public.complete_pi_webhook_event(
  p_webhook_event_id uuid,
  p_lease_token uuid
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_event public.pi_webhook_events%ROWTYPE;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_maintenance']::name[]);

  PERFORM public.rev2e_advisory_lock('webhook_event', p_webhook_event_id::text);

  SELECT * INTO v_event
  FROM public.pi_webhook_events
  WHERE id = p_webhook_event_id FOR UPDATE;
  IF NOT FOUND OR v_event.status <> 'processing'
     OR v_event.lease_token IS DISTINCT FROM p_lease_token THEN
    RETURN false;
  END IF;

  UPDATE public.pi_webhook_events
  SET status = 'completed', completed_at = now(),
      lease_token = NULL, lease_expires_at = NULL
  WHERE id = p_webhook_event_id;

  PERFORM public.rev2e_audit_event(
    'PI_WEBHOOK_COMPLETED', 'info', NULL, v_event.payment_intent_id,
    jsonb_build_object('webhook_event_id', p_webhook_event_id)
  );

  RETURN true;
END
$fn$;

CREATE FUNCTION public.fail_pi_webhook_event(
  p_webhook_event_id uuid,
  p_lease_token uuid,
  p_error_code text
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
DECLARE
  v_event public.pi_webhook_events%ROWTYPE;
  v_config public.rev2e_payment_config%ROWTYPE;
BEGIN
  PERFORM public.rev2e_assert_session_role(ARRAY['teospitaxi_maintenance']::name[]);

  IF p_error_code IS NULL OR length(p_error_code) NOT BETWEEN 3 AND 80 THEN
    RAISE EXCEPTION 'Invalid webhook error code';
  END IF;

  PERFORM public.rev2e_advisory_lock('webhook_event', p_webhook_event_id::text);

  SELECT * INTO v_config FROM public.rev2e_payment_config WHERE id = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment configuration is missing';
  END IF;

  SELECT * INTO v_event
  FROM public.pi_webhook_events
  WHERE id = p_webhook_event_id FOR UPDATE;
  IF NOT FOUND OR v_event.status <> 'processing'
     OR v_event.lease_token IS DISTINCT FROM p_lease_token THEN
    RETURN false;
  END IF;

  UPDATE public.pi_webhook_events
  SET status = CASE WHEN v_event.attempts >= v_config.webhook_max_attempts THEN 'dead' ELSE 'failed' END,
      lease_token = NULL,
      lease_expires_at = NULL,
      last_error_code = p_error_code
  WHERE id = p_webhook_event_id;

  PERFORM public.rev2e_audit_event(
    'PI_WEBHOOK_FAILED', 'warning', NULL, v_event.payment_intent_id,
    jsonb_build_object(
      'webhook_event_id', p_webhook_event_id,
      'attempts', v_event.attempts,
      'error_code', p_error_code
    )
  );

  RETURN true;
END
$fn$;

-- ---------------------------------------------------------------------------
-- Uniform writer ownership, revocation, and grant application
-- ---------------------------------------------------------------------------

DO $rev2e_finalize_writer_functions$
DECLARE
  r record;
  granted name;
BEGIN
  FOR r IN SELECT * FROM public.rev2e_writer_function_allowlist WHERE is_active LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO teospitaxi_payment_writer', r.function_identity);
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated, service_role',
      r.function_identity
    );

    FOREACH granted IN ARRAY r.allowed_roles LOOP
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO %I', r.function_identity, granted);
    END LOOP;
  END LOOP;
END
$rev2e_finalize_writer_functions$;

DO $rev2e_revoke_managed_functions$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.rev2e_sha256_hex(text)',
    'public.rev2e_hmac_hex(text,bytea)',
    'public.rev2e_random_hex(integer)',
    'public.rev2e_advisory_key(text,text)',
    'public.rev2e_advisory_lock(text,text)',
    'public.rev2e_assert_session_role(name[])',
    'public.rev2e_active_csrf_secret()',
    'public.rev2e_rotate_csrf_secret()',
    'public.rev2e_assert_role_membership_graph()',
    'public.rev2e_assert_writer_function_inventory()',
    'public.promote_qualified_agents()',
    'public.rev2e_pi_payment_quotes_guard()',
    'public.rev2e_pi_payment_quotes_supersede_check()',
    'public.rev2e_append_only_guard()',
    'public.rev2e_pi_payment_approvals_guard()',
    'public.rev2e_pi_webhook_events_guard()'
  ]::text[] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated, service_role', fn);
  END LOOP;
END
$rev2e_revoke_managed_functions$;

-- ---------------------------------------------------------------------------
-- Postconditions
-- ---------------------------------------------------------------------------

DO $rev2e_postflight$
DECLARE
  t text;
  spec record;
  v_count integer;
  expected text[] := ARRAY[
    'rev2e_legacy_backup','rev2e_payment_audit_events','rev2e_payment_config',
    'rev2e_pi_amount_policy','rev2e_route_provider_policy','rev2e_agent_policy',
    'rev2e_service_pricing_policy','rev2e_secret_store','rev2e_rate_limit_events',
    'rev2e_writer_function_allowlist','rev2e_payout_state','pi_browse_evidence','pi_sessions',
    'pi_driver_presence','pi_trip_metrics','pi_route_metric_evidence',
    'pi_payment_quotes','pi_provider_verifications','pi_payment_approvals',
    'pi_payment_settlements','pi_payment_ledger_entries','pi_webhook_secrets',
    'pi_webhook_events'
  ];
BEGIN
  PERFORM public.rev2e_assert_role_membership_graph();
  PERFORM public.rev2e_assert_writer_function_inventory();

  FOREACH t IN ARRAY expected LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = t AND c.relkind = 'r'
        AND c.relrowsecurity AND c.relforcerowsecurity
    ) THEN
      RAISE EXCEPTION 'Managed table public.% must have ENABLE and FORCE ROW LEVEL SECURITY', t;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.role_table_grants g
      WHERE g.table_schema = 'public'
        AND g.table_name = t
        AND g.grantee IN ('anon','authenticated','service_role')
    ) THEN
      RAISE EXCEPTION 'Managed table public.% must not grant privileges to application roles', t;
    END IF;
  END LOOP;

  FOR spec IN
    SELECT * FROM (VALUES
      ('pi_payment_quotes','rev2e_pi_payment_quotes_guard_trg'),
      ('pi_payment_quotes','rev2e_pi_payment_quotes_supersede_ck'),
      ('pi_provider_verifications','rev2e_provider_verifications_append_trg'),
      ('pi_payment_settlements','rev2e_settlements_append_trg'),
      ('pi_payment_ledger_entries','rev2e_ledger_append_trg'),
      ('rev2e_legacy_backup','rev2e_legacy_backup_append_trg'),
      ('pi_payment_approvals','rev2e_pi_payment_approvals_guard_trg'),
      ('pi_webhook_events','rev2e_pi_webhook_events_guard_trg')
    ) AS v(table_name, trigger_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger tr
      JOIN pg_class c ON c.oid = tr.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = spec.table_name
        AND tr.tgname = spec.trigger_name
        AND NOT tr.tgisinternal
    ) THEN
      RAISE EXCEPTION 'Managed trigger %.% is missing', spec.table_name, spec.trigger_name;
    END IF;
  END LOOP;

  FOREACH t IN ARRAY ARRAY['users','trips','agent_referrals','pricing_configs','payment_transactions']::text[] LOOP
    IF NOT has_table_privilege('teospitaxi_payment_writer', 'public.' || t, 'SELECT') THEN
      RAISE EXCEPTION 'Writer SELECT privilege is missing on frozen table public.%', t;
    END IF;
  END LOOP;
  IF NOT has_table_privilege('teospitaxi_payment_writer', 'public.trips', 'UPDATE') THEN
    RAISE EXCEPTION 'Writer UPDATE privilege is missing on public.trips';
  END IF;
  IF NOT has_table_privilege('teospitaxi_payment_writer', 'public.payment_transactions', 'INSERT') THEN
    RAISE EXCEPTION 'Writer INSERT privilege is missing on public.payment_transactions';
  END IF;

  FOR spec IN
    SELECT * FROM (VALUES
      ('users','rev2e_writer_read_users','r'),
      ('trips','rev2e_writer_read_trips','r'),
      ('trips','rev2e_writer_update_trips','w'),
      ('agent_referrals','rev2e_writer_read_agent_referrals','r'),
      ('pricing_configs','rev2e_writer_read_pricing_configs','r'),
      ('payment_transactions','rev2e_writer_read_payment_transactions','r'),
      ('payment_transactions','rev2e_writer_insert_payment_transactions','a'),
      ('rev2e_secret_store','rev2e_writer_insert_rev2e_secret_store','a'),
      ('rev2e_rate_limit_events','rev2e_writer_insert_rev2e_rate_limit_events','a'),
      ('rev2e_rate_limit_events','rev2e_writer_delete_rev2e_rate_limit_events','d'),
      ('rev2e_payout_state','rev2e_writer_read_rev2e_payout_state','r'),
      ('rev2e_payout_state','rev2e_writer_insert_rev2e_payout_state','a'),
      ('rev2e_payout_state','rev2e_writer_update_rev2e_payout_state','w'),
      ('pi_sessions','rev2e_writer_insert_pi_sessions','a'),
      ('pi_sessions','rev2e_writer_update_pi_sessions','w'),
      ('pi_sessions','rev2e_writer_delete_pi_sessions','d'),
      ('pi_driver_presence','rev2e_writer_insert_pi_driver_presence','a'),
      ('pi_webhook_secrets','rev2e_writer_read_pi_webhook_secrets','r')
    ) AS v(table_name, policy_name, command_code)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policy p
      JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = spec.table_name
        AND p.polname = spec.policy_name
        AND p.polcmd = spec.command_code
        AND (SELECT oid FROM pg_roles WHERE rolname = 'teospitaxi_payment_writer') = ANY(p.polroles)
    ) THEN
      RAISE EXCEPTION 'Required writer RLS policy % is missing', spec.policy_name;
    END IF;
  END LOOP;

  SELECT count(*) INTO v_count
  FROM public.rev2e_secret_store
  WHERE secret_type = 'csrf_hmac' AND is_active = true;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Exactly one active csrf_hmac secret is required; found %', v_count;
  END IF;

  FOR spec IN
    SELECT * FROM (VALUES
      ('pi_provider_verifications','webhook_event_id'),
      ('rev2e_payment_config','payment_webhook_event_type'),
      ('rev2e_payment_config','completion_webhook_event_type')
    ) AS v(table_name, column_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = spec.table_name
        AND column_name = spec.column_name
    ) THEN
      RAISE EXCEPTION 'Required column public.%.% is missing', spec.table_name, spec.column_name;
    END IF;
  END LOOP;

  FOR spec IN
    SELECT * FROM (VALUES
      ('pi_payment_quotes','pi_payment_quotes_policy_split'),
      ('pi_payment_quotes','pi_payment_quotes_minor_sum'),
      ('pi_payment_settlements','pi_payment_settlements_split'),
      ('pi_payment_settlements','pi_payment_settlements_sum'),
      ('pi_webhook_secrets','pi_webhook_secrets_state')
    ) AS v(table_name, constraint_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint co
      WHERE co.conrelid = ('public.' || spec.table_name)::regclass
        AND co.conname = spec.constraint_name AND co.contype = 'c'
    ) THEN
      RAISE EXCEPTION 'Required constraint % on public.% is missing', spec.constraint_name, spec.table_name;
    END IF;
  END LOOP;

  FOR spec IN
    SELECT pr.oid AS function_oid, pr.oid::regprocedure::text AS identity
    FROM pg_proc pr
    JOIN pg_namespace ns ON ns.oid = pr.pronamespace
    WHERE ns.nspname = 'public'
      AND (
        pr.proowner = (SELECT oid FROM pg_roles WHERE rolname = 'teospitaxi_payment_writer')
        OR pr.proname LIKE 'rev2e_%'
        OR pr.proname IN (
          'promote_qualified_agents','create_pi_session','rotate_pi_session_with_browse',
          'revoke_pi_session','rotate_pi_session_csrf','set_pi_session_csrf_hash',
          'verify_pi_session','authorize_pi_mutation','update_driver_presence',
          'enforce_rate_limit','cleanup_rate_limit_events','record_pi_trip_metrics',
          'create_pi_payment_quote','record_pi_provider_verification',
          'create_pi_payment_approval','claim_pi_payment_completion_lease',
          'release_pi_payment_completion_lease','consume_pi_payment_approval',
          'mark_pi_payment_quote_expired','record_pi_webhook_event',
          'claim_pi_webhook_event','complete_pi_webhook_event','fail_pi_webhook_event',
          'record_pi_browse_evidence'
        )
      )
  LOOP
    IF has_function_privilege('anon', spec.identity, 'EXECUTE')
       OR has_function_privilege('authenticated', spec.identity, 'EXECUTE')
       OR has_function_privilege('service_role', spec.identity, 'EXECUTE')
       OR EXISTS (
         SELECT 1 FROM pg_proc pr
         WHERE pr.oid = spec.identity::regprocedure
           AND EXISTS (
             SELECT 1 FROM aclexplode(pr.proacl) a
             WHERE a.grantee = 0 AND a.privilege_type = 'EXECUTE'
           )
       ) THEN
      RAISE EXCEPTION 'Managed function % must not be executable by PUBLIC or application roles', spec.identity;
    END IF;
  END LOOP;

  -- Trigger, constraint, RLS policy, and privilege coverage is asserted by the
  -- fully schema-qualified checks above; no duplicate unqualified loop is used.
END
$rev2e_postflight$;

COMMIT;
