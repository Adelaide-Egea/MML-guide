// Applies the RLS migration through the Supabase Management API, so the fix can be
// done without a computer, a terminal or the SQL editor.
//
// You need one thing: a Supabase personal access token, which can be created on a
// phone in about a minute. See FIX-FROM-YOUR-PHONE.md.
//
//   SUPABASE_ACCESS_TOKEN=sbp_... node supabase/apply.mjs --check
//   SUPABASE_ACCESS_TOKEN=sbp_... node supabase/apply.mjs --apply
//
// --check   reports project status, whether the table is currently exposed, and how
//           many rows are at risk. It changes nothing.
// --apply   restores the project if it is paused, dumps the affected tables to
//           supabase/backup-<timestamp>.json, runs the migration, then re-runs the
//           exposure check and fails loudly if the table is still readable.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const API = 'https://api.supabase.com';
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'jgqemguvrslzrbedjirq';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN is not set. See supabase/FIX-FROM-YOUR-PHONE.md.');
  process.exit(2);
}

async function api(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const detail = typeof body === 'string' ? body : JSON.stringify(body);
    throw new Error(`${init.method || 'GET'} ${path} -> ${res.status}: ${detail}`);
  }
  return body;
}

const sql = (query) =>
  api(`/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    body: JSON.stringify({ query }),
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function project() {
  const all = await api('/v1/projects');
  const found = all.find((p) => p.id === PROJECT_REF || p.ref === PROJECT_REF);
  if (!found) {
    const names = all.map((p) => `${p.name} (${p.id || p.ref}) — ${p.status}`).join('\n  ');
    throw new Error(
      `No project ${PROJECT_REF} on this account. Projects visible to this token:\n  ${names || '(none)'}`,
    );
  }
  return found;
}

async function waitUntilHealthy() {
  for (let i = 0; i < 40; i += 1) {
    const p = await project();
    console.log(`  status: ${p.status}`);
    if (p.status === 'ACTIVE_HEALTHY') return p;
    await sleep(15_000);
  }
  throw new Error('Project did not reach ACTIVE_HEALTHY within ten minutes.');
}

/** The question that matters: can the anon role — whose key is printed in the
 *  deployed page source — read the table? This is the check the previous fix never
 *  performed, which is why it shipped a page claiming to have closed a hole that
 *  was still open. */
async function exposure() {
  const rows = await sql(`
    set local role anon;
    select
      (select count(*) from public.trips) as anon_readable_trips;
  `);
  const first = Array.isArray(rows) ? rows[rows.length - 1] : rows;
  return Number(first?.anon_readable_trips ?? first?.[0]?.anon_readable_trips ?? 0);
}

async function tableExists(name) {
  const rows = await sql(`select to_regclass('public.${name}') is not null as present;`);
  const r = Array.isArray(rows) ? rows[0] : rows;
  return Boolean(r?.present);
}

async function check() {
  const p = await project();
  console.log(`Project : ${p.name} (${PROJECT_REF})`);
  console.log(`Region  : ${p.region}`);
  console.log(`Status  : ${p.status}`);

  if (p.status !== 'ACTIVE_HEALTHY') {
    console.log('\nThe database is not running, so nothing is reachable right now.');
    console.log('Re-run with --apply to restore it and close the hole in one go.');
    return;
  }

  for (const t of ['trips', 'events']) {
    console.log(`\nTable ${t}: ${(await tableExists(t)) ? 'present' : 'absent'}`);
  }

  const total = await sql('select count(*)::int as n from public.trips;');
  const n = (Array.isArray(total) ? total[0] : total)?.n ?? 0;
  const readable = await exposure();
  console.log(`\nRows in trips              : ${n}`);
  console.log(`Rows readable by anon      : ${readable}`);
  console.log(
    readable > 0
      ? `\nEXPOSED. ${readable} rows of children's names, ages and notes are readable by anyone\nholding the publishable key, which is in the deployed page source. Run --apply.`
      : '\nNot exposed. anon cannot read the table.',
  );
}

async function apply() {
  let p = await project();
  console.log(`Project : ${p.name} (${PROJECT_REF})  status: ${p.status}`);

  if (p.status !== 'ACTIVE_HEALTHY') {
    console.log('\nRestoring the paused project...');
    await api(`/v1/projects/${PROJECT_REF}/restore`, { method: 'POST', body: '{}' });
    p = await waitUntilHealthy();
  }

  const before = await exposure();
  console.log(`\nRows readable by anon, before: ${before}`);

  // Back up before touching policies. The migration adds a not-null column with a
  // generated default, which is not something to do to live data unrehearsed.
  const backup = {};
  for (const t of ['trips', 'events']) {
    if (await tableExists(t)) {
      backup[t] = await sql(`select * from public.${t};`);
      console.log(`Backed up ${t}: ${backup[t]?.length ?? 0} rows`);
    }
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = join(HERE, `backup-${stamp}.json`);
  writeFileSync(path, JSON.stringify(backup, null, 2));
  console.log(`Backup written to ${path}`);

  console.log('\nApplying 0001_lock_down_trips.sql...');
  const migration = readFileSync(join(HERE, 'migrations', '0001_lock_down_trips.sql'), 'utf8');
  await sql(migration);
  console.log('Applied.');

  const after = await exposure();
  console.log(`\nRows readable by anon, after: ${after}`);
  if (after > 0) {
    console.error('\nFAILED — the table is still readable by anon. Do not consider this closed.');
    process.exit(1);
  }
  console.log('\nClosed. anon can no longer read the table.');

  const advisors = await api(`/v1/projects/${PROJECT_REF}/advisors/security`);
  const errors = (advisors?.lints || []).filter((l) => l.level === 'ERROR');
  console.log(`\nSupabase security advisor: ${errors.length} remaining error-level findings`);
  for (const e of errors) console.log(`  - ${e.name}: ${e.title}`);
}

const mode = process.argv[2];
try {
  if (mode === '--apply') await apply();
  else if (mode === '--check') await check();
  else {
    console.error('Usage: node supabase/apply.mjs --check | --apply');
    process.exit(2);
  }
} catch (err) {
  console.error(`\n${err.message}`);
  process.exit(1);
}
