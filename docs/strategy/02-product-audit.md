# 2. Existing product audit

Covers deliverables 2, 3, 4 and 5: the product-level audit, and the three individual product
analyses.

---

## 2.0 The portfolio as it stands

Two shipped apps and one concept. They share a founder, a font pairing, a Supabase project and a
tagline. They share no code, no account, no data, no design tokens, no user, and no reason —
from the user's point of view — to be in the same family.

| | Held | Readied | Colour Keeper |
|---|---|---|---|
| Job | brief a caregiver about your children | pack the family for a trip | unknown |
| Trigger | you are leaving a child with someone | you are going away | unknown |
| Frequency | occasional, unpredictable | 2–6× a year for most families | unknown |
| Output | a document you send to somebody else | a checklist you and a partner tick | unknown |
| Session shape | one long form, one artefact, done | build once, return repeatedly over days | unknown |
| Who else touches it | the caregiver (read-only) | the partner (read-write) | unknown |
| Emotional register | relief at the door | competence before departure | unknown |
| Accent colour | forest green `#335C4A` | clay `#B25A34` | unknown |

The important observation from that table: **these are not variants of one product. They are two
different session shapes with two different second users.** That has direct consequences for the
ecosystem architecture (see `06`) and for whether a single subscription makes sense (see `07`).

The second observation: **both are episodic, not habitual.** Neither creates a daily reason to
open the app. That is a strategic asset — it is exactly what "make life feel lighter, not another
system to maintain" means in practice — and simultaneously the central commercial problem, because
episodic products are hard to build a recurring subscription on. Section `07` addresses this
directly and it is the most consequential commercial question in this document.

---

## 3. Held — analysis

### What problem is it trying to solve

The gap between what a parent knows about their child and what the person now looking after that
child knows. Not a scheduling problem and not a task problem — a **knowledge-transfer** problem,
under time pressure, at the door, with your coat on.

The brand manifest describes this well and I think it is correct: *"Every family app I found was
built for the person who already knows. Nothing was built for the person who doesn't."*

### Who is the user

There are two, and the app currently only serves one of them properly.

- **The briefer** — the parent leaving. Usually the parent who holds the default knowledge. Time-poor
  at the exact moment of use.
- **The briefed** — the babysitter, grandparent, au pair, nanny, or new partner. They receive a PDF
  or an image in WhatsApp. They are the person the document exists for, and they have no product
  experience at all: no ability to search it, ask a follow-up, mark something done, or say "she
  wouldn't eat the pasta".

That second user is the biggest unexploited asset in the whole portfolio.

### Core value proposition

Answer a few questions once; hand over a document that a stranger can actually act on, in their
language, in under a minute.

### Desired outcome, emotional benefit, functional benefit

- **Outcome:** you leave without a running commentary and without the 11pm text.
- **Emotional:** permission to go. The manifest's line "You can leave now" is the product in three
  words and it is genuinely good.
- **Functional:** a translated, structured, printable document that did not exist before and would
  have taken forty minutes to write by hand.

### Existing flow

Home → number of children → duration and format → essentials (the one critical thing, country,
language) → children hub → per-child basics/care/personality → caregiver → routine builder →
emergency contacts → finish → AI generation → guide → send as image / PDF / plain text.

Eight main steps plus three sub-steps per child. For a family with two children that is fourteen
screens before any output.

### Data used

Per child: name, age, colour, emoji, allergies, nappy status and size, cream, milk types, bottle
amounts, food stage, nursery, school, likes and comfort items, screen rules, what to do when upset.
Plus: routine items with times and per-child assignment, emergency contacts, country, guide
language, an "important — read first" free-text note, extra notes, sign-off.

That is a substantial and genuinely well-designed child profile. It is also **the most valuable data
asset in the ecosystem** and it is currently trapped in `localStorage` on one device.

### Connections to the rest of MML

None today. The child profile is rebuilt from scratch in Readied as a "traveller" with a name and an
age band. The same child is entered twice, in two apps, with no relationship between them.

### What is good

