import { Suspense } from "react";
import { AdminBar } from "@/components/admin-bar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <Suspense fallback={null}>
        <AdminBar />
      </Suspense>
      <div className="mx-auto w-full max-w-3xl">{children}</div>
    </div>
  );
}
