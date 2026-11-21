// Pi Network SDK integration and types

export interface PiUser {
  uid: string
  username: string
}

export interface PiPayment {
  identifier: string
  user_uid: string
  amount: number
  memo: string
  metadata: Record<string, unknown>
  from_address: string
  to_address: string
  direction: string
  created_at: string
  network: string
  status: {
    developer_approved: boolean
    transaction_verified: boolean
    developer_completed: boolean
    cancelled: boolean
    user_cancelled: boolean
  }
  transaction: {
    txid: string
    verified: boolean
    _link: string
  }
}

export interface PiAuth {
  accessToken: string
  user: PiUser
}

type PiPaymentCallbacks = {
  onReadyForServerApproval: (paymentId: string) => void | Promise<void>
  onReadyForServerCompletion: (paymentId: string, txid: string) => void | Promise<void>
  onCancel: (paymentId: string) => void
  onError: (error: Error, payment?: PiPayment) => void
}

type PiSdk = {
  init: (config: { version: string; sandbox: boolean }) => void
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: PiPayment) => void,
  ) => Promise<PiAuth>
  createPayment: (
    paymentData: { amount: number; memo: string; metadata: Record<string, unknown> },
    callbacks: PiPaymentCallbacks,
  ) => Promise<PiPayment>
}

function getPiSdk(): PiSdk | undefined {
  if (typeof window === "undefined") return undefined
  return (window as Window & { Pi?: PiSdk }).Pi
}

// Initialize Pi SDK. Network selection is explicit and client-side only;
// all financial authority remains server-side.
export function initPiSDK() {
  const pi = getPiSdk()
  if (pi) {
    const sandbox = process.env.NEXT_PUBLIC_PI_NETWORK !== "mainnet"
    pi.init({ version: "2.0", sandbox })
  }
}

/**
 * Browse-first gate. User-agent inspection is advisory only and never proves
 * ecosystem context. The authoritative evidence is the server-persisted browse
 * record created by /api/session/browse-evidence before Pi.authenticate runs.
 */
export function assertPiBrowserContext(): void {
  if (!getPiSdk()) {
    throw new Error("Pi SDK is not available in this browser")
  }

  const ua = navigator.userAgent || ""
  if (!/PiBrowser|Pi Network/i.test(ua)) {
    console.warn(
      "[rev2e] Pi Browser user-agent hint not detected; server browse evidence is authoritative.",
    )
  }
}

// Authenticate user with Pi Network after the browse-first gate has passed.
export async function authenticateUser(): Promise<PiAuth | null> {
  try {
    assertPiBrowserContext()

    const scopes = ["username", "payments"]
    const auth = await getPiSdk()!.authenticate(scopes, onIncompletePaymentFound)
    return auth
  } catch (error) {
    console.error("[v0] Pi Authentication failed:", error)
    return null
  }
}

// Handle incomplete payments
function onIncompletePaymentFound(payment: PiPayment) {
  console.log("[v0] Incomplete payment found:", payment)
  // Handle incomplete payment - could show modal to user
}

// Create payment request
export async function createPiPayment(
  amount: number,
  memo: string,
  metadata: Record<string, unknown>,
  onApprovalNeeded?: (paymentId: string) => Promise<void>,
  onCompletionNeeded?: (paymentId: string, txid: string) => Promise<void>,
) {
  const pi = getPiSdk()
  if (!pi) {
    throw new Error("Pi SDK not loaded")
  }

  try {
    const paymentData = {
      amount,
      memo,
      metadata,
    }

    const payment = await pi.createPayment(paymentData, {
      onReadyForServerApproval: async (paymentId: string) => {
        console.log("[v0] Payment ready for server approval:", paymentId)
        if (onApprovalNeeded) {
          await onApprovalNeeded(paymentId)
        }
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        console.log("[v0] Payment ready for completion:", paymentId, txid)
        if (onCompletionNeeded) {
          await onCompletionNeeded(paymentId, txid)
        }
      },
      onCancel: (paymentId: string) => {
        console.log("[v0] Payment cancelled:", paymentId)
      },
      onError: (error: Error, payment?: PiPayment) => {
        console.error("[v0] Payment error:", error, payment)
      },
    })

    return payment
  } catch (error) {
    console.error("[v0] Failed to create payment:", error)
    throw error
  }
}