- **The positioning is genuinely differentiated.** "Outbound, not inbound" — briefing before rather
  than logging after — is a real distinction and, on the evidence available, under-served.
- **The prompt engineering is careful.** Explicit rules against inventing, linking unlinked facts, or
  softening negatives. Somebody has clearly been burned by a model turning "she falls asleep with no
  warning" into "watch for her sleep cue" and has written a rule to stop it.
- **Safety-critical facts are rendered by the app, not the model.**
- **UI chrome is hand-translated**, not model-translated. Correct.
- **Age-adaptive fields.** The care screen changes with the child's age band.
- **Saved child profiles.** The right instinct — a repeat guide should be a few taps.
- **Translation is a real wedge.** An English-speaking parent in France briefing a French nounou is
  a specific, painful, unserved job. Almost nothing else in the category does this.
- **The one-thing-they-must-not-miss field.** Forcing a single "Important — read first" answer is
  good product design.
- **"Fix a word or two."** Letting the parent correct the model rather than regenerate is the right
  trust model. (It just doesn't persist — see B3 in the technical audit.)

### What is weak

- **Fourteen screens to first value.** The sample guide is the only fast path and it is buried
  behind a text link. Most people will not finish.
- **Effort is front-loaded and payoff is back-loaded.** The parent using this app is, by definition,
  about to leave the house. Asking for a full child profile at that moment is the wrong time.
- **The caregiver gets a dead artefact.** A PNG in WhatsApp. They cannot search it, cannot ask
  a question, cannot confirm they have read it, cannot report back.
- **No return loop.** Once the guide is sent the product is over. Nothing brings the parent back
  except starting again from the beginning.
- **The allergy bug** (B1) means the model writes its narrative believing there are no allergies.
- **"A separate guide each" is decorative** (B2).
- **Manual edits are lost on reload** (B3).
- **Single-parent by construction.** No second parent, no shared household, so the other parent
  cannot send the guide, and the guide reflects one person's knowledge only. For a product about
  distributing the mental load, this is an odd omission.

### What is confusing

- **"Held" as a name.** It is a past participle with no subject. Held by whom? The manifest already
  concedes it is a plain English word describing what the product does, and therefore weak as a
  trademark. Agreed.
- **Format vs duration** asks the user to make a decision (one-pager or full guide) before they have
  seen either, and then the choice mostly changes CSS density.
- **"My Mental Load" as the endorsing line.** The brand voice rule is "give permission, never name
  the burden" — and then the logo lockup names the burden, directly under the product name, on every
  screen. This is the sharpest internal contradiction in the current brand and section `05` returns
  to it.
- **The beta code field** implies a payment system that does not exist.

### What creates friction

The routine builder (tap a chip, it inserts a row, set a time, add a note, repeat), re-entering child
details that Readied already has, the emoji and colour picker at the point of maximum time pressure,
and the requirement to name a caregiver before you can continue when you may not yet know who it is.

### What feels unnecessary

Twenty-four emoji choices and twelve colour swatches during a hurried handover. The combined/separate
guide toggle (it does nothing). The format toggle before generation, given it is available after
generation too. The duration tiles, which mostly just pre-select the format.

### What could become genuinely differentiated

1. **The caregiver-side experience.** A live web link instead of a PNG: searchable, translatable on
   demand, with a "seen it" acknowledgement and a way to send one line back ("she didn't eat much").
   Nobody in this category is building for the caregiver. This is the strongest single idea in the
   portfolio.
2. **The persistent child profile.** Enter once, reuse forever, across every app. The guide becomes
   a *view* over a profile rather than a form you fill in.
3. **Translation as the wedge.** Expat and cross-cultural families, and UK/FR households with a
   French-speaking nounou or grandparent, are a specific and reachable market.
4. **Time-to-first-guide under ninety seconds.** If the profile already exists, a guide should be:
   who is coming, how long, send. That is the actual product.

### What should be abandoned

The name. The one-shot-form-then-dead-PDF shape. The emoji/colour picker at that point in the flow.
The combined/separate toggle. The fake beta code. The idea that the parent is the only user.

### Verdict

**The underlying product idea is the strongest thing in the portfolio and should be the first app
rebuilt.** The name goes. The form-first structure goes — it becomes profile-first, with generation
as a fast action over a profile that already exists. The caregiver becomes a first-class user.

---

## 4. Readied — analysis

### What problem is it trying to solve

Packing for a family, which is not "make a list" but a genuinely hard constraint-satisfaction
problem: multiple people with different bodies and ages, multiple legs with different weather, a
laundry opportunity somewhere in the middle, a ferry crossing where the big bags are inaccessible,
and one adult holding all of it in their head at 11pm the night before.

### Who is the user

The parent who packs — in practice usually one parent — plus, once shared, the partner who is
supposed to help and now can, because there is a list on their phone with tickable items.

### Core value proposition

A per-person, weather-aware, laundry-aware packing list that is right the first time, and that two
people can tick at once.

### Desired outcome, emotional benefit, functional benefit

- **Outcome:** leave without the sinking feeling that something is missing.
- **Emotional:** competence and delegation — someone else can now do a share of it without being
  told what to do.
- **Functional:** correct quantities, per person, per bag, including the bag you need on the ferry.

### Existing flow

Welcome → people (with age bands and wardrobe style) → trip dates → destinations and legs (with
transport, laundry, overnight, transit flags) → activities and occasions → style/shopping/food
preferences → generate → results with tick-off, notes, photos, swaps, buy flags → share code →
"packing home" reverse mode.

Six steps, with real depth in the legs step.

### Data used

Travellers (name, age band, wardrobe preference), transport modes, trip start/end, legs (place,
dates, laundry availability, arrive/depart timing, overnight, transit, who is on this leg),
activities with per-person assignment, occasions, style/shop/food preferences, free-text notes and
culture notes, then generated lists, schedule, weather, and tick state for both outbound and return.

### Connections to the rest of MML

One: it shares a Supabase project with nothing else in it. Travellers are re-entered. Children
entered in Held do not appear here.

### What is good

- **`buildLocal()` is real IP.** Per-person dry-spell maths driven by the longest run without
  laundry; transit-bag grouping terminated by either a stop or a laundry opportunity; wardrobe modes;
  regional medicine substitution. This is domain understanding that a competitor cannot copy from a
  screenshot and a model will not reliably reproduce.
- **Local-first, AI-enriches.** The deterministic build always succeeds; the model adds seasonal
  weather and parses the parent's brain-dump. If every AI call fails, the user still gets a complete
  list. This is the right architecture and should become the house pattern.
- **The brain-dump guarantee.** Whatever you typed appears somewhere, even with no AI.
- **Real resilience engineering.** Verified storage writes, quota recovery, shape guards on model
  output, an error boundary with a route back, working Undo.
- **Genuine two-person use.** Ticking together is the only feature in either app that actually
  redistributes work rather than describing it.
- **The reverse mode** (packing to come home) is a lovely, specific observation.
- **The breathing cue on the generation screen** is the single best expression of the brand's
  intent in either app.
- **Better accessibility and escaping discipline than Held.**

### What is weak

- **"Readied" is not a word people use.** Awkward as a past participle, awkward to say, and it
  describes a state rather than offering anything.
- **Frequency.** Most families take two to six trips a year. That is a hard base for a subscription.
- **Polling every four seconds** instead of Supabase Realtime — cost, battery, and not actually live.
- **Share codes are five characters** and, given the RLS defect, the table is readable anyway.
- **No account, so no cross-device.** Change phone, lose everything.
- **The legs step is the best and heaviest part of the product.** Multi-leg trips with transit bags
  are where it wins, and also where most users will abandon.
- **The AI status indicator ("AI OFF (proxy file missing)", "add ANTHROPIC_API_KEY in Vercel")** is
  developer diagnostics shown to end users.

### What is confusing

Style/shop/food preferences arrive before the user knows what they affect. "Occasions" and
"activities" overlap. The results screen carries a lot at once: lists, schedule, weather, handled
notes, places, progress, share, save, reverse mode.

### What creates friction

Entering travellers who are the same children already described in Held. The legs step for a simple
one-destination trip. Free-text notes competing with structured fields.

### What feels unnecessary

The "places to eat and stay" AI call — it is a different product (travel recommendations), it is the
least reliable output, and it invites comparison with tools that do it far better. The developer AI
status text. The food preference setting, whose effect is not visible.

### What could become genuinely differentiated

1. **The packing engine as a shared service.** The dry-spell/laundry/transit model is the asset.
2. **Two-person ticking as the headline**, not a share feature. "The other parent can actually help"
   is a stronger promise than "a good list".
3. **Reuse across trips.** Last summer's list, adjusted for a year older and different weather. This
   is the closest thing in the portfolio to a repeat-use loop.
4. **It knows your children.** Once the household profile exists, packing for a 2-year-old with a
   dairy allergy and a comfort rabbit should require answering almost nothing.

### What should be abandoned

The name. The places/restaurant recommendations. The developer-facing status text. Polling. Standing
as an independent product with its own account and its own child data.

### Verdict

**Keep the engine, drop the standalone product.** Readied's packing logic is the best code in the
portfolio, but as a separate app with its own name, its own marketing and its own subscription it is
weak — the frequency does not support it and the name does not help. Its natural home is as a
capability inside a household that already knows who the children are. Whether that means a second
named app or a mode within one app is the ecosystem question, and section `06` argues a specific
answer.

---

## 5. Colour Keeper — analysis

### Status: cannot be analysed

Colour Keeper does not exist in this repository, in any of its 70 commits, in any branch, or in the
supplied files. A full-text search across everything available returns no match for "colour keeper"
or "color keeper".

I am not going to invent an analysis of a product I have not seen. What follows is therefore
**strictly provisional**, offered so that the decision is not blocked, and flagged for correction as
soon as the concept is supplied.

### What can be said now

From the name alone, "Colour Keeper" reads as either (a) a colour-coded system for keeping track of
who-is-who or what-belongs-to-whom across a family, or (b) something about preserving colour —
laundry, decorating, wardrobe. Both apps already use a per-child colour-and-emoji identity system
(Held's `KID_IDENTITIES` array of twelve colour/dim/emoji triples; Readied's age-band avatars), which
suggests (a) — a colour-as-identity system across a family.

If that is the concept, the strategic reading is: **that is a feature of the household model, not a
product.** A per-person colour and symbol that runs consistently across every app — on the guide, on
the packing list, on the calendar — is exactly the kind of shared primitive that makes an ecosystem
feel like one thing. It is a design-system decision and it is genuinely valuable. It is not an app.

### The brief's instruction

The brief says the current Colour Keeper colour system needs significant redesign and should not be
treated as final. I have no colour system to redesign. What I can do — and have done in `05` — is
propose the token architecture that any per-person colour system must satisfy: contrast-verified
against both surfaces, distinguishable by people with the three common colour-vision deficiencies,
never the sole carrier of meaning, and paired with a shape or symbol so that colour is reinforcement
rather than information.

### What I need

The concept, sketches, code, or a paragraph describing what it is meant to do. Then I will produce
the same analysis given for Held and Readied. This is decision **D1**.

---

## 2.9 What the three products tell us collectively

Three things fall out of the audit that shape everything downstream:

**One.** The valuable, durable asset in both apps is the same thing: *a structured, accurate
description of your children and your household*. Held collects it richly and strands it. Readied
collects a thin version of it again. Every product idea in the portfolio is downstream of that one
object. **The household profile is the platform; the apps are views over it.**

**Two.** Both apps are episodic and outbound-facing. Both produce an artefact that leaves the
household and goes to somebody else — a caregiver, a partner. That is a coherent, ownable position
and it is genuinely different from every "inbound" family app that summarises your own week back to
you. The portfolio has an accidental strategy and it is a good one.

**Three.** Neither app has any reason to be opened on a Tuesday. That is a feature of the promise
("not another system to maintain") and a problem for the business model. It is resolved not by
manufacturing engagement — which would betray the promise — but by choosing a commercial model that
does not require daily opens. Section `07`.
