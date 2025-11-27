import { type NextRequest, NextResponse } from "next/server"

const PI_API_BASE = "https://api.minepi.com"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paymentId = searchParams.get("paymentId")

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required", status: 400 }, { status: 400 })
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

    // Call Pi Platform API to get payment status
    const statusResponse = await fetch(`${PI_API_BASE}/v2/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Key ${apiKey}`,
      },
    })

    if (!statusResponse.ok) {
      const errorData = await statusResponse.json().catch(() => ({}))
      console.error("[TeosPiTaxi] Pi Platform status check failed:", errorData)
      return NextResponse.json(
        {
          error: "Failed to fetch payment status",
          details: errorData,
          status: statusResponse.status,
        },
        { status: statusResponse.status },
      )
    }

    const statusData = await statusResponse.json()

    return NextResponse.json({
      success: true,
      data: statusData,
    })
  } catch (error: any) {
    console.error("[TeosPiTaxi] Payment status error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch payment status",
        message: error.message || "Internal server error",
        status: 500,
      },
      { status: 500 },
    )
  }
}
