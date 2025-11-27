// Frontend API client for TEOSPITAXI backend

export interface CreateTripRequest {
  riderId: string
  pickupLocation: { lat: number; lng: number }
  dropoffLocation: { lat: number; lng: number }
  pickupAddress: string
  dropoffAddress: string
  serviceType: "taxi" | "bike_delivery"
  distanceKm: number
  durationMinutes?: number
  agentId?: string
}

export interface Trip {
  id: string
  trip_number: string
  status: string
  estimated_fare: number
  pickup_address: string
  dropoff_address: string
  driver_id?: string
  payment_intent_id?: string
}

export async function calculateFare(distanceKm: number, durationMinutes: number, hasAgent = false) {
  const response = await fetch("/api/transparency/fare-calculator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ distanceKm, durationMinutes, hasAgent }),
  })

  if (!response.ok) throw new Error("Failed to calculate fare")
  return response.json()
}

export async function createTrip(request: CreateTripRequest): Promise<{ trip: Trip }> {
  const response = await fetch("/api/trips/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })

  if (!response.ok) throw new Error("Failed to create trip")
  return response.json()
}

export async function acceptTrip(tripId: string, driverId: string) {
  const response = await fetch("/api/trips/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tripId, driverId }),
  })

  if (!response.ok) throw new Error("Failed to accept trip")
  return response.json()
}

export async function updateTripStatus(tripId: string, status: string) {
  const response = await fetch("/api/trips/update-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tripId, status }),
  })

  if (!response.ok) throw new Error("Failed to update trip status")
  return response.json()
}

export async function createEscrow(tripId: string, paymentIntentId: string, piPaymentId: string) {
  const response = await fetch("/api/payments/escrow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tripId, paymentIntentId, piPaymentId }),
  })

  if (!response.ok) throw new Error("Failed to create escrow")
  return response.json()
}

export async function completeTrip(tripId: string) {
  const response = await fetch("/api/payments/complete-trip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tripId }),
  })

  if (!response.ok) throw new Error("Failed to complete trip")
  return response.json()
}

export async function createDispute(
  tripId: string,
  filedById: string,
  reason: string,
  description: string,
  evidence?: any,
) {
  const response = await fetch("/api/disputes/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tripId, filedById, reason, description, evidence }),
  })

  if (!response.ok) throw new Error("Failed to create dispute")
  return response.json()
}

export async function getPlatformStats() {
  const response = await fetch("/api/transparency/stats")
  if (!response.ok) throw new Error("Failed to fetch platform stats")
  return response.json()
}
