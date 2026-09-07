# 10. Ideal user journey

Brief section 11. The purpose here is to name every point of friction and remove the ones that are
not earning their place.

The governing constraint: **the person using this product is, at the moment of use, about to leave
the house.** Every second of setup is being taken from someone who does not have it.

---

## The journey, end to end

### Discovery

*Where they come from:* a friend forwarding a guide (the strongest channel available — see below);
search for "babysitter information sheet" or "fiche nounou"; a parenting community; App Store search.

**Friction today:** there is none of this. No landing page, no marketing site, no SEO surface, no
share loop. Both apps are URLs you have to already know.

**Fix.** The single highest-leverage acquisition mechanic in this product is already latent in it:
**every guide is sent to another adult.** A caregiver opening a shared guide is a person who has just
experienced the product's value from the receiving end, for free, with no signup. A quiet, tasteful
"made with [product]" on the share view — not a growth-hack banner, a credit line — turns every
handover into a distribution event. This is the mechanic to build deliberately in Phase 4.

### Landing page

**Friction today:** does not exist.

**Fix.** One promise, one proof, one action. The promise is the manifest's own line. The proof is a
real guide, visible immediately, with no signup — Held already has a sample generator; it should be
the hero of the page rather than a link under the fold. The action is "make one".

**Remove:** feature grids, pricing above the fold, testimonials before proof, any explanation of
mental load. The visitor already knows what mental load is; explaining it back to them is the exact
thing the voice rule forbids.

### Signup

**Friction today:** none, because there are no accounts — which is also why nothing persists, nothing
is shared between parents, and nothing works on a second device.

**Fix.** Magic link, or Apple, or Google. No password. **And crucially: do not ask for it yet.**

The strongest available sequence is **value before account**. Let a first-time visitor build a real
guide without signing in. Ask for an account at the moment they want to *keep* or *send* it — a point
at which they have something they do not want to lose, and the ask is obviously in their interest
rather than ours. This inverts the standard funnel and it is the right shape for a product whose
first session is under time pressure.

**Remove:** email verification before use, onboarding questionnaires, a "choose your plan" step
anywhere near signup.

### Onboarding

**Friction today:** Held's onboarding *is* the product — fourteen screens before any output. There
is no separation between "set up" and "use", which means the first-time cost and the every-time cost
are identical, and the second use is as expensive as the first.

**Fix.** Split them. Onboarding creates the smallest viable household: one child, a name, an age.
That is it. Everything else — allergies, milk, comfort items, routine — is asked **in context, at the
moment it is needed, once, and then remembered forever.** The first guide asks a handful of
questions. The second asks almost none.

This is the structural change that makes the product feel light rather than thorough, and it is
worth more than any individual feature in the backlog.

**Remove from onboarding:** the emoji picker, the colour picker, format and duration choices, the
caregiver name requirement, anything optional.

### Household setup

**Friction today:** children are entered in Held and entered again in Readied, in a different shape,
with no relationship between the two records.

**Fix.** One household, one set of people, shared by both parents. The second parent is invited by a
link and inherits everything — which is the first moment the product does something a solo app
cannot, and is worth prompting for at the right time (after the first guide is sent, not before).

**Remove:** re-entry of anything, anywhere, ever. If a fact has been given once it is never asked for
again; it is only ever confirmed, and only when it has plausibly gone stale.

### First value moment

**This is the moment the whole product turns on, and it should arrive within about two minutes of
arrival.**

The first value moment is **seeing a finished guide with your own child's name on it** — not
completing onboarding, not creating an account, not a welcome screen. It should be reachable from a
cold start with one child's name, one age, one "important" line and one caregiver.

**Friction today:** roughly fourteen screens, and no output at all until an AI call succeeds.

**Fix.** The deterministic document is assembled first and can be shown immediately; AI prose fills
in behind it. A generation failure degrades to a complete, usable guide rather than an error. The
user should never watch a spinner wondering whether they will get anything.

### MML Home

**Friction today:** does not exist.

**Fix.** As specified in `06`. It is finishable, it is honest when there is nothing to say, and it
gets out of the way of someone who arrived with a task.

**Remove:** any metric, streak, score or completion percentage.

### First surface

**Friction today:** none — direct entry is all there is. Preserve that. A returning user with a task
should be able to go straight to it from a link, a notification, or a home-screen icon, without
passing through Home.

### Ongoing use

