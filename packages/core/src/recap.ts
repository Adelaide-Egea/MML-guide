// Bullet recaps for long parent notes.
//
// Full entry bodies stay verbatim as facts. A recap is a shorter, parent-approved
// bullet list the caregiver can prefer for scanning — never a replacement for
// safety-critical blocks, and never silently substituted for what the parent wrote.

/** Turn a free-text note into short bullet lines (parent can edit before approving). */
export function bulletRecap(body: string): string {
  const text = body.trim();
  if (!text) return '';

  const pieces: string[] = [];
  for (const paragraph of text.split(/\n+/)) {
    const line = paragraph.trim();
    if (!line) continue;
    // Already bulleted — keep each line as one point.
    if (/^[-•*]\s+/.test(line) || line.includes('\n')) {
      for (const part of line.split(/\n+/)) {
        const cleaned = part.replace(/^[-•*]\s+/, '').trim();
        if (cleaned) pieces.push(cleaned);
      }
      continue;
    }
    const sentences = line.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    if (sentences.length > 1) {
      pieces.push(...sentences);
    } else {
      pieces.push(line);
    }
  }

  const seen = new Set<string>();
  const bullets: string[] = [];
  for (const piece of pieces) {
    const cleaned = piece.replace(/^[-•*]\s+/, '').trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    bullets.push(`• ${cleaned}`);
  }
  return bullets.join('\n');
}

/** Lines from an approved (or draft) recap, without leading bullet markers. */
export function recapLines(recap: string): readonly string[] {
  return recap
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s+/, '').trim())
    .filter(Boolean);
}

/** True when the note is long enough that a bullet recap is worth offering. */
export function shouldOfferRecap(body: string): boolean {
  const trimmed = body.trim();
  if (!trimmed) return false;
  if (trimmed.length >= 120) return true;
  return /[.!?].+\S/.test(trimmed) || trimmed.includes('\n');
}
