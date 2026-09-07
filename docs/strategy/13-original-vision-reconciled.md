# 13. The original MML vision, reconciled

The founder's original feature list and sign-up model, assessed against the market
research in `03` and the architecture in `06` and `08`. Also covers the proposal to
turn the care guide from a document into an interactive app.

This document exists because the original list is broader than the material I audited,
and it contains one idea I had missed that is better than anything I proposed.

---

## 13.1 The good news first: the data model was already right

The original sign-up captures children's date of birth, allergies, likes and dislikes,
nappy size, milk type, doses, personality, nap times, stroller size, nappy bag,
city, and whether care is nursery, nanny, parent or grandparent.

That is, almost field for field, the household model already built in
`packages/core/src/household.ts` — arrived at independently from the audit. It is a
strong signal that the "one household, many surfaces" architecture recommended in `06`
§6.1 is the shape you were reaching for all along, and nothing needs to change to
accommodate the original vision's data requirements.

Two additions the original list makes that the current model does not have, and both
are good: **stroller and bag dimensions** (which make packing genuinely deterministic
rather than generic — you can only say "that won't fit" if you know the bag), and
**the care arrangement itself** (nursery / nanny / parent / grandparent), which is the
single most useful field for deciding what to show someone.

## 13.2 The feature list, sorted by the only question that matters

The market research produced one test worth applying to every item: **does this move
knowledge out of someone's head, or does it create a system that has to be
maintained?** The first is the differentiated, defensible thing nobody else is doing.
The second is the category that killed Milo, Yohana, Maple and Picniic.

Sorting the original list on that axis is unusually clarifying.

### Outbound — keep. This is the actual business.

| Item | Assessment |
|---|---|
| **Care guide** (the existing Held) | The lead surface. Already argued in `03` §3.7 |
| **House clean: detailed update for cleaner** | **See §13.3 — this is the most important item on the list** |
| **Day travel / travel packing** | The existing Readied. Retention asset, not a revenue line (PackPoint is $2.99 once with ~40k ratings) |
| **Help phrasing requests to avoid blaming** | **See §13.4 — the sleeper** |

### Inbound — the family-operating-system trap. Decline.

| Item | Why |
|---|---|
| **Appointments / to-do lists / reminders** | This *is* the category with the graveyard. Cozi has twenty million users and nineteen staff at $39/year, and MOLO is VC-funded and ahead of us on exactly this. There is no room and no differentiation |
| **Predictive reminders from grocery habits** | Requires either receipt ingestion or manual logging. Manual logging is a system to maintain; ingestion is the inbound model we are positioned against. It is also the single most-attempted and least-delivered feature in the category |
| **Growth charts / food logging** | Daily logging, so the wrong frequency for an episodic product; a crowded field (Huckleberry and the baby trackers); and it edges toward **regulated territory** — software that interprets a child's measurements against clinical percentiles may fall in scope of EU MDR, which is a question for a regulatory lawyer before a line is written, not after |

### Content, not load reduction — decline, or make them free marketing

| Item | Why |
|---|---|
| **Recipes** | Infinitely available free. Adds nothing a search does not |
| **Kid / baby activities** | Same. Useful as *content marketing* — this is exactly the French-language organic material `03` §3.5 says is the only affordable acquisition channel — but not as a paid feature |
| **Tutoring** | A marketplace. Entirely different business, different supply side |
| **Tips on children's reactions** | Good *inside* another surface (a line in a care guide) but not a destination |
| **Return to work guidance, CV, Indeed partnership** | A careers and employment-law product. Different audience moment (once, briefly), different partners, different regulatory posture. Genuinely interesting, genuinely unrelated. If it is pursued it should be pursued the way the animated universe should be — separately |

**What survives is four items, and three of them are the same machine.**

## 13.3 The idea I had missed: it is not one product with many features, it is one engine with many recipients

Buried in the original list, between recipes and tutoring, is *"House clean: detailed
update for cleaner."*

