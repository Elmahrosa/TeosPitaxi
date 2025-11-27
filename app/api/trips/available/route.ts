import type { NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data: trips, error } = await supabase
      .from("trips")
      .select(
        `
        id,
        trip_number,
        rider_id,
        pickup_location,
        dropoff_location,
        pickup_address,
        dropoff_address,
        service_type,
        estimated_fare,
        distance_km,
        duration_minutes,
        status,
        created_at
      `,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10)

    if (error) {
      console.error("[TeosPiTaxi] Database error fetching available trips:", error)
      return Response.json({ success: false, error: "Database error" }, { status: 500 })
    }

    return Response.json({
      success: true,
      trips: trips || [],
      count: trips?.length || 0,
    })
  } catch (error) {
    console.error("[TeosPiTaxi] Unexpected error fetching available trips:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
