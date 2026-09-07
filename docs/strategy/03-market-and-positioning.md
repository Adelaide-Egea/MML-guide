# 3. Competitive analysis and product positioning

Deliverables 7 and 8. Research conducted September 2026. Prices are as verified at that date;
anything I could not verify is marked.

---

## 3.1 The finding that should reframe everything: this category has a graveyard, not a leaderboard

Before any positioning discussion, the survival record:

| Product | Backing | Outcome |
|---|---|---|
| **Milo** — "The Family AI" | YC W20, OpenAI-backed, ~$1.3–2.5M | **Shut down January 2026** |
| **Yohana** | Panasonic | **Dead.** US ended Sept 2025, Japan Jan 2026 |
| **Maple** | VC-backed | **Acquired by Wander, sunsetting 31 Dec 2026** |
| **Picniic** | $2M from Telenor | **Ceased operations** |
| **Wonderschool** | $49.4M — a16z, Goldman, First Round | **Pivoted out of consumer** to US government contracts |

The survivor is **Cozi**: 20M+ registered users, $39/year, roughly 19 staff, owned by
OurFamilyWizard. That is the shape of a successful business in this category — a low-ARPU utility,
not a venture outcome.

**Milo's post-mortem is the single most important document for this strategy.** Its founder, after
six years and backing from YC and OpenAI:

> *"The technology is simply too early to be reliable in any useful way. We've prompted and few-shot
> and fine-tuned and trained our way through every possible path with promising demos but
> disappointing production and scale. So we've tread water for 18 months."*

Read carefully, she did not say families don't want help. She said **AI cannot reliably infer family
logistics.** That distinction is the most valuable thing available to you, because it maps exactly
onto the architectural choice already made in both of your prototypes: the parent supplies the facts,
and the software formats, translates and delivers them. Nothing infers anything.

That is the tractable version of this problem in 2026. It is also, as section 3.4 sets out honestly,
the *small* version.

---

## 3.2 The competitive set, by ring

### Ring 1 — direct: caregiver handover apps

The niche is not empty. It was colonised in the last twelve months — and none of the entrants has
any traction whatsoever.

| Product | What it does | Price | Traction signal |
|---|---|---|---|
| **Gosling** | Closest match. Child and pet profiles, **expiring PIN-protected browser link, no sitter download** | $4.99/mo, **$29.99/yr** | Domain registered **14 Feb 2026**. Owner unclaimed. No reviews |
| **Handoff** | Per-child briefs, QR/expiring invite code, routine alerts | $2.99/mo, **$19.99/yr** | **1 App Store rating** |
| **Handover App** | Structured handover in <60s, secure SMS link, no account needed | $2.99/mo, **$24.99/yr** | *"Hasn't received enough ratings to display"* |
| **CareCard** | **AI interview** — chat about your child, it fills 50+ fields. Caregivers "Ask AI Anything" | not published | Very new. The intake model is a direct threat to a questionnaire flow |
| **NestNote** | Session-based; tailors to session length and sitter experience; PDF for the fridge | free tier + Pro | Requires the sitter to install the app — they concede this is a weakness |
| **Pebbi** 🇬🇧 | Shared *baby* care around the handover moment, offline-first | **£2.49/mo, £19.99/yr, £34.99 lifetime** | UK. Substantial SEO operation |
| **Covely** | Voice-logged shared care log, "handoff briefing" | limited free + paid | Infant-weighted |
| **Walliee** 🇬🇧 | Child and pet care, built by a UK GP | not published | UK, 2024 |

Two things follow. First, **the outbound-briefing idea is validated** — eight teams independently
arrived at it in a year. Second, **it is validated as an idea, not as a business**: not one has
escaped single-digit ratings. Low barriers, no moat, no winner.

A useful sub-distinction: Pebbi, Covely, Walliee and Handover are **infant shared-logging** products
(feeds, naps, nappies, bidirectional). Gosling, Handoff, CareCard and NestNote are true **outbound
briefing** products. All four of the latter are US-centric, English-only, solo projects.

