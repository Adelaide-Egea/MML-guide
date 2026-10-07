import { randomUUID } from "crypto";
import type {
  AreaVote,
  DateAvailability,
  DateVote,
  DaySlot,
  Group,
  GroupId,
  HistoryEntry,
  Member,
  Option,
  OptionComment,
  OptionPick,
  Round,
  RoundKind,
  RoundStatus,
  SlotVote,
  Visit,
  VisitChannel,
} from "@/lib/types";
import { nextVisitWrite, VISIT_DEDUPE_MS } from "@/lib/analytics";
import { SEED_GROUPS, SEED_OPTIONS, newToken } from "./seed-data";

export interface DataStore {
  groups: Group[];
  members: Member[];
  rounds: Round[];
  dateVotes: DateVote[];
  areaVotes: AreaVote[];
  slotVotes: SlotVote[];
  options: Option[];
  optionPicks: OptionPick[];
  optionComments: OptionComment[];
  history: HistoryEntry[];
  organisers: string[];
  visits: Visit[];
}

function buildSeedStore(): DataStore {
  return {
    groups: structuredClone(SEED_GROUPS),
    members: [],
    rounds: [],
    dateVotes: [],
    areaVotes: [],
    slotVotes: [],
    options: SEED_OPTIONS.map((o) => ({
      ...o,
      id: randomUUID(),
      seen: false,
      seen_on: null,
      status: "approved" as const,
      open_days: (o as { open_days?: number[] | null }).open_days ?? null,
      availability_note:
        (o as { availability_note?: string | null }).availability_note ?? null,
    })),
    optionPicks: [],
    optionComments: [],
    history: [],
    organisers: [],
    visits: [],
  };
}

const globalForStore = globalThis as unknown as {
  __mnoStore?: DataStore;
};

export function getMemoryStore(): DataStore {
  if (!globalForStore.__mnoStore) {
    globalForStore.__mnoStore = buildSeedStore();
  }
  return globalForStore.__mnoStore;
}

export function resetMemoryStore(): DataStore {
  globalForStore.__mnoStore = buildSeedStore();
  return globalForStore.__mnoStore;
}

/** Test helper only — never called by the app. */
export function ensureDemoMembers(): void {
  const store = getMemoryStore();
  if (store.members.some((m) => m.group_id === "french")) return;
  for (const name of ["Anna", "Claire"]) {
    store.members.push({
      id: randomUUID(),
      group_id: "french",
      first_name: name,
      active: true,
      phone: null,
      channel: "evening",
    });
  }
  for (const name of ["Emma", "Sarah"]) {
    store.members.push({
      id: randomUUID(),
      group_id: "barnes",
      first_name: name,
      active: true,
      phone: null,
      channel: "evening",
    });
  }
}

