"use client"

import { AlertCircle } from "lucide-react"
import { useLocale } from "@/contexts/locale-context"

export function VerificationBanner() {
  const { isRTL } = useLocale()

  return (
    <div className="bg-yellow-500/10 border-y border-yellow-500/30 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
        <span className="font-semibold text-yellow-700 dark:text-yellow-300 text-center">
          {isRTL ? "تطبيق تطويري - في انتظار تحقق فريق Pi Core" : "DEVELOPMENT APP - PENDING PI CORE TEAM VERIFICATION"}
        </span>
      </div>
    </div>
  )
}
