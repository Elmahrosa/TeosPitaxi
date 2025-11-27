// AI Chat API - powered by Vercel AI SDK
import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Generate AI response using OpenAI
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: `You are a helpful assistant for TEOSPITAXI, a Pi-native mobility platform. 
      You help users with:
      - Booking taxi rides and bike deliveries
      - Understanding Pi cryptocurrency payments
      - Explaining fare calculations and pricing
      - Assisting with driver onboarding
      - Answering questions about the platform
      
      Always be friendly, professional, and promote the civic-first, transparent values of TEOSPITAXI.
      The founder is aams1969. Platform operates in Alexandria, Egypt with plans to expand across MENA.`,
      prompt: message,
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("[AI Chat Error]", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