export const memoryDb = {
  getGroupByToken(token: string): Group | null {
    return getMemoryStore().groups.find((g) => g.invite_token === token) ?? null;
  },
  getGroupById(id: GroupId): Group | null {
    return getMemoryStore().groups.find((g) => g.id === id) ?? null;
  },
  listGroups(): Group[] {
    return [...getMemoryStore().groups];
  },
  regenerateToken(groupId: GroupId): string {
    const g = getMemoryStore().groups.find((x) => x.id === groupId);
    if (!g) throw new Error("Group not found");
    g.invite_token = newToken();
    return g.invite_token;
  },
  listMembers(groupId: GroupId, activeOnly = true): Member[] {
    return getMemoryStore().members.filter(
      (m) => m.group_id === groupId && (!activeOnly || m.active),
    );
  },
  getMember(groupId: GroupId, memberId: string): Member | null {
    return (
      getMemoryStore().members.find(
        (m) => m.id === memberId && m.group_id === groupId,
      ) ?? null
    );
  },
  addMember(
    groupId: GroupId,
    firstName: string,
    phone: string | null = null,
    channel: import("@/lib/types").RoundKind = "evening",
  ): Member {
    const m: Member = {
      id: randomUUID(),
      group_id: groupId,
      first_name: firstName.trim(),
      active: true,
      phone,
      channel,
    };
    getMemoryStore().members.push(m);
    return m;
  },
  updateMember(
    groupId: GroupId,
    memberId: string,
    patch: Partial<Pick<Member, "first_name" | "active" | "phone">>,
  ): Member | null {
    const m = memoryDb.getMember(groupId, memberId);
    if (!m) return null;
    if (patch.first_name !== undefined) m.first_name = patch.first_name.trim();
    if (patch.active !== undefined) m.active = patch.active;
    if (patch.phone !== undefined) m.phone = patch.phone;
    return m;
  },
  listActiveRounds(groupId: GroupId): Round[] {
    const active = getMemoryStore().rounds.filter(
      (r) =>
        r.group_id === groupId &&
        r.status !== "done" &&
        r.status !== "cancelled",
    );
    active.sort(
      (a, b) =>
        new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime(),
    );
    return active;
  },
  getActiveRound(groupId: GroupId, kind?: RoundKind): Round | null {
    const active = memoryDb
      .listActiveRounds(groupId)
      .filter((r) => (kind ? r.kind === kind : true));
    return active[0] ?? null;
  },
  getRound(groupId: GroupId, roundId: string): Round | null {
    return (
      getMemoryStore().rounds.find(
        (r) => r.id === roundId && r.group_id === groupId,
      ) ?? null
    );
  },
  createRound(
    groupId: GroupId,
    data: {
      dates: string[];
      closes_at: string;
      status?: RoundStatus;
      kind?: RoundKind;
      meeting_point?: string | null;
      pushchair_friendly?: boolean | null;
      coffee_stop?: string | null;
    },
  ): Round {
    const round: Round = {
      id: randomUUID(),
      group_id: groupId,
      status: data.status ?? "voting",
      kind: data.kind ?? "evening",
      opened_at: new Date().toISOString(),
      closes_at: data.closes_at,
      dates: data.dates,
      chosen_date: null,
      chosen_option_id: null,
      meeting_point: data.meeting_point ?? null,
      pushchair_friendly: data.pushchair_friendly ?? null,
      coffee_stop: data.coffee_stop ?? null,
    };
    getMemoryStore().rounds.push(round);
    return round;
  },
  updateRound(
    groupId: GroupId,
    roundId: string,
    patch: Partial<
      Pick<
        Round,
        | "status"
        | "closes_at"
        | "chosen_date"
        | "chosen_option_id"
        | "dates"
        | "meeting_point"
        | "pushchair_friendly"
        | "coffee_stop"
      >
    >,
  ): Round | null {
    const r = memoryDb.getRound(groupId, roundId);
    if (!r) return null;
    Object.assign(r, patch);
    return r;
  },
  listDateVotes(groupId: GroupId, roundId: string): DateVote[] {
    const round = memoryDb.getRound(groupId, roundId);
    if (!round) return [];
    return getMemoryStore()
      .dateVotes.filter((v) => v.round_id === roundId)
      .map((v) => ({
        ...v,
        availability: v.availability ?? ("yes" as const),
      }));
  },
  setDateVote(
    groupId: GroupId,
    roundId: string,
    memberId: string,
    date: string,
    availability: DateAvailability,
  ): void {
    const round = memoryDb.getRound(groupId, roundId);
    if (!round) throw new Error("Round not found");
    if (!memoryDb.getMember(groupId, memberId)) throw new Error("Member not found");
    const store = getMemoryStore();
    const idx = store.dateVotes.findIndex(
      (v) =>
        v.round_id === roundId && v.member_id === memberId && v.date === date,
    );
    const row = {
      round_id: roundId,
      member_id: memberId,
      date,
      availability,
    };
    if (idx === -1) store.dateVotes.push(row);
    else store.dateVotes[idx] = row;
  },
  listAreaVotes(groupId: GroupId, roundId: string): AreaVote[] {
    if (!memoryDb.getRound(groupId, roundId)) return [];
    return getMemoryStore().areaVotes.filter((v) => v.round_id === roundId);
  },
  setAreaVote(
    groupId: GroupId,
    roundId: string,
    memberId: string,
    area: string,
    chosen: boolean,
  ): void {
    if (!memoryDb.getRound(groupId, roundId)) throw new Error("Round not found");
    if (!memoryDb.getMember(groupId, memberId)) throw new Error("Member not found");
    const store = getMemoryStore();
    const idx = store.areaVotes.findIndex(
      (v) =>
        v.round_id === roundId && v.member_id === memberId && v.area === area,
    );
    if (chosen && idx === -1) {
      store.areaVotes.push({ round_id: roundId, member_id: memberId, area });
    } else if (!chosen && idx !== -1) {
      store.areaVotes.splice(idx, 1);
    }
  },
  listSlotVotes(groupId: GroupId, roundId: string): SlotVote[] {
    if (!memoryDb.getRound(groupId, roundId)) return [];
    return getMemoryStore().slotVotes.filter((v) => v.round_id === roundId);
  },
  setSlotVote(
    groupId: GroupId,
    roundId: string,
    memberId: string,
    date: string,
    slot: DaySlot,
    free: boolean,
  ): void {
    if (!memoryDb.getRound(groupId, roundId)) throw new Error("Round not found");
    if (!memoryDb.getMember(groupId, memberId)) throw new Error("Member not found");
    const store = getMemoryStore();
    const idx = store.slotVotes.findIndex(
      (v) =>
        v.round_id === roundId &&
        v.member_id === memberId &&
        v.date === date &&
        v.slot === slot,
    );
    if (free && idx === -1) {
      store.slotVotes.push({
        round_id: roundId,
        member_id: memberId,
        date,
        slot,
      });
    } else if (!free && idx !== -1) {
      store.slotVotes.splice(idx, 1);
    }
  },
  listOptionComments(groupId: GroupId, optionId: string): OptionComment[] {
    return getMemoryStore()
      .optionComments.filter(
        (c) => c.group_id === groupId && c.option_id === optionId,
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  addOptionComment(
    groupId: GroupId,
    optionId: string,
    memberId: string,
    body: string,
  ): OptionComment {
    if (!memoryDb.getOption(groupId, optionId)) throw new Error("Option not found");
    if (!memoryDb.getMember(groupId, memberId)) throw new Error("Member not found");
    const c: OptionComment = {
      id: randomUUID(),
      group_id: groupId,
      option_id: optionId,
      member_id: memberId,
      body: body.trim(),
      created_at: new Date().toISOString(),
    };
    getMemoryStore().optionComments.push(c);
    return c;
  },
  listOptions(groupId: GroupId): Option[] {
    return getMemoryStore().options.filter((o) => o.group_id === groupId);
  },
  getOption(groupId: GroupId, optionId: string): Option | null {
    return (
      getMemoryStore().options.find(
        (o) => o.id === optionId && o.group_id === groupId,
      ) ?? null
    );
  },
  upsertOption(
    groupId: GroupId,
    data: Partial<Option> & { title: string; kind: Option["kind"] },
    id?: string,
  ): Option {
    const store = getMemoryStore();
    if (id) {
      const existing = memoryDb.getOption(groupId, id);
      if (!existing) throw new Error("Option not found");
      Object.assign(existing, data, { group_id: groupId });
      return existing;
    }
    const opt: Option = {
      id: randomUUID(),
      group_id: groupId,
      kind: data.kind,
      title: data.title,
      venue: data.venue ?? null,
      area: data.area ?? null,
      station: data.station ?? null,
      lines: data.lines ?? [],
      price_from: data.price_from ?? null,
      runs_from: data.runs_from ?? null,
      runs_to: data.runs_to ?? null,
      url: data.url ?? null,
      note: data.note ?? null,
      is_new: data.is_new ?? false,
      upcoming: data.upcoming ?? false,
      flexible_arrival: data.flexible_arrival ?? true,
      seen: data.seen ?? false,
      seen_on: data.seen_on ?? null,
      status: data.status ?? "approved",
      open_days: data.open_days ?? null,
      availability_note: data.availability_note ?? null,
    };
    store.options.push(opt);
    return opt;
  },
  deleteOption(groupId: GroupId, optionId: string): boolean {
    const store = getMemoryStore();
    const idx = store.options.findIndex(
      (o) => o.id === optionId && o.group_id === groupId,
    );
    if (idx === -1) return false;
    store.options.splice(idx, 1);
    return true;
  },
  listOptionPicks(groupId: GroupId, roundId: string): OptionPick[] {
    if (!memoryDb.getRound(groupId, roundId)) return [];
    return getMemoryStore().optionPicks.filter((p) => p.round_id === roundId);
  },
  setOptionPick(
    groupId: GroupId,
    roundId: string,
    memberId: string,
    optionId: string,
    liked: boolean,
  ): void {
    if (!memoryDb.getRound(groupId, roundId)) throw new Error("Round not found");
    if (!memoryDb.getMember(groupId, memberId)) throw new Error("Member not found");
    if (!memoryDb.getOption(groupId, optionId)) throw new Error("Option not found");
    const store = getMemoryStore();
    const idx = store.optionPicks.findIndex(
      (p) =>
        p.round_id === roundId &&
        p.member_id === memberId &&
        p.option_id === optionId,
    );
    if (liked && idx === -1) {
      store.optionPicks.push({
        round_id: roundId,
        member_id: memberId,
        option_id: optionId,
      });
    } else if (!liked && idx !== -1) {
      store.optionPicks.splice(idx, 1);
    }
  },
  listHistory(groupId: GroupId): HistoryEntry[] {
    return getMemoryStore()
      .history.filter((h) => h.group_id === groupId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },
  addHistory(
    groupId: GroupId,
    entry: { date: string; option_id: string | null; title: string },
  ): HistoryEntry {
    const h: HistoryEntry = {
      id: randomUUID(),
      group_id: groupId,
      date: entry.date,
      option_id: entry.option_id,
      title: entry.title,
    };
    getMemoryStore().history.push(h);
    return h;
  },
  listOrganisers(): string[] {
    return [...getMemoryStore().organisers];
  },
  addOrganiser(email: string): void {
    const store = getMemoryStore();
    if (!store.organisers.includes(email)) store.organisers.push(email);
  },
  removeOrganiser(email: string): void {
    const store = getMemoryStore();
    store.organisers = store.organisers.filter((item) => item !== email);
  },
  listVisitsSince(sinceIso: string): Visit[] {
    const cutoff = new Date(sinceIso).getTime();
    return getMemoryStore().visits.filter(
      (visit) => new Date(visit.created_at).getTime() >= cutoff,
    );
  },
  recordVisit(input: {
    groupId: GroupId;
    channel: VisitChannel;
    path: string;
    visitorId: string;
    memberId: string | null;
    now?: Date;
  }): "inserted" | "updated" | "skipped" {
    const store = getMemoryStore();
    const now = input.now ?? new Date();
    const cutoff = now.getTime() - VISIT_DEDUPE_MS;
    const recent =
      [...store.visits]
        .reverse()
        .find(
          (visit) =>
            visit.visitor_id === input.visitorId &&
            visit.path === input.path &&
            new Date(visit.created_at).getTime() >= cutoff,
        ) ?? null;
    const decision = nextVisitWrite(recent, input.memberId);
    if (decision.action === "skip") return "skipped";
    if (decision.action === "update") {
      const row = store.visits.find((visit) => visit.id === decision.id);
      if (row) row.member_id = input.memberId;
      return "updated";
    }
    store.visits.push({
      id: randomUUID(),
      group_id: input.groupId,
      channel: input.channel,
      path: input.path,
      visitor_id: input.visitorId,
      member_id: input.memberId,
      created_at: now.toISOString(),
    });
    return "inserted";
  },
};
