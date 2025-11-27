// Server-to-user transfer service for automated payment distribution
// Uses Pi Platform API v2 for backend transfers

const PI_API_BASE = "https://api.minepi.com"

export interface TransferRequest {
  to: string // Pi wallet address
  amount: number
  memo: string
  metadata?: Record<string, any>
}

export interface TransferResponse {
  transferId: string
  status: "pending" | "completed" | "failed"
  to: string
  amount: number
  txid?: string
}

// Execute server-to-user transfer (requires backend API key)
export async function transferPi(transfer: TransferRequest): Promise<TransferResponse> {
  const apiKey = process.env.PI_API_KEY

  if (!apiKey) {
    throw new Error("PI_API_KEY not configured for server transfers")
  }

  try {
    const response = await fetch(`${PI_API_BASE}/v2/transfers`, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: transfer.to,
        amount: transfer.amount,
        memo: transfer.memo,
        metadata: transfer.metadata,
      }),
    })

    if (!response.ok) {
      throw new Error(`Transfer failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      transferId: data.identifier,
      status: data.status,
      to: transfer.to,
      amount: transfer.amount,
      txid: data.transaction?.txid,
    }
  } catch (error) {
    console.error("[v0] Pi transfer error:", error)
    throw error
  }
}

// Batch transfers for automated distribution
export async function batchTransferPi(transfers: TransferRequest[]): Promise<TransferResponse[]> {
  // Execute transfers sequentially to ensure atomicity
  const results: TransferResponse[] = []

  for (const transfer of transfers) {
    try {
      const result = await transferPi(transfer)
      results.push(result)
    } catch (error) {
      console.error(`[v0] Failed transfer to ${transfer.to}:`, error)
      // In production: Implement retry logic and rollback on failure
      throw error
    }
  }

  return results
}
