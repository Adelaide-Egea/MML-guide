import { AdminOrganisers } from "@/components/admin-organisers";
import { CopyButton } from "@/components/copy-button";
import { FilterTabs } from "@/components/filter-tabs";
import { requireAdmin } from "@/lib/admin-auth";
import { loadAdminHome, type AdminChannel } from "@/lib/admin-channels";
import { getAdminEmail } from "@/lib/env";
import { store } from "@/lib/store";
import { pickTab } from "@/lib/tabs";
import Link from "next/link";

const TABS = [
  { id: "todo", label: "To do" },
  { id: "traffic", label: "Traffic" },
  { id: "links", label: "Links" },
  { id: "people", label: "People" },
] as const;

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const { tab } = await searchParams;
  const current = pickTab(
    tab,
    TABS.map((item) => item.id),
    "todo",
  );
  const { channels, longLinks } = await loadAdminHome();
  const open = channels.filter((channel) => channel.hasRound);

  return (
    <main className="mx-auto max-w-3xl px-page py-page pb-16">
      <h1 className="sr-only">Organiser</h1>
      <FilterTabs label="Organiser" basePath="/admin" current={current} tabs={[...TABS]} />
      <div
        className="mt-4"
        role="tabpanel"
        id={`panel-${current}`}
        aria-labelledby={`tab-${current}`}
      >
        {current === "todo" && <ToDo open={open} all={channels} />}
        {current === "traffic" && (
          <Traffic channels={channels} longLinks={longLinks} />
        )}
        {current === "links" && <Links channels={channels} />}
        {current === "people" && (
          <AdminOrganisers
            ownerEmail={getAdminEmail()}
            emails={await store.listOrganiserEmails()}
          />
        )}
      </div>
    </main>
  );
}

function ToDo({
  open,
  all,
}: {
  open: AdminChannel[];
  all: AdminChannel[];
}) {
  const idle = all.filter((channel) => !channel.hasRound);
  if (open.length === 0 && idle.length === 0) {
    return <p className="text-small text-[var(--grey)]">No poll open.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {open.map((channel) => {
        const names = channel.showChase
          ? channel.unfinished.map((line) => line.name)
          : [];
        const quietCount = channel.quietPlaces.reduce(
          (n, area) => n + area.places.length,
          0,
        );
        return (
          <article
            key={channel.key}
            className="flex items-start justify-between gap-3 rounded-card border border-[var(--line)] bg-white px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-small font-semibold text-[var(--ink)]">
                {channel.title}
              </p>
              {channel.statusLine && (
                <p className="text-small text-[var(--grey)]">{channel.statusLine}</p>
              )}
              {names.length > 0 && (
                <p className="mt-0.5 text-small text-[var(--grey)]">
                  {names.join(", ")}
                </p>
              )}
              {channel.showChase && names.length === 0 && quietCount === 0 && (
                <p className="text-small text-[var(--grey)]">Done</p>
              )}
              {quietCount > 0 && (
                <p className="text-small text-[var(--grey)]">
                  {quietCount} place{quietCount === 1 ? "" : "s"} with no votes
                </p>
              )}
            </div>
            <Link
              href={channel.adminPath}
              className="shrink-0 pt-0.5 text-small font-semibold text-[var(--ink)]"
            >
              Open
            </Link>
          </article>
        );
      })}
      {idle.map((channel) => (
        <Link
          key={channel.key}
          href={`${channel.adminPath}?tab=poll&plan=${channel.kind}`}
          className="flex min-h-11 items-center justify-center rounded-card border border-[var(--line)] bg-white px-3 text-small font-semibold"
        >
          Plan {channel.title}
        </Link>
      ))}
    </div>
  );
}

function Traffic({
  channels,
  longLinks,
}: {
  channels: AdminChannel[];
  longLinks: { name: string; people: number }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {channels.map((channel) => (
        <article
          key={channel.key}
          className="rounded-card border border-[var(--line)] bg-white p-4"
        >
          <h2 className="font-display text-title text-[var(--ink)]">{channel.title}</h2>
          <p className="mt-1 text-body text-[var(--ink)]">{opensLine(channel)}</p>
        </article>
      ))}
      {longLinks.map((item) => (
        <p key={item.name} className="text-body text-[var(--grey)]">
          {item.people === 1 ? "1 person" : `${item.people} people`} opened the long{" "}
          {item.name} link this week.
        </p>
      ))}
    </div>
  );
}

function Links({ channels }: { channels: AdminChannel[] }) {
  return (
    <div className="flex flex-col gap-4">
      {channels.map((channel) => (
        <article
          key={channel.key}
          className="rounded-card border border-[var(--line)] bg-white p-4"
        >
          <h2 className="font-display text-title text-[var(--ink)]">{channel.title}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <CopyButton label="Copy link" text={channel.shareText} />
            <Link
              href={channel.path}
              className="inline-flex min-h-tap items-center justify-center rounded-card border border-[var(--line)] bg-white text-body font-semibold"
            >
              Open
            </Link>
          </div>
        </article>
      ))}
      <Link
        href="/logo"
        className="inline-flex min-h-tap items-center text-body font-semibold text-[var(--ink)]"
      >
        Logo
      </Link>
    </div>
  );
}

function opensLine(channel: AdminChannel): string {
  if (channel.opens === 0) return "No opens this week";
  const week =
    channel.opens === 1 ? "1 person this week" : `${channel.opens} people this week`;
  if (channel.opensToday === 0) return week;
  const today =
    channel.opensToday === 1 ? "1 today" : `${channel.opensToday} today`;
  return `${week} · ${today}`;
}

