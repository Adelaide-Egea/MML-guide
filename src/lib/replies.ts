/** yyyy-MM-dd, even if a timestamp sneaks in. */
export function dateKey(value: string): string {
  const match = String(value).match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : String(value);
}

/**
 * Someone has replied once they have answered at least one date on this poll.
 * Waiting until every evening is filled left the line at "0 of 1 replied"
 * while dates were already selected.
 */
export function countMembersReplied(
  members: { id: string }[],
  dates: string[],
  votes: { member_id: string; date: string }[],
): number {
  const open = new Set(dates.map(dateKey));
  const answered = new Set<string>();
  for (const vote of votes) {
    const key = dateKey(vote.date);
    if (open.size > 0 && !open.has(key)) continue;
    answered.add(vote.member_id);
  }
  return members.filter((member) => answered.has(member.id)).length;
}
