import { describe, expect, it, beforeEach } from "vitest";
import {
  bringTotals,
  comingOnDate,
  CRAFT_DEFAULT_DATES,
  craftExtraDayMessage,
  craftInviteMessage,
  craftWhatsAppMessage,
  dateVoteCounts,
  isCraftVotingOpen,
  roundsBesideCraft,
  withoutNotes,
  winningCraftDate,
} from "@/lib/home-event";
import type { HomeEvent, HomeEventResponse } from "@/lib/types";
import {
  ensureDemoMembers,
  memoryDb,
  resetMemoryStore,
} from "@/lib/store/memory";

function event(patch: Partial<HomeEvent> = {}): HomeEvent {
  return {
    id: "e1",
    group_id: "barnes",
    title: "Craft evening at Adelaide's",
    start_time: "20:00:00",
    note: "Little babies are very welcome!",
    dates: CRAFT_DEFAULT_DATES,
    opened_at: "2026-11-17T10:00:00.000Z",
    closes_at: "2026-11-19T11:00:00.000Z",
    chosen_date: null,
    status: "open",
    ...patch,
  };
}

function response(
  memberId: string,
  dates: string[],
  bringing: HomeEventResponse["bringing"] = [],
  note: string | null = null,
): HomeEventResponse {
  return {
    event_id: "e1",
    member_id: memberId,
    dates,
    bringing,
    note,
    updated_at: "2026-11-17T12:00:00.000Z",
  };
}

describe("craft evening helpers", () => {
  it("picks the earliest date when votes tie", () => {
    const votes = [
      response("a", ["2026-11-26", "2026-12-01"]),
      response("b", ["2026-11-26", "2026-12-01"]),
    ];
    expect(winningCraftDate(event(), votes)).toBe("2026-11-26");
  });

  it("picks the date with the most can-come votes", () => {
    const votes = [
      response("a", ["2026-11-24", "2026-11-26"]),
      response("b", ["2026-11-26"]),
      response("c", ["2026-12-03"]),
    ];
    expect(winningCraftDate(event(), votes)).toBe("2026-11-26");
  });

  it("lets admin override the chosen date", () => {
    const votes = [response("a", ["2026-11-26"]), response("b", ["2026-11-26"])];
    expect(
      winningCraftDate(event({ chosen_date: "2026-12-01" }), votes),
    ).toBe("2026-12-01");
  });

  it("only lists mums who can come on the chosen date", () => {
    const votes = [
      response("a", ["2026-11-26"], ["crafts"]),
      response("b", ["2026-12-01"], ["drink"]),
    ];
    const coming = comingOnDate(votes, "2026-11-26");
    expect(coming.map((row) => row.member_id)).toEqual(["a"]);
  });

  it("counts live votes per date", () => {
    const counts = dateVoteCounts(CRAFT_DEFAULT_DATES, [
      response("a", ["2026-11-24", "2026-11-26"]),
      response("b", ["2026-11-26"]),
    ]);
    expect(counts.get("2026-11-24")).toBe(1);
    expect(counts.get("2026-11-26")).toBe(2);
    expect(counts.get("2026-12-01")).toBe(0);
  });

  it("nudges empty bring categories among people coming", () => {
    const totals = bringTotals([
      response("a", ["2026-11-26"], ["crafts", "food"]),
    ]);
    expect(totals.crafts).toBe(1);
    expect(totals.food).toBe(1);
    expect(totals.drink).toBe(0);
  });

  it("strips notes from member-facing rows", () => {
    const publicRows = withoutNotes([
      response("a", ["2026-11-26"], ["drink"], "bringing my 3-month-old"),
    ]);
    expect(publicRows[0]).not.toHaveProperty("note");
    expect(JSON.stringify(publicRows)).not.toContain("3-month-old");
  });

  it("locks after closes_at", () => {
    const open = event({ closes_at: "2026-11-19T12:00:00.000Z" });
    const now = new Date("2026-11-19T11:00:00.000Z");
    const later = new Date("2026-11-19T12:00:00.000Z");
    expect(isCraftVotingOpen(open, now)).toBe(true);
    expect(isCraftVotingOpen(open, later)).toBe(false);
  });

  it("hides leftover night-out rounds while a craft evening is on the page", () => {
    const rounds = [
      { kind: "evening" },
      { kind: "day" },
    ];
    expect(roundsBesideCraft(rounds, event())).toEqual([{ kind: "day" }]);
    expect(roundsBesideCraft(rounds, null)).toEqual(rounds);
  });

  it("builds the invite and recap WhatsApp texts", () => {
    const invite = craftInviteMessage({
      link: "https://mums-night-out.vercel.app/barnesmums",
      closesAt: "2026-11-19T11:00:00.000Z",
    });
    expect(invite).toContain("Craft evening at mine");
    expect(invite).toContain("https://mums-night-out.vercel.app/barnesmums");

    const extra = craftExtraDayMessage({
      date: "2026-12-04",
      link: "https://mums-night-out.vercel.app/barnesmums",
    });
    expect(extra).toContain("Friday 4 December");
    expect(extra).toContain("https://mums-night-out.vercel.app/barnesmums");

    const whatsapp = craftWhatsAppMessage({
      chosenDate: "2026-11-26",
      coming: [
        { name: "Anna", bringing: ["crafts", "drink"] },
        { name: "Claire", bringing: ["food"] },
      ],
      totals: { crafts: 1, food: 1, drink: 1 },
    });
    expect(whatsapp).toContain("Thursday 26 November");
    expect(whatsapp).toContain("• Anna: crafts, drink");
    expect(whatsapp).toContain("• Claire: food");
    expect(whatsapp).toContain("🧵 1");
  });
});

