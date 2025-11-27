import { createBrowserClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createServerClient() {
  const cookieStore = cookies()

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Legacy export for backward compatibility
export const supabase = createClient()

// Server-side client with service role for admin operations
export function getServiceSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required")
  }
  return createBrowserClient(supabaseUrl, serviceRoleKey)
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
