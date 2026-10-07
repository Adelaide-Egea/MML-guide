import { describe, expect, it } from "vitest";
import { rankPlacesForDate, type MeetingPlace } from "@/lib/options";

const places: MeetingPlace[] = [
  { id: "crossing", title: "The Crossing", venue: null, area: "Barnes" },
  { id: "hartys", title: "Harty's", venue: null, area: "Barnes" },
  { id: "home", title: "Adelaide's home", venue: null, area: "Barnes" },
  { id: "coach", title: "Coach and Horses", venue: null, area: "Barnes" },
];

describe("rankPlacesForDate", () => {
  it("counts picks only from people free that night and returns the top three", () => {
    const ranks = rankPlacesForDate(
      places,
      [
        { member_id: "a", option_id: "crossing" },
        { member_id: "b", option_id: "crossing" },
        { member_id: "c", option_id: "crossing" },
        { member_id: "a", option_id: "hartys" },
        { member_id: "b", option_id: "hartys" },
        { member_id: "a", option_id: "home" },
        { member_id: "busy", option_id: "coach" },
      ],
      ["a", "b", "c"],
    );
    expect(ranks.map((row) => [row.place.title, row.count])).toEqual([
      ["The Crossing", 3],
      ["Harty's", 2],
      ["Adelaide's home", 1],
    ]);
  });

  it("hides places nobody free that night picked", () => {
    const ranks = rankPlacesForDate(
      places,
      [{ member_id: "busy", option_id: "coach" }],
      ["a"],
    );
    expect(ranks).toEqual([]);
  });
});
