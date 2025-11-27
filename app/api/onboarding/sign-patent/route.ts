import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, agreementType = "platform_ip", agreementVersion = "1.0", ipAddress, metadata } = body

    if (!userId || !agreementVersion) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: { userId: !!userId, agreementVersion: !!agreementVersion },
          status: 400,
        },
        { status: 400 },
      )
    }

    const supabase = createServerClient()

    // Create signature hash
    const signatureData = `${userId}-${agreementType}-${agreementVersion}-${Date.now()}`
    const signatureHash = crypto.createHash("sha256").update(signatureData).digest("hex")

    // Insert patent agreement
    const { data: agreement, error: signError } = await supabase
      .from("patent_agreements")
      .insert({
        user_id: userId,
        agreement_type: agreementType,
        agreement_version: agreementVersion,
        signature_hash: signatureHash,
        ip_address: ipAddress,
        metadata,
      })
      .select()
      .single()

    if (signError) {
      console.error("[TeosPiTaxi] Patent signing error:", signError)
      return NextResponse.json(
        {
          error: "Failed to record patent agreement",
          details: signError.message,
          status: 500,
        },
        { status: 500 },
      )
    }

    // Update onboarding checklist
    await supabase.from("user_onboarding").upsert({
      user_id: userId,
      patent_signed: true,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      agreement,
      signatureHash,
    })
  } catch (error: any) {
    console.error("[TeosPiTaxi] Sign patent error:", error)
    return NextResponse.json(
      {
        error: "Failed to sign patent agreement",
        message: error.message || "Internal server error",
        status: 500,
      },
      { status: 500 },
    )
  }
}
