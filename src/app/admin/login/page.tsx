import { AdminLoginForm } from "@/components/admin-login-form";
import { BrandMark } from "@/components/brand-mark";
import { isAdmin } from "@/lib/admin-auth";
import { getAdminEmail, isSupabaseConfigured } from "@/lib/env";
import { redirect } from "next/navigation";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-12">
      <BrandMark height={36} tone="gold" className="mb-6" />
      <h1 className="font-display text-3xl leading-snug">
        Organiser login
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        We&apos;ll email you a sign-in link. There isn&apos;t a password to
        set or change.
      </p>
      <div className="mt-8">
        <AdminLoginForm
          demoMode={!isSupabaseConfigured()}
          defaultEmail={getAdminEmail()}
        />
      </div>
    </main>
  );
}
