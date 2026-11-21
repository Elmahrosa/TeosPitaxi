import { describe, expect, it } from "vitest"
import { calculateDistribution } from "@/lib/escrow-service"
import { DEFAULT_FARE_CONFIG, calculateFare } from "@/lib/fare-calculator"

describe("frozen fee policy", () => {
  it("splits 85% driver / 10% treasury / 5% qualified agent in integer minor units", () => {
    const distribution = calculateDistribution(10_000, 2, true)
    expect(distribution.treasuryMinor).toBe(1_000)
    expect(distribution.agentMinor).toBe(500)
    expect(distribution.driverMinor).toBe(8_500)
    expect(distribution.totalMinor).toBe(
      distribution.treasuryMinor + distribution.agentMinor + distribution.driverMinor,
    )
  })

  it("splits 90% driver / 10% treasury / 0% agent when no qualified agent exists", () => {
    const distribution = calculateDistribution(10_000, 2, false)
    expect(distribution.treasuryMinor).toBe(1_000)
    expect(distribution.agentMinor).toBe(0)
    expect(distribution.driverMinor).toBe(9_000)
  })

  it("rejects amounts that cannot satisfy the frozen percentages exactly", () => {
    expect(() => calculateDistribution(99, 2, false)).toThrow(/divisible/)
    expect(() => calculateDistribution(99, 2, true)).toThrow(/divisible/)
    expect(() => calculateDistribution(0, 2)).toThrow(/positive safe integer/)
    expect(() => calculateDistribution(1.5, 2)).toThrow(/positive safe integer/)
    expect(() => calculateDistribution(100, 7)).toThrow(/scale/)
  })

  it("uses the frozen percentages in the display fare calculator", () => {
    const withoutAgent = calculateFare(10, 20, false)
    expect(withoutAgent.totalFare).toBeCloseTo(35)
    expect(withoutAgent.treasuryFee).toBeCloseTo(3.5)
    expect(withoutAgent.agentCommission).toBe(0)
    expect(withoutAgent.driverPayout).toBeCloseTo(31.5)

    const withAgent = calculateFare(10, 20, true)
    expect(withAgent.treasuryFee).toBeCloseTo(3.5)
    expect(withAgent.agentCommission).toBeCloseTo(1.75)
    expect(withAgent.driverPayout).toBeCloseTo(29.75)
    expect(DEFAULT_FARE_CONFIG.treasuryFeePercent).toBe(10)
    expect(DEFAULT_FARE_CONFIG.agentCommissionPercent).toBe(5)
  })
})