**The honest position: this product is used occasionally, and that is correct.** A parent needs a
guide when someone else has the children, and a packing list when they travel. Manufacturing a reason
to open it on a Tuesday would betray the entire promise.

So the design goal is not frequency. It is **being effortless on the second and tenth use.** The
first guide takes two minutes; the tenth should take twenty seconds, because the household already
knows everything. Retention here looks like "still installed and still trusted", not "opened daily".

**Remove:** streaks, daily prompts, engagement notifications, anything that punishes absence.

### Cross-surface value

**Friction today:** none exists — the apps are unaware of each other.

**Fix.** The natural bridge is a trip that leaves children behind: you are away, someone else has the
children, and the two surfaces meet. That is a genuine moment, not a manufactured one. It arrives in
Phase 7 and it is the payoff for the unified household.

### AI assistance

**Fix.** AI is visible where it interpreted something and invisible where it merely formatted. The
parent always sees what was understood and can always correct it — Readied's "here is each point from
your notes and what I did with it" is the pattern. No chat interface. No assistant persona.

**Remove:** any AI feature that requires the parent to learn how to prompt it.

### Premium conversion

**The upgrade moment is when the product has just worked, not when the user arrives.** After the
second or third guide, when the value is proven and the household is populated — not on a pricing
page, not behind onboarding, and never in front of a parent who needs a guide tonight.

**Friction today:** a beta code field that implies a payment system that does not exist.

Detail is in `07`.

### Retention

Retention in an episodic product is measured in *occasions served*, not sessions. The mechanisms that
work here: the household stays accurate without effort (so the next use is trivial), the caregiver
credit line brings new people in, and the product is remembered because it was genuinely useful the
last time. The mechanisms that do not work here, and must be refused: notification-driven
re-engagement, streaks, and content.

---

## Friction inventory

Every point where the current products cost the user something they should not.

| # | Friction | Where | Fix | Phase |
|---|---|---|---|---|
| 1 | No landing page or discovery surface | both | marketing site | 12 |
| 2 | ~14 screens before any output | Held | profile-first; generation is an action | 5 |
| 3 | Full profile demanded at the moment of leaving | Held | progressive enrichment in context | 5 |
| 4 | Children entered twice, in two shapes | both | one household | 2 |
| 5 | Nothing persists across devices | both | accounts | 2 |
| 6 | Second parent cannot participate at all | Held | household membership | 2 |
| 7 | Caregiver receives a dead image | Held | live share view | 4 |
| 8 | Caregiver cannot acknowledge or reply | Held | acknowledgement + one reply channel | 5 |
| 9 | Format/duration chosen before seeing either | Held | choose after, or not at all | 5 |
| 10 | Emoji and colour picker mid-handover | Held | move to household setup, optional | 2 |
| 11 | Caregiver name required to continue | Held | optional | 5 |
| 12 | Manual guide edits silently lost on reload | Held | persist properly | 5 |
| 13 | "Separate guide each" does nothing | Held | implement or remove | 5 |
| 14 | Allergies never reach the model | Held | fix + permanent test | 5 |
| 15 | No output at all if the AI call fails | Held | deterministic-first | 5 |
| 16 | Legs step is heavy for a simple trip | Readied | progressive disclosure | 6 |
| 17 | Developer AI status text shown to users | Readied | remove | 6 |
| 18 | Restaurant recommendations dilute the product | Readied | remove | 6 |
| 19 | 4-second polling instead of realtime | Readied | Supabase Realtime | 6 |
| 20 | Beta code implies a paywall that does not exist | Held | remove until real | −1 |
| 21 | Pinch-zoom disabled | both | remove `user-scalable=no` | −1 |
| 22 | No keyboard or screen-reader operability | both | real components | 1 |
| 23 | ~1 MB of PDF libraries render-blocking | Held | lazy-load | 1 |
| 24 | No desktop experience at all | both | responsive | 1 |
| 25 | No way to export or delete your data | both | in-product | 2 |

---

## Measuring it

Four numbers, tracked from Phase 9. Everything else is secondary.

- **Time to first guide** from cold start. Target: under two minutes. This is the number that
  determines whether the product is what it claims to be.
- **Time to second guide** for a returning household. Target: under thirty seconds. This is the
  number that determines whether the household model was worth building.
- **Share-view rate** — proportion of guides actually opened by the caregiver. This measures whether
  the product's output is real or merely produced.
- **Occasions served per household per year.** The honest retention metric for an episodic product,
  and the number that determines whether the pricing model in `07` is right.
