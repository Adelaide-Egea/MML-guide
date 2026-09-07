# 7. Monetisation strategy

Deliverable 15. Market pricing benchmarks are in `03-market-and-positioning.md`; this document is the
recommendation.

> **Revised after competitive research.** An earlier draft of this document recommended £4.99/month
> or £39/year, benchmarked against Cozi. That was wrong, and the correction matters: Cozi is a
> 20-million-user family operating system, whereas **every direct handover competitor prices at
> $19.99–29.99 per year**, and the frequency data (§7.1) is worse than assumed. The prices below are
> materially lower and the free tier is materially tighter. The reasoning for both changes is set out
> where it applies.

---

## 7.1 The central problem, stated plainly

**This is an episodic product, and episodic products are hard to subscribe.**

The research put numbers on how episodic. Across 6,420 UK couples in the Millennium Cohort Study,
**9–10% of parents go out monthly or more often, 29–33% manage it monthly, and 29–34% "hardly ever or
never"**. A 2026 survey of 1,000 UK parents of under-fives found **93% rarely manage an evening
out**. Among UK parents using formal childcare, only **8% use babysitters at all**.

So the median parent needs a care guide perhaps **six to twelve times a year** — and regular carers
(a grandparent every Tuesday, a nanny) don't need re-briefing each time, which narrows the genuinely
repeat use case further to new or occasional sitters, holidays with grandparents, and nanny/au pair
onboarding. Packing runs two to six times a year.

A competitor review names the consequence exactly: *"parents who use a tool occasionally — not daily
— resent paying monthly for a tool they open a few times a year."*

Every instinct in consumer software says: fix that by increasing frequency. Add a calendar. Add
reminders. Add a daily check-in. **That instinct must be refused**, because it converts the product
into the thing the brand exists to avoid — another system to maintain. The brand's own constraint
("not a family operating system", "we do one moment well") is also a commercial constraint, and it
should be honoured rather than quietly abandoned at the pricing stage.

There are only three honest ways to monetise an episodic product:

1. **Charge per use.** Aligns perfectly with value. Produces lumpy revenue, discourages the behaviour
   we want, and puts a price tag on the moment a parent is most stressed. Rejected as the primary
   model — but see the one-off purchase below, which the evidence now supports more strongly than it
   did.
2. **Charge for readiness, not usage.** The household pays a modest amount to be *ready* — profile
   maintained, guides instant, everything current — and uses it whenever needed. This is how breakdown
   cover, password managers and cloud backup are sold, and all three are episodic.
3. **Charge once, for a lifetime household.** Clean and honest; leaves recurring AI costs uncovered,
   but those costs are pence (§7.5).

**Recommendation: option 2 as the headline, with option 3 offered alongside it and option 1 as a
tested escape hatch.** Offering lifetime is not a hedge — for a product with this frequency profile
it is arguably the most rational purchase a customer can make, and the direct competitor closest to
us (Pebbi, £34.99 lifetime) and the best-documented document-generator (Rezi, which added a lifetime
plan against 16% monthly churn) have both concluded the same.

---

## 7.2 The recommended model

**Freemium at the household level, with one subscription across the whole ecosystem.**

That is option C from the brief's list. The alternatives are rejected as follows:

- **A — pay per app.** Rejected. Two subscriptions for two occasional products is two decisions, two
  cancellations and two churn events. It also destroys the ecosystem argument: the reason to build one
  household is that the second surface should feel free once you have the first. Packing in particular
  cannot carry a price — PackPoint is **$2.99 once, with ~40,600 ratings** (§3.2), which caps that
  category permanently. Packing is an acquisition and retention asset, not a revenue line.
- **B — pay for MML, no free tier.** Tempting on the data: RevenueCat's 2026 report across 75,000+
  apps finds **hard paywalls convert at 10.7% by day 35 against freemium's 2.1%** — five times better.
  Rejected anyway, because the best acquisition channel this product has is *a caregiver receiving a
  guide and becoming a parent who wants one*, and the best conversion argument is a parent who has
  already made one. A hard paywall severs both. The compromise is a free tier that is **complete but
  finite** (below), rather than generous and open-ended.
- **D — family plan as the only tier.** Rejected as a *tier*, accepted as the *default*: the household
  already is the unit, so every plan is inherently a family plan and it must not be priced as an
  upsell.

### The tiers

| | **Free** | **Household** |
|---|---|---|
| Household, children, people | unlimited | unlimited |
| Both parents | **yes** | yes |
| Care guides | **2 in total** (not per month) | unlimited |
| Editing and re-sending those guides | **unlimited, forever** | unlimited |
| Packing lists | **2 per year** | unlimited |
| Share links | **yes, unlimited** | yes |
| Translation | — | **all languages** |
| PDF and print export | **yes** | yes |
| Saved profiles | **yes** | yes |
| Caregiver acknowledgement and reply | — | yes |
| Guide history | the 2 you have | unlimited |
| Home suggestions | — | yes |
| Trip reuse | — | yes |

