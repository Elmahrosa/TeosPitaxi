import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { tripId, filedById, reason, description, evidence } = await req.json()

    if (!tripId || !filedById || !reason || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = getServiceSupabase()

    // Get trip details
    const { data: trip } = await db
      .from("trips")
      .select("*, rider:users!trips_rider_id_fkey(id), driver:users!trips_driver_id_fkey(id)")
      .eq("id", tripId)
      .single()

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Determine who the dispute is against
    const filedAgainstId = filedById === trip.rider_id ? trip.driver_id : trip.rider_id

    // Create dispute
    const { data: dispute, error } = await db
      .from("disputes")
      .insert({
        trip_id: tripId,
        filed_by_id: filedById,
        filed_against_id: filedAgainstId,
        reason,
        description,
        evidence,
        status: "open",
      })
      .select()
      .single()

    if (error) throw error

    // Update trip status
    await db.from("trips").update({ status: "disputed", payment_status: "disputed" }).eq("id", tripId)

    // Log transparency
    await db.from("transparency_logs").insert({
      event_type: "dispute_filed",
      trip_id: tripId,
      description: `Dispute filed for trip ${trip.trip_number}`,
      public_data: {
        trip_number: trip.trip_number,
        reason,
        status: "open",
      },
    })

    return NextResponse.json({ dispute })
  } catch (error: any) {
    console.error("[v0] Create dispute error:", error)
    return NextResponse.json({ error: error.message || "Failed to create dispute" }, { status: 500 })
  }
}