That is not a separate feature. **It is the care guide, pointed at a different
person.** Same structure: a household holds facts, one person needs a subset of them,
the product renders that subset into something readable, in their language, delivered
by link, with nothing to install.

Once you see it, the ecosystem reorganises. It is not *many apps for many jobs*. It is
**one briefing engine and many recipients**:

| Recipient | What they receive |
|---|---|
| Babysitter, grandparent | The child's routine, comfort, allergies, contacts |
| Nanny, au pair | The same, longer-form, with house rules — the onboarding pack |
| Cleaner | The house: what matters, what to leave alone, where things live, access |
| Dog sitter, house sitter | The house and the animal |
| A holiday host, a school trip | Whatever subset applies |
| Yourself, packing for a trip | The same engine pointed inward — a list instead of a brief |

This is a materially better strategic story than the one in `03`, and it fixes the
weakest point of that analysis. `03` §3.4 concluded honestly that the niche is
under-served but *small*: the median parent briefs a babysitter six to twelve times a
year. **The recipient framing changes that number**, because a household with a
cleaner, an occasional sitter, a grandparent and one holiday a year has considerably
more occasions than one with a sitter alone — without adding a single system for
anyone to maintain.

It also strengthens the moat. Eight competitors have built babysitter briefings
(`03` §3.2). None has built a general briefing engine, because they each started from
the babysitter as a *category* rather than from the handover as a *mechanism*.

And it explains the translation wedge better than I did. A cleaner or an au pair is
even more likely than a babysitter to read a different first language. Translation is
not a feature bolted onto a childcare app; it is the core of what a briefing engine
does.

**Recommendation:** adopt "one engine, many recipients" as the product architecture.
Build the childcare recipient first, exactly as planned. Add the cleaner second — it
is the cheapest new surface you will ever ship, because the engine, the household, the
share link and the translation already exist, and only the field set changes.

One caveat worth holding onto: the household model must generalise from *children* to
*the home*. That is a small change now and an expensive one later, so the schema
should anticipate it — which is a change I would make to `packages/core` before
building much on top of it.

## 13.4 The sleeper: "help phrasing requests to avoid blaming"

This appears once in the original list, without elaboration, and I think it may be the
most original idea in the whole project.

Everything else in the mental-load category treats the problem as *logistical* — who
does what, when. This treats it as **interpersonal**: the reason the load does not get
shared is often not that the other person refuses, but that asking is exhausting,
and asking badly starts an argument. Nothing in the competitive set touches this.
MOLO comes closest with *"the modern load is not a personal failing, it is a
structural problem"*, but that is a marketing position, not a feature.

It also happens to be the ideal AI use case for this product, which is rare. Rewriting
tone is what language models are genuinely good at; it carries no safety risk, because
nothing factual is at stake; it is cheap; and the user can obviously judge the output
themselves, which is the property that makes AI trustworthy rather than alarming.

Two cautions. It must never become a script generator for managing a partner — that is
a different and slightly grim product. And it should probably live as a small thing
inside the main product rather than a surface with a name, at least until there is
evidence people reach for it.

**Recommendation:** hold it for the AI phase, then build the smallest possible version
and watch whether anyone uses it. If they do, it is a genuine differentiator that no
competitor is positioned to copy quickly.

## 13.5 Tiering: "small mental load" and "full mental load"

The original model gives the free tier access to two features and the paid tier access
to everything.

The instinct — that the free tier should be genuinely useful rather than crippled — is
right, and it matches the recommendation in `07`. But feature-count tiers have two
practical problems. The user has to choose which two before they know which two they
want, which is a decision at exactly the wrong moment. And it doubles the surface area
of everything, because every feature needs an entitled and an unentitled state.

**The recipient framing gives a much cleaner version of the same intent:** the free
tier covers **one recipient type**, the paid tier covers all of them. A household
briefing its babysitter for free that then hires a cleaner has an obvious, well-timed
reason to upgrade, and the boundary explains itself in one sentence.

