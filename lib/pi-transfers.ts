// Automated App-to-User transfers are intentionally disabled.
import "server-only"
//
// Official Mainnet A2U support, developer eligibility and the complete set of
// documented transfer fields have not been proven for this application. Until
// that evidence exists, no transfer request may leave this process. These
// functions remain as fail-closed stubs so no caller can accidentally enable
// automated payouts by importing them.

export interface TransferRequest {
  to: string
  amount: number
  memo: string
  metadata?: Record<string, unknown>
}

export interface TransferResponse {
  transferId: string
  status: "pending" | "completed" | "failed"
  to: string
  amount: number
  txid?: string
}

export class AutomatedTransfersUnavailableError extends Error {
  constructor() {
    super("Automated Pi A2U transfers are unavailable until Mainnet eligibility is verified")
    this.name = "AutomatedTransfersUnavailableError"
  }
}

export async function transferPi(_transfer: TransferRequest): Promise<TransferResponse> {
  throw new AutomatedTransfersUnavailableError()
}

export async function batchTransferPi(_transfers: TransferRequest[]): Promise<TransferResponse[]> {
  throw new AutomatedTransfersUnavailableError()
}
