import { nextVisitWrite, VISIT_DEDUPE_MS } from "@/lib/analytics";
import { isSupabaseConfigured } from "@/lib/env";
import {
  clipCraftNote,
  isCraftGroup,
  isCraftVotingOpen,
  normalizeBringList,
  normalizeDateList,
} from "@/lib/home-event";
import { dateKey } from "@/lib/replies";
import type {
  AreaVote,
  DateVote,
  DaySlot,
  Group,
  GroupId,
  HistoryEntry,
  HomeEvent,
  HomeEventResponse,
  Member,
  Option,
  OptionComment,
  OptionKind,
  OptionPick,
  Round,
  RoundKind,
  RoundStatus,
  SlotVote,
  Visit,
  VisitChannel,
} from "@/lib/types";
import { memoryDb } from "./memory";
import { createServiceClient } from "@/lib/supabase/admin";
import { newToken } from "./seed-data";

function useMemory(): boolean {
  return !isSupabaseConfigured();
}

function db() {
  return createServiceClient();
}

function normalizeGroup(row: Group | null): Group | null {
  if (!row) return null;
  return {
    ...row,
    supports_day_meetups: Boolean(row.supports_day_meetups),
    preferred_lines: row.preferred_lines ?? [],
    subtitle: row.subtitle ?? null,
  };
}

function normalizeMember(row: Member): Member {
  return {
    ...row,
    phone: row.phone ?? null,
    channel: row.channel === "day" ? "day" : "evening",
  };
}

function normalizeRound(row: Round | null): Round | null {
  if (!row) return null;
  return {
    ...row,
    kind: row.kind === "day" ? "day" : "evening",
    presence_open: Boolean(row.presence_open),
    meeting_point: row.meeting_point ?? null,
    pushchair_friendly:
      row.pushchair_friendly === null || row.pushchair_friendly === undefined
        ? null
        : Boolean(row.pushchair_friendly),
    coffee_stop: row.coffee_stop ?? null,
  };
}

function normalizeOption(row: Option): Option {
  return {
    ...row,
    open_days: row.open_days ?? null,
    availability_note: row.availability_note ?? null,
    lines: row.lines ?? [],
  };
}