describe("craft evening store", () => {
  beforeEach(() => {
    resetMemoryStore();
    ensureDemoMembers();
  });

  it("never opens a craft evening for French Mums", () => {
    expect(() =>
      memoryDb.createHomeEvent("french", {
        title: "Craft evening at Adelaide's",
        start_time: "20:00",
        note: "nope",
        dates: CRAFT_DEFAULT_DATES,
        closes_at: "2026-11-19T11:00:00.000Z",
      }),
    ).toThrow(/Barnes/);
    expect(memoryDb.getOpenHomeEvent("french")).toBeNull();
  });

  it("keeps notes off the public list and rejects writes after close", () => {
    const created = memoryDb.createHomeEvent("barnes", {
      title: "Craft evening at Adelaide's",
      start_time: "20:00",
      note: "Little babies are very welcome!",
      dates: CRAFT_DEFAULT_DATES,
      closes_at: "2026-11-19T11:00:00.000Z",
    });
    const emma = memoryDb.listMembers("barnes").find((m) => m.first_name === "Emma");
    expect(emma).toBeTruthy();
    memoryDb.upsertHomeEventResponse(
      "barnes",
      created.id,
      emma!.id,
      {
        dates: ["2026-11-26"],
        bringing: ["crafts"],
        note: "bringing my 3-month-old",
      },
      new Date("2026-11-18T10:00:00.000Z"),
    );
    const publicList = memoryDb.listHomeEventResponses("barnes", created.id, false);
    expect(publicList[0]?.note).toBeNull();
    const adminList = memoryDb.listHomeEventResponses("barnes", created.id, true);
    expect(adminList[0]?.note).toBe("bringing my 3-month-old");

    expect(() =>
      memoryDb.upsertHomeEventResponse(
        "barnes",
        created.id,
        emma!.id,
        { dates: ["2026-11-24"], bringing: [], note: null },
        new Date("2026-11-19T11:00:00.000Z"),
      ),
    ).toThrow(/closed/i);
  });

  it("can add an extra evening without dropping the others", () => {
    const created = memoryDb.createHomeEvent("barnes", {
      title: "Craft evening at Adelaide's",
      start_time: "20:00",
      note: "Little babies are very welcome!",
      dates: CRAFT_DEFAULT_DATES,
      closes_at: "2026-11-21T17:00:00.000Z",
    });
    memoryDb.updateHomeEvent("barnes", created.id, {
      dates: [...created.dates, "2026-12-04"],
    });
    const next = memoryDb.getHomeEvent("barnes", created.id);
    expect(next?.dates).toContain("2026-11-24");
    expect(next?.dates).toContain("2026-12-04");
  });

  it("does not leak a Barnes craft evening onto the French group", () => {
    memoryDb.createHomeEvent("barnes", {
      title: "Craft evening at Adelaide's",
      start_time: "20:00",
      note: "Little babies are very welcome!",
      dates: CRAFT_DEFAULT_DATES,
      closes_at: "2026-11-19T11:00:00.000Z",
    });
    expect(memoryDb.getOpenHomeEvent("barnes")).toBeTruthy();
    expect(memoryDb.getOpenHomeEvent("french")).toBeNull();
  });
});
