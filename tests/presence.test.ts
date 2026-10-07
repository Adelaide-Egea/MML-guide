import { describe, expect, it } from "vitest";
import type { Round } from "@/lib/types";
import {
  canReplyOnDate,
  isPresenceOpen,
  isVotingOpen,
} from "@/lib/types";

function round(patch: Partial<Round>): Round {
  return {
    id: "r1",
    group_id: "barnes",
    status: "voting",
    kind: "evening",
    opened_at: "2026-10-01T10:00:00.000Z",
    closes_at: "2026-10-06T18:00:00.000Z",
    dates: ["2026-10-14", "2026-10-15", "2026-10-16"],
    chosen_date: null,
    chosen_option_id: null,
    presence_open: false,
    meeting_point: null,
    pushchair_friendly: null,
    coffee_stop: null,
    ...patch,
  };
}

const now = new Date("2026-10-06T12:00:00.000Z");

describe("final-choice presence", () => {
  it("lets people vote every date while the poll is open", () => {
    const open = round({
      closes_at: "2026-10-07T18:00:00.000Z",
    });
    expect(isVotingOpen(open, now)).toBe(true);
    expect(canReplyOnDate(open, "2026-10-14", now)).toBe(true);
    expect(canReplyOnDate(open, "2026-10-16", now)).toBe(true);
  });

  it("locks every date after close until the organiser opens the final choice", () => {
    const closed = round({
      closes_at: "2026-10-05T18:00:00.000Z",
    });
    expect(isVotingOpen(closed, now)).toBe(false);
    expect(canReplyOnDate(closed, "2026-10-14", now)).toBe(false);
    expect(isPresenceOpen(closed)).toBe(false);
  });

  it("reopens only the chosen date once presence is on", () => {
    const presence = round({
      status: "pick",
      closes_at: "2026-10-05T18:00:00.000Z",
      chosen_date: "2026-10-15",
      presence_open: true,
    });
    expect(isPresenceOpen(presence)).toBe(true);
    expect(canReplyOnDate(presence, "2026-10-15", now)).toBe(true);
    expect(canReplyOnDate(presence, "2026-10-14", now)).toBe(false);
    expect(canReplyOnDate(presence, "2026-10-16", now)).toBe(false);
  });

  it("still takes names after the night is booked", () => {
    const decided = round({
      status: "decided",
      closes_at: "2026-10-05T18:00:00.000Z",
      chosen_date: "2026-10-15",
      chosen_option_id: "opt-1",
      presence_open: true,
    });
    expect(canReplyOnDate(decided, "2026-10-15", now)).toBe(true);
    expect(canReplyOnDate(decided, "2026-10-14", now)).toBe(false);
  });

  it("ignores presence_open until a date is chosen", () => {
    const tooSoon = round({
      status: "voting",
      closes_at: "2026-10-05T18:00:00.000Z",
      presence_open: true,
    });
    expect(isPresenceOpen(tooSoon)).toBe(false);
    expect(canReplyOnDate(tooSoon, "2026-10-14", now)).toBe(false);
  });
});
