/** Wordmark from /logo.svg — use in headers instead of logo.jpg + text. */
export function BrandMark({
  height = 28,
  className = "",
  tone = "ink",
}: {
  /** Rendered height in px; width follows the wordmark aspect ratio. */
  height?: number;
  className?: string;
  /** Admin uses solid gold so the wordmark is easy to spot. */
  tone?: "ink" | "gold";
}) {
  // logo.svg viewBox ≈ 481 × 86.5
  const width = Math.round(height * (481 / 86.5));
  if (tone === "gold") {
    return (
      <span
        role="img"
        aria-label="Mums' Night Out"
        className={`brand-mark inline-block max-w-full shrink-0 ${className}`}
        style={{
          height,
          width,
          background: "#C99A3E",
          WebkitMask: "url(/logo.svg) center / contain no-repeat",
          mask: "url(/logo.svg) center / contain no-repeat",
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt="Mums' Night Out"
      width={width}
      height={height}
      className={`brand-mark inline-block max-w-full ${className}`}
      style={{ height, width: "auto" }}
    />
  );
}
