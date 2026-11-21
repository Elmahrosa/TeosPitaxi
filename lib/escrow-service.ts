// Revision 2e: legacy escrow helper is disabled.
// No blockchain escrow, automated A2U transfer, or client-side payout is available.
// Settlement is recorded only by the trusted server verifier boundary.

export type DisabledEscrowReason = "ESCROW_SERVICE_DISABLED"

export interface EscrowPayment {
  id: string
  paymentId: string
  amountMinor: number
  minorUnitScale: number
  status: "unavailable"
  serviceType: "ride" | "delivery"
  riderId: string
  driverId: string | null
  agentId?: string
  createdAt: string
}

export interface PaymentDistribution {
  totalMinor: number
  minorUnitScale: number
  treasuryMinor: number
  driverMinor: number
  agentMinor: number
  treasuryPercent: 10
  qualifiedAgentPercent: 5
  driverWithAgentPercent: 85
  driverWithoutAgentPercent: 90
}

class DisabledEscrowError extends Error {
  readonly code: DisabledEscrowReason = "ESCROW_SERVICE_DISABLED"

  constructor() {
    super("Escrow operations are disabled in this release candidate")
  }
}

export async function createEscrow(): Promise<EscrowPayment> {
  throw new DisabledEscrowError()
}

export async function holdInEscrow(): Promise<EscrowPayment> {
  throw new DisabledEscrowError()
}

export function calculateDistribution(
  totalMinor: number,
  minorUnitScale: number,
  hasQualifiedAgent = false,
): PaymentDistribution {
  if (!Number.isSafeInteger(totalMinor) || totalMinor <= 0) {
    throw new Error("Minor-unit amount must be a positive safe integer")
  }
  if (!Number.isInteger(minorUnitScale) || minorUnitScale < 0 || minorUnitScale > 6) {
    throw new Error("Minor-unit scale must be between 0 and 6")
  }

  // The frozen policy is exact: 10% treasury always, plus a 5% qualified
  // agent share. Reject amounts that would require silent rounding.
  const requiredDivisor = hasQualifiedAgent ? 20 : 10
  if (totalMinor % requiredDivisor !== 0) {
    throw new Error("Minor-unit amount is not divisible by the frozen fee policy")
  }

  const treasuryMinor = totalMinor / 10
  const agentMinor = hasQualifiedAgent ? totalMinor / 20 : 0
  const driverMinor = totalMinor - treasuryMinor - agentMinor

  return {
    totalMinor,
    minorUnitScale,
    treasuryMinor,
    driverMinor,
    agentMinor,
    treasuryPercent: 10,
    qualifiedAgentPercent: 5,
    driverWithAgentPercent: 85,
    driverWithoutAgentPercent: 90,
  }
}

export async function releaseFromEscrow(): Promise<never> {
  throw new DisabledEscrowError()
}

export async function initiateDispute(): Promise<never> {
  throw new DisabledEscrowError()
}
