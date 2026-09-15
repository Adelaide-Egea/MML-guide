/** The mark: the D is the door.
 *
 *  Capital D with the counter opened toward the baseline — a doorway, not a gap.
 *  Inside: the punctum (the note left for whoever comes in).
 *
 *  The opening is deliberately narrow. Tested at 64/32/24/16px: a wider gap stops
 *  reading as a D below about 32px and starts reading as a C or a broken O, which
 *  is exactly the size it appears at in a WhatsApp link preview and on a home
 *  screen. Narrow keeps the idea and keeps the letter.
 *
 *  Spec: design/domela-brand.md §6
 */
export function Mark({
  size = 32,
  withPunctum = true,
}: {
  size?: number;
  withPunctum?: boolean;
}) {
  const showDot = withPunctum && size >= 24;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M13 9 V39" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" />
      <path
        d="M13 9 H25 C34.5 9 39 15.5 39 24 C39 32.5 34.5 39 25 39 H20.5"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {showDot && <rect x="21" y="21" width="6" height="6" fill="var(--brand, #d9923a)" />}
    </svg>
  );
}
