// Revision 2e: legacy in-memory ride lifecycle helper is disabled.
// Trip state transitions are owned by server-authorized database functions.

export type RideStatus = "requested" | "accepted" | "started" | "completed" | "cancelled" | "disputed"

export interface Ride {
  id: string
  riderId: string
  driverId: string | null
  status: RideStatus
  availability: "unavailable"
}

class DisabledRideServiceError extends Error {
  readonly code = "RIDE_SERVICE_DISABLED"

  constructor() {
    super("Ride lifecycle operations are disabled in this release candidate")
  }
}

export async function createRide(): Promise<Ride> {
  throw new DisabledRideServiceError()
}

export async function acceptRide(): Promise<Ride> {
  throw new DisabledRideServiceError()
}

export async function startRide(): Promise<Ride> {
  throw new DisabledRideServiceError()
}

export async function completeRide(): Promise<Ride> {
  throw new DisabledRideServiceError()
}

export async function cancelRide(): Promise<Ride> {
  throw new DisabledRideServiceError()
}
