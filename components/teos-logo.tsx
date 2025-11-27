"use client"

import { cn } from "@/lib/utils"

interface TeosLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function TeosLogo({ size = "md", className }: TeosLogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  }

  const iconSize = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  }

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-label="TeosPiTaxi Logo"
      >
        {/* Blockchain nodes circle - geometric lines for transparency */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="oklch(0.65 0.15 65)"
          strokeWidth="1.5"
          strokeDasharray="8 4"
          fill="none"
          opacity="0.6"
        />

        {/* Inner blockchain nodes */}
        <circle cx="50" cy="15" r="2" fill="oklch(0.25 0.08 240)" opacity="0.5" />
        <circle cx="85" cy="50" r="2" fill="oklch(0.25 0.08 240)" opacity="0.5" />
        <circle cx="50" cy="85" r="2" fill="oklch(0.25 0.08 240)" opacity="0.5" />
        <circle cx="15" cy="50" r="2" fill="oklch(0.25 0.08 240)" opacity="0.5" />

        {/* Connecting lines - ledger transparency symbol */}
        <line x1="50" y1="15" x2="50" y2="30" stroke="oklch(0.25 0.08 240)" strokeWidth="1" opacity="0.3" />
        <line x1="85" y1="50" x2="70" y2="50" stroke="oklch(0.25 0.08 240)" strokeWidth="1" opacity="0.3" />
        <line x1="50" y1="85" x2="50" y2="70" stroke="oklch(0.25 0.08 240)" strokeWidth="1" opacity="0.3" />
        <line x1="15" y1="50" x2="30" y2="50" stroke="oklch(0.25 0.08 240)" strokeWidth="1" opacity="0.3" />

        {/* Pi coin circle - central, glowing */}
        <circle cx="50" cy="50" r="32" fill="oklch(0.65 0.15 65)" opacity="0.15" />
        <circle cx="50" cy="50" r="28" fill="oklch(0.65 0.15 65)" stroke="oklch(0.65 0.15 65)" strokeWidth="2" />

        {/* Stylized taxi icon - sleek, futuristic, minimal */}
        <g transform="translate(50, 50) scale(0.5) translate(-24, -16)">
          {/* Taxi body */}
          <path
            d="M4 24 L8 12 L40 12 L44 24 L4 24 Z"
            fill="oklch(0.25 0.08 240)"
            stroke="oklch(0.25 0.08 240)"
            strokeWidth="1.5"
          />
          {/* Taxi roof */}
          <path
            d="M12 12 L14 6 L34 6 L36 12 Z"
            fill="oklch(0.25 0.08 240)"
            stroke="oklch(0.25 0.08 240)"
            strokeWidth="1.5"
          />
          {/* Windows */}
          <rect x="14" y="8" width="8" height="4" fill="oklch(0.97 0.01 60)" opacity="0.6" />
          <rect x="26" y="8" width="8" height="4" fill="oklch(0.97 0.01 60)" opacity="0.6" />
          {/* Wheels */}
          <circle cx="12" cy="24" r="3" fill="oklch(0.25 0.08 240)" stroke="oklch(0.65 0.15 65)" strokeWidth="1" />
          <circle cx="36" cy="24" r="3" fill="oklch(0.25 0.08 240)" stroke="oklch(0.65 0.15 65)" strokeWidth="1" />
          {/* Light accents - futuristic touch */}
          <line x1="8" y1="18" x2="40" y2="18" stroke="oklch(0.65 0.15 65)" strokeWidth="0.5" opacity="0.8" />
        </g>

        {/* Pi symbol (π) - bold, golden, unmistakable */}
        <text
          x="50"
          y="58"
          fontSize="28"
          fontWeight="bold"
          fill="oklch(0.65 0.15 65)"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
        >
          π
        </text>
      </svg>
    </div>
  )
}
