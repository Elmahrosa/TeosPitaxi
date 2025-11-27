import { generateText } from "ai"
import { NextResponse } from "next/server"
import { TEOSPITAXI_KNOWLEDGE } from "@/lib/teospitaxi-knowledge"

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    try {
      const { text } = await generateText({
        model: "google/gemini-2.5-flash-image", // Free tier: 6M tokens/day
        system: `You are the official TEOSPITAXI AI Assistant with complete knowledge of the platform.

${TEOSPITAXI_KNOWLEDGE}

IMPORTANT INSTRUCTIONS:
- Answer ALL questions directly using the knowledge base above
- Be friendly, professional, and enthusiastic about blockchain mobility
- NEVER redirect users to WhatsApp, Telegram, or external support unless they specifically ask for contact info
- Provide specific, detailed answers with examples
- If asked about booking, guide them through the exact steps
- If asked about prices, explain the transparent pricing formula
- If asked about Pi Network, explain how to join with referral code aams1969
- Emphasize that TeosPiTaxi is the FIRST Pi blockchain ride-sharing platform
- Promote the petition for digital currency regulation
- Always mention founder's referral code when relevant: aams1969
- Be civic-minded and promote transparency, fairness, and community governance

If you don't know something specific, say so honestly but provide related helpful information from the knowledge base.

Your goal: Help users understand, join, and use TeosPiTaxi successfully!`,
        prompt: message,
      })

      return NextResponse.json({ response: text })
    } catch (aiError: any) {
      console.error("[AI Error]", aiError)

      const basicAnswer = getBasicAnswer(message)
      return NextResponse.json({
        response: basicAnswer,
      })
    }
  } catch (error: any) {
    console.error("[Chat API Error]", error)
    return NextResponse.json(
      {
        error: "Service temporarily unavailable",
        response:
          "I apologize for the technical difficulty. Please try refreshing the page or asking your question again.",
      },
      { status: 500 },
    )
  }
}

