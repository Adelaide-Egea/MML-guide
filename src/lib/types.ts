export type GroupId = "french" | "barnes";

export type RoundStatus = "voting" | "pick" | "decided" | "done" | "cancelled";

export type RoundKind = "evening" | "day";

export type DaySlot = "morning" | "afternoon";

export type OptionKind = "show" | "drinks" | "food" | "activity";

export type OptionStatus = "approved" | "pending";

export interface Group {
  id: GroupId;
  name: string;
  invite_token: string;
  start_time: string; // HH:mm:ss
  arrival_note: string | null;
  /** One grey line under the group name. Stored per group, not hardcoded. */
  subtitle: string | null;
  evenings: number[];
  lead_days: number;
  horizon_days: number;
  vote_hours: number;
  show_budget: number | null;
  area_label: string | null;
  preferred_lines: string[];
  supports_day_meetups: boolean;
}

export interface Member {
  id: string;
  group_id: GroupId;
  first_name: string;
  active: boolean;
  /** Optional mobile — for updates if they're not on WhatsApp */
  phone: string | null;
  /** Night-out list or day-walk list. Missing means night out. */
  channel?: RoundKind;
}

export interface Round {
  id: string;
  group_id: GroupId;
  status: RoundStatus;
  kind: RoundKind;
  opened_at: string;
  closes_at: string;
  dates: string[];
  chosen_date: string | null;
  chosen_option_id: string | null;
  /** Day walks — shown on the walk card */
  meeting_point: string | null;
  pushchair_friendly: boolean | null;
  coffee_stop: string | null;
}

export type DateAvailability = "yes" | "if_needed" | "cant";

export interface DateVote {
  round_id: string;
  member_id: string;
  date: string;
  availability: DateAvailability;
}

export interface AreaVote {
  round_id: string;
  member_id: string;
  area: string;
}

/** Members free enough to count for a date (Yes or If needed). */
export function isFreeEnough(v: DateVote): boolean {
  return v.availability === "yes" || v.availability === "if_needed";
}

export interface SlotVote {
  round_id: string;
  member_id: string;
  date: string;
  slot: DaySlot;
}

export interface Option {
  id: string;
  group_id: GroupId;
  kind: OptionKind;
  title: string;
  venue: string | null;
  area: string | null;
  station: string | null;
  lines: string[];
  price_from: number | null;
  runs_from: string | null;
  runs_to: string | null;
  url: string | null;
  note: string | null;
  is_new: boolean;
  upcoming: boolean;
  flexible_arrival: boolean;
  seen: boolean;
  seen_on: string | null;
  status: OptionStatus;
  /** 0=Sun … 6=Sat; null/empty = any day */
  open_days: number[] | null;
  availability_note: string | null;
}

export interface OptionComment {
  id: string;
  group_id: GroupId;
  option_id: string;
  member_id: string;
  body: string;
  created_at: string;
}

export interface OptionPick {
  round_id: string;
  member_id: string;
  option_id: string;
}

export interface HistoryEntry {
  id: string;
  group_id: GroupId;
  date: string;
  option_id: string | null;
  title: string;
}

/** evening/day short links, or both when someone opens the long /g/ link. */
export type VisitChannel = RoundKind | "both";

export interface Visit {
  id: string;
  group_id: GroupId;
  channel: VisitChannel;
  path: string;
  visitor_id: string;
  member_id: string | null;
  created_at: string;
}

export interface MemberCookie {
  group_id: GroupId;
  member_id: string;
  /** Remembered separately so the night link and the walk link don't sign each other out. */
  evening_member_id?: string | null;
  day_member_id?: string | null;
}

export function memberChannel(member: { channel?: RoundKind | null }): RoundKind {
  return member.channel === "day" ? "day" : "evening";
}

export type Step = 1 | 2 | 3 | 4;

export function votingStep(round: Round | null, now = new Date()): Step {
  if (!round || round.status === "cancelled" || round.status === "done") return 1;
  if (round.status === "voting") {
    return new Date(round.closes_at) > now ? 1 : 2;
  }
  if (round.status === "pick") return 3;
  if (round.status === "decided") return 4;
  return 1;
}

/** Weekday 0=Sun … 6=Sat for a yyyy-MM-dd date (UTC noon safe). */
export function weekdayOfDate(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}