### Ring 2 — the real incumbent: a £3 Etsy PDF

This should not be softened. Etsy carries **5,000+ "nanny binder" listings** at **$3.00–$12.99**,
with individual sellers showing 1,100–2,900 sales. There are free versions from Rocket Lawyer and
countless blogs. **AuPairWorld bundles a customisable "Family Handbook" PDF free with its €49.90–
149.90 membership** — covering welcome, safety, behaviour, food and allergies, routines, house
rules — handed to the family at the exact moment of peak intent. Cultural Care does the same.

**Consequences.** Your price ceiling for "a document" is anchored in low single digits by a market
with real volume. The au pair segment is effectively closed to a paid standalone product, because the
platform that owns the customer gives the artefact away. And anything you charge above the Etsy
anchor must be justified by something a PDF structurally cannot do: **live updating, per-carer
scoping, expiring links, multi-child generation, and above all translation.** A Canva template cannot
translate itself into Portuguese for a Brazilian au pair.

### Ring 3 — the mental-load "family OS" apps

Not competing on handover, but competing for the same parent, the same wallet and the same words.

| Product | Positioning | Price |
|---|---|---|
| **Cozi** | The incumbent. Deliberately basic | Free (30-day calendar cap since 2024); Gold **$39/yr**; Max **$79/yr** |
| **MOLO** 🇬🇧 | **"AI-powered FamilyOS… makes the invisible load visible, manageable, and shared. No default parent."** Trademarked *The Modern Load™* | not published |
| **Jam** | Explicitly mental-load-positioned calendar | **$15.99/mo, $119.99/yr** |
| **Ohai.ai** | AI household manager via text/voice | from **$9.99/mo** |
| **Skylight** | Hardware-first wall display | **$299–629** + **$79/yr**; Assistant **$119.99/yr** |
| **Hearth** | Premium 27" display | **$699** + **$9/mo membership required to set up** |
| **FamilyWall** | All-in-one | **$4.99/mo, $44.99/yr** |
| **Fambot** | "AI chief of staff" — reads email, calendars, WhatsApp → SMS summary | Free in beta. **$3.5M pre-seed**, launched 1 Sept 2026 |

**MOLO needs flagging specifically.** London-based, psychologist-founded, VC-backed, launched before
you, and its core message is almost word-for-word the MML thesis. It is a calendar and email-
extraction product — it does not do handover — but it owns the narrative and the search terms in your
home market. This has direct consequences for the masterbrand question in `04` and `11`.

### Ring 4 — the structural observation about professional software

Every institutional product in this space captures rich child profiles and points them **the wrong
way**:

| | Direction |
|---|---|
| Famly (£79–209/mo), Kinderly (£12.50/mo), Brightwheel, Tapestry, Parenta | setting → parent |
| Kidizz/Familizz 🇫🇷, Stay Informed 🇩🇪 (11,000 settings, 850,000 parents), CARE 🇩🇪 | setting → parent |
| Poppin's 🇫🇷 (€3.99–14.99/mo), TisLien, Mon Ass'Mat | childminder → parent |
| The French *cahier de transmission* | childminder → parent |
| The German *Notfallkarte Kita* | parent → setting, **but paper and single-institution** |

Allergies, emergency contacts, collection authorisations, medical consents — all captured, all owned
by institutions, none of it available to a parent handing their child to a grandparent on a Friday
night. **The B2B side is well funded and consolidating; the parent-side outbound market is a handful
of individuals with no ratings.** That asymmetry is the opportunity, and it is also a warning about
how small the parent-side willingness to pay has proved so far.

### Ring 5 — packing, and a savage price anchor

**PackPoint: ~40,600 Google Play ratings, $0.99–3.99 one-time, forever.** Packing Pro: $3.99 one-time.
Packr charges $24.99/yr and has family mode — but is iOS-only with ~6,300 ratings after years.

