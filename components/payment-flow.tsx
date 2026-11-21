"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createPiPayment } from "@/lib/pi-sdk"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, XCircle, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface ServerPaymentQuote {
  paymentIntentId: string
  amountMinor: number
  minorUnitScale: number
  amountDisplay: number
  expiresAt: string
}

interface PaymentFlowProps {
  tripId: string
  quote: ServerPaymentQuote
  serviceType: "ride" | "delivery"
  description: string
  onVerified?: (paymentId: string, txid: string) => void
  onCancel?: () => void
}

export function PaymentFlow({
  tripId,
  quote,
  serviceType,
  description,
  onVerified,
  onCancel,
}: PaymentFlowProps) {
  const [status, setStatus] = useState<
    "idle" | "processing" | "approving" | "verifying" | "verified" | "error"
  >("idle")
  const [paymentId, setPaymentId] = useState<string>("")
  const [error, setError] = useState<string>("")
  const { toast } = useToast()

  const postWithCredentials = async (url: string, body: Record<string, unknown>) => {
    const csrfToken = window.sessionStorage.getItem("rev2e_csrf_token") ?? ""
    const csrfEpoch = window.sessionStorage.getItem("rev2e_csrf_epoch") ?? ""

    const response = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "x-rev2e-csrf": csrfToken,
        "x-rev2e-csrf-epoch": csrfEpoch,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Server verification unavailable (${response.status})`)
    }

    return response.json()
  }

  const initiatePayment = async () => {
    setStatus("processing")
    setError("")

    try {
      if (new Date(quote.expiresAt).getTime() <= Date.now()) {
        throw new Error("Quote has expired; request a new quote")
      }

      await createPiPayment(
        quote.amountDisplay,
        description,
        {
          paymentIntentId: quote.paymentIntentId,
          tripId,
          serviceType,
        },
        async (piPaymentId) => {
          setPaymentId(piPaymentId)
          setStatus("approving")
          await postWithCredentials("/api/payments/escrow", {
            tripId,
            paymentIntentId: quote.paymentIntentId,
            providerPaymentId: piPaymentId,
          })
        },
        async (piPaymentId, txid) => {
          setStatus("verifying")
          await postWithCredentials("/api/payments/complete", {
            tripId,
            paymentIntentId: quote.paymentIntentId,
            providerPaymentId: piPaymentId,
            txid,
          })
          setStatus("verified")
          onVerified?.(piPaymentId, txid)
        },
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed")
      setStatus("error")
      toast({
        title: "Payment not verified",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Payment Details</h3>
        {status !== "idle" && (
          <Badge variant={status === "verified" ? "default" : status === "error" ? "destructive" : "outline"}>
            {status === "processing" && "Processing"}
            {status === "approving" && "Approving"}
            {status === "verifying" && "Verifying"}
            {status === "verified" && "Verified"}
            {status === "error" && "Failed"}
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Server-quoted amount</span>
          <span className="font-bold flex items-center gap-1">
            <span className="text-accent">π</span>
            <span>{quote.amountDisplay}</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Payment intent</span>
          <span className="font-mono text-xs">{quote.paymentIntentId}</span>
        </div>
      </div>

      {status === "idle" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <Shield className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-accent mb-1">Server-verified settlement</p>
              <p className="text-muted-foreground">
                The exact quoted amount is verified by the server before approval and completion. Approved split:
                85% or 90% driver, 10% treasury, 0% or 5% qualified agent. No automatic payout is executed.
              </p>
            </div>
          </div>
          <Button onClick={initiatePayment} className="w-full" size="lg">
            Pay with Pi Network
          </Button>
        </div>
      )}

      {(status === "processing" || status === "approving" || status === "verifying") && (
        <div className="flex flex-col items-center justify-center py-6 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {status === "processing" && "Opening Pi payment..."}
            {status === "approving" && "Requesting server verification..."}
            {status === "verifying" && "Waiting for server settlement record..."}
          </p>
        </div>
      )}

      {status === "verified" && (
        <div className="flex flex-col items-center justify-center py-6 space-y-3">
          <CheckCircle className="h-8 w-8 text-chart-5" />
          <p className="font-semibold">Payment verified and settlement recorded</p>
          {paymentId && <p className="text-xs font-mono">ID: {paymentId.slice(0, 16)}...</p>}
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <XCircle className="h-8 w-8 text-destructive" />
            <p className="font-semibold">Payment not completed</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setStatus("idle"); onCancel?.() }} className="flex-1">
              Cancel
            </Button>
            <Button onClick={initiatePayment} className="flex-1">Retry</Button>
          </div>
        </div>
      )}
    </Card>
  )
}
