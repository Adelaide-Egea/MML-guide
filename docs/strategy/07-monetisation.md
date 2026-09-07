# 7. Monetisation strategy

Deliverable 15. Market pricing benchmarks are in `03-market-and-positioning.md`; this document is the
recommendation.

---

## 7.1 The central problem, stated plainly

**This is an episodic product, and episodic products are hard to subscribe.**

A parent needs a care guide when someone else has their children — perhaps six to twenty times a
year for a family that uses babysitters and grandparents regularly, and perhaps twice a year for one
that does not. They need a packing list two to six times a year. Neither creates a weekly habit.

Every instinct in consumer software says: fix that by increasing frequency. Add a calendar. Add
reminders. Add a daily check-in. **That instinct must be refused**, because it converts the product
into precisely the thing the brand exists to avoid — another system to maintain. The brand's own
constraint ("not a family operating system", "we do one moment well") is also a commercial
constraint, and it should be honoured rather than quietly abandoned at the pricing stage.

So the model must earn recurring revenue from a product that is used occasionally. That is the
problem to solve, and there are only three honest solutions:

1. **Charge per use.** Aligns perfectly with value. Produces lumpy revenue, discourages the very
   behaviour we want (using it every time rather than winging it), and puts a price tag on the
   moment a parent is most stressed. Rejected — but see the hybrid below.
2. **Charge a subscription that is priced as insurance, not as usage.** The parent pays a modest
   amount for the household to be *ready* — profile maintained, guides instant, everything in one
   place — and uses it whenever they need it. This is how breakdown cover, password managers and
   cloud backup are sold, and all three are episodic.
3. **Charge once for a lifetime household.** Clean, honest, and leaves recurring AI costs uncovered.

**Recommendation: option 2, with a genuinely useful free tier and an annual-first price.**

---

## 7.2 The recommended model

**Freemium at the household level, with one subscription across the whole ecosystem.**

That is option C from the brief's list, and the alternatives are rejected as follows:

- **A — pay per app.** Rejected. Two subscriptions for two occasional products is two decisions, two
  cancellations and two churn events. It also destroys the ecosystem argument: the reason to build
  one household is that the second surface should feel free once you have the first.
- **B — pay for MML with no free tier.** Rejected. The product's best acquisition channel is a
  caregiver receiving a guide, and its best conversion argument is a parent who has already made one.
  Both require a free path to real output.
- **D — family plan as the only tier.** Rejected as a *tier*, accepted as the *default*: the
  household already is the unit, so every plan is inherently a family plan and it should not be
  priced as an upsell.

### The tiers

| | **Free** | **Household** |
|---|---|---|
| Household and people | unlimited | unlimited |
| Both parents | **yes** | yes |
| Care guides | **3 per month** | unlimited |
| Packing lists | **2 per year** | unlimited |
| Share links | **yes, unlimited** | yes |
| Translation | **1 language** | all languages |
| PDF and image export | **yes** | yes |
| Saved profiles | **yes** | yes |
| Caregiver acknowledgement and reply | — | yes |
| Guide history | last 3 | unlimited |
| Home suggestions | — | yes |
| Trip reuse | — | yes |

The free tier is deliberately generous on the things that build trust and drive distribution
(sharing, export, both parents, a real guide) and limited on the things that indicate a household
genuinely running on the product (volume, all languages, history, intelligence).

### Price

**£4.99 / month, or £39 / year.** In euros, **€4.99 / month or €39 / year** — round local numbers
rather than a converted price.

Reasoning:

- Annual is a 35% discount, which is aggressive enough to make annual the obvious choice. **Annual
  should be the default selection**, because an episodic product has a churn problem on monthly
  billing by construction: any month in which nobody looks after your children is a month in which
  the subscription looks pointless. An annual term spans enough occasions to prove value.
- Under £5/month sits below the deliberation threshold for most households in this bracket and is
  comfortably beneath the family-app subscriptions parents already carry.
- £39/year is roughly the cost of one evening's babysitting. That is the comparison to make, and it
  is a very favourable one.
- A single price. No plan matrix, no per-seat pricing, no add-ons. The household is the unit and
  everyone in it is included.

**A 14-day free trial is not recommended.** A trial is the wrong instrument for an episodic product —
a fortnight may contain zero occasions, and the trial then expires having demonstrated nothing. The
free tier is the trial, and it has no clock on it.

### The hybrid worth testing

There is one case the subscription serves badly: the parent who needs a guide **tonight**, has never
used the product, and will not need another for four months. Making that person subscribe is a bad
trade for both sides.

