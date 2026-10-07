"use server";

import { isOrganiserEmail } from "@/lib/admin-auth";
import { clearAdminCookie, setAdminCookie } from "@/lib/cookies";
import { isSupabaseConfigured, getSiteUrl } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requestMagicLink(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!(await isOrganiserEmail(normalized))) {
    return { ok: false as const, error: "That email isn't an organiser yet." };
  }

  if (!isSupabaseConfigured()) {
    await setAdminCookie(normalized);
    redirect("/admin");
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: `${getSiteUrl()}/api/auth/callback`,
    },
  });
  if (error) {
    return {
      ok: false as const,
      error: "Couldn't send the login email. Try again in a moment.",
    };
  }
  return { ok: true as const, message: "Check your inbox for the magic link." };
}

export async function demoAdminLogin(email: string) {
  if (isSupabaseConfigured()) {
    return { ok: false as const, error: "Use the magic link when Supabase is set up." };
  }
  const normalized = email.trim().toLowerCase();
  if (!(await isOrganiserEmail(normalized))) {
    return { ok: false as const, error: "That email isn't an organiser yet." };
  }
  await setAdminCookie(normalized);
  redirect("/admin");
}

export async function adminLogout() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
  await clearAdminCookie();
  redirect("/admin/login");
}
