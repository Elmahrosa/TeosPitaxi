import "server-only"

import { createBrowserClient, createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function assertPublicConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and anon key must be configured")
  }
}

/** Browser-only anon client. Never import from server-only modules. */
export function createClient() {
  assertPublicConfig()
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

/** Cookie-aware SSR anon client. Used only from server components and route handlers. */
export async function createServerClient() {
  assertPublicConfig()
  const cookieStore = await cookies()

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Route handlers may set cookies directly; ignore here.
        }
      },
    },
  })
}

/**
 * Server-only service-role client. Never import from client components.
 * Service role is not a member of the controlled writer or verifier roles.
 */
export function getServiceSupabase() {
  assertPublicConfig()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required")
  }
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// Database types
export interface User {
  id: string
  pi_uid: string
  username: string
  email?: string
  phone?: string
  role: "rider" | "driver" | "agent" | "admin"
  status: "active" | "suspended" | "banned"
  pi_wallet_address?: string
  rating: number
  total_trips: number
  created_at: string
  updated_at: string
}

export interface DriverProfile {
  id: string
  user_id: string
  vehicle_type: "taxi" | "bike" | "scooter"
  vehicle_model?: string
  vehicle_plate: string
  license_number: string
  license_expiry?: string
  verification_status: "pending" | "verified" | "rejected"
  current_location?: { lat: number; lng: number }
  is_online: boolean
  is_available: boolean
  total_earnings: number
  created_at: string
  updated_at: string
}

export interface Trip {
  id: string
  trip_number: string
  rider_id?: string
  driver_id?: string
  agent_id?: string
  service_type: "taxi" | "bike_delivery"
  pickup_location: { lat: number; lng: number }
  dropoff_location: { lat: number; lng: number }
  pickup_address?: string
  dropoff_address?: string
  distance_km?: number
  estimated_fare: number
  final_fare?: number
  surge_multiplier: number
  status: "requested" | "accepted" | "driver_arriving" | "in_progress" | "completed" | "cancelled" | "disputed"
  payment_intent_id?: string
  escrow_amount?: number
  treasury_fee?: number
  agent_commission?: number
  driver_payout?: number
  payment_status: "pending" | "escrowed" | "completed" | "refunded" | "disputed"
  requested_at: string
  accepted_at?: string
  started_at?: string
  completed_at?: string
  cancelled_at?: string
  rider_rating?: number
  driver_rating?: number
  rider_feedback?: string
  driver_feedback?: string
  created_at: string
  updated_at: string
}

export interface PaymentTransaction {
  id: string
  trip_id?: string
  payment_intent_id: string
  pi_payment_id?: string
  from_user_id?: string
  to_user_id?: string
  amount: number
  transaction_type:
    | "escrow_fund"
    | "driver_payout"
    | "treasury_fee"
    | "agent_commission"
    | "refund"
    | "dispute_resolution"
  status: "pending" | "approved" | "submitted" | "completed" | "failed" | "cancelled"
  pi_transaction_id?: string
  blockchain_txid?: string
  memo?: string
  metadata?: any
  created_at: string
  completed_at?: string
}

export interface Dispute {
  id: string
  trip_id: string
  filed_by_id: string
  filed_against_id?: string
  reason: string
  description: string
  evidence?: any
  status: "open" | "under_review" | "resolved" | "rejected"
  resolution?: string
  resolved_by_id?: string
  resolved_at?: string
  refund_amount?: number
  refund_status?: "pending" | "approved" | "rejected" | "completed"
  created_at: string
  updated_at: string
}
