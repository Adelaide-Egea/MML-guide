import { nextVisitWrite, VISIT_DEDUPE_MS } from "@/lib/analytics";
import { isSupabaseConfigured } from "@/lib/env";
import type {
  AreaVote,
  DateVote,
  DaySlot,
  Group,
  GroupId,
  HistoryEntry,
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
};