function getBasicAnswer(message: string): string {
  const lowerMsg = message.toLowerCase()

  if (lowerMsg.includes("book") || lowerMsg.includes("ride") || lowerMsg.includes("trip")) {
    return `To book a ride on TeosPiTaxi:

1. Go to the Rider app at https://teospitaxi.teosegypt.com/rider
2. Connect your Pi wallet (required for payment)
3. Sign the digital currency regulation petition
4. Enter your pickup location (Alexandria, Cairo, Giza, Aswan, etc.)
5. Enter your destination
6. Choose vehicle type (small car, large car, or bike)
7. See fare estimate
8. Confirm booking - payment held in secure escrow
9. Get matched with a driver
10. Track your ride in real-time

Payment is automatically split: 85% to driver, 10% to platform, 5% to referring agent.

Need help? Just ask me more questions!`
  }

  if (lowerMsg.includes("price") || lowerMsg.includes("fare") || lowerMsg.includes("cost")) {
    return `TeosPiTaxi uses transparent dynamic pricing based on:

- **Distance:** Rate per kilometer
- **Time:** Rate per minute  
- **Demand:** Surge multiplier during peak times (always shown)
- **Vehicle Type:** Small cars cheaper than large cars/SUVs

Fare Formula: (Distance × km_rate) + (Time × min_rate) × surge_multiplier

All pricing is transparent - you see the exact calculation before booking. First month promotional rates may be available.

Payment splits:
- 85% → Driver
- 10% → TEOS Treasury
- 5% → Referring Agent

Want to see a fare estimate? Tell me your pickup and destination!`
  }

  if (lowerMsg.includes("pi") || lowerMsg.includes("wallet") || lowerMsg.includes("cryptocurrency")) {
    return `TeosPiTaxi uses Pi cryptocurrency exclusively for all payments!

**To join Pi Network:**
1. Download Pi Network app (iOS/Android)
2. Use referral code: **aams1969** (founder's code)
3. Direct link: https://minepi.com/aams1969
4. Start mining Pi for free on your phone
5. Complete KYC verification
6. Create your Pi wallet
7. Authorize TeosPiTaxi to use your wallet

**Why Pi?**
- Secure blockchain escrow
- No credit card fees
- Instant driver payments
- Transparent on-chain transactions
- Global acceptance

TeosPiTaxi is the world's FIRST Pi-native ride-sharing platform!`
  }

  if (lowerMsg.includes("driver") || lowerMsg.includes("earn") || lowerMsg.includes("work")) {
    return `Become a TeosPiTaxi driver and earn Pi cryptocurrency!

**Requirements:**
- Age 21+
- Valid driver's license
- Vehicle 2020 or newer (small car, large car, or bike)
- Pi Network wallet
- Clean driving record

**Documents Needed:**
- Driver's license photo
- Vehicle registration
- Insurance proof
- National ID/passport

**How to Register:**
1. Go to https://teospitaxi.teosegypt.com/driver
2. Create profile
3. Upload documents
4. Sign digital currency petition
5. Wait for verification (24-48 hours)
6. Start earning!

**Earnings:**
- You keep 85% of every fare
- Instant Pi payment after trip
- No commission delays
- Transparent pricing

Join the blockchain revolution in mobility!`
  }

  if (lowerMsg.includes("agent") || lowerMsg.includes("refer") || lowerMsg.includes("commission")) {
    return `Join TeosPiTaxi's Global Agent Network and earn commissions!

**How it Works:**
- Share your referral code with riders and drivers
- Earn 5% commission on every ride they take
- Build your network worldwide
- Passive income in Pi cryptocurrency

**Get Started:**
1. Go to https://teospitaxi.teosegypt.com/agent
2. Create agent profile
3. Get your unique referral code
4. Share with your network
5. Track earnings in real-time

**Founder's Referral Code:** aams1969

Use this code when joining Pi Network to connect with the TeosPiTaxi community!

**Agent Benefits:**
- 5% of all referred rides
- Unlimited earning potential
- Help grow blockchain mobility in Egypt and beyond
- Be part of civic-first governance`
  }

  if (lowerMsg.includes("petition") || lowerMsg.includes("sign") || lowerMsg.includes("regulation")) {
    return `All TeosPiTaxi users must sign this important petition:

**Join the Movement: Sign the Petition to Regulate Digital Currencies in Egypt**

🔗 https://www.change.org/p/join-the-movement-sign-the-petition-to-regulate-digital-currencies-in-egypt

**Why this matters:**
- Advocates for legal framework for cryptocurrencies in Egypt
- Protects digital currency users
- Promotes innovation-friendly regulations
- Supports financial inclusion through blockchain
- Helps legitimize platforms like TeosPiTaxi

**You must sign before:**
- Connecting your Pi wallet
- Booking your first ride
- Becoming a driver or agent

Join thousands supporting the future of digital finance in Egypt!`
  }

  // Default comprehensive response
  return `Welcome to TeosPiTaxi - the world's FIRST Pi blockchain ride-sharing platform!

I can help you with:
✅ Booking rides in Alexandria, Cairo, Giza, Aswan
✅ Understanding Pi cryptocurrency payments
✅ Becoming a driver (earn 85% of fares)
✅ Joining as an agent (earn 5% commissions)
✅ Learning about transparent pricing
✅ Signing up for Pi Network (code: aams1969)
✅ Supporting digital currency regulation petition

**Quick Links:**
🚗 Book Ride: https://teospitaxi.teosegypt.com/rider
🚕 Become Driver: https://teospitaxi.teosegypt.com/driver
💰 Pi Network: https://minepi.com/aams1969
✍️ Petition: https://www.change.org/p/join-the-movement-sign-the-petition-to-regulate-digital-currencies-in-egypt

**What would you like to know?**
- How to book a ride?
- How pricing works?
- How to earn as a driver?
- How to join Pi Network?
- How to become an agent?

Just ask me anything!`
}
