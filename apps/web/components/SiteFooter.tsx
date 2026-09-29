import Link from 'next/link';

/** Support inbox for people stuck in the app. */
const SUPPORT_EMAIL = 'adefitte@gmail.com';
const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Domela — I need help')}`;

export function SiteFooter() {
  return (
    <footer className="site-footer no-print">
      <p className="muted">
        Domela — the household guide.{' '}
        <Link href="/privacy">Privacy</Link>
        {' · '}
        <Link href="/data">Your data</Link>
      </p>
      <a href={SUPPORT_MAILTO} className="btn btn-secondary site-footer-contact">
        Contact me
      </a>
      <p className="muted site-footer-contact-hint">Having difficulty with the app? Send a note.</p>
    </footer>
  );
}
