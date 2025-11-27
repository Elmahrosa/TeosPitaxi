import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, termsType, termsVersion, ipAddress, userAgent } = body

    if (!userId || !termsType || !termsVersion) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: { userId: !!userId, termsType: !!termsType, termsVersion: !!termsVersion },
          status: 400,
        },
        { status: 400 },
      )
    }

    const supabase = createServerClient()

    // Insert terms acceptance
    const { data: acceptance, error: acceptError } = await supabase
      .from("terms_acceptance")
      .insert({
        user_id: userId,
        terms_type: termsType,
        terms_version: termsVersion,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (acceptError) {
      console.error("[TeosPiTaxi] Terms acceptance error:", acceptError)
      return NextResponse.json(
        {
          error: "Failed to record terms acceptance",
          details: acceptError.message,
          status: 500,
        },
        { status: 500 },
      )
    }

    // Update onboarding checklist
    await supabase.from("user_onboarding").upsert({
      user_id: userId,
      terms_accepted: true,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      acceptance,
    })
  } catch (error: any) {
    console.error("[TeosPiTaxi] Accept terms error:", error)
    return NextResponse.json(
      {
        error: "Failed to accept terms",
        message: error.message || "Internal server error",
        status: 500,
      },
      { status: 500 },
    )
  }
}
