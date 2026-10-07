/**
 * Seed options into Supabase (groups must already exist from seed.sql).
 * Usage: SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... npx tsx scripts/seed.ts
 */
import { createClient } from "@supabase/supabase-js";
import { SEED_OPTIONS, googleTicketsUrl } from "../src/lib/store/seed-data";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rows = SEED_OPTIONS.map((o) => ({
    group_id: o.group_id,
    kind: o.kind,
    title: o.title,
    venue: o.venue,
    area: o.area,
    station: o.station,
    lines: o.lines,
    price_from: o.price_from,
    runs_from: o.runs_from,
    runs_to: o.runs_to,
    url: o.url ?? googleTicketsUrl(o.title, o.venue),
    note: o.note,
    is_new: o.is_new,
    upcoming: o.upcoming,
    flexible_arrival: o.flexible_arrival,
    seen: false,
    status: "approved",
  }));

  const { error } = await db.from("options").insert(rows);
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`Seeded ${rows.length} options.`);
}

main();