PackPoint's own documentation says it has no per-person profiles and is *"solely meant for personal
use"*, so the family gap is real. But a one-time $2.99 incumbent with forty thousand ratings caps
what this can ever be. **Treat packing as an acquisition and retention asset for the umbrella brand,
not a revenue line.** This confirms the `02` verdict from a different direction.

### Ring 6 — the long-term threat is not a family app

**Town** raised **$55M Series A** from a16z in June 2026 for a horizontal personal AI, and a16z's own
announcement lists *"juggling school logistics"* as a use case. **jo** (YC Spring 2026) explicitly
learns "kids' schedules" and has "multiplayer shared family assistants" on its roadmap. *"Write me a
babysitter brief for tonight from what you know about my kids"* is a plausible feature of a general
assistant.

The defence is not the generation — a model can write prose. It is **structured data the model does
not have, print-perfect output, expiring per-carer links, and translation.**

---

## 3.3 What kills products in this category

Four failure modes, all well evidenced.

**1. Single-user adoption — the category killer.** From a Skylight Calendar review:

> *"My husband gave up using the Skylight Calendar quickly… He (understandably) didn't want to create
> events a second time in the Skylight app, **so I end up having to enter his events into the calendar
> myself.**"*

The mental-load product increased her mental load, on a $299 device with a $79/year subscription. A
Cozi review states the constraint plainly: *"Everyone Needs To Participate. This is the biggest
limitation. One person cannot build a truly shared system alone… If only one person uses it, it
becomes another list that one person has to maintain."*

**This is the strongest possible argument for the outbound architecture.** A care guide does not
require the second person to adopt anything. The caregiver opens a link. There is nothing to log into
and nothing to maintain. Your product is structurally immune to the failure mode that has killed
most of this category — and that is worth saying out loud in positioning.

**2. "Another system to maintain."** A French competitor's own analysis of the category:
*"C'est le point faible historique de la catégorie : un outil qui demande vingt minutes de
configuration par semaine ajoute de la charge au lieu d'en retirer."* Multiple entrants now lead with
*"Pas une app de plus"* — not one more app. When everyone's headline is "we're not another app", the
category has an app-fatigue problem.

**3. Data entry before value.** Huckleberry's onboarding — **32 screens with mandatory account
creation on screen 5** — is widely cited as its biggest conversion leak: *"sleep-deprived parents at
3am with limited patience are disproportionately likely to bounce."* Held's fourteen screens are a
milder version of the same mistake, and the fix is already in `10-user-journey.md`.

**4. Subscription resentment at low frequency.** Cozi's 2024 free-tier restriction created an
identifiable cohort of long-time users now shopping elsewhere. S'moresUp doubled its price to
$9.99/mo and sits at **3.3★ on Google Play** against 4.2★ on iOS. An entire hardware sub-market
(Beinhome, Akimart) now markets on **"No Subscription"** as its headline. And the line that should
govern our pricing: *"parents who use a tool occasionally — not daily — resent paying monthly for a
tool they open a few times a year."*

**5. AI does not retain.** RevenueCat's *State of Subscription Apps 2026*, across 75,000+ apps:
**AI-powered apps generate 41% more revenue per payer but churn 30% faster.**

---

## 3.4 The frequency problem, stated honestly

This is the most uncomfortable finding and it should not be buried.

| Source | Finding |
|---|---|
| Marriage Foundation / Millennium Cohort Study (6,420 UK couples) | **9–10% weekly. 29–33% monthly. 29–34% "hardly ever or never."** |
| Rascals, 1,000 UK parents of under-5s (2026) | 96% say a monthly evening out would improve their happiness. **93% say they rarely manage one.** |
| Groupon international | **25% of UK parents have never had a romantic date** post-children — highest of any country surveyed. France: 18% |
| UK GGS 2022–23 | Among parents using formal childcare, only **8% use babysitters** |

