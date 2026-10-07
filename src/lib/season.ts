import { formatInTimeZone } from "date-fns-tz";
import { TZ } from "@/lib/dates";

export type Season = "spring" | "summer" | "autumn" | "winter";

export const SEASON_LABELS: Record<Season, string> = {
  spring: "Spring blossom",
  summer: "Summer evening",
  autumn: "Autumn glow",
  winter: "Winter sparkle",
};

/** Meteorological seasons in Europe/London. */
export function getSeason(date: Date = new Date()): Season {
  const month = Number(formatInTimeZone(date, TZ, "M")); // 1–12
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

export function seasonLabel(season: Season = getSeason()): string {
  return SEASON_LABELS[season];
}
