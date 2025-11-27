export async function POST(request: Request) {
  try {
    const { pickup, destination, vehicleType } = await request.json()

    const fareEstimate = calculateFare(pickup, destination, vehicleType)

    return Response.json({
      success: true,
      estimate: fareEstimate,
    })
  } catch (error) {
    return Response.json({ success: false, error: "Failed to calculate fare" }, { status: 500 })
  }
}

function calculateFare(pickup: any, destination: any, vehicleType: string) {
  // Calculate distance (simplified - use actual mapping service)
  const distance =
    Math.sqrt(Math.pow(destination.lat - pickup.lat, 2) + Math.pow(destination.lng - pickup.lng, 2)) * 111 // Rough km conversion

  const rates: Record<string, number> = {
    economy: 0.5,
    comfort: 0.75,
    premium: 1.0,
    bike: 0.3,
  }

  const baseRate = rates[vehicleType] || 0.5
  const baseFare = 2.0
  const perKmRate = baseRate

  const subtotal = baseFare + distance * perKmRate
  const treasuryFee = subtotal * 0.1
  const driverEarnings = subtotal * 0.85
  const agentCommission = subtotal * 0.05

  return {
    distance: distance.toFixed(2),
    baseFare,
    perKmRate,
    subtotal: subtotal.toFixed(2),
    treasuryFee: treasuryFee.toFixed(2),
    driverEarnings: driverEarnings.toFixed(2),
    agentCommission: agentCommission.toFixed(2),
    total: subtotal.toFixed(2),
  }
}
