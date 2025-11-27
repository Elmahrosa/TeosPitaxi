import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { approvePayment } from "@/lib/pi-sdk-server"
import { CreateEscrowSchema } from "@/lib/validation"

// Create escrow for a trip
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const validation = CreateEscrowSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 400 },
      )
    }

    const { tripId, paymentIntentId } = validation.data

    if (!process.env.PI_API_KEY) {
      console.error("[TeosPiTaxi] CRITICAL: PI_API_KEY not configured")
      return NextResponse.json(
        {
          error: "Payment system not configured",
          message: "Pi Network API key is missing. Please contact support.",
        },
        { status: 503 },
      )
    }

    const db = getServiceSupabase()

    // Get trip details
    const { data: trip, error: tripError } = await db.from("trips").select("*").eq("id", tripId).single()

    if (tripError || !trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Approve the payment on Pi Network
    let piPayment
    try {
      piPayment = await approvePayment(paymentIntentId)

      if (!piPayment || !piPayment.identifier) {
        throw new Error("Invalid payment response from Pi Network")
      }
    } catch (error: any) {
      console.error("[TeosPiTaxi] Pi payment approval FAILED:", error)
      return NextResponse.json(
        {
          error: "Payment approval failed",
          message: "Unable to approve payment with Pi Network. Please try again.",
          details: error.message,
        },
        { status: 500 },
      )
    }

    // Update trip with payment info
    await db
      .from("trips")
      .update({
        payment_intent_id: paymentIntentId,
        escrow_amount: piPayment.amount,
        payment_status: "escrowed",
      })
      .eq("id", tripId)

    // Record escrow transaction
    await db.from("payment_transactions").insert({
      trip_id: tripId,
      payment_intent_id: paymentIntentId,
      pi_payment_id: piPayment.identifier,
      from_user_id: trip.rider_id,
      amount: piPayment.amount,
      transaction_type: "escrow_fund",
      status: "approved",
      pi_transaction_id: piPayment.transaction?.txid,
      metadata: piPayment,
    })

    // Log transparency
    await db.from("transparency_logs").insert({
      event_type: "escrow_funded",
      trip_id: tripId,
      description: "Trip escrow funded via Pi Network",
      public_data: {
        trip_number: trip.trip_number,
        amount: piPayment.amount,
        payment_id: paymentIntentId,
      },
    })

    return NextResponse.json({
      success: true,
      payment: piPayment,
      trip,
    })
  } catch (error: any) {
    console.error("[TeosPiTaxi] Escrow error:", error)
    return NextResponse.json({ error: error.message || "Failed to create escrow" }, { status: 500 })
  }
}
