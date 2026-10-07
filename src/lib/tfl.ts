export const TFL_LINES: Record<
  string,
  { label: string; bg: string; text: string; darkBorder?: boolean }
> = {
  northern: {
    label: "Northern",
    bg: "#000000",
    text: "#FFFFFF",
    darkBorder: true,
  },
  victoria: { label: "Victoria", bg: "#0098D4", text: "#FFFFFF" },
  district: { label: "District", bg: "#00782A", text: "#FFFFFF" },
  hammersmith: {
    label: "H&C",
    bg: "#F3A9BB",
    text: "#1a1a1a",
  },
  "hammersmith & city": {
    label: "H&C",
    bg: "#F3A9BB",
    text: "#1a1a1a",
  },
  jubilee: { label: "Jubilee", bg: "#A0A5A9", text: "#1a1a1a" },
  piccadilly: { label: "Piccadilly", bg: "#003688", text: "#FFFFFF" },
  bakerloo: { label: "Bakerloo", bg: "#B36305", text: "#FFFFFF" },
  central: { label: "Central", bg: "#E32017", text: "#FFFFFF" },
  elizabeth: { label: "Elizabeth", bg: "#6950A1", text: "#FFFFFF" },
  circle: { label: "Circle", bg: "#FFD300", text: "#1a1a1a" },
};

export const ALL_LINE_KEYS = [
  "northern",
  "victoria",
  "district",
  "hammersmith",
  "jubilee",
  "piccadilly",
  "bakerloo",
  "central",
  "elizabeth",
  "circle",
] as const;

export function normalizeLine(line: string): string {
  const key = line.toLowerCase().trim();
  if (key === "hammersmith & city" || key === "h&c" || key === "hammersmith and city") {
    return "hammersmith";
  }
  return key;
}
