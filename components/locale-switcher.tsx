"use client"

import { Button } from "@/components/ui/button"
import { useLocale } from "@/contexts/locale-context"
import { Languages } from "lucide-react"

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale()

  const toggleLocale = () => {
    setLocale(locale === "en" ? "ar" : "en")
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggleLocale} className="gap-2">
      <Languages className="h-4 w-4" />
      <span className="text-sm font-medium">{locale === "en" ? "العربية" : "English"}</span>
    </Button>
  )
}
