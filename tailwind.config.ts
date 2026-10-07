import type { Config } from "tailwindcss";
import { theme } from "./src/lib/theme";

const config: Config = {
  theme: {
    extend: {
      colors: {
        ink: theme.color.ink,
        linen: theme.color.linen,
        gold: theme.color.gold,
        line: theme.color.line,
        grey: theme.color.grey,
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: theme.radius,
      },
      spacing: {
        page: theme.space.page,
        stack: theme.space.gap,
      },
      minHeight: {
        tap: theme.tap,
      },
      fontSize: {
        title: [theme.type.title, { lineHeight: "1.2", fontWeight: "500" }],
        body: [theme.type.body, { lineHeight: "1.45" }],
        small: [theme.type.small, { lineHeight: "1.4" }],
      },
    },
  },
};

export default config;
