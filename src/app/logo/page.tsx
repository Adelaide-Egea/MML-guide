import { isAdmin } from "@/lib/admin-auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Logo · Mums' Night Out",
  description: "Download the Mums' Night Out logo",
};

/** Big logo page — organiser only. Long-press on phone to save. */
export default async function LogoPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <h1 className="font-display text-3xl">Your logo</h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
        Wordmark and app icons. Long-press a picture and choose Save Image.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt="Mums' Night Out wordmark"
        className="mt-8 w-full max-w-md"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.jpg"
        alt="Mums' Night Out square mark"
        width={256}
        height={256}
        className="mt-8 w-40 rounded-3xl shadow-lg ring-1 ring-[var(--border)]"
      />
      <div className="mt-8 grid w-full max-w-sm gap-3">
        <a
          href="/logo.svg"
          download="mums-night-out-logo.svg"
          className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[var(--accent)] px-4 text-base font-semibold text-[var(--accent-fg)]"
        >
          Download wordmark (SVG)
        </a>
        <a
          href="/logo.jpg"
          download="mums-night-out-logo.jpg"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border)] px-4 text-sm font-semibold"
        >
          Download square (JPG)
        </a>
      </div>
    </main>
  );
}
