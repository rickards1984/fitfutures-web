import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0D1117",
          surface: "#161B22",
          border: "#21262D",
          "border-md": "#30363D",
          text: "#F0F0F0",
          muted: "#8B949E",
          accent: "#00E5FF",
          success: "#3FB950",
          warning: "#D29922",
          danger: "#F85149",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontWeight: {
        // Weights 400 + 500 only — no 600/700.
        normal: "400",
        medium: "500",
      },
      borderRadius: {
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