Worth testing in Phase 8: a **one-off "one guide" purchase at £2.99**, offered only after the free
allowance is exhausted, with the amount credited against a subscription if they upgrade within
30 days. This captures the genuinely occasional user without cannibalising the subscription, and it
matches how document-generator products (which is structurally what the Handover surface is) actually
monetise.

Test it; do not assume it. If it materially suppresses subscription conversion, remove it.

---

## 7.3 The upgrade moment

**Placement is more important than price.** The upgrade prompt appears at exactly one kind of moment:
**immediately after the product has just worked.**

Good moments:
- The third guide in a month is finished, sent, and confirmed opened by the caregiver. *"That's three
  this month. Household is unlimited."*
- A parent selects a second translation language.
- A caregiver has opened the guide and the parent wants to see the reply.
- A trip is created for the second time and the reuse option would have saved them ten minutes.

Forbidden moments — and this list should be enforced in code, not by convention:
- Before the first guide is complete.
- While a guide is being generated.
- On the Home screen.
- In any notification.
- Anywhere in onboarding.
- To a parent who needs a guide tonight and has an unmet urgent need.

### Never paywalled

Treat this list as immutable. It exists because this product handles children's safety information,
and gating safety behind a card is indefensible regardless of what it would do to conversion.

- **Anything already created.** Downgrade never locks an existing guide, list or profile.
- **Allergy, medication and emergency-contact information.** Never, in any form, in any tier.
- **The "important — read first" content.**
- **Sharing and viewing a guide.** The caregiver never encounters a paywall — they are not the
  customer and must never be treated as one.
- **Export of your own data.**
- **Account deletion.**
- **The second parent.** Charging to let both parents participate would be perverse in a product
  about redistributing work between them.

### Failed payment

Degrade to the free tier. Never lock a parent out of a guide they need tonight because a card
expired. Retain data for the full retention window, notify by email, and make reactivation one tap.

---

## 7.4 Conversion and retention

**Conversion strategy.** The sequence is: free guide → it works → account created to keep it →
household populated → second guide is trivially fast → the household is now genuinely useful → the
allowance is reached → upgrade. Every step must deliver value before the next is asked for. The
metric to optimise is *time to second guide*, because a household that has made two guides has
internalised the value and a household that has made one has not.

**Retention strategy.** For an episodic product, retention is *readiness*, not engagement:

- **The household stays accurate with no effort.** The strongest retention mechanic available. If the
  profile is current, the next guide takes twenty seconds and cancelling means going back to writing
  it by hand.
- **Annual billing.** Spans enough occasions to prove value.
- **The caregiver loop.** A guide opened by a grandparent is a reminder the product exists and works.
- **Occasion-triggered usefulness.** Not engagement notifications — a genuine "you're away Friday and
  the guide is from March" is welcome; anything else is not.
- **Honest cancellation.** A one-tap cancel with data kept produces more returning customers than a
  retention flow that traps people. In a trust-based product, a hostile cancellation experience is a
  brand injury.

**What to measure:** free-to-paid conversion (a realistic target for this category is low
single-digit percentages of registered households, and the model should be built assuming that);
annual vs monthly mix; occasions served per household per year; time to second guide; share-view
rate; and — the one that matters most for pricing — whether households that reach three guides in a
month convert at a materially higher rate than those that do not. If they do, the free allowance is
set correctly. If they do not, it is too generous or the product is not yet good enough to pay for.

---

## 7.5 Unit economics

The only significant variable cost is AI. Everything else is close to fixed at this scale.

Rough shape per guide, at current model pricing for a small structured extraction plus a prose and
translation pass: single-digit pence. A free household making three guides a month is a cost of a
few pence a month. A £39/year subscriber would need to generate an implausible volume to become
unprofitable.

That is a comfortable position, but it depends entirely on controls that do not currently exist:

- **Per-account budgets enforced in the AI gateway** (`08`), degrading to deterministic output rather
  than failing or overspending.
- **Deterministic-first generation**, so a large share of every document costs nothing.
- **Caching** where inputs have not changed — regenerating an unchanged guide should not cost
  anything.
- **Small models for extraction, larger ones only for the final prose pass.**
- **A hard Anthropic account spend cap** as a backstop that does not depend on our code being right.

Without those, the free tier is an open-ended liability — which is precisely the position the two
open proxies create today (`SECURITY-IMMEDIATE.md`).

**Do not build payments before Phase 8.** Pricing a product that is not yet worth paying for produces
a low conversion number that is then mistaken for evidence about price rather than about product.
