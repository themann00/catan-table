import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/** Resource and dice colors are CSS variables so light and dark mode can tune them. */
const hsl = (name: string) => `hsl(var(--${name}))`;

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: hsl("border"),
        input: hsl("input"),
        ring: hsl("ring"),
        background: hsl("background"),
        foreground: hsl("foreground"),
        primary: { DEFAULT: hsl("primary"), foreground: hsl("primary-foreground") },
        secondary: { DEFAULT: hsl("secondary"), foreground: hsl("secondary-foreground") },
        destructive: { DEFAULT: hsl("destructive"), foreground: hsl("destructive-foreground") },
        muted: { DEFAULT: hsl("muted"), foreground: hsl("muted-foreground") },
        accent: { DEFAULT: hsl("accent"), foreground: hsl("accent-foreground") },
        popover: { DEFAULT: hsl("popover"), foreground: hsl("popover-foreground") },
        card: { DEFAULT: hsl("card"), foreground: hsl("card-foreground") },
        // Catan palette
        sea: hsl("sea"),
        wood: hsl("wood"),
        forest: hsl("forest"),
        pasture: hsl("pasture"),
        fields: hsl("fields"),
        hills: hsl("hills"),
        mountains: hsl("mountains"),
        desert: hsl("desert"),
        "die-red": hsl("die-red"),
        "die-yellow": hsl("die-yellow"),
        robber: hsl("robber"),
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "dice-shake": {
          "0%, 100%": { transform: "rotate(0deg) translateY(0)" },
          "25%": { transform: "rotate(-14deg) translateY(-4px)" },
          "75%": { transform: "rotate(14deg) translateY(4px)" },
        },
        "robber-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-8px)" },
          "40%, 80%": { transform: "translateX(8px)" },
        },
      },
      animation: {
        "dice-shake": "dice-shake 0.22s ease-in-out infinite",
        "robber-shake": "robber-shake 0.5s ease-in-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