For the median UK parent, "brief a babysitter" happens perhaps **6–12 times a year**. And regular
carers — grandparents, a nanny — do not need re-briefing each time, so the genuinely repeat use case
narrows further to: **new or occasional babysitters, holidays where children stay with grandparents,
and nanny/au pair onboarding.**

Worse, the moment of need is twenty minutes before you leave the house — the worst imaginable moment
to onboard someone into a new app and charge them.

**What this means.** Acquisition cannot rely on intent-based search at the moment of panic; it has to
happen well before the need. And a monthly subscription for the care guide alone is fighting its own
usage pattern. Both conclusions are carried into `07-monetisation.md`, which has been revised in
light of this.

---

## 3.5 France, and why it is the strongest wedge

The *cahier de liaison* / *cahier de transmission* is **not** an incumbent for the care guide, and
understanding why is the whole insight. Both French documents run **inward**: the school informs the
parent; the *assistante maternelle* reports the day back to the parent. Neither is the parent
briefing a carer.

But the behaviour is already normalised. French families accept, as a professional norm, that **care
information is written down and handed over.** In the UK you must first teach parents that writing it
down is a thing people do. In France you do not. The pitch is nearly trivial:

> *Le cahier de transmission, mais dans l'autre sens.*

Supporting arguments:

- ***Charge mentale*** has been mainstream French vocabulary since Emma's 2017 comic *Fallait
  demander* (the term itself dates to sociologist Monique Haicault, 1984). Zero market education cost.
- **A dense, vocabulary-rich childcare landscape** — *nounou*, *crèche*, *assistante maternelle
  agréée*, MAM, *périscolaire*, *centre de loisirs*, *colonie de vacances* — each a distinct handover
  context and a content surface no English-first competitor can address.
- **Not one direct handover competitor has a French version.** Gosling, Handoff, Handover, CareCard,
  NestNote are all English-only. Bilingualism is a moat against the entire direct set.
- **French organic search is materially less contested.** The AI-generated comparison-content plague
  in this category is overwhelmingly anglophone — probably the only viable low-cost acquisition
  channel available anywhere.
- French parents report *never* dating at 18% vs the UK's 25%. Marginal, but it moves frequency the
  right way.

Against: Western Europe converts at **2.0% D35** against North America's 2.6%, and median first-year
value per payer is **$25 vs $32**. French family apps skew free (Famicity, Tribe Family, WeFam) or
cheap (Mental Loadless at €3.99/mo).

**Two French-language competitors to install and study.** **WeFam** (Swiss, covering France and
Belgium, free) already ships a *"briefing du soir"* and a per-child *"fiche santé"* — aimed at
separated parents and grandparents rather than babysitters, but the closest French-language product
to the Handover surface. **Mental Loadless** (mentalloadless.com, FR+EN, €3.99/mo) has taken the
*charge mentale* name space and built Rodsky's Fair Play method into an app.

**Germany** has the same structural gap and arguably a bigger one — the *Notfallkarte Kita* is a
better content specification than anything the English competitors have built, and *Zettelwirtschaft*
("paper-slip economy") is a ready-made hook. But it is a third language and a stricter regulatory
read. Year two, if France and the UK work.

---

## 3.6 Marketing register: guilt backfires, and there is a mechanism

Four registers exist in this category. Two work.

- **Statistical indictment** — *"89% of working mothers say they carry the majority of the mental
  load."* Recognition, but also the feeling of being seen as someone who is failing.
- **Structural absolution** — MOLO: *"The Modern Load is not a personal failing. It is a structural
  problem. We fix the system, not the person."* The strongest register in the category.
- **Corporate metaphor** — "Family OS", "chief of staff", "household operating system." Cold, and it
  implies work.
- **Calm and relief** — Ohai's best testimonial: *"My brain can breathe."*

The evidence against guilt is specific. Behavioural analysis of Mother's Day campaigns identifies
**moral licensing** as the mechanism: *"'you deserve this because you've sacrificed all year long.'
But for Moms already struggling with impossible standards, this actually triggers more guilt, not
less."* The prescription — *"reframe products not as indulgences that trigger Mom Guilt but tools
that help"* — is directly applicable to the pricing page. Supporting data: 91% of US mothers report
"mom guilt"; 84% say they need more reassurance they are doing a good job.

