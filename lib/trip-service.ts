import { getServiceSupabase, type Trip } from "./supabase"
import { calculateFare } from "./fare-calculator"

export interface CreateTripRequest {
  riderId: string
  pickupLocation: { lat: number; lng: number }
  dropoffLocation: { lat: number; lng: number }
  pickupAddress?: string
  dropoffAddress?: string
  serviceType: "taxi" | "bike_delivery"
  distanceKm: number
  durationMinutes: number
  agentId?: string
}

export async function createTrip(request: CreateTripRequest): Promise<Trip> {
  const db = getServiceSupabase()

  // Calculate fare
  const fare = calculateFare(request.distanceKm, request.durationMinutes, !!request.agentId)

  // Generate unique trip number
  const tripNumber = `TEOS-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

  // Insert trip
  const { data: trip, error } = await db
    .from("trips")
    .insert({
      trip_number: tripNumber,
      rider_id: request.riderId,
      agent_id: request.agentId,
      service_type: request.serviceType,
      pickup_location: request.pickupLocation,
      dropoff_location: request.dropoffLocation,
      pickup_address: request.pickupAddress,
      dropoff_address: request.dropoffAddress,
      distance_km: request.distanceKm,
      estimated_fare: fare.totalFare,
      surge_multiplier: fare.surgeMultiplier,
      treasury_fee: fare.treasuryFee,
      agent_commission: fare.agentCommission,
      driver_payout: fare.driverPayout,
      status: "requested",
      payment_status: "pending",
    })
    .select()
    .single()

  if (error) throw error

  // Log to transparency
  await db.from("transparency_logs").insert({
    event_type: "trip_requested",
    trip_id: trip.id,
    description: `New ${request.serviceType} trip requested`,
    public_data: {
      trip_number: tripNumber,
      distance_km: request.distanceKm,
      estimated_fare: fare.totalFare,
      surge_multiplier: fare.surgeMultiplier,
    },
  })

  return trip
}

export async function assignDriver(tripId: string, driverId: string): Promise<Trip> {
  const db = getServiceSupabase()

  const { data: trip, error } = await db
    .from("trips")
    .update({
      driver_id: driverId,
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", tripId)
    .eq("status", "requested")
    .select()
    .single()

  if (error) throw error

  // Update driver availability
  await db.from("driver_profiles").update({ is_available: false }).eq("user_id", driverId)

  return trip
}

export async function updateTripStatus(tripId: string, status: Trip["status"]): Promise<Trip> {
  const db = getServiceSupabase()

  const updates: any = { status }

  if (status === "driver_arriving") {
    // Driver is on the way
  } else if (status === "in_progress") {
    updates.started_at = new Date().toISOString()
  } else if (status === "completed") {
    updates.completed_at = new Date().toISOString()
  } else if (status === "cancelled") {
    updates.cancelled_at = new Date().toISOString()
  }

  const { data: trip, error } = await db.from("trips").update(updates).eq("id", tripId).select().single()

  if (error) throw error

  // Make driver available again if trip ended
  if (status === "completed" || status === "cancelled") {
    if (trip.driver_id) {
      await db.from("driver_profiles").update({ is_available: true }).eq("user_id", trip.driver_id)
    }
  }

  return trip
}

export async function rateTrip(tripId: string, userId: string, rating: number, feedback?: string): Promise<void> {
  const db = getServiceSupabase()

  const { data: trip } = await db.from("trips").select("rider_id, driver_id").eq("id", tripId).single()

  if (!trip) throw new Error("Trip not found")

  const isRider = trip.rider_id === userId
  const updates: any = {}

  if (isRider) {
    updates.driver_rating = rating
    updates.driver_feedback = feedback
  } else {
    updates.rider_rating = rating
    updates.rider_feedback = feedback
  }

  await db.from("trips").update(updates).eq("id", tripId)

  // Update user's average rating
  const targetUserId = isRider ? trip.driver_id : trip.rider_id
  if (targetUserId) {
    const { data: trips } = await db
      .from("trips")
      .select(isRider ? "driver_rating" : "rider_rating")
      .eq(isRider ? "driver_id" : "rider_id", targetUserId)
      .not(isRider ? "driver_rating" : "rider_rating", "is", null)

    if (trips && trips.length > 0) {
      const ratings = trips.map((t) => (isRider ? t.driver_rating : t.rider_rating)).filter(Boolean)

      const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length

      await db
        .from("users")
        .update({ rating: Math.round(avgRating * 100) / 100 })
        .eq("id", targetUserId)
    }
  }
}
