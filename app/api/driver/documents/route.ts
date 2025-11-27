import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const supabase = createServerClient()

    // Validate vehicle year
    const vehicleYear = Number.parseInt(formData.get("vehicleYear") as string)
    if (vehicleYear < 2020) {
      return NextResponse.json({ error: "Vehicle must be 2020 model or newer", status: 400 }, { status: 400 })
    }

    // TODO: Upload files to storage and save to database
    // For now, just validate and return success

    const driverData = {
      full_name: formData.get("fullName"),
      phone: formData.get("phone"),
      national_id: formData.get("nationalId"),
      license_number: formData.get("licenseNumber"),
      license_expiry: formData.get("licenseExpiry"),
      vehicle_year: vehicleYear,
      vehicle_make: formData.get("vehicleMake"),
      vehicle_model: formData.get("vehicleModel"),
      vehicle_type: formData.get("vehicleType"),
      license_plate: formData.get("licensePlate"),
      status: "pending_verification",
    }

    console.log("[Driver Documents]", driverData)

    return NextResponse.json({
      success: true,
      message: "Documents submitted successfully",
    })
  } catch (error: any) {
    console.error("[Document Upload Error]", error)
    return NextResponse.json({ error: "Failed to process documents", status: 500 }, { status: 500 })
  }
}
