import Link from "next/link";

export function FilterTabs({
  label,
  basePath,
  current,
  tabs,
}: {
  label: string;
  basePath: string;
  current: string;
  tabs: { id: string; label: string }[];
}) {
  return (
    <div className="-mx-page overflow-x-auto px-page">
      <div role="tablist" aria-label={label} className="flex w-max min-w-full gap-2">
        {tabs.map((tab) => {
          const on = tab.id === current;
          const href = tab.id === tabs[0]?.id ? basePath : `${basePath}?tab=${tab.id}`;
          return (
            <Link
              key={tab.id}
              href={href}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={on}
              aria-controls={`panel-${tab.id}`}
              className={`inline-flex min-h-tap shrink-0 items-center rounded-card border bg-white px-4 text-body font-semibold ${
                on
                  ? "border-[var(--gold)] text-[var(--ink)]"
                  : "border-[var(--line)] text-[var(--grey)]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
