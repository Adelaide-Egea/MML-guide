import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer no-print">
      <p className="muted">Domela — the household guide.</p>
      <p className="muted">
        <Link href="/privacy">Privacy</Link>
        {' · '}
        <Link href="/data">Your data</Link>
      </p>
    </footer>
  );
}