**This validates the brand manifest's voice rule empirically.** "Give permission, never name the
burden" is not just tasteful — it is the register the evidence supports. Adopt structural absolution
plus calm, and never imply the parent has failed to organise something.

One further observation worth acting on: Ohai's testimonial wall is dominated by **ADHD mothers**
(*"ADHD mama over here and planners don't work for me"*), and Hearth runs a dedicated neurodiversity
page. Neurodivergent parents are a self-identifying, community-connected, high-intent segment that
this category has repeatedly found converts well — and a care guide (externalised working memory, no
daily upkeep) is an unusually good fit. Worth a deliberate content and community effort.

---

## 3.7 Positioning recommendation

### The statement

> **For parents handing their children to someone else — a grandparent, a babysitter, a nanny, an
> au pair — who currently write the same long text or six-page note every time, [product] turns what
> you know by heart into a guide they can actually read, in their language, in under two minutes.
> Unlike family calendars and household apps, nobody else has to sign up, install anything, or keep
> it updated. You send it, and you leave.**

### The five pillars

**1. Outbound, not inbound.** Every funded competitor takes your email, calendar and messages and
hands back a summary of your own week. That reduces nothing — it reorganises what is already yours.
This product moves knowledge *out* of one person's head and into someone else's hands, which is the
only mechanism that actually removes load. It is also cheaper to build, far less privacy-invasive,
and it keeps you out of a head-on fight with Town, Fambot and Ohai.

**2. Nothing to adopt, nothing to maintain.** This is the answer to the failure mode that killed the
category. The caregiver opens a link — no download, no account, no login. Competitors have already
converged on this (Gosling, Handoff, Handover all use expiring browser links; NestNote requires an
install and concedes it is a weakness). **Treat "the carer installs nothing" as settled and
non-negotiable.**

**3. Translation.** The single feature no competitor and no Etsy PDF can copy. It is the justification
for pricing above the £3 anchor, and it is the wedge into cross-border families, au pairs, expat
households, and UK/FR homes with a French-speaking nounou or grandparent.

**4. Older children, not babies.** Pebbi, Covely, Walliee, Handover and Baby Connect are all
feed/nap/nappy shaped. Comfort items, *what to do if they get upset*, house rules and screen-time
rules are the 3–10 band — a much larger and far worse-served market. **NSPCC guidance on leaving
children with a sitter names almost exactly this field list** (routine, bedtime, screen-time rules,
the specific toy that comforts them, allergies, where medication is stored). No competitor is using
that authority signal.

**5. Bilingual by construction, France first.** See 3.5.

### Positioning against the four rings

| Against | The line |
|---|---|
| Etsy templates | *"You don't have to write it. And it can speak their language."* |
| The eight indie handover apps | Translation, older children, print-perfect output, bilingual markets, and a brand |
| Family OS apps (MOLO, Cozi, Jam) | *"We don't run your household. We do one moment well."* No adoption required from anyone else |
| Horizontal AI (Town, jo) | Structured data they don't have, an artefact they can't produce, per-carer expiring links |

### What positioning rules out

Ingesting email, calendar or WhatsApp — it is the inbound category by definition. A shared family
calendar. Chore assignment. Anything that requires the second parent to log in. Anything that
requires the household to maintain it to stay useful.

### The honest caveat

The niche is genuinely under-served and genuinely small. Eight competitors appeared in twelve months
and none has traction; the median parent needs this 6–12 times a year; the price ceiling is set by a
£3 PDF and $20–30/yr rivals. **Build it accordingly — cheap to run, priced for episodic use, and as
one asset inside an umbrella brand rather than as a company in its own right.** That is exactly the
architecture `06` already recommends, and the market research independently arrives at the same
conclusion.
