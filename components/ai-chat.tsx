"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send, X, Sparkles } from "lucide-react"

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: `Welcome to TeosPiTaxi! 🚗 I'm your AI assistant with complete knowledge of our Pi blockchain ride-sharing platform.

I can help you with:
• Booking rides across Egypt
• Understanding Pi payments
• Becoming a driver or agent
• Joining Pi Network (code: aams1969)
• Platform features and pricing

What would you like to know?`,
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.response) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I'm having trouble processing that. Could you please rephrase your question? I can help with booking rides, understanding pricing, becoming a driver, joining Pi Network, and more!",
          },
        ])
      }
    } catch (error) {
      console.error("[Chat Error]", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm experiencing a connection issue. Please try again or ask me about booking rides, driver registration, Pi Network, or our services!",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const quickActions = ["How to book a ride?", "How much does it cost?", "How to become a driver?", "Join Pi Network"]

  const handleQuickAction = (action: string) => {
    setInput(action)
  }

  return (
    <>
      {/* Chat Toggle Button with pulsing animation */}
      {!isOpen && (
        <Button
          size="lg"
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 animate-pulse"
          onClick={() => setIsOpen(true)}
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-4 right-4 w-[90vw] sm:w-96 h-[500px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <h3 className="font-semibold text-sm">TEOSPITAXI AI</h3>
                <p className="text-xs opacity-90">Instant answers, no redirects</p>
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-sm ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                    <div
                      className="h-2 w-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="h-2 w-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-3 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {quickActions.map((action) => (
                  <Button
                    key={action}
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickAction(action)}
                    className="text-xs h-7"
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything about TeosPiTaxi..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                disabled={loading}
                className="text-sm"
              />
              <Button size="icon" onClick={sendMessage} disabled={loading || !input.trim()} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}
