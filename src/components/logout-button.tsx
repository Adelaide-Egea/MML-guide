"use client";

import { adminLogout } from "@/actions/auth";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => adminLogout()}
      className="min-h-11 text-sm text-[var(--muted)] underline-offset-2 hover:underline"
    >
      Log out
    </button>
  );
}
