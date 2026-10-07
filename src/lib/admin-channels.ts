import { buildChannelReport } from "@/lib/analytics";
import { formatClosesExact, formatFromTime } from "@/lib/dates";
import { groupChannelLinks, groupInviteUrl } from "@/lib/invite-paths";
import { meetingPlaces } from "@/lib/options";
import { store } from "@/lib/store";
import type { GroupId, Round, RoundKind, Visit } from "@/lib/types";
import { memberChannel } from "@/lib/types";

export type AdminChannel = {
  key: string;
  groupId: GroupId;
  kind: RoundKind;
  title: string;
  path: string;
  adminPath: string;
  shareText: string;
  hasRound: boolean;
  statusLine: string | null;
  showChase: boolean;
  unfinished: { name: string; detail: string }[];
  quietPlaces: { area: string; places: string[] }[];
  opens: number;
  opensToday: number;
};

export async function loadAdminHome(): Promise<{
  channels: AdminChannel[];
  longLinks: { name: string; people: number }[];
}> {
  const now = new Date();
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const groups = await store.listGroups();
  let visits: Visit[] = [];
  try {
    visits = await store.listVisitsSince(since);
  } catch (error) {
    console.error("visits", error);
  }

  const channels = await Promise.all(
    groups.flatMap((group) =>
      groupChannelLinks(group).map(async (link) => {
        const [rounds, members, options] = await Promise.all([
          store.listActiveRounds(group.id),
          store.listMembers(group.id),
          store.listOptions(group.id),
        ]);
        const round = rounds.find((item) => item.kind === link.channel) ?? null;
        const roster = members.filter(
          (member) => memberChannel(member) === link.channel,
        );
        const [dateVotes, slotVotes, picks] = round
          ? await Promise.all([
              store.listDateVotes(group.id, round.id),
              round.kind === "day"
                ? store.listSlotVotes(group.id, round.id)
                : Promise.resolve([]),
              store.listOptionPicks(group.id, round.id),
            ])
          : [[], [], []];
        const places =
          link.channel === "day"
            ? []
            : meetingPlaces(group, options).map((place) => ({
                id: place.id,
                area: place.area,
                label: place.title,
              }));
        const report = buildChannelReport({
          visits,
          groupId: group.id,
          path: link.path,
          now,
          kind: link.channel,
          status: round?.status ?? null,
          dates: round?.dates ?? [],
          members: roster.map((member) => ({
            id: member.id,
            first_name: member.first_name,
          })),
          dateVotes,
          slotVotes,
          picks,
          places,
        });
        const time = formatFromTime(group.start_time);
        const url = groupInviteUrl(group, link.channel);
        return {
          key: `${group.id}-${link.channel}`,
          groupId: group.id,
          kind: link.channel,
          title: `${group.name} · ${link.label}`,
          path: link.path,
          adminPath: `/admin/${group.id}`,
          shareText: [
            link.channel === "day"
              ? `${group.name} — day walk`
              : `${group.name} — night out, from ${time}`,
            link.channel === "day" ? null : group.arrival_note,
            url,
          ]
            .filter(Boolean)
            .join("\n"),
          hasRound: Boolean(round),
          statusLine: roundStatus(round, now),
          showChase: report.showUnfinished,
          unfinished: report.unfinished,
          quietPlaces: report.quietPlaces,
          opens: report.traffic.visits === 0 ? 0 : report.traffic.people,
          opensToday: report.traffic.peopleToday,
        } satisfies AdminChannel;
      }),
    ),
  );

  const weekStart = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const longLinks = groups
    .map((group) => ({
      name: group.name,
      people: new Set(
        visits
          .filter(
            (visit) =>
              visit.group_id === group.id &&
              visit.path.startsWith("/g/") &&
              new Date(visit.created_at).getTime() >= weekStart,
          )
          .map((visit) => visit.visitor_id),
      ).size,
    }))
    .filter((item) => item.people > 0);

  return { channels, longLinks };
}

function roundStatus(round: Round | null, now: Date): string | null {
  if (!round) return null;
  if (round.status === "voting") {
    return new Date(round.closes_at) <= now
      ? "Voting closed"
      : `Closes ${formatClosesExact(round.closes_at)}`;
  }
  if (round.status === "pick") return "Pick the plan";
  if (round.status === "decided") return "It's on";
  return null;
}
