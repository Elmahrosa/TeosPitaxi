import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { approvePayment } from "@/lib/pi-sdk-server"

// Create escrow for a trip
export async function POST(req: NextRequest) {
  try {
    const { tripId, paymentIntentId, piPaymentId } = await req.json()

    if (!tripId || !paymentIntentId) {
      return NextResponse.json({ error: "Missing tripId or paymentIntentId" }, { status: 400 })
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
    } catch (error: any) {
      console.error("[v0] Pi payment approval error:", error)
      return NextResponse.json({ error: "Failed to approve Pi payment" }, { status: 500 })
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
    console.error("[v0] Escrow error:", error)
    return NextResponse.json({ error: error.message || "Failed to create escrow" }, { status: 500 })
  }
}
