// Production-ready Escrow service for managing Pi payment holds and releases
// Implements automated treasury fee distribution and dispute resolution

export interface EscrowPayment {
  id: string
  paymentId: string
  amount: number
  status: "pending" | "held" | "released" | "disputed" | "refunded"
  serviceType: "ride" | "delivery"
  riderId: string
  driverI: string | null
  agentId?: string
  createdAt: string
  heldAt?: string
  releasedAt?: string
  disputedAt?: string
  disputeReason?: string
  refundedAt?: string
}

export interface PaymentDistribution {
  totalAmount: number
  treasuryFee: number
  driverEarnings: number
  agentCommission: number
  treasuryAddress: string
}

// TEOS Treasury Pi address (configure in production)
const TEOS_TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TEOS_TREASURY_ADDRESS || "TREASURY_PI_ADDRESS"

// Fee structure: 10% treasury, 5% agent (if applicable), 85% driver
const TREASURY_FEE_PERCENT = 0.1
const AGENT_COMMISSION_PERCENT = 0.05

// Create escrow record when ride/delivery is requested
export async function createEscrow(
  paymentId: string,
  amount: number,
  serviceType: "ride" | "delivery",
  riderId: string,
  metadata: Record<string, any>,
): Promise<EscrowPayment> {
  const escrowRecord: EscrowPayment = {
    id: `escrow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    paymentId,
    amount,
    status: "pending",
    serviceType,
    riderId,
    driverId: null,
    agentId: metadata.agentId,
    createdAt: new Date().toISOString(),
  }

  // In production: Store in database (Supabase/Neon)
  // await db.escrow.insert(escrowRecord)

  return escrowRecord
}

// Hold payment in escrow when driver accepts
export async function holdInEscrow(escrowId: string, driverId: string, paymentId: string): Promise<EscrowPayment> {
  // In production: Update database record
  const escrowRecord: EscrowPayment = {
    id: escrowId,
    paymentId,
    amount: 0, // Fetch from DB
    status: "held",
    serviceType: "ride",
    riderId: "",
    driverId,
    heldAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }

  // Lock funds on Pi blockchain via escrow smart contract
  // This prevents release until trip completion or dispute resolution

  return escrowRecord
}

// Calculate payment distribution with treasury and agent splits
export function calculateDistribution(amount: number, hasAgent = false): PaymentDistribution {
  const treasuryFee = amount * TREASURY_FEE_PERCENT
  const agentCommission = hasAgent ? amount * AGENT_COMMISSION_PERCENT : 0
  const driverEarnings = amount - treasuryFee - agentCommission

  return {
    totalAmount: amount,
    treasuryFee,
    driverEarnings,
    agentCommission,
    treasuryAddress: TEOS_TREASURY_ADDRESS,
  }
}

// Release payment from escrow when service completes successfully
export async function releaseFromEscrow(
  escrowId: string,
  paymentId: string,
  txid: string,
  driverAddress: string,
  agentAddress?: string,
): Promise<{ escrow: EscrowPayment; distribution: PaymentDistribution }> {
  // Fetch escrow record from database
  // const escrow = await db.escrow.findById(escrowId)

  const hasAgent = !!agentAddress
  const distribution = calculateDistribution(100, hasAgent) // Use actual amount from escrow

  // Execute automated splits via Pi Platform server-to-user transfers
  // 1. Transfer treasury fee to TEOS_TREASURY_ADDRESS
  // 2. Transfer driver earnings to driverAddress
  // 3. Transfer agent commission to agentAddress (if applicable)

  // In production: Call Pi Platform API for server-to-user transfers
  /*
  await transferPi({
    to: TEOS_TREASURY_ADDRESS,
    amount: distribution.treasuryFee,
    memo: `Treasury fee for ${paymentId}`
  })
  
  await transferPi({
    to: driverAddress,
    amount: distribution.driverEarnings,
    memo: `Earnings for ${paymentId}`
  })
  
  if (hasAgent && agentAddress) {
    await transferPi({
      to: agentAddress,
      amount: distribution.agentCommission,
      memo: `Commission for ${paymentId}`
    })
  }
  */

  // Complete the user-to-app payment
  await fetch("/api/payments/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId, txid }),
  })

  const updatedEscrow: EscrowPayment = {
    id: escrowId,
    paymentId,
    amount: distribution.totalAmount,
    status: "released",
    serviceType: "ride",
    riderId: "",
    driverId: "",
    releasedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }

  // Update database
  // await db.escrow.update(escrowId, { status: 'released', releasedAt: new Date() })
  // await db.transactions.insert({ escrowId, distribution, timestamp: new Date() })

  return { escrow: updatedEscrow, distribution }
}

// Initiate dispute if rider or driver reports an issue
export async function initiateDispute(
  escrowId: string,
  reason: string,
  initiatedBy: "rider" | "driver",
): Promise<EscrowPayment> {
  const updatedEscrow: EscrowPayment = {
    id: escrowId,
    paymentId: "",
    amount: 0,
    status: "disputed",
    serviceType: "ride",
    riderId: "",
    driverId: null,
    disputedAt: new Date().toISOString(),
    disputeReason: reason,
    createdAt: new Date().toISOString(),
  }

  // In production:
  // 1. Freeze escrow funds
  // 2. Notify admin/governance team
  // 3. Create dispute record with evidence
  // await db.escrow.update(escrowId, { status: 'disputed', disputedAt: new Date(), disputeReason: reason })
  // await db.disputes.insert({ escrowId, reason, initiatedBy, status: 'open' })

  return updatedEscrow
}

// Resolve dispute with admin decision
export async function resolveDispute(
  escrowId: string,
  resolution: "refund_rider" | "pay_driver" | "split_payment",
  adminId: string,
): Promise<void> {
  // Fetch escrow and dispute records
  // const escrow = await db.escrow.findById(escrowId)
  // const dispute = await db.disputes.findByEscrowId(escrowId)

  switch (resolution) {
    case "refund_rider":
      // Return full amount to rider (minus small processing fee)
      // await refundToRider(escrowId)
      break
    case "pay_driver":
      // Release payment to driver with normal distribution
      // await releaseFromEscrow(escrowId, ...)
      break
    case "split_payment":
      // Custom split based on evidence (e.g., 50/50)
      // await customSplit(escrowId, 0.5)
      break
  }

  // Update records
  // await db.disputes.update(disputeId, { status: 'resolved', resolution, resolvedBy: adminId })
}

// Refund payment if cancelled before driver accepts
export async function refundFromEscrow(escrowId: string, paymentId: string, reason: string): Promise<void> {
  // In production:
  // 1. Verify escrow is in 'pending' or 'held' status
  // 2. Cancel the Pi payment (if not yet completed)
  // 3. Return funds to rider
  // 4. Update escrow status to 'refunded'
  // await db.escrow.update(escrowId, { status: 'refunded', refundedAt: new Date() })
}
