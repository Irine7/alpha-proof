import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070A0F",
        graphite: "#101720",
        mantle: "#00E0A4",
        amberproof: "#FFC857",
        dangerproof: "#FF5C7A"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        proof: "0 24px 80px rgba(0, 224, 164, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
