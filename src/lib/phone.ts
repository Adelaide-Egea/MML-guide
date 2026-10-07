/** Soft UK-friendly phone check — optional field, keep it light. */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length < 10) {
    throw new Error("That number looks a bit short — include the area code.");
  }
  if (trimmed.length > 24) {
    throw new Error("That number is a bit long.");
  }
  return trimmed;
}
