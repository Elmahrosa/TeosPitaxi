import { type NextRequest, NextResponse } from "next/server"

const PI_API_BASE = "https://api.minepi.com"

export async function POST(request: NextRequest) {
  try {
    const { paymentId, userId, amount, memo, metadata } = await request.json()

    if (!paymentId || !userId || !amount) {
      return NextResponse.json(
        {
          error: "Missing required payment fields",
          details: { paymentId: !!paymentId, userId: !!userId, amount: !!amount },
        },
        { status: 400 },
      )
    }

    const apiKey = process.env.PI_API_KEY

    if (!apiKey) {
      console.error("[TeosPiTaxi] CRITICAL: PI_API_KEY not configured - API key required for production")
      return NextResponse.json(
        {
          error: "Payment system not configured",
          message: "API key required for production. Contact administrator.",
          status: 503,
        },
        { status: 503 },
      )
    }

    // Call Pi Platform API to approve payment
    const approvalResponse = await fetch(`${PI_API_BASE}/v2/payments/${paymentId}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!approvalResponse.ok) {
      const errorData = await approvalResponse.json().catch(() => ({}))
      console.error("[TeosPiTaxi] Pi Platform approval failed:", errorData)
      return NextResponse.json(
        {
          error: "Payment approval failed with Pi Platform",
          details: errorData,
          status: approvalResponse.status,
        },
        { status: approvalResponse.status },
      )
    }

    const approvalData = await approvalResponse.json()

    console.log("[TeosPiTaxi] Payment approved successfully:", { paymentId, userId })

    return NextResponse.json({
      success: true,
      paymentId,
      status: "approved",
      data: approvalData,
    })
  } catch (error: any) {
    console.error("[TeosPiTaxi] Payment approval error:", error)
    return NextResponse.json(
      {
        error: "Payment approval failed",
        message: error.message || "Internal server error",
        status: 500,
      },
      { status: 500 },
    )
  }
}
