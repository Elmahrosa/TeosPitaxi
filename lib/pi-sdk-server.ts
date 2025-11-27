// Server-side Pi SDK utilities
import axios from "axios"

const PI_API_URL = "https://api.minepi.com"
const PI_API_KEY = process.env.PI_API_KEY

export const TEOS_TREASURY_WALLET =
  process.env.TEOS_TREASURY_WALLET || process.env.NEXT_PUBLIC_TEOS_TREASURY_ADDRESS || "aams1969"

export const FOUNDER_PI_USERNAME = "aams1969"

if (!PI_API_KEY) {
  console.warn("[TEOSPITAXI] PI_API_KEY not set - Pi SDK features will not work")
}

export interface PiPayment {
  identifier: string
  user_uid: string
  amount: number
  memo: string
  metadata: any
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
  transaction?: {
    txid: string
    verified: boolean
    _link: string
  }
}

// Approve a payment on the backend
export async function approvePayment(paymentId: string): Promise<PiPayment> {
  if (!PI_API_KEY) {
    throw new Error("PI_API_KEY not configured")
  }

  const response = await axios.post(
    `${PI_API_URL}/v2/payments/${paymentId}/approve`,
    {},
    {
      headers: {
        Authorization: `Key ${PI_API_KEY}`,
      },
    },
  )

  return response.data
}

// Complete a payment after verification
export async function completePayment(paymentId: string, txid: string): Promise<PiPayment> {
  if (!PI_API_KEY) {
    throw new Error("PI_API_KEY not configured")
  }

  const response = await axios.post(
    `${PI_API_URL}/v2/payments/${paymentId}/complete`,
    { txid },
    {
      headers: {
        Authorization: `Key ${PI_API_KEY}`,
      },
    },
  )

  return response.data
}

// Get payment status
export async function getPayment(paymentId: string): Promise<PiPayment> {
  if (!PI_API_KEY) {
    throw new Error("PI_API_KEY not configured")
  }

  const response = await axios.get(`${PI_API_URL}/v2/payments/${paymentId}`, {
    headers: {
      Authorization: `Key ${PI_API_KEY}`,
    },
  })

  return response.data
}

// Cancel a payment
export async function cancelPayment(paymentId: string): Promise<PiPayment> {
  if (!PI_API_KEY) {
    throw new Error("PI_API_KEY not configured")
  }

  const response = await axios.post(
    `${PI_API_URL}/v2/payments/${paymentId}/cancel`,
    {},
    {
      headers: {
        Authorization: `Key ${PI_API_KEY}`,
      },
    },
  )

  return response.data
}

// Create a server-to-user transfer (for payouts)
export async function createTransfer(recipientUid: string, amount: number, memo: string, metadata?: any): Promise<any> {
  if (!PI_API_KEY) {
    throw new Error("PI_API_KEY not configured")
  }

  const response = await axios.post(
    `${PI_API_URL}/v2/payments`,
    {
      payment: {
        amount,
        memo,
        metadata,
        uid: recipientUid,
      },
    },
    {
      headers: {
        Authorization: `Key ${PI_API_KEY}`,
      },
    },
  )

  return response.data
}
