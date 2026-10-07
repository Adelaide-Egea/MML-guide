import { BrandMark } from "@/components/brand-mark";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-4 px-page py-page text-center">
      <h1 className="sr-only">Mums&apos; Night Out</h1>
      <BrandMark height={36} className="mx-auto" />
      <p className="text-small text-[var(--grey)]">
        Grown-up nights. Proper chat. No kids, no rush.
      </p>
      <p className="max-w-sm text-body text-[var(--ink)]">
        Got a link from your organiser? Open it from WhatsApp.
      </p>
    </main>
  );
}