**The change from the earlier draft is the free allowance, and it is the most important number in
this document.** The previous version offered three guides *per month*. Against a usage profile of
six to twelve guides *per year*, that is not a free tier — it is a free product, and nobody would
ever have reached the paywall. Free allowances for episodic products must be expressed as an
**absolute lifetime count**, not a rate.

Two guides is the right count because it lets a household experience the thing that actually converts:
the second guide, which takes twenty seconds because the profile already exists. That is the moment
the value becomes obvious. The third is the ask.

**Translation moves behind the paywall**, having been "one language free" before. It is the single
feature no competitor and no £3 Etsy PDF can replicate (§3.7), which makes it the strongest thing to
charge for and a poor thing to give away.

### Price

| | |
|---|---|
| **Annual — the default** | **£24 / year** (€27) |
| **Lifetime household** | **£49** (€55) one-off |
| Monthly — de-emphasised | £3.49 / month (€3.99) |

Reasoning, and where it differs from the earlier draft:

- **£24/year places us inside the direct competitive band, not above it.** Handoff is $19.99/yr,
  Handover $24.99/yr, Gosling $29.99/yr, Pebbi £19.99/yr. The previous £39 figure was set at Cozi
  parity — but Cozi is a full family operating system with 20 million registered users, and we are a
  single-purpose tool. Pricing above every direct rival while doing less than the incumbent was
  indefensible.
- **£24/year is roughly the cost of half an evening's babysitting.** That comparison still works, and
  it works better at £24 than at £39.
- **Lifetime at £49 is priced at roughly two years.** For a household with a genuine 6–12 occasions a
  year, lifetime is rational, and it converts a customer who would have churned in month eight into
  revenue now. It also suits a small business with no runway. Cap the risk by scoping lifetime to *the
  household* and to a fair-use AI allowance (§7.5) — the marginal cost of a lifetime customer is pence
  a year.
- **Monthly exists but is not promoted.** Any month in which nobody looks after your children is a
  month in which a monthly subscription looks pointless. Monthly billing on an episodic product is a
  churn machine, and RevenueCat's finding that **AI-powered apps churn 30% faster** despite earning
  41% more per payer reinforces it. Show annual and lifetime; put monthly behind a "other options"
  link.
- **One price, no plan matrix**, no per-seat pricing, no add-ons. The household is the unit and
  everyone in it is included.

**A 14-day free trial is not recommended.** A trial is the wrong instrument here — a fortnight may
contain zero occasions, and the trial then expires having demonstrated nothing. The free tier is the
trial, and it has no clock on it.

### The one-off purchase — now recommended, not merely tested

One case the subscription serves badly: the parent who needs a guide **tonight**, has never used the
product, and won't need another for four months. Making that person subscribe is a bad trade for both
sides — and it is a large share of this market, given §7.1.

Offer a **one-off guide at £3.99**, shown only after the free allowance is spent, with the amount
credited against annual or lifetime if they upgrade within 30 days. This sits at the Etsy anchor
(£3–13) where the customer's mental model already lives, captures the genuinely occasional user, and
matches how document generators actually monetise. The earlier draft flagged this as an experiment;
the frequency data promotes it to part of the recommended model.

---

## 7.3 The upgrade moment

**Placement matters more than price.** The prompt appears at exactly one kind of moment: **immediately
after the product has just worked.**

Good moments:
- The second guide is finished, sent, and confirmed opened by the caregiver. *"That took twenty
  seconds because your household is set up. Unlimited guides are £24 a year."*
- A parent reaches for a second language.
- A caregiver has opened the guide and the parent wants to see their reply.
- A trip is created for the second time and reuse would have saved them ten minutes.

Forbidden moments — enforce these in code, not by convention:
- Before the first guide is complete.
- While a guide is being generated.
- On the Home screen.
- In any notification.
- Anywhere in onboarding.
- To a parent with an unmet urgent need tonight.

**And one framing rule, which §3.6 makes an evidence-based requirement rather than a matter of taste.**
Behavioural analysis of parent-directed marketing identifies **moral licensing** as the mechanism by
which "you deserve this, you've sacrificed all year" *increases* guilt rather than relieving it; 91%
of mothers report parenting guilt and 84% want reassurance they are doing well. The pricing page must
therefore never suggest the parent has failed to organise something, never quantify what they are
carrying, and never sell relief as an indulgence. Sell it as a tool that works. Structural absolution,
never personal indictment.

