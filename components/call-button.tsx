"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Phone, Video, X } from "lucide-react"
import { callingService } from "@/lib/calling-service"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CallButtonProps {
  recipientName: string
  recipientPhone?: string
  tripId?: string
  variant?: "audio" | "video" | "phone"
}

export function CallButton({ recipientName, recipientPhone, tripId, variant = "audio" }: CallButtonProps) {
  const [isCallActive, setIsCallActive] = useState(false)

  const handleCall = async () => {
    if (variant === "phone" && recipientPhone) {
      await callingService.makePhoneCall(recipientPhone)
      return
    }

    setIsCallActive(true)
    try {
      await callingService.initiateCall({
        type: variant === "video" ? "video" : "audio",
        recipientId: recipientPhone || "unknown",
        recipientName,
        tripId,
      })
    } catch (error) {
      console.error("[v0] Call failed:", error)
      setIsCallActive(false)
    }
  }

  const handleEndCall = () => {
    callingService.endCall()
    setIsCallActive(false)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleCall}>
        {variant === "video" ? <Video className="h-4 w-4 mr-2" /> : <Phone className="h-4 w-4 mr-2" />}
        Call
      </Button>

      <Dialog open={isCallActive} onOpenChange={setIsCallActive}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calling {recipientName}</DialogTitle>
            <DialogDescription>{variant === "video" ? "Video call" : "Voice call"} in progress</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
              {variant === "video" ? (
                <Video className="h-12 w-12 text-primary" />
              ) : (
                <Phone className="h-12 w-12 text-primary" />
              )}
            </div>
            <Button variant="destructive" size="lg" onClick={handleEndCall} className="rounded-full h-16 w-16">
              <X className="h-8 w-8" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
