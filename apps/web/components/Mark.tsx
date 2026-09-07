/** The mark: an arc with a point at each end. One thing handed from here to there.
 *  Deliberately name-agnostic — no name has been chosen, and the mark does not
 *  depend on one. */
export function Mark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M9 31.5 Q24 6.5 39 31.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <circle cx="9" cy="31.5" r="4.75" fill="currentColor" />
      <circle cx="39" cy="31.5" r="4.75" fill="currentColor" />
    </svg>
  );
}
