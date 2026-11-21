import nextCoreWebVitals from "eslint-config-next/core-web-vitals"

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "verification-evidence/**",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
]

export default config
