import { describe, expect, it } from "vitest"
import { defaultLocale, getTranslations, locales } from "@/lib/i18n"

describe("Arabic RTL and English support", () => {
  it("supports exactly English and Arabic with English as the default", () => {
    expect(locales).toEqual(["en", "ar"])
    expect(defaultLocale).toBe("en")
  })

  it("provides distinct real translations, not copied placeholders", () => {
    const english = getTranslations("en")
    const arabic = getTranslations("ar")
    expect(arabic).not.toEqual(english)
    expect(Object.keys(arabic).length).toBeGreaterThan(0)

    const ArabicStrings = JSON.stringify(arabic)
    expect(/[\u0600-\u06FF]/.test(ArabicStrings)).toBe(true)
  })
})
