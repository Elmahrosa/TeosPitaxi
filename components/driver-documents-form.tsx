"use client"

import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function DriverDocumentsForm() {
  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-bold">Driver Documents Unavailable</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Document submission and review are disabled in this release candidate. No upload is accepted and no
              approval success state is reachable.
            </p>
          </div>
          <Button variant="outline" disabled>
            Submit Application Unavailable
          </Button>
        </div>
      </div>
    </Card>
  )
}
