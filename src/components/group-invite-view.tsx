import { FilterTabs } from "@/components/filter-tabs";
import { getValidMemberForGroup, memberIdForChannel } from "@/lib/cookies";
import { formatTimeLabel } from "@/lib/dates";
import { meetingPlaces } from "@/lib/options";
import { store } from "@/lib/store";
import { pickTab } from "@/lib/tabs";
import type { Group, Member, Round, RoundKind } from "@/lib/types";
import { memberChannel, votingStep } from "@/lib/types";
import { WhoAreYou } from "@/components/who-are-you";
import { NotYou } from "@/components/not-you";
import { WhatsOn } from "@/components/whats-on";
import { SuggestPlace } from "@/components/suggest-place";
import { BrandMark } from "@/components/brand-mark";
import { RoundTrackCard } from "@/components/round-track-card";
import { VisitBeacon } from "@/components/visit-beacon";

export async function GroupInviteView({
  group,
  channel,
  tab,
  path,
}: {
  group: Group;
  /** Set on the short links so night out and day walk stay separate. */
  channel?: RoundKind;
  tab?: string;
  path: string;
}) {
  const token = group.invite_token;
  const members = (await store.listMembers(group.id, true))
    .map(withoutPhone)
    .filter((member) => !channel || memberChannel(member) === channel)
    .sort((a, b) =>
      a.first_name.localeCompare(b.first_name, "en", { sensitivity: "base" }),
    );
  const cookie = await getValidMemberForGroup(group.id);
  const memberId = cookie
    ? channel
      ? memberIdForChannel(cookie, channel)
      : cookie.member_id
    : null;
  const loaded = memberId ? await store.getMember(group.id, memberId) : null;
  const member =
    loaded?.active && (!channel || memberChannel(loaded) === channel)
      ? withoutPhone(loaded)
      : null;

  const rounds = sortTracks(await store.listActiveRounds(group.id)).filter(
    (round) => !channel || round.kind === channel,
  );
  const options = await store.listOptions(group.id);
  const comments = await store.listGroupOptionComments(group.id);
  const history = await store.listHistory(group.id);

  const places = meetingPlaces(group, options);
  const placeIds = new Set(places.map((place) => place.id));
  const ideas = options.filter(
    (o) =>
      !o.seen &&
      !o.upcoming &&
      o.status === "approved" &&
      !placeIds.has(o.id),
  );
  const comingSoon = options.filter(
    (o) => o.upcoming && !o.seen && o.status === "approved",
  );
  const eveningRound = rounds.find((round) => round.kind === "evening") ?? null;
  const dayRound = rounds.find((round) => round.kind === "day") ?? null;
  const showIdeas = channel !== "day";
  const tabs = memberTabs({
    channel,
    eveningRound,
    dayRound,
    hasPlaces: places.length > 0,
    showIdeas,
    ideaLabel:
      ideas.length + comingSoon.length + history.length > 0 ? "Ideas" : "Add",
  });
  const current = pickTab(
    tab,
    tabs.map((item) => item.id),
    tabs[0]?.id ?? (channel === "day" ? "walk" : "ideas"),
  );
  const panel =
    tabs.length > 1 ? current : channel === "day" ? "walk" : (tabs[0]?.id ?? "ideas");
  const roundCards = await Promise.all(
    rounds.map(async (round) => {
      const votes = await store.listDateVotes(group.id, round.id);
      const slotVotes =
        round.kind === "day" ? await store.listSlotVotes(group.id, round.id) : [];
      const picks = await store.listOptionPicks(group.id, round.id);
      return { round, votes, slotVotes, picks };
    }),
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-page py-page pb-16">
      <VisitBeacon groupId={group.id} memberId={member?.id ?? null} />
      <h1 className="sr-only">Mums&apos; Night Out</h1>
      <header className="flex flex-col gap-4">
        <BrandMark height={28} />
        <div>
          <p className="font-display text-title text-[var(--ink)]">{group.name}</p>
          <p className="mt-1 text-small text-[var(--grey)]">
            {groupLine(group, rounds, channel)}
          </p>
        </div>
      </header>

      {!member || !member.active ? (
        <WhoAreYou token={token} members={members} channel={channel} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-body text-[var(--ink)]">{member.first_name}</p>
            <NotYou token={token} name={member.first_name} channel={channel} />
          </div>

          {tabs.length > 1 && (
            <FilterTabs label={group.name} basePath={path} current={current} tabs={tabs} />
          )}

          <div role="tabpanel" id={`panel-${panel}`} aria-labelledby={`tab-${panel}`}>
            <MemberPanel
              current={panel}
              token={token}
              group={group}
              members={members}
              member={member}
              roundCards={roundCards}
              eveningRound={eveningRound}
              dayRound={dayRound}
              channel={channel}
              options={options}
              comments={comments}
              ideas={ideas}
              comingSoon={comingSoon}
              history={history}
            />
          </div>
        </div>
      )}
    </main>
  );
}

