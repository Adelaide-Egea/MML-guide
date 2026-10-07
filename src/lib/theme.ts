/**
 * Single visual system for Mums' Night Out.
 * Tailwind tokens in tailwind.config.ts and CSS variables in globals.css
 * must stay in lockstep with these values.
 */
export const theme = {
  color: {
    ink: "#2B2233",
    linen: "#F4EEE6",
    gold: "#C99A3E",
    white: "#FFFFFF",
    line: "#E6DFD5",
    grey: "#8A8178",
  },
  font: {
    display: "Fraunces, Georgia, serif",
    sans: "DM Sans, system-ui, sans-serif",
  },
  space: {
    page: "24px",
    gap: "16px",
  },
  radius: "14px",
  tap: "48px",
  type: {
    title: "1.75rem",
    body: "1rem",
    small: "0.8125rem",
  },
} as const;

export type Theme = typeof theme;