### Never paywalled

Treat this list as immutable. The product handles children's safety information, and gating safety
behind a card is indefensible regardless of what it does to conversion.

- **Anything already created.** Downgrade never locks an existing guide, list or profile — and never
  blocks editing or re-sending it. A parent whose card expired must still be able to update the
  allergy line and send it tonight.
- **Allergy, medication and emergency-contact information.** Never, in any form, in any tier.
- **The "important — read first" content.**
- **Sharing and viewing a guide.** The caregiver never encounters a paywall. They are not the customer
  and must never be treated as one — and they are also the distribution channel.
- **Export of your own data.**
- **Account deletion.**
- **The second parent.** Charging to let both parents participate would be perverse in a product about
  redistributing work between them — and §4.1's evidence on fathers' disengagement says the second
  parent needs every possible invitation, not a toll gate.

### Failed payment

Degrade to the free tier, retaining full access to everything already created. Never lock a parent out
of a guide they need tonight because a card expired. Retain data for the full retention window, notify
by email, make reactivation one tap.

---

## 7.4 Conversion and retention

**Conversion.** The sequence is: free guide → it works → account created to keep it → household
populated → **second guide is trivially fast** → allowance reached → upgrade. Every step delivers
value before the next is asked for. The metric to optimise is **time to second guide**, because a
household that has made two has internalised the value and a household that has made one has not.

**Retention.** For an episodic product, retention is *readiness*, not engagement:

- **The household stays accurate with no effort.** The strongest mechanic available. If the profile is
  current, the next guide takes twenty seconds, and cancelling means going back to writing it by hand.
- **Annual and lifetime billing.** Spans enough occasions to prove value.
- **The caregiver loop.** A guide opened by a grandparent reminds everyone the product exists and
  works.
- **Occasion-triggered usefulness.** Not engagement notifications. *"You're away Friday and the guide
  is from March"* is welcome; anything else is not.
- **Honest cancellation.** One-tap cancel with data kept produces more returning customers than a
  retention flow that traps people. In a trust product, a hostile cancellation is a brand injury —
  and note the category's cautionary tales: Cozi's 2024 free-tier restriction created an identifiable
  cohort of alienated long-time users, and S'moresUp sits at **3.3★ on Google Play** after doubling
  its price.

**What to measure:** free-to-paid conversion (build the model assuming **2–3%**, per RevenueCat's
freemium benchmark, not a hoped-for double digit); annual/lifetime versus monthly mix; occasions
served per household per year; time to second guide; share-view rate; and whether households that
exhaust the free allowance convert materially better than those that don't. If they do, the allowance
is set correctly. If they don't, it is still too generous or the product is not yet worth paying for.

---

## 7.5 Unit economics, and the acquisition constraint

The only significant variable cost is AI. Everything else is close to fixed at this scale.

Per guide, at current pricing for a small structured extraction plus a prose and translation pass:
**single-digit pence**. A free household is a cost of pennies in total. A £24/year subscriber would
need implausible volume to become unprofitable, and even a £49 lifetime customer costs perhaps a pound
a decade at realistic usage.

That is comfortable — but it depends on controls that do not exist today:

- **Per-account budgets enforced in the AI gateway** (`08`), degrading to deterministic output rather
  than failing or overspending.
- **Deterministic-first generation**, so a large share of every document costs nothing.
- **Caching** where inputs are unchanged — regenerating an unchanged guide should cost nothing.
- **Small models for extraction, larger ones only for the final prose pass.**
- **A hard Anthropic account spend cap** as a backstop that doesn't depend on our code being right.

Without those, the free tier is an open-ended liability — precisely the position the two open proxies
create today (`SECURITY-IMMEDIATE.md`).

**The constraint that shapes everything else: paid acquisition is not available.** RevenueCat puts
median first-year realised value per payer in **Western Europe at $25**, against $32 in North America.
At a 2–3% conversion rate, the realised value of a *registered household* is well under a pound. No
paid channel clears that. Combined with §3.6's finding that organic search in this category is
saturated with AI-generated comparison content in English — but materially less so in French — the
viable channels are narrow and specific: **French-language organic content, the caregiver-receives-a-
guide loop, the neurodivergent-parent community, and partnerships with the platforms that already own
the moment of need** (au pair agencies, nanny payroll services, NCT-type networks).

This is not a footnote to the pricing model. It is the reason the pricing model must be cheap to
serve and must include a lifetime option: **there is no growth budget, so revenue has to come from a
small number of households paying willingly, for a long time.**

**Do not build payments before Phase 8.** Pricing a product that is not yet worth paying for produces
a low conversion number that is then mistaken for evidence about price rather than about product.
