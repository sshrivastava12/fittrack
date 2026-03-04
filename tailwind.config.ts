import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        surface: "#1C1C1E",
        card: "#2C2C2E",
        "card-elevated": "#3A3A3C",
        primary: "#0A84FF",
        success: "#30D158",
        danger: "#FF453A",
        warning: "#FF9F0A",
        "text-primary": "#FFFFFF",
        "text-secondary": "#8E8E93",
        separator: "#38383A",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Display'",
          "'SF Pro Text'",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        ios: "12px",
        "ios-lg": "16px",
        "ios-xl": "20px",
      },
    },
  },
  plugins: [],
};

export default config;
