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
        {current === "todo" && <ToDo channels={open} />}
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

function ToDo({ channels }: { channels: AdminChannel[] }) {
  if (channels.length === 0) {
    return <p className="text-body text-[var(--ink)]">No poll open.</p>;
  }
  return (
    <div className="flex flex-col gap-4">
      {channels.map((channel) => (
        <article
          key={channel.key}
          className="rounded-card border border-[var(--line)] bg-white p-4"
        >
          <h2 className="font-display text-title text-[var(--ink)]">{channel.title}</h2>
          {channel.statusLine && (
            <p className="mt-1 text-body text-[var(--ink)]">{channel.statusLine}</p>
          )}
          {channel.showChase && channel.unfinished.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2">
              {channel.unfinished.map((line) => (
                <li key={`${line.name}-${line.detail}`} className="text-body">
                  <span className="font-semibold">{line.name}</span>
                  <span className="text-[var(--grey)]"> · {shortDetail(line.detail)}</span>
                </li>
              ))}
            </ul>
          )}
          {channel.showChase &&
            channel.unfinished.length === 0 &&
            channel.quietPlaces.length === 0 && (
              <p className="mt-4 text-body text-[var(--grey)]">Done</p>
            )}
          {channel.quietPlaces.length > 0 && (
            <div className="mt-4">
              <p className="text-small font-semibold text-[var(--grey)]">No votes</p>
              <ul className="mt-2 flex flex-col gap-2">
                {channel.quietPlaces.flatMap((area) =>
                  area.places.map((place) => (
                    <li key={`${area.area}-${place}`} className="text-body">
                      <span className="font-semibold">{place}</span>
                      <span className="block text-small text-[var(--grey)]">{area.area}</span>
                    </li>
                  )),
                )}
              </ul>
            </div>
          )}
          <Link
            href={channel.adminPath}
            className="mt-4 flex min-h-tap items-center justify-center rounded-card bg-[var(--ink)] text-body font-semibold text-white"
          >
            Open
          </Link>
        </article>
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

function shortDetail(detail: string): string {
  const halfway = detail.match(/stopped halfway through the dates \((.+)\)/);
  if (halfway) return halfway[1] ?? detail;
  if (detail === "hasn't answered any dates" || detail === "hasn't marked a time yet") {
    return "not started";
  }
  if (detail === "answered the dates and hasn't chosen a place") return "no place";
  if (detail === "opened the link and didn't add a name") return "no name";
  return detail;
}
