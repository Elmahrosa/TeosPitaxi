"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ExternalLink, FileText } from "lucide-react"

interface PetitionDialogProps {
  open: boolean
  onComplete: () => void
}

export function PetitionDialog({ open, onComplete }: PetitionDialogProps) {
  const [hasReadTerms, setHasReadTerms] = useState(false)
  const [hasSignedPetition, setHasSignedPetition] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const petitionUrl =
    "https://www.change.org/p/join-the-movement-sign-the-petition-to-regulate-digital-currencies-in-egypt"

  const handleOpenPetition = () => {
    window.open(petitionUrl, "_blank")
  }

  const handleContinue = async () => {
    if (!hasReadTerms || !hasSignedPetition) return

    setIsProcessing(true)
    try {
      // Record petition signature in backend
      await fetch("/api/onboarding/sign-petition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petitionUrl,
          signedAt: new Date().toISOString(),
        }),
      })
      onComplete()
    } catch (error) {
      console.error("[v0] Failed to record petition signature:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Join the Elmahrosa Movement
          </DialogTitle>
          <DialogDescription>
            Support digital currency regulation in Egypt before connecting your Pi wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
            <h4 className="font-semibold mb-2 text-sm">Why Sign This Petition?</h4>
            <p className="text-sm text-muted-foreground">
              TeosPiTaxi is part of the Elmahrosa Projects initiative to bring blockchain innovation to Egypt. Your
              signature helps advocate for clear regulations that protect users and enable growth of digital currencies
              like Pi Network.
            </p>
          </div>

          <Button variant="outline" className="w-full bg-transparent" onClick={handleOpenPetition}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Petition on Change.org
          </Button>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={hasReadTerms}
                onCheckedChange={(checked) => setHasReadTerms(checked === true)}
              />
              <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                I have read and agree to the{" "}
                <a href="/terms" target="_blank" className="text-primary hover:underline" rel="noreferrer">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" target="_blank" className="text-primary hover:underline" rel="noreferrer">
                  Privacy Policy
                </a>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="petition"
                checked={hasSignedPetition}
                onCheckedChange={(checked) => setHasSignedPetition(checked === true)}
              />
              <label htmlFor="petition" className="text-sm leading-relaxed cursor-pointer">
                I have signed the petition to support digital currency regulation in Egypt
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full"
            disabled={!hasReadTerms || !hasSignedPetition || isProcessing}
            onClick={handleContinue}
          >
            {isProcessing ? "Processing..." : "Continue to Connect Wallet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
