import { type NextRequest, NextResponse } from "next/server"
import { createTrip } from "@/lib/trip-service"
import { CreateTripSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const validation = CreateTripSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 400 },
      )
    }

    const trip = await createTrip(validation.data)

    return NextResponse.json({ success: true, trip })
  } catch (error: any) {
    console.error("[TeosPiTaxi] Create trip error:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to create trip" }, { status: 500 })
  }
}
