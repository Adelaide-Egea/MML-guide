'use client';

import { useState } from 'react';
import { EVENT_LABELS, USAGE_EVENTS, type UsageStats, type UserCounts } from '../lib/usage.ts';

/** The private usage dashboard. Pure presentation: /admin fetches the stats. */
export function AdminDashboard({ stats }: { stats: UsageStats }) {
  const t = stats.totals30;
  const reopenedShare =
    stats.guidesOpened > 0 ? Math.round((stats.guidesReopened / stats.guidesOpened) * 100) : null;

  return (
    <main className="admin">
      <header className="admin-head">
        <div>
          <h1>Domela usage</h1>
          <p className="muted">
            Updated {formatTime(stats.generatedAt)}. Days are UTC. People are counted by anonymous
            device, so one parent on a phone and a laptop counts twice.
          </p>
        </div>
        <div className="admin-actions">
          <a className="btn btn-secondary" href="/admin">
            Refresh
          </a>
          <form method="post" action="/api/admin/logout">
            <button type="submit" className="btn btn-quiet">
              Log out
            </button>
          </form>
        </div>
      </header>

      {!stats.durable && (
        <p className="admin-warning" role="status">
          Not connected to the database yet, so these numbers reset whenever the server restarts.
          Connect Upstash Redis in Vercel (Storage) to keep them.
        </p>
      )}

      <section className="admin-tiles" aria-label="Headline numbers">
        <PeopleTile label="Parents" counts={stats.parents} swatch="parent" />
        <PeopleTile label="Caregivers" counts={stats.caregivers} swatch="caregiver" />
        <Tile label="Guides created" value={t.guide_created ?? 0} note="last 30 days" />
        <Tile label="Links sent" value={t.share ?? 0} note="last 30 days" />
        <Tile
          label="Guides reopened"
          value={stats.guidesReopened}
          note={
            reopenedShare === null
              ? 'no caregiver opens yet'
              : `of ${stats.guidesOpened} opened by a caregiver (${reopenedShare}%) on 2+ days`
          }
        />
      </section>

      <section className="admin-card">
        <h2>People each day</h2>
        <p className="muted">Unique devices per day, last 30 days. Hover a day for numbers.</p>
        <PeopleChart stats={stats} />
      </section>

      <section className="admin-card">
        <h2>From guide to caregiver</h2>
        <p className="muted">
          How many times each step happened in the last 30 days. The example was loaded{' '}
          {t.sample ?? 0} times.
        </p>
        <Funnel
          steps={[
            { label: EVENT_LABELS.guide_created, value: t.guide_created ?? 0 },
            { label: EVENT_LABELS.share, value: t.share ?? 0 },
            { label: EVENT_LABELS.caregiver_open, value: t.caregiver_open ?? 0 },
          ]}
        />
      </section>

      <section className="admin-card">
        <h2>Testers</h2>
        <p className="muted">
          Give each tester their own link, for example <code>domela.app/?trial=anna</code>. The code
          sticks to their phone from then on.
        </p>
        {stats.trials.length === 0 ? (
          <p className="admin-empty">No tester codes yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Code</th>
                  <th scope="col">Devices</th>
                  <th scope="col">Opens</th>
                  <th scope="col">Guides created</th>
                  <th scope="col">Links sent</th>
                  <th scope="col">Examples</th>
                  <th scope="col">First seen</th>
                  <th scope="col">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {stats.trials.map((row) => (
                  <tr key={row.code}>
                    <th scope="row">{row.code}</th>
                    <td>{row.devices}</td>
                    <td>{row.events.open ?? 0}</td>
                    <td>{row.events.guide_created ?? 0}</td>
                    <td>{row.events.share ?? 0}</td>
                    <td>{row.events.sample ?? 0}</td>
                    <td>{row.firstSeen ? formatDay(row.firstSeen) : ''}</td>
                    <td>{row.lastSeen ? formatTime(row.lastSeen) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-card">
        <h2>Every event, last 30 days</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Last 7 days</th>
                <th scope="col">Last 30 days</th>
              </tr>
            </thead>
            <tbody>
              {USAGE_EVENTS.map((event) => (
                <tr key={event}>
                  <th scope="row">{EVENT_LABELS[event]}</th>
                  <td>{stats.days.slice(-7).reduce((sum, d) => sum + (d.events[event] ?? 0), 0)}</td>
                  <td>{t[event] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Tile({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="admin-tile">
      <span className="admin-tile-label">{label}</span>
      <span className="admin-tile-value">{value.toLocaleString('en-GB')}</span>
      <span className="admin-tile-note">{note}</span>
    </div>
  );
}

function PeopleTile({
  label,
  counts,
  swatch,
}: {
  label: string;
  counts: UserCounts;
  swatch: 'parent' | 'caregiver';
}) {
  return (
    <div className="admin-tile">
      <span className="admin-tile-label">
        <i className={`admin-swatch admin-swatch-${swatch}`} aria-hidden="true" />
        {label}, last 7 days
      </span>
      <span className="admin-tile-value">{counts.last7.toLocaleString('en-GB')}</span>
      <span className="admin-tile-note">
        {counts.today} today, {counts.last30} in 30 days, {counts.allTime} ever
      </span>
    </div>
  );
}

const W = 720;
const H = 240;
const PAD = { top: 16, right: 92, bottom: 28, left: 36 };

function PeopleChart({ stats }: { stats: UsageStats }) {
  const [hover, setHover] = useState<number | null>(null);
  const days = stats.days;
  const max = Math.max(4, ...days.map((d) => Math.max(d.parents, d.caregivers)));
  const top = niceTop(max);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (days.length === 1 ? innerW / 2 : (i / (days.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;
  const ticks = [0, top / 2, top];
  const path = (key: 'parents' | 'caregivers') =>
    days.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');
  const last = days.length - 1;
  const lastRow = days[last]!;
  const hovered = hover === null ? null : days[hover]!;

  // Keep the two end labels apart when the values are close.
  let labelP = y(lastRow.parents);
  let labelC = y(lastRow.caregivers);
  if (Math.abs(labelP - labelC) < 16) {
    const mid = (labelP + labelC) / 2;
    const parentAbove = lastRow.parents >= lastRow.caregivers;
    labelP = mid + (parentAbove ? -8 : 8);
    labelC = mid + (parentAbove ? 8 : -8);
  }

  return (
    <div className="admin-chart">
      <div className="admin-legend" aria-hidden="true">
        <span>
          <i className="admin-swatch admin-swatch-parent" /> Parents
        </span>
        <span>
          <i className="admin-swatch admin-swatch-caregiver" /> Caregivers
        </span>
      </div>
      <div className="admin-chart-frame">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Parents and caregivers each day for the last 30 days"
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line className="admin-grid" x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} />
              <text className="admin-axis" x={PAD.left - 8} y={y(tick) + 4} textAnchor="end">
                {tick}
              </text>
            </g>
          ))}
          {[0, 7, 14, 21, last].map((i) => (
            <text key={i} className="admin-axis" x={x(i)} y={H - 8} textAnchor="middle">
              {formatDay(days[i]!.day)}
            </text>
          ))}
          {hover !== null && (
            <line className="admin-crosshair" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} />
          )}
          <path className="admin-line admin-line-parent" d={path('parents')} />
          <path className="admin-line admin-line-caregiver" d={path('caregivers')} />
          <circle className="admin-dot admin-dot-parent" cx={x(last)} cy={y(lastRow.parents)} r={4} />
          <circle className="admin-dot admin-dot-caregiver" cx={x(last)} cy={y(lastRow.caregivers)} r={4} />
          <text className="admin-end-label" x={x(last) + 10} y={labelP + 4}>
            Parents {lastRow.parents}
          </text>
          <text className="admin-end-label" x={x(last) + 10} y={labelC + 4}>
            Caregivers {lastRow.caregivers}
          </text>
          {hovered && (
            <>
              <circle className="admin-dot admin-dot-parent" cx={x(hover!)} cy={y(hovered.parents)} r={4} />
              <circle className="admin-dot admin-dot-caregiver" cx={x(hover!)} cy={y(hovered.caregivers)} r={4} />
            </>
          )}
          {days.map((d, i) => (
            <rect
              key={d.day}
              x={x(i) - innerW / (days.length - 1) / 2}
              y={PAD.top}
              width={innerW / (days.length - 1)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
            />
          ))}
        </svg>
        {hovered && (
          <div
            className="admin-tooltip"
            style={
              x(hover!) / W > 0.55
                ? { right: `calc(${(1 - x(hover!) / W) * 100}% + 12px)` }
                : { left: `calc(${(x(hover!) / W) * 100}% + 12px)` }
            }
            role="status"
          >
            <strong>{formatDay(hovered.day)}</strong>
            <span>
              <i className="admin-swatch admin-swatch-parent" /> Parents {hovered.parents}
            </span>
            <span>
              <i className="admin-swatch admin-swatch-caregiver" /> Caregivers {hovered.caregivers}
            </span>
            <span className="muted">
              {hovered.events.guide_created ?? 0} guides created, {hovered.events.share ?? 0} links sent
            </span>
          </div>
        )}
      </div>
      <details className="admin-details">
        <summary>Show as a table</summary>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Parents</th>
                <th scope="col">Caregivers</th>
                <th scope="col">Guides created</th>
                <th scope="col">Links sent</th>
                <th scope="col">Caregiver opens</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((d) => (
                <tr key={d.day}>
                  <th scope="row">{formatDay(d.day)}</th>
                  <td>{d.parents}</td>
                  <td>{d.caregivers}</td>
                  <td>{d.events.guide_created ?? 0}</td>
                  <td>{d.events.share ?? 0}</td>
                  <td>{d.events.caregiver_open ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <ol className="admin-funnel">
      {steps.map((step, i) => {
        const prev = i > 0 ? steps[i - 1]!.value : null;
        const rate = prev ? Math.round((step.value / prev) * 100) : null;
        return (
          <li key={step.label}>
            <span className="admin-funnel-label">{step.label}</span>
            <span className="admin-funnel-track">
              <span className="admin-funnel-bar" style={{ width: `${(step.value / max) * 100}%` }} />
            </span>
            <span className="admin-funnel-value">
              {step.value}
              {rate !== null && <span className="muted"> ({rate}% of step before)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function niceTop(max: number): number {
  const step = max <= 10 ? 2 : max <= 50 ? 10 : max <= 200 ? 50 : 100;
  return Math.ceil(max / step) * step;
}

function formatDay(iso: string): string {
  return new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  });
}
