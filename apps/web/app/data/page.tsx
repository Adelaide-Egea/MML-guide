import Link from 'next/link';
import { TopBar } from '../../components/Chrome.tsx';

export const metadata = {
  title: 'Your data — Domela',
  description: 'Plain explanation of where Domela household data lives.',
};

export default function DataPage() {
  return (
    <main className="shell read">
      <TopBar title="Your data" back="/" />

      <h1 className="display" style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-4)' }}>
        One page on your data
      </h1>

      <table className="data-table">
        <thead>
          <tr>
            <th>Thing</th>
            <th>Where it lives</th>
            <th>Leaves the device?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Household &amp; guide text</td>
            <td>This browser (localStorage)</td>
            <td>No</td>
          </tr>
          <tr>
            <td>Photos</td>
            <td>This browser (IndexedDB)</td>
            <td>No</td>
          </tr>
          <tr>
            <td>Ask question + selected snippets</td>
            <td>AI provider, only when you Ask</td>
            <td>Only if you use Ask</td>
          </tr>
          <tr>
            <td>Anonymous open / use events</td>
            <td>Trial counters (no content)</td>
            <td>Yes — event name only</td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginTop: 'var(--space-5)' }}>
        Full wording: <Link href="/privacy">Privacy</Link>.
      </p>
    </main>
  );
}
