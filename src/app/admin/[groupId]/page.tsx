import { AdminManage } from "@/components/admin-manage";
import { RetireLongLink } from "@/components/retire-long-link";
import { AdminRoundPanel } from "@/components/admin-round-panel";
import { FilterTabs } from "@/components/filter-tabs";
import { requireAdmin } from "@/lib/admin-auth";
import { formatFromTime } from "@/lib/dates";
import { store } from "@/lib/store";
import { pickTab } from "@/lib/tabs";
import type { GroupId, Round } from "@/lib/types";
import { notFound } from "next/navigation";
import Link from "next/link";

const TABS = [
  { id: "poll", label: "Poll" },
  { id: "results", label: "Results" },
  { id: "names", label: "Names" },
  { id: "ideas", label: "Ideas" },
] as const;

export default async function AdminGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ tab?: string; plan?: string }>;
}) {
  await requireAdmin();
  const { groupId: raw } = await params;
  if (raw !== "french" && raw !== "barnes") notFound();
  const groupId = raw as GroupId;
  const group = await store.getGroupById(groupId);
  if (!group) notFound();
  const { tab, plan } = await searchParams;
  const current = pickTab(
    tab,
    TABS.map((item) => item.id),
    "poll",
  );

  const [members, roundsRaw, options] = await Promise.all([
    store.listMembers(groupId, false),
    store.listActiveRounds(groupId),
    store.listOptions(groupId),
  ]);
  const activeMembers = members.filter((m) => m.active);
  const rounds = sortTracks(roundsRaw);
  const openKinds = new Set(rounds.map((r) => r.kind));
  const canLaunchEvening = !openKinds.has("evening");
  const canLaunchDay = group.supports_day_meetups && !openKinds.has("day");

  return (
    <main className="px-page py-page pb-16">
      <Link
        href="/admin"
        className="inline-flex min-h-tap items-center text-body text-[var(--grey)]"
      >
        Back
      </Link>
      <h1 className="font-display text-title text-[var(--ink)]">{group.name}</h1>
      <p className="text-small text-[var(--grey)]">{formatFromTime(group.start_time)}</p>

      <div className="mt-4">
        <FilterTabs
          label={group.name}
          basePath={`/admin/${group.id}`}
          current={current}
          tabs={[...TABS]}
        />
      </div>

      <div
        className="mt-4"
        role="tabpanel"
        id={`panel-${current}`}
        aria-labelledby={`tab-${current}`}
      >
        {current === "poll" && (
          <div className="flex flex-col gap-4">
            {rounds.length === 0 ? (
              <AdminRoundPanel
                group={group}
                round={null}
                members={activeMembers}
                votes={[]}
                slotVotes={[]}
                picks={[]}
                options={options}
                token={group.invite_token}
                launchPreferredKind={
                  plan === "day" || plan === "evening" ? plan : "evening"
                }
              />
            ) : (
              <>
                {(canLaunchEvening || canLaunchDay) && (
                  <AdminRoundPanel
                    group={group}
                    round={null}
                    members={activeMembers}
                    votes={[]}
                    slotVotes={[]}
                    picks={[]}
                    options={options}
                    token={group.invite_token}
                    launchPreferredKind={
                      canLaunchEvening ? "evening" : "day"
                    }
                    launchLockedKinds={[
                      ...(canLaunchEvening ? [] : (["evening"] as const)),
                      ...(canLaunchDay ? [] : (["day"] as const)),
                    ]}
                    startCollapsed
                  />
                )}
                {await Promise.all(
                  rounds.map(async (round) => {
                    const votes = await store.listDateVotes(groupId, round.id);
                    const slotVotes =
                      round.kind === "day"
                        ? await store.listSlotVotes(groupId, round.id)
                        : [];
                    const picks = await store.listOptionPicks(groupId, round.id);
                    return (
                      <AdminRoundPanel
                        key={round.id}
                        group={group}
                        round={round}
                        members={activeMembers}
                        votes={votes}
                        slotVotes={slotVotes}
                        picks={picks}
                        options={options}
                        token={group.invite_token}
                      />
                    );
                  }),
                )}
              </>
            )}
          </div>
        )}
        {current === "results" && (
          <div className="flex flex-col gap-4">
            {rounds.length === 0 ? (
              <p className="text-body text-[var(--ink)]">No poll open.</p>
            ) : (
              await Promise.all(
                rounds.map(async (round) => {
                  const votes = await store.listDateVotes(groupId, round.id);
                  const slotVotes =
                    round.kind === "day"
                      ? await store.listSlotVotes(groupId, round.id)
                      : [];
                  const picks = await store.listOptionPicks(groupId, round.id);
                  return (
                    <AdminRoundPanel
                      key={round.id}
                      group={group}
                      round={round}
                      members={activeMembers}
                      votes={votes}
                      slotVotes={slotVotes}
                      picks={picks}
                      options={options}
                      token={group.invite_token}
                      view="results"
                    />
                  );
                }),
              )
            )}
          </div>
        )}
        {current === "names" && (
          <AdminManage group={group} members={activeMembers} options={options} part="names" />
        )}
        {current === "ideas" && (
          <div className="flex flex-col gap-4">
            <AdminManage group={group} members={activeMembers} options={options} part="ideas" />
            <RetireLongLink groupId={group.id} label={group.name} />
          </div>
        )}
      </div>
    </main>
  );
}

function sortTracks(rounds: Round[]): Round[] {
  return [...rounds].sort((a, b) => {
    if (a.kind === b.kind) {
      return new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime();
    }
    return a.kind === "evening" ? -1 : 1;
  });
}
