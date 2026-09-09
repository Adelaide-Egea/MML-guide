import Link from 'next/link';
import { TopBar } from '../../components/Chrome.tsx';

export const metadata = {
  title: 'Privacy — Domela',
  description: 'What Domela stores, what it does not, and what never leaves your device.',
};

export default function PrivacyPage() {
  return (
    <main className="shell read">
      <TopBar title="Privacy" back="/" />

      <h1 className="display" style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-4)' }}>
        Your household stays on your device
      </h1>

      <p className="lede">
        Domela is built so the knowledge of your house — including anything about
        children, pets, keys, and routines — is not uploaded to us by default.
      </p>

      <section className="stack" style={{ marginTop: 'var(--space-6)' }}>
        <h2>What stays on this phone or computer</h2>
        <ul className="plain-list">
          <li>Household names, people, pets, and places</li>
          <li>Guide entries, photos, and routines</li>
          <li>Safety notes</li>
        </ul>
        <p>
          These live in your browser’s local storage and, for photos, IndexedDB.
          Clearing site data for this site deletes them. We do not receive a copy.
        </p>
      </section>

      <section className="stack" style={{ marginTop: 'var(--space-6)' }}>
        <h2>What we never collect from your guide</h2>
        <ul className="plain-list">
          <li>No account. No email required to use the app.</li>
          <li>No sale of data. No advertising profiles.</li>
          <li>No uploading of photos or guide text to Domela servers in ordinary use.</li>
        </ul>
      </section>

      <section className="stack" style={{ marginTop: 'var(--space-6)' }}>
        <h2>Ask (optional)</h2>
        <p>
          If you use <strong>Ask</strong>, the question and the selected guide
          snippets needed to answer it are sent to an AI provider so an answer can
          be written. Safety fields are excluded from that request. If Ask is not
          configured, nothing is sent and the app still works offline for reading
          the guide.
        </p>
      </section>

      <section className="stack" style={{ marginTop: 'var(--space-6)' }}>
        <h2>Trial usage (anonymous)</h2>
        <p>
          During early trials we record only coarse, anonymous events:{' '}
          <em>app opened</em>, <em>guide opened</em>, <em>Ask used</em>. These
          events do not include names, addresses, guide text, photos, or questions.
          An optional trial code from your invite link may be included so we can
          see whether that household opened the app more than once — still without
          reading what is inside it.
        </p>
      </section>

      <section className="stack disclaimer" style={{ marginTop: 'var(--space-6)' }}>
        <h2>Disclaimer</h2>
        <p>
          Domela is a household reference tool. It is not medical advice, not a
          monitoring or surveillance product, and not a substitute for clear
          conversation between adults. You are responsible for what you write in
          your guide and for who you share a device or link with.
        </p>
        <p>
          Domela does not store your household content on its servers in ordinary
          use, and does not share that content with third parties for advertising
          or profiling. See also <Link href="/data">Your data</Link>.
        </p>
      </section>
    </main>
  );
}
