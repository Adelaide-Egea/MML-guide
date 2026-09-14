/** The mark: the D is the door.
 *
 *  Capital D with the counter open to the baseline — an open doorway.
 *  Inside: the punctum (note left for whoever comes in).
 *  Spec: design/domela-brand.md
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
      {/* Stem */}
      <path d="M13 9 V39" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      {/* Open bowl — gap at the bottom-left of the counter creates the doorway */}
      <path
        d="M13 9 H25 C34.5 9 39 15.5 39 24 C39 32.5 34.5 39 25 39 H18"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {showDot && <rect x="21" y="21" width="6" height="6" fill="var(--brand, #d08a2c)" />}
    </svg>
  );
}