function MemberPanel({
  current,
  token,
  group,
  members,
  member,
  roundCards,
  eveningRound,
  dayRound,
  channel,
  options,
  comments,
  ideas,
  comingSoon,
  history,
}: {
  current: string;
  token: string;
  group: Group;
  members: Member[];
  member: Member;
  roundCards: {
    round: Round;
    votes: Awaited<ReturnType<typeof store.listDateVotes>>;
    slotVotes: Awaited<ReturnType<typeof store.listSlotVotes>>;
    picks: Awaited<ReturnType<typeof store.listOptionPicks>>;
  }[];
  eveningRound: Round | null;
  dayRound: Round | null;
  channel?: RoundKind;
  options: Awaited<ReturnType<typeof store.listOptions>>;
  comments: Awaited<ReturnType<typeof store.listGroupOptionComments>>;
  ideas: Awaited<ReturnType<typeof store.listOptions>>;
  comingSoon: Awaited<ReturnType<typeof store.listOptions>>;
  history: Awaited<ReturnType<typeof store.listHistory>>;
}) {
  const cardFor = (round: Round | null) =>
    roundCards.find((card) => card.round.id === round?.id) ?? null;

  if (current === "ideas") {
    return (
      <div className="flex flex-col gap-4">
        {!eveningRound && channel !== "day" && !dayRound && (
          <p className="text-body text-[var(--ink)]">
            {channel === "evening" ? "No night out open." : "Nothing open."}
          </p>
        )}
        <SuggestPlace token={token} groupId={group.id} />
        <WhatsOn
          bare
          ideas={ideas}
          comingSoon={comingSoon}
          past={history}
          preferredLines={group.preferred_lines}
        />
      </div>
    );
  }

  if (current === "places") {
    const card = cardFor(eveningRound);
    if (!card || !member) return null;
    return (
      <RoundTrackCard
        token={token}
        group={group}
        round={card.round}
        members={members}
        member={member}
        votes={card.votes}
        slotVotes={card.slotVotes}
        picks={card.picks}
        options={options}
        comments={comments}
        showPlaces
      />
    );
  }

  const round =
    current === "walk" ? dayRound : channel === "day" ? dayRound : eveningRound ?? dayRound;
  const card = cardFor(round);
  if (!card) {
    return (
      <p className="text-body text-[var(--ink)]">
        {channel === "day" || current === "walk" ? "No day walk open." : "No night out open."}
      </p>
    );
  }

  return (
    <RoundTrackCard
      token={token}
      group={group}
      round={card.round}
      members={members}
      member={member}
      votes={card.votes}
      slotVotes={card.slotVotes}
      picks={card.picks}
      options={options}
      comments={comments}
    />
  );
}

function memberTabs({
  channel,
  eveningRound,
  dayRound,
  hasPlaces,
  showIdeas,
  ideaLabel,
}: {
  channel?: RoundKind;
  eveningRound: Round | null;
  dayRound: Round | null;
  hasPlaces: boolean;
  showIdeas: boolean;
  ideaLabel: string;
}): { id: string; label: string }[] {
  if (channel === "day") return [];

  const night = eveningRound;
  const nightStep = night ? votingStep(night) : 0;
  const tabs: { id: string; label: string }[] = [];

  if (night && nightStep === 1) {
    tabs.push({ id: "dates", label: "Dates" });
    if (hasPlaces) tabs.push({ id: "places", label: "Places" });
  } else if (night && nightStep === 2) {
    tabs.push({ id: "results", label: "Results" });
  } else if (night && nightStep === 3) {
    tabs.push({ id: "plan", label: "Plan" });
  } else if (night && nightStep === 4) {
    tabs.push({ id: "tonight", label: "Tonight" });
  }

  if (!channel && dayRound) tabs.push({ id: "walk", label: "Walk" });
  if (showIdeas) tabs.push({ id: "ideas", label: ideaLabel });
  return tabs;
}

function sortTracks(rounds: Round[]): Round[] {
  return [...rounds].sort((a, b) => {
    if (a.kind === b.kind) {
      return new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime();
    }
    return a.kind === "evening" ? -1 : 1;
  });
}

/** Public directory — phone numbers stay on the organiser dashboard. */
function withoutPhone(member: Member): Member {
  return { ...member, phone: null };
}

function groupLine(group: Group, rounds: Round[], channel?: RoundKind): string {
  const time = formatTimeLabel(group.start_time);
  if (channel === "evening") return `Evenings from ${time}`;
  if (channel === "day") return "Day walks";
  const evening = rounds.some((round) => round.kind === "evening");
  const day = rounds.some((round) => round.kind === "day");
  if (evening && !day) return `Evenings from ${time}`;
  if (day && !evening) return "Day walks";
  if (evening && day) return `Evenings from ${time} · Day walks`;
  const stored = group.subtitle?.trim();
  if (stored) return stored;
  return group.supports_day_meetups
    ? `Evenings from ${time} · Day walks`
    : `Evenings from ${time}`;
}
