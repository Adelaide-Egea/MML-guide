import { BrandMark } from "@/components/brand-mark";
import { LogoutButton } from "@/components/logout-button";
import { isAdmin } from "@/lib/admin-auth";

export async function AdminBar() {
  const admin = await isAdmin();
  if (!admin) return null;
  return (
    <div className="sticky top-0 z-20 border-b border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-page py-3">
        <a href="/admin" className="flex min-h-tap min-w-0 items-center gap-4">
          <BrandMark height={26} tone="gold" />
          <span className="truncate font-display text-body text-[var(--ink)]">
            Organiser
          </span>
        </a>
        <LogoutButton />
      </div>
    </div>
  );
}