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
  metadata: Record<string, any>
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

// Initialize Pi SDK
export function initPiSDK() {
  if (typeof window !== "undefined" && (window as any).Pi) {
    ;(window as any).Pi.init({ version: "2.0", sandbox: true })
  }
}

// Authenticate user with Pi Network
export async function authenticateUser(): Promise<PiAuth | null> {
  if (typeof window === "undefined" || !(window as any).Pi) {
    console.error("[v0] Pi SDK not loaded")
    return null
  }

  try {
    const scopes = ["username", "payments"]
    const auth = await (window as any).Pi.authenticate(scopes, onIncompletePaymentFound)
    console.log("[v0] Pi Authentication successful:", auth.user)
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
  metadata: Record<string, any>,
  onApprovalNeeded?: (paymentId: string) => Promise<void>,
  onCompletionNeeded?: (paymentId: string, txid: string) => Promise<void>,
) {
  if (typeof window === "undefined" || !(window as any).Pi) {
    throw new Error("Pi SDK not loaded")
  }

  try {
    const paymentData = {
      amount,
      memo,
      metadata,
    }

    const payment = await (window as any).Pi.createPayment(paymentData, {
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
