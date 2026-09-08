/** The mark: the punctum.
 *
 *  A small square sitting on a rule — the smallest mark you can make, which is
 *  what "Notula" means. Not a checkbox, not a mosaic, not a handover arc.
 */
export function Mark({ size = 32 }: { size?: number }) {
  // Optical centre sits slightly above geometric centre (~4%).
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <line
        x1="10"
        y1="22"
        x2="38"
        y2="22"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="20" y="16" width="8" height="8" fill="currentColor" />
    </svg>
  );
}
