"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createPiPayment } from "@/lib/pi-sdk"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, XCircle, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PaymentFlowProps {
  tripId: string
  amount: number
  serviceType: "ride" | "delivery"
  description: string
  metadata: Record<string, any>
  onSuccess?: (paymentId: string, txid: string) => void
  onCancel?: () => void
}

export function PaymentFlow({
  tripId,
  amount,
  serviceType,
  description,
  metadata,
  onSuccess,
  onCancel,
}: PaymentFlowProps) {
  const [status, setStatus] = useState<"idle" | "processing" | "approving" | "completing" | "success" | "error">("idle")
  const [paymentId, setPaymentId] = useState<string>("")
  const [error, setError] = useState<string>("")
  const { toast } = useToast()

  const initiatePayment = async () => {
    setStatus("processing")
    setError("")

    try {
      console.log("[v0] Initiating Pi payment:", { tripId, amount, serviceType, description })

      await createPiPayment(
        amount,
        description,
        {
          ...metadata,
          tripId,
          serviceType,
          timestamp: new Date().toISOString(),
        },
        // Approval callback
        async (paymentId) => {
          console.log("[v0] Payment approval needed:", paymentId)
          setPaymentId(paymentId)
          setStatus("approving")

          // Call backend to approve and create escrow
          const response = await fetch("/api/payments/escrow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tripId,
              paymentIntentId: paymentId,
              piPaymentId: paymentId,
            }),
          })

          if (!response.ok) {
            throw new Error("Failed to approve payment")
          }

          toast({
            title: "Payment Approved",
            description: "Funds secured in escrow",
          })
        },
        // Completion callback
        async (paymentId, txid) => {
          console.log("[v0] Payment completion needed:", paymentId, txid)
          setStatus("completing")

          // Call backend to complete payment and distribute funds
          const response = await fetch("/api/payments/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId,
              txid,
              tripId,
            }),
          })

          if (!response.ok) {
            throw new Error("Failed to complete payment")
          }

          const data = await response.json()
          console.log("[v0] Payment completed, distribution:", data.distribution)

          setStatus("success")
          toast({
            title: "Payment Successful",
            description: "Funds distributed: Driver, Agent, and Treasury",
          })

          onSuccess?.(paymentId, txid)
        },
      )
    } catch (err: any) {
      console.error("[v0] Payment error:", err)
      setError(err.message || "Payment failed")
      setStatus("error")
      toast({
        title: "Payment Failed",
        description: err.message || "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setStatus("idle")
    setError("")
    onCancel?.()
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Payment Details</h3>
        {status !== "idle" && (
          <Badge variant={status === "success" ? "default" : status === "error" ? "destructive" : "outline"}>
            {status === "processing" && "Processing"}
            {status === "approving" && "Approving"}
            {status === "completing" && "Completing"}
            {status === "success" && "Success"}
            {status === "error" && "Failed"}
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="font-bold flex items-center gap-1">
            <span className="text-accent">π</span>
            <span>{amount}</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Service</span>
          <span className="font-medium capitalize">{serviceType}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Description</span>
          <span className="text-sm text-right max-w-[200px] truncate">{description}</span>
        </div>
      </div>

      {status === "idle" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <Shield className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-accent mb-1">Escrow Protection</p>
              <p className="text-muted-foreground">
                Payment held securely until service completion. Auto-split: 80% Driver, 15% Treasury, 5% Agent
              </p>
            </div>
          </div>
          <Button onClick={initiatePayment} className="w-full" size="lg">
            Pay with Pi Network
          </Button>
        </div>
      )}

      {status === "processing" && (
        <div className="flex flex-col items-center justify-center py-6 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Opening Pi payment...</p>
        </div>
      )}

      {status === "approving" && (
        <div className="flex flex-col items-center justify-center py-6 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Securing payment in escrow...</p>
        </div>
      )}

      {status === "completing" && (
        <div className="flex flex-col items-center justify-center py-6 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Distributing funds...</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center justify-center py-6 space-y-3">
          <div className="h-16 w-16 bg-chart-5/10 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-chart-5" />
          </div>
          <div className="text-center">
            <p className="font-semibold">Payment Successful</p>
            <p className="text-sm text-muted-foreground">Funds distributed automatically</p>
            {paymentId && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">ID: {paymentId.slice(0, 16)}...</p>
            )}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Payment Failed</p>
              <p className="text-sm text-muted-foreground">{error || "Please try again"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button onClick={initiatePayment} className="flex-1">
              Retry
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
