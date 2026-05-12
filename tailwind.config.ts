import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        daily: {
          bg: "rgb(var(--daily-bg) / <alpha-value>)",
          panel: "rgb(var(--daily-panel) / <alpha-value>)",
          mint: "rgb(var(--daily-mint) / <alpha-value>)",
          cyan: "rgb(var(--daily-cyan) / <alpha-value>)",
          ink: "rgb(var(--daily-ink) / <alpha-value>)",
          muted: "rgb(var(--daily-muted) / <alpha-value>)"
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(0, 0, 0, 0.28)"
      }
    }
  },
  plugins: []
} satisfies Config;