That is compatible with the pricing in `07` (£24/year, £49 lifetime), and it is a
better boundary than the "two guides in total" limit I proposed, because it does not
require counting and it never says no at the moment of need.

## 13.6 Turning the care guide into an interactive app

The proposal: rather than producing a PDF, the caregiver gets something interactive
they can tick off as they go.

**The instinct is right and the default implementation would be a mistake.** Both
halves of that need explaining, because the difference is subtle and it is the whole
product's positioning.

### What is right about it

A document is a snapshot. It cannot update when plans change at 7pm, cannot confirm
anything was read, and cannot hold anything the parent adds after sending. A live page
solves all three, and the competitive set has already converged on the live link —
Gosling, Handoff and Handover all use expiring browser links rather than PDFs.

### What would go wrong

The strongest thing this product has is that **the caregiver adopts nothing**. That is
not a convenience; it is the structural reason it survives the failure mode that
killed the category, where the second person never joins in and the mental-load tool
becomes more mental load (`03` §3.3). Every step that asks the caregiver to *do
something* erodes it.

A checklist asks them to do something. Thirty times.

There is a second problem, and it is the more serious one. A completion log visible to
the parent turns the caregiver into a monitored worker. That contradicts the
positioning directly: the argument against the name *Lisette* in `04` §4.2 was that a
product whose credibility rests on the carer being a **trusted person rather than
staff** must not code them as staff. A tick-box report card does exactly that, and a
grandmother will find it insulting.

### What I would build instead

Three things, in order of confidence:

**1. A live page instead of a PDF, with the PDF kept.** The link is the product; the
printable version stays, because a phone dies and a fridge does not. The page updates
if the parent edits it. This is pure gain and I would do it regardless.

**2. One acknowledgement, not thirty ticks.** The caregiver taps once to confirm they
have read the critical section — allergies, medication, emergency contacts. One tap,
on the thing that actually matters, and the parent sees it was read.

This is the version worth building. It gives the parent the reassurance they want, it
gives the caregiver a two-second obligation rather than a chore chart, and it produces
a genuine safety artefact — a timestamped record that the person looking after your
child confirmed they read the allergy information. That has real weight with nanny
agencies and au pair placements, and it is the kind of thing the domain core's
critical-block model (`packages/core/src/guide.ts`) is already structured to support.

**3. Optional ticking, visible only to the caregiver.** If a sitter wants to check off
bedtime steps as they go, let them — some will find it genuinely useful at 7pm with two
children. But it is a tool *for them*, not a report to the parent. Store it locally,
show it to nobody, and never nudge them to use it.

**And a boundary to hold:** never require the caregiver to install anything, create an
account, or log in. Every competitor that requires an install concedes it as a
weakness. NestNote says so explicitly. It is settled, and it should stay settled.

### On attaching approved videos

Good feature, small effort, real friction solved — the care guide already has a screen
time field, and *"what are they allowed to watch"* is a question every sitter asks. It
fits.

One condition, covered at more length in `12` §12.4: **the list must accept any URL and
default to nothing.** If it were ever weighted toward a related venture's content, the
feature stops being help and becomes placement, and the product's whole value rests on
parents believing it is on their side.

## 13.7 What this changes

Nothing structural, which is the point — the household model, the deterministic guide
builder and the safety invariants all hold. What changes is emphasis:

1. **Adopt "one engine, many recipients"** as the framing, and generalise the household
   schema from children to the home before building further on it.
2. **The cleaner brief becomes the second surface**, ahead of packing. It is nearly free
   to build and it multiplies the occasions per household, which is the weakest number
   in the whole plan.
3. **The free/paid boundary becomes one recipient versus all recipients**, replacing the
   guide-count limit in `07` §7.2.
4. **Decline the family-operating-system features** — reminders, growth charts, food
   logging, appointments — not because they are bad ideas, but because they are the
   ideas that have consumed every well-funded company in this category.
5. **Recipes and activities become French-language content marketing**, not product.
6. **Hold "help phrasing requests" for the AI phase** and build the smallest version.
