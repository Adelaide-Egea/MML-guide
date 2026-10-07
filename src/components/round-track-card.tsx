import { DayResultsView } from "@/components/day-results";
import { PickPlan } from "@/components/pick-plan";
import { ResultsView } from "@/components/results-view";
import { BigNightTicket } from "@/components/ticket-card";
import { VoteAreas } from "@/components/vote-areas";
import { VoteDates } from "@/components/vote-dates";
import { VoteDaySlots } from "@/components/vote-day-slots";
import { bookedWhatsAppMessage } from "@/lib/calendar";
import { formatFromTime, formatLongDate } from "@/lib/dates";
import { groupInviteUrl } from "@/lib/invite-paths";
import { meetingPlaces } from "@/lib/options";
import { store } from "@/lib/store";
import type {
  DateVote,
  Group,
  Member,
  Option,
  OptionComment,
  OptionPick,
  Round,
  SlotVote,
} from "@/lib/types";
import { isFreeEnough, votingStep } from "@/lib/types";

export async function RoundTrackCard({
  token,
  group,
  round,
  members,
  member,
  votes,
  slotVotes,
  picks,
  options,
  comments,
  showPlaces = false,
}: {
  token: string;
  group: Group;
  round: Round;
  members: Member[];
  member: Member;
  votes: DateVote[];
  slotVotes: SlotVote[];
  picks: OptionPick[];
  options: Option[];
  comments: OptionComment[];
  /** Places are their own tab. The date card does not repeat them. */
  showPlaces?: boolean;
}) {
  const step = votingStep(round);
  const isDay = round.kind === "day";
  const places = isDay ? [] : meetingPlaces(group, options);
  const votingOpen =
    round.status === "voting" && new Date(round.closes_at) > new Date();

  let nightTicket: React.ReactNode = null;
  if (
    step === 4 &&
    !isDay &&
    round.chosen_option_id &&
    round.chosen_date
  ) {
    const option = await store.getOption(group.id, round.chosen_option_id);
    if (option) {
      const timeLabel = formatFromTime(group.start_time);
      const dateLabel = formatLongDate(round.chosen_date);
      const shareText = bookedWhatsAppMessage({
        title: option.title,
        venue: option.venue,
        dateLabel,
        timeLabel,
        arrivalNote: group.arrival_note,
        link: groupInviteUrl(group, round.kind),
      });
      nightTicket = (
        <BigNightTicket
          title={option.title}
          venue={option.venue}
          area={option.area}
          dateLabel={dateLabel}
          timeLabel={timeLabel}
          arrivalNote={group.arrival_note}
          station={option.station}
          lines={option.lines}
          preferredLines={group.preferred_lines}
          url={option.url}
          date={round.chosen_date}
          startTime={group.start_time}
          shareText={shareText}
        />
      );
    }
  }

  if (showPlaces) {
    if (isDay || places.length === 0 || step !== 1) return null;
    return (
      <section className="rounded-card border border-[var(--line)] bg-white p-4">
        <VoteAreas
          token={token}
          roundId={round.id}
          places={places}
          picks={picks}
          memberId={member.id}
          locked={!votingOpen}
          showIntro={false}
        />
      </section>
    );
  }

  return (
    <section className="rounded-card border border-[var(--line)] bg-white p-4">
      {isDay && <WalkFacts round={round} />}

      <div>
        {round.status === "cancelled" || round.status === "done" ? null : step ===
            1 &&
          round.status === "voting" &&
          isDay ? (
          <VoteDaySlots
            token={token}
            roundId={round.id}
            dates={round.dates}
            closesAt={round.closes_at}
            locked={new Date(round.closes_at) <= new Date()}
            members={members}
            slots={slotVotes}
            memberId={member.id}
          />
        ) : step === 1 && round.status === "voting" ? (
          <VoteDates
            token={token}
            roundId={round.id}
            dates={round.dates}
            closesAt={round.closes_at}
            locked={new Date(round.closes_at) <= new Date()}
            members={members}
            votes={votes}
            memberId={member.id}
          />
        ) : step === 2 && isDay ? (
          <DayResultsView
            dates={round.dates}
            slots={slotVotes}
            members={members}
          />
        ) : step === 2 ? (
          <ResultsView dates={round.dates} votes={votes} members={members} />
        ) : step === 3 && round.chosen_date && !isDay ? (
          <PickPlan
            token={token}
            roundId={round.id}
            group={group}
            chosenDate={round.chosen_date}
            freeNames={votes
              .filter(
                (v) => v.date === round.chosen_date && isFreeEnough(v),
              )
              .map(
                (v) =>
                  members.find((m) => m.id === v.member_id)?.first_name ?? "?",
              )}
            options={options}
            picks={picks}
            comments={comments}
            members={members}
            memberId={member.id}
          />
        ) : step === 4 && isDay && round.chosen_date ? (
          <DayWalkBooked round={round} />
        ) : (
          nightTicket
        )}
      </div>
    </section>
  );
}

function WalkFacts({ round }: { round: Round }) {
  const facts = [
    round.meeting_point?.trim()
      ? ["Meet", round.meeting_point.trim()]
      : null,
    round.pushchair_friendly == null
      ? null
      : ["Pushchair", round.pushchair_friendly ? "Yes" : "Not ideal"],
    round.coffee_stop?.trim() ? ["Coffee", round.coffee_stop.trim()] : null,
  ].filter((fact): fact is [string, string] => fact !== null);
  if (facts.length === 0) return null;
  return (
    <dl className="mb-4 flex flex-col gap-2">
      {facts.map(([label, value]) => (
        <div key={label}>
          <dt className="text-small text-[var(--grey)]">{label}</dt>
          <dd className="text-body font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DayWalkBooked({ round }: { round: Round }) {
  return (
    <div className="space-y-3 py-2">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
        It&apos;s on
      </p>
      <h3 className="font-display text-3xl">Day walk</h3>
      <p className="font-mono text-sm">{formatLongDate(round.chosen_date!)}</p>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-[var(--muted)]">Meeting point</dt>
          <dd className="font-semibold">
            {round.meeting_point?.trim() || "Check the group chat"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Pushchair-friendly</dt>
          <dd className="font-semibold">
            {round.pushchair_friendly == null
              ? "Ask in the chat"
              : round.pushchair_friendly
                ? "Yes"
                : "Not ideal"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Coffee stop</dt>
          <dd className="font-semibold">
            {round.coffee_stop?.trim() || "TBC"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
