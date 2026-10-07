import { getAdminCookieEmail } from "@/lib/cookies";
import { getAdminEmail, isSupabaseConfigured } from "@/lib/env";
import { store } from "@/lib/store";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function isOrganiserEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === getAdminEmail()) return true;
  const allowed = await store.listOrganiserEmails();
  return allowed.includes(normalized);
}

export async function getAdminSessionEmail(): Promise<string | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase.auth.getUser();
      return data.user?.email?.toLowerCase() ?? null;
    } catch {
      return null;
    }
  }
  return getAdminCookieEmail();
}

export async function requireAdmin(): Promise<string> {
  const email = await getAdminSessionEmail();
  if (!(await isOrganiserEmail(email))) {
    redirect("/admin/login");
  }
  return email!;
}

export async function isAdmin(): Promise<boolean> {
  const email = await getAdminSessionEmail();
  return isOrganiserEmail(email);
}
