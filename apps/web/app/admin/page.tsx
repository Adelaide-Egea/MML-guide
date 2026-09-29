import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { AdminDashboard } from '../../components/AdminDashboard.tsx';
import { ADMIN_COOKIE, adminPassword, isAdminCookie } from '../../lib/admin-auth.ts';
import { readUsageStats } from '../../lib/usage.ts';
import { usageStore } from '../../lib/usage-store.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Domela usage',
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const jar = await cookies();
  const signedIn = await isAdminCookie(jar.get(ADMIN_COOKIE)?.value);

  if (!signedIn) {
    return <AdminLogin error={adminPassword() ? error : 'unset'} />;
  }

  try {
    const stats = await readUsageStats(usageStore());
    return <AdminDashboard stats={stats} />;
  } catch {
    return (
      <main className="admin">
        <h1>Domela usage</h1>
        <p className="admin-warning" role="alert">
          Could not reach the usage database. Check the Upstash connection in Vercel, then refresh.
        </p>
      </main>
    );
  }
}

function AdminLogin({ error }: { error: string | undefined }) {
  return (
    <main className="admin admin-login">
      <h1>Domela usage</h1>
      {error === 'unset' ? (
        <p className="admin-warning" role="alert">
          No admin password is set. Add ADMIN_PASSWORD (8 characters or more) in Vercel, then
          redeploy.
        </p>
      ) : (
        <form method="post" action="/api/admin/login" className="stack">
          <label htmlFor="admin-password" className="admin-label">
            Password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
          />
          {error === 'wrong' && (
            <p className="admin-error" role="alert">
              That password is not right. Try again.
            </p>
          )}
          <button type="submit" className="btn">
            Open dashboard
          </button>
        </form>
      )}
    </main>
  );
}
