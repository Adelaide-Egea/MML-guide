import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { store } from "@/lib/store";

/**
 * Phase 5 — monthly show refresh.
 * Vercel Cron: 0 6 1 * * (1st of month 06:00 UTC)
 * Requires ANTHROPIC_API_KEY. Inserts pending options for French Mums only.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "ANTHROPIC_API_KEY not set",
    });
  }

  // Placeholder: without live web-search tool wiring, return a stub response.
  // When wired, call Claude with web search and insert status=pending options,
  // skipping titles already seen for the french group.
  const existing = await store.listOptions("french");
  const seenTitles = new Set(
    existing.filter((o) => o.seen).map((o) => o.title.toLowerCase()),
  );

  return NextResponse.json({
    ok: true,
    supabase: isSupabaseConfigured(),
    seenTitles: seenTitles.size,
    message:
      "Cron reachable. Wire Anthropic web-search here to insert pending shows.",
  });
}