export const store = {
  async getGroupByToken(token: string): Promise<Group | null> {
    if (useMemory()) {
      return memoryDb.getGroupByToken(token);
    }
    const { data } = await db()
      .from("groups")
      .select("*")
      .eq("invite_token", token)
      .maybeSingle();
    return normalizeGroup(data as Group | null);
  },

  async getGroupById(id: GroupId): Promise<Group | null> {
    if (useMemory()) return memoryDb.getGroupById(id);
    const { data } = await db().from("groups").select("*").eq("id", id).maybeSingle();
    return normalizeGroup(data as Group | null);
  },

  async listGroups(): Promise<Group[]> {
    if (useMemory()) return memoryDb.listGroups();
    const { data } = await db().from("groups").select("*").order("name");
    return ((data as Group[]) ?? []).map((g) => normalizeGroup(g)!);
  },

  async regenerateToken(groupId: GroupId): Promise<string> {
    if (useMemory()) return memoryDb.regenerateToken(groupId);
    const token = newToken();
    const { error } = await db()
      .from("groups")
      .update({ invite_token: token })
      .eq("id", groupId);
    if (error) throw error;
    return token;
  },

  async listMembers(groupId: GroupId, activeOnly = true): Promise<Member[]> {
    if (useMemory()) {
      return memoryDb.listMembers(groupId, activeOnly);
    }
    let q = db().from("members").select("*").eq("group_id", groupId);
    if (activeOnly) q = q.eq("active", true);
    const { data } = await q.order("first_name");
    return ((data as Member[]) ?? []).map(normalizeMember);
  },

  async getMember(groupId: GroupId, memberId: string): Promise<Member | null> {
    if (useMemory()) return memoryDb.getMember(groupId, memberId);
    const { data } = await db()
      .from("members")
      .select("*")
      .eq("group_id", groupId)
      .eq("id", memberId)
      .maybeSingle();
    return data ? normalizeMember(data as Member) : null;
  },

  async addMember(
    groupId: GroupId,
    firstName: string,
    phone: string | null = null,
    channel: import("@/lib/types").RoundKind = "evening",
  ): Promise<Member> {
    if (useMemory()) return memoryDb.addMember(groupId, firstName, phone, channel);
    const { data, error } = await db()
      .from("members")
      .insert({
        group_id: groupId,
        first_name: firstName.trim(),
        phone,
        channel,
      })
      .select()
      .single();
    if (error) throw error;
    return normalizeMember(data as Member);
  },

  async updateMember(
    groupId: GroupId,
    memberId: string,
    patch: Partial<Pick<Member, "first_name" | "active" | "phone">>,
  ): Promise<Member | null> {
    if (useMemory()) return memoryDb.updateMember(groupId, memberId, patch);
    const { data, error } = await db()
      .from("members")
      .update(patch)
      .eq("group_id", groupId)
      .eq("id", memberId)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? normalizeMember(data as Member) : null;
  },

  async listActiveRounds(groupId: GroupId): Promise<Round[]> {
    if (useMemory()) return memoryDb.listActiveRounds(groupId);
    const { data } = await db()
      .from("rounds")
      .select("*")
      .eq("group_id", groupId)
      .not("status", "in", '("done","cancelled")')
      .order("opened_at", { ascending: false });
    return ((data as Round[]) ?? [])
      .map((r) => normalizeRound(r)!)
      .filter(Boolean);
  },

  async getActiveRound(
    groupId: GroupId,
    kind?: RoundKind,
  ): Promise<Round | null> {
    if (useMemory()) return memoryDb.getActiveRound(groupId, kind);
    let q = db()
      .from("rounds")
      .select("*")
      .eq("group_id", groupId)
      .not("status", "in", '("done","cancelled")');
    if (kind) q = q.eq("kind", kind);
    const { data } = await q
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return normalizeRound(data as Round | null);
  },

  async getRound(groupId: GroupId, roundId: string): Promise<Round | null> {
    if (useMemory()) return memoryDb.getRound(groupId, roundId);
    const { data } = await db()
      .from("rounds")
      .select("*")
      .eq("group_id", groupId)
      .eq("id", roundId)
      .maybeSingle();
    return normalizeRound(data as Round | null);
  },

  async createRound(
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
  ): Promise<Round> {
    if (useMemory()) return memoryDb.createRound(groupId, data);
    const { data: row, error } = await db()
      .from("rounds")
      .insert({
        group_id: groupId,
        dates: data.dates,
        closes_at: data.closes_at,
        status: data.status ?? "voting",
        kind: data.kind ?? "evening",
        meeting_point: data.meeting_point ?? null,
        pushchair_friendly: data.pushchair_friendly ?? null,
        coffee_stop: data.coffee_stop ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return normalizeRound(row as Round)!;
  },

  async updateRound(
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
        | "presence_open"
        | "meeting_point"
        | "pushchair_friendly"
        | "coffee_stop"
      >
    >,
  ): Promise<Round | null> {
    if (useMemory()) return memoryDb.updateRound(groupId, roundId, patch);
    const { data, error } = await db()
      .from("rounds")
      .update(patch)
      .eq("group_id", groupId)
      .eq("id", roundId)
      .select()
      .maybeSingle();
    if (error) throw error;
    return normalizeRound(data as Round | null);
  },

  async listDateVotes(groupId: GroupId, roundId: string): Promise<DateVote[]> {
    if (useMemory()) return memoryDb.listDateVotes(groupId, roundId);
    const round = await store.getRound(groupId, roundId);
    if (!round) return [];
    const { data } = await db()
      .from("date_votes")
      .select("*")
      .eq("round_id", roundId);
    return ((data as DateVote[]) ?? []).map((v) => ({
      ...v,
      availability: v.availability ?? "yes",
    }));
  },

  async listSlotVotes(groupId: GroupId, roundId: string): Promise<SlotVote[]> {
    if (useMemory()) return memoryDb.listSlotVotes(groupId, roundId);
    const round = await store.getRound(groupId, roundId);
    if (!round) return [];
    const { data } = await db()
      .from("slot_votes")
      .select("*")
      .eq("round_id", roundId);
    return (data as SlotVote[]) ?? [];
  },

  async setSlotVote(
    groupId: GroupId,
    roundId: string,
    memberId: string,
    date: string,
    slot: DaySlot,
    free: boolean,
  ): Promise<void> {
    if (useMemory()) {
      memoryDb.setSlotVote(groupId, roundId, memberId, date, slot, free);
      return;
    }
    const round = await store.getRound(groupId, roundId);
    if (!round) throw new Error("Round not found");
    if (!(await store.getMember(groupId, memberId))) {
      throw new Error("Member not found");
    }
    if (free) {
      const { error } = await db()
        .from("slot_votes")
        .upsert({
          round_id: roundId,
          member_id: memberId,
          date,
          slot,
        });
      if (error) throw error;
    } else {
      const { error } = await db()
        .from("slot_votes")
        .delete()
        .eq("round_id", roundId)
        .eq("member_id", memberId)
        .eq("date", date)
        .eq("slot", slot);
      if (error) throw error;
    }
  },

  async listOptionComments(
    groupId: GroupId,
    optionId: string,
  ): Promise<OptionComment[]> {
    if (useMemory()) return memoryDb.listOptionComments(groupId, optionId);
    const { data } = await db()
      .from("option_comments")
      .select("*")
      .eq("group_id", groupId)
      .eq("option_id", optionId)
      .order("created_at", { ascending: false });
    return (data as OptionComment[]) ?? [];
  },

  async listGroupOptionComments(groupId: GroupId): Promise<OptionComment[]> {
    if (useMemory()) {
      return memoryDb
        .listOptions(groupId)
        .flatMap((o) => memoryDb.listOptionComments(groupId, o.id));
    }
    const { data } = await db()
      .from("option_comments")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    return (data as OptionComment[]) ?? [];
  },

  async addOptionComment(
    groupId: GroupId,
    optionId: string,
    memberId: string,
    body: string,
  ): Promise<OptionComment> {
    if (useMemory()) {
      return memoryDb.addOptionComment(groupId, optionId, memberId, body);
    }
    const { data, error } = await db()
      .from("option_comments")
      .insert({
        group_id: groupId,
        option_id: optionId,
        member_id: memberId,
        body: body.trim(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as OptionComment;
  },

  async setDateVote(
    groupId: GroupId,
    roundId: string,
    memberId: string,
    date: string,
    availability: import("@/lib/types").DateAvailability,
  ): Promise<void> {
    if (useMemory()) {
      memoryDb.setDateVote(groupId, roundId, memberId, date, availability);
      return;
    }
    const round = await store.getRound(groupId, roundId);
    if (!round) throw new Error("Round not found");
    const member = await store.getMember(groupId, memberId);
    if (!member) throw new Error("Member not found");
    const { error } = await db().from("date_votes").upsert({
      round_id: roundId,
      member_id: memberId,
      date,
      availability,
    });
    if (error) throw error;
  },

  async listAreaVotes(groupId: GroupId, roundId: string): Promise<AreaVote[]> {
    if (useMemory()) return memoryDb.listAreaVotes(groupId, roundId);
    const round = await store.getRound(groupId, roundId);
    if (!round) return [];
    const { data, error } = await db()
      .from("area_votes")
      .select("round_id, member_id, area")
      .eq("round_id", roundId);
    if (error) throw error;
    return (data as AreaVote[]) ?? [];
  },

  async setAreaVote(
    groupId: GroupId,
    roundId: string,
    memberId: string,
    area: string,
    chosen: boolean,
  ): Promise<void> {
    if (useMemory()) {
      memoryDb.setAreaVote(groupId, roundId, memberId, area, chosen);
      return;
    }
    const round = await store.getRound(groupId, roundId);
    if (!round) throw new Error("Round not found");
    const member = await store.getMember(groupId, memberId);
    if (!member) throw new Error("Member not found");
    if (chosen) {
      const { error } = await db().from("area_votes").upsert(
        { round_id: roundId, member_id: memberId, area },
        { onConflict: "round_id,member_id,area" },
      );
      if (error) throw error;
      return;
    }
    const { error } = await db()
      .from("area_votes")
      .delete()
      .eq("round_id", roundId)
      .eq("member_id", memberId)
      .eq("area", area);
    if (error) throw error;
  },

  async listOptions(groupId: GroupId): Promise<Option[]> {
    if (useMemory()) return memoryDb.listOptions(groupId);
    const { data } = await db()
      .from("options")
      .select("*")
      .eq("group_id", groupId)
      .order("title");
    return ((data as Option[]) ?? []).map(normalizeOption);
  },

  async getOption(groupId: GroupId, optionId: string): Promise<Option | null> {
    if (useMemory()) return memoryDb.getOption(groupId, optionId);
    const { data } = await db()
      .from("options")
      .select("*")
      .eq("group_id", groupId)
      .eq("id", optionId)
      .maybeSingle();
    return data ? normalizeOption(data as Option) : null;
  },

  async upsertOption(
    groupId: GroupId,
    data: Partial<Option> & { title: string; kind: OptionKind },
    id?: string,
  ): Promise<Option> {
    if (useMemory()) return memoryDb.upsertOption(groupId, data, id);
    if (id) {
      const { data: row, error } = await db()
        .from("options")
        .update({ ...data, group_id: groupId })
        .eq("id", id)
        .eq("group_id", groupId)
        .select()
        .single();
      if (error) throw error;
      return row as Option;
    }
    const { data: row, error } = await db()
      .from("options")
      .insert({ ...data, group_id: groupId })
      .select()
      .single();
    if (error) throw error;
    return row as Option;
  },

  async deleteOption(groupId: GroupId, optionId: string): Promise<boolean> {
    if (useMemory()) return memoryDb.deleteOption(groupId, optionId);
    const { error, count } = await db()
      .from("options")
      .delete({ count: "exact" })
      .eq("group_id", groupId)
      .eq("id", optionId);
    if (error) throw error;
    return (count ?? 0) > 0;
  },

  async listOptionPicks(groupId: GroupId, roundId: string): Promise<OptionPick[]> {
    if (useMemory()) return memoryDb.listOptionPicks(groupId, roundId);
    const round = await store.getRound(groupId, roundId);
    if (!round) return [];
    const { data } = await db()
      .from("option_picks")
      .select("*")
      .eq("round_id", roundId);
    return (data as OptionPick[]) ?? [];
  },

  async setOptionPick(
    groupId: GroupId,
    roundId: string,
    memberId: string,
    optionId: string,
    liked: boolean,
  ): Promise<void> {
    if (useMemory()) {
      memoryDb.setOptionPick(groupId, roundId, memberId, optionId, liked);
      return;
    }
    const round = await store.getRound(groupId, roundId);
    if (!round) throw new Error("Round not found");
    if (!(await store.getMember(groupId, memberId))) throw new Error("Member not found");
    if (!(await store.getOption(groupId, optionId))) throw new Error("Option not found");
    if (liked) {
      const { error } = await db()
        .from("option_picks")
        .upsert({ round_id: roundId, member_id: memberId, option_id: optionId });
      if (error) throw error;
    } else {
      const { error } = await db()
        .from("option_picks")
        .delete()
        .eq("round_id", roundId)
        .eq("member_id", memberId)
        .eq("option_id", optionId);
      if (error) throw error;
    }
  },

  async listHistory(groupId: GroupId): Promise<HistoryEntry[]> {
    if (useMemory()) return memoryDb.listHistory(groupId);
    const { data } = await db()
      .from("history")
      .select("*")
      .eq("group_id", groupId)
      .order("date", { ascending: false });
    return (data as HistoryEntry[]) ?? [];
  },

  async addHistory(
    groupId: GroupId,
    entry: { date: string; option_id: string | null; title: string },
  ): Promise<HistoryEntry> {
    if (useMemory()) return memoryDb.addHistory(groupId, entry);
    const { data, error } = await db()
      .from("history")
      .insert({ group_id: groupId, ...entry })
      .select()
      .single();
    if (error) throw error;
    return data as HistoryEntry;
  },

  async listOrganiserEmails(): Promise<string[]> {
    const { getAdminEmail } = await import("@/lib/env");
    const owner = getAdminEmail();
    if (useMemory()) {
      return Array.from(new Set([owner, ...memoryDb.listOrganisers()]));
    }
    const { data, error } = await db().from("organisers").select("email");
    if (error) return [owner];
    const extras = ((data as { email: string }[]) ?? []).map((row) =>
      row.email.trim().toLowerCase(),
    );
    return Array.from(new Set([owner, ...extras]));
  },

  async addOrganiserEmail(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    if (useMemory()) {
      memoryDb.addOrganiser(normalized);
      return;
    }
    const { error } = await db()
      .from("organisers")
      .upsert({ email: normalized }, { onConflict: "email" });
    if (error) throw error;
  },

  async removeOrganiserEmail(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    if (useMemory()) {
      memoryDb.removeOrganiser(normalized);
      return;
    }
    const { error } = await db().from("organisers").delete().eq("email", normalized);
    if (error) throw error;
  },

  async listVisitsSince(sinceIso: string): Promise<Visit[]> {
    if (useMemory()) return memoryDb.listVisitsSince(sinceIso);
    const { data, error } = await db()
      .from("visits")
      .select("*")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw error;
    return (data as Visit[]) ?? [];
  },

  async recordVisit(input: {
    groupId: GroupId;
    channel: VisitChannel;
    path: string;
    visitorId: string;
    memberId: string | null;
    now?: Date;
  }): Promise<"inserted" | "updated" | "skipped"> {
    if (useMemory()) return memoryDb.recordVisit(input);
    const now = input.now ?? new Date();
    const since = new Date(now.getTime() - VISIT_DEDUPE_MS).toISOString();
    const { data, error } = await db()
      .from("visits")
      .select("id, member_id")
      .eq("visitor_id", input.visitorId)
      .eq("path", input.path)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    const recent =
      ((data as { id: string; member_id: string | null }[]) ?? [])[0] ?? null;
    const decision = nextVisitWrite(recent, input.memberId);
    if (decision.action === "skip") return "skipped";
    if (decision.action === "update") {
      const { error: updateError } = await db()
        .from("visits")
        .update({ member_id: input.memberId })
        .eq("id", decision.id);
      if (updateError) throw updateError;
      return "updated";
    }
    const { error: insertError } = await db().from("visits").insert({
      group_id: input.groupId,
      channel: input.channel,
      path: input.path,
      visitor_id: input.visitorId,
      member_id: input.memberId,
      created_at: now.toISOString(),
    });
    if (insertError) throw insertError;
    return "inserted";
  },

  async getOpenHomeEvent(groupId: GroupId): Promise<HomeEvent | null> {
    if (useMemory()) return memoryDb.getOpenHomeEvent(groupId);
    if (!isCraftGroup(groupId)) return null;
    const { data, error } = await db()
      .from("home_events")
      .select("*")
      .eq("group_id", groupId)
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      if (isMissingHomeEventTable(error)) return null;
      throw error;
    }
    return data ? normalizeHomeEvent(data) : null;
  },

  async getHomeEvent(
    groupId: GroupId,
    eventId: string,
  ): Promise<HomeEvent | null> {
    if (useMemory()) return memoryDb.getHomeEvent(groupId, eventId);
    const { data, error } = await db()
      .from("home_events")
      .select("*")
      .eq("group_id", groupId)
      .eq("id", eventId)
      .maybeSingle();
    if (error) throw error;
    return data ? normalizeHomeEvent(data) : null;
  },

  async createHomeEvent(
    groupId: GroupId,
    data: {
      title: string;
      start_time: string;
      note: string | null;
      dates: string[];
      closes_at: string;
    },
  ): Promise<HomeEvent> {
    if (useMemory()) return memoryDb.createHomeEvent(groupId, data);
    if (!isCraftGroup(groupId)) {
      throw new Error("Craft evenings are only for Barnes Mums.");
    }
    const dates = normalizeDateList(data.dates);
    if (dates.length === 0) throw new Error("Pick at least one date.");
    const { data: row, error } = await db()
      .from("home_events")
      .insert({
        group_id: groupId,
        title: data.title.trim() || "Craft evening at Adelaide's",
        start_time: data.start_time,
        note: data.note,
        dates,
        closes_at: data.closes_at,
        status: "open",
      })
      .select()
      .single();
    if (error) throw error;
    return normalizeHomeEvent(row);
  },

  async updateHomeEvent(
    groupId: GroupId,
    eventId: string,
    patch: Partial<Pick<HomeEvent, "closes_at" | "chosen_date" | "status" | "dates">>,
  ): Promise<HomeEvent> {
    if (useMemory()) return memoryDb.updateHomeEvent(groupId, eventId, patch);
    const existing = await this.getHomeEvent(groupId, eventId);
    if (!existing) throw new Error("Craft evening not found.");
    const next: Record<string, unknown> = {};
    const dates = patch.dates
      ? normalizeDateList(patch.dates)
      : existing.dates;
    if (patch.dates !== undefined) {
      if (dates.length === 0) throw new Error("Pick at least one date.");
      next.dates = dates;
    }
    if (patch.closes_at !== undefined) next.closes_at = patch.closes_at;
    if (patch.chosen_date !== undefined) {
      next.chosen_date = patch.chosen_date
        ? dateKey(patch.chosen_date)
        : null;
      if (
        next.chosen_date &&
        !dates.includes(next.chosen_date as string)
      ) {
        throw new Error("That date isn't on this evening.");
      }
    }
    if (patch.status !== undefined) next.status = patch.status;
    const { data, error } = await db()
      .from("home_events")
      .update(next)
      .eq("id", eventId)
      .eq("group_id", groupId)
      .select()
      .single();
    if (error) throw error;
    return normalizeHomeEvent(data);
  },

  async listHomeEventResponses(
    groupId: GroupId,
    eventId: string,
    includeNotes = false,
  ): Promise<HomeEventResponse[]> {
    if (useMemory()) {
      return memoryDb.listHomeEventResponses(groupId, eventId, includeNotes);
    }
    const event = await this.getHomeEvent(groupId, eventId);
    if (!event) return [];
    const { data, error } = await db()
      .from("home_event_responses")
      .select("*")
      .eq("event_id", eventId);
    if (error) throw error;
    return ((data as unknown as Record<string, unknown>[]) ?? []).map((row) =>
      normalizeHomeEventResponse(row, includeNotes),
    );
  },

  async getHomeEventResponse(
    groupId: GroupId,
    eventId: string,
    memberId: string,
  ): Promise<HomeEventResponse | null> {
    if (useMemory()) {
      return memoryDb.getHomeEventResponse(groupId, eventId, memberId);
    }
    if (!(await this.getHomeEvent(groupId, eventId))) return null;
    const { data, error } = await db()
      .from("home_event_responses")
      .select("*")
      .eq("event_id", eventId)
      .eq("member_id", memberId)
      .maybeSingle();
    if (error) throw error;
    return data ? normalizeHomeEventResponse(data, true) : null;
  },

  async upsertHomeEventResponse(
    groupId: GroupId,
    eventId: string,
    memberId: string,
    data: { dates: string[]; bringing: string[]; note: string | null },
    now = new Date(),
  ): Promise<HomeEventResponse> {
    if (useMemory()) {
      return memoryDb.upsertHomeEventResponse(
        groupId,
        eventId,
        memberId,
        data,
        now,
      );
    }
    const event = await this.getHomeEvent(groupId, eventId);
    if (!event) throw new Error("Craft evening not found.");
    if (event.status === "archived" || !isCraftVotingOpen(event, now)) {
      throw new Error("Voting has closed.");
    }
    const member = await this.getMember(groupId, memberId);
    if (!member) throw new Error("Member not found.");
    const allowed = new Set(event.dates);
    const dates = normalizeDateList(data.dates).filter((date) => allowed.has(date));
    const bringing = normalizeBringList(data.bringing);
    const note = clipCraftNote(data.note);
    const row = {
      event_id: eventId,
      member_id: memberId,
      dates,
      bringing,
      note,
      updated_at: now.toISOString(),
    };
    const { data: saved, error } = await db()
      .from("home_event_responses")
      .upsert(row)
      .select()
      .single();
    if (error) throw error;
    return normalizeHomeEventResponse(saved, true);
  },

  /** Organiser moves someone between evenings — works after voting closes. */
  async setHomeEventResponseDatesAsAdmin(
    groupId: GroupId,
    eventId: string,
    memberId: string,
    dates: string[],
    now = new Date(),
  ): Promise<HomeEventResponse> {
    if (useMemory()) {
      return memoryDb.setHomeEventResponseDatesAsAdmin(
        groupId,
        eventId,
        memberId,
        dates,
        now,
      );
    }
    const event = await this.getHomeEvent(groupId, eventId);
    if (!event) throw new Error("Craft evening not found.");
    if (event.status === "archived") throw new Error("This craft evening is archived.");
    const member = await this.getMember(groupId, memberId);
    if (!member) throw new Error("Member not found.");
    const allowed = new Set(event.dates);
    const clean = normalizeDateList(dates).filter((date) => allowed.has(date));
    const existing = await this.getHomeEventResponse(groupId, eventId, memberId);
    const row = {
      event_id: eventId,
      member_id: memberId,
      dates: clean,
      bringing: existing?.bringing ?? [],
      note: existing?.note ?? null,
      updated_at: now.toISOString(),
    };
    const { data: saved, error } = await db()
      .from("home_event_responses")
      .upsert(row)
      .select()
      .single();
    if (error) throw error;
    return normalizeHomeEventResponse(saved, true);
  },
};

function isMissingHomeEventTable(error: { message?: string; code?: string }): boolean {
  const message = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /home_events|schema cache/i.test(message)
  );
}

function normalizeHomeEvent(row: Record<string, unknown> | HomeEvent): HomeEvent {
  const start = String(row.start_time ?? "20:00");
  return {
    id: String(row.id),
    group_id: row.group_id === "french" ? "french" : "barnes",
    title: String(row.title ?? "Craft evening at Adelaide's"),
    start_time: start.length === 5 ? `${start}:00` : start,
    note: (row.note as string | null) ?? null,
    dates: normalizeDateList(row.dates),
    opened_at: String(row.opened_at),
    closes_at: String(row.closes_at),
    chosen_date: row.chosen_date ? dateKey(String(row.chosen_date)) : null,
    status: row.status === "archived" ? "archived" : "open",
  };
}

function normalizeHomeEventResponse(
  row: Record<string, unknown>,
  includeNotes: boolean,
): HomeEventResponse {
  return {
    event_id: String(row.event_id),
    member_id: String(row.member_id),
    dates: normalizeDateList(row.dates),
    bringing: normalizeBringList(row.bringing),
    note: includeNotes ? clipCraftNote(row.note) : null,
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}
