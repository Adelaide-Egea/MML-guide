# 0. Executive summary

Read this one. The other twelve documents are the evidence behind it.

---

## The short version

The repository is two single-file prototypes, not the system the brief describes. There is no
framework, no build step, no tests, no accounts, and no Colour Keeper anywhere. **There are also two
live security problems that need fixing before anything else happens**, one of which exposes
children's names and parents' notes to anyone with a key printed in the page source.

Underneath the prototypes, though, there is a genuinely good product idea, and the research sharpened
rather than softened it. **The mechanism that makes it work is that it points outward.** Every funded
competitor ingests your calendar and email and hands your own week back to you reorganised. This
product takes what one person knows and puts it in another person's hands. That is the only mechanism
that actually removes load rather than redistributing it — and, crucially, it is the only one that
doesn't require a second person to adopt anything, which is the failure mode that has killed most of
this category.

Three recommendations will be uncomfortable, and all three are argued in full below:

1. **The masterbrand should change.** Not because the brief asked — it explicitly didn't — but because
   "My Mental Load" is probably unregistrable, at least three competitors already use the term as
   their brand, MOLO is a near-homophone in your home market, and the name contradicts your own voice
   rule in the most visible place you own.
2. **The French female-diminutive naming system should be abandoned.** The individual names have
   specific, severe problems, but the architecture has a worse one: a feminine-coded parenting brand
   measurably fails to reach fathers, which is a direct hit on the shared-responsibility goal.
3. **The price should be roughly £24/year, not £39.** Every direct rival sits at $20–30, and the real
   usage rate is six to twelve occasions a year, not the weekly habit a subscription assumes.

---

## 1. What actually exists

Two static HTML files, deployed separately.

| | **Held** (this repo) | **Readied** (supplied separately) |
|---|---|---|
| Size | 2,676 lines, one file | ~2,349 lines, one file |
| Framework | none | none |
| Storage | `localStorage` | `localStorage` + Supabase |
| Accounts | none | none |
| Tests | none | none |
| Code quality | prototype | **notably better** — resilience layer, shape guards, error boundaries, undo |

**The genuinely valuable assets** are not the code but three things inside it: Readied's `buildLocal()`
packing logic (dry-spell maths, transit-bag grouping, wardrobe modes — real domain knowledge that
would take a long time to rediscover), Readied's **deterministic-first, AI-enriches-second** pattern,
and Held's question set, which turns out to map closely onto NSPCC guidance on briefing a sitter.

**Two things need fixing immediately** (`SECURITY-IMMEDIATE.md`):

- **The Supabase `trips` table is world-readable.** The `security.html` page you were given claims to
  have fixed this. It did not — the policy it installs grants unconditional `SELECT`, and the built-in
  test only ever checked `DELETE`. The table holds children's names, ages and parents' notes.
- **Both AI endpoints are open proxies.** Held's lets the caller supply the system prompt; Readied's
  has no rate limiting at all and lets the caller choose the model and token count. Anyone can bill
  your Anthropic account.

**One correctness bug worth singling out**, because it undermines the product's core promise. In Held,
a parent types "Peanuts" into the allergy field; the guide displays "Peanuts"; **the model is told
"Allergies: None noted."** The collector writes `allergies`, the prompt builder reads `allergens`. I
verified this by running the actual code paths. Every piece of AI-written safety guidance in every
guide ever generated was written as though the child had no allergies.

Full detail in `01-technical-audit.md`, with a KEEP / IMPROVE / REBUILD / REMOVE / UNKNOWN verdict on
every file.

---

## 2. What the market says

**This category has a graveyard, not a leaderboard.** Milo (YC, OpenAI-backed) shut down in January
2026. Yohana (Panasonic) is dead. Maple sunsets this December. Picniic ceased operations. Wonderschool
took $49.4M and pivoted out of consumer entirely. The survivor is Cozi: 20M users, $39/year, ~19 staff.

**Milo's post-mortem is the most useful document available to you:** *"The technology is simply too
early to be reliable in any useful way… promising demos but disappointing production and scale."*
She did not say families don't want help. She said **AI cannot reliably infer family logistics** —
which is precisely why the parent-supplies-facts, software-formats-and-translates architecture already
present in both prototypes is the tractable version of this problem.

**The handover niche was colonised in the last twelve months and nobody has traction.** Eight products
— Gosling, Handoff, Handover, CareCard, NestNote, Pebbi, Covely, Walliee — most launched in 2026, most
with single-digit App Store ratings. The idea is validated; the business is not. All are English-only,
US-centric, solo projects.

**The real incumbent is a £3 Etsy PDF.** Five thousand "nanny binder" listings at $3–13. AuPairWorld
gives a family handbook away free with membership. That anchors what you can charge for *a document* —
so the price has to be justified by what a PDF structurally cannot do: **live updating, per-carer
scoping, expiring links, and above all translation.**

**And the frequency data is sobering.** Only 9–10% of UK parents go out weekly; 29–34% hardly ever;
93% of parents of under-fives rarely manage an evening out. The median parent needs this **six to
twelve times a year**.

`03-market-and-positioning.md` has the full competitive map across six rings.

---

## 3. The recommended shape

**One application, one account, one household, with named surfaces inside it.** Not separate apps.
The household — the children, their allergies, their routines, who is allowed to collect them — is the
same data for every surface, and the second surface should feel free once you have the first.

**Positioning:**

> For parents handing their children to someone else, who currently write the same long text every
> time — this turns what you know by heart into a guide they can actually read, in their language, in
> under two minutes. Nobody else has to sign up, install anything, or keep it updated.

Five pillars, argued in `03` §3.7: **outbound not inbound**; **nothing to adopt, nothing to maintain**;
**translation** as the uncopyable differentiator; **older children rather than babies** (every rival is
feed/nap/nappy shaped, and the 3–10 band is larger and worse served); and **bilingual by construction,
France first**.

**France first is a real recommendation, not a nicety.** The *cahier de transmission* already
normalises written care handover there, so the pitch is nearly trivial — *le cahier de transmission,
mais dans l'autre sens*. *Charge mentale* has been mainstream French vocabulary since 2017. Not one
direct competitor has a French version. And French organic search is far less saturated with
AI-generated comparison content than English, which matters because the ARPU here does not support
paid acquisition at all.

**Build order: Handover first, Away second.** Away has the better code; Handover has the better
product, the stronger differentiation, the translation wedge, and a caregiver who becomes a
distribution channel.

---

## 4. Brand and naming — the uncomfortable part

### The masterbrand

I have respected the brief: nothing in the roadmap depends on a rename, and I am not proposing one as
a task. But the brief asked me to flag an exceptionally strong strategic reason if one appeared, and
four appeared at once.

**"My Mental Load" is probably unregistrable** as a word mark — s.3(1)(c) TMA 1994 and Art. 7(1)(c)
EUTMR refuse signs that exclusively describe the purpose of the goods. **At least three competitors
already use the term as their brand** — Mental Load, Mental Loadless (shipping, FR+EN, €3.99/mo), The
Mental Load Project. **MOLO** — London, VC-backed, *"makes the invisible load visible, manageable and
shared"* — is a near-homophone of MML selling to the same parents. And **the name contradicts your own
voice rule** at maximum volume: "give permission, never name the burden", printed on a logo that names
the burden. The research on moral licensing (`03` §3.6) shows this isn't merely inelegant — guilt-
adjacent framing measurably backfires with this audience.

My earlier recommendation was to keep MML as three unexpanded letters. **I now think that is the worst
option**: you keep the descriptive baggage for anyone who looks it up while losing the searchability
that made the phrase attractive, and bare "MML" collides with a €2.7bn London private equity firm.

**Recommendation:** a new consumer masterbrand, MML retained as the legal entity, and "mental load" /
*charge mentale* used as **category vocabulary** in SEO, App Store keywords and press. The category
term is how people find you; the brand name is how they feel.

### The naming system

**Abandon the French female-diminutive family.** Three independent reasons, in `04` §4.1:

- **Aaker's framework** says a house of brands requires incompatible positioning to justify it, and
  two apps for the same parents have none. You'd forfeit the halo effect and take on three domains,
  two zero-rating store listings, no cross-sell, and three trademark filing families.
- **The `-ette` suffix reads as "small, fake, feminine" in English.** One such name is invisible; a
  *family* makes the morpheme salient. Answer.AI uses the same suffix for its libraries specifically
  to signal "a small helper for the real thing".
- **Feminine-coded parenting products measurably fail to reach fathers.** Fathers *"don't see
  themselves represented… or believe father-focused resources aren't as serious or as trustworthy"*
  (Donelle et al., 2021). UNESCO's first recommendation in *I'd Blush If I Could* was to stop making
  domestic-helper assistants female by default. **This is a direct hit on the shared-responsibility
  goal**, not a branding nicety.

The individual names have specific problems too, and two are unusually bad. **Lisette** is a live
Answer.AI Python library *and* French theatre's archetypal housemaid — the *soubrette* in seventeen
Marivaux plays — which is exactly wrong for a product whose positioning depends on the carer being
trusted rather than staff. **Jeannette** is the ordinary French word for a **sleeve ironing board**
(Larousse gives no other definition) and a 175-year-old madeleine brand with a worker-occupation
resistance narrative — exactly wrong for a domestic-logistics product in France. **Ninon** is
disqualified because Apple's own search returns Nikon on both storefronts. **Lucette** is a
contraceptive pill sold in France. **Cosette** is the abused child servant in *Les Misérables*.

Of the seventeen names tested, **Aliette** alone clears every gate I could check — zero App Store
results in GB and FR, all compound domains free — with one liability: Bayer holds a registered
fungicide mark on it, in class 5.

**Recommendation:** a branded house under one non-gendered masterbrand, with **Relay / Relais** as my
lead candidate — the same word in both languages, meaning a deliberate, practised, trusted transfer
between people running the same race. Keep the family-names idea *inside* the product, where it is
charming and reversible.

### Colour

The proposed palette is close, and the fixes are small and specific (`05`). Two things must change:
several per-child identity colours fail WCAG contrast and are confusable under the common forms of
colour blindness, and colour is currently doing work on its own where it must not — a child's
allergies must never be identified by hue alone. Colour Keeper does not exist anywhere I can find, so
it is UNKNOWN pending D1.

---

## 5. Pricing

**£24/year, £49 lifetime, £3.49/month de-emphasised. Free tier: two care guides in total.**

This is a downward revision, and the correction is instructive. My first draft said £39/year with
three free guides *per month*, benchmarked against Cozi. But Cozi is a 20-million-user family
operating system and we are a single-purpose tool, while **every direct rival prices at $19.99–29.99**.
And three free guides a month against a real usage rate of six to twelve a *year* is not a free tier —
nobody would ever have reached the paywall. **Free allowances for episodic products must be absolute
lifetime counts, not rates.**

Lifetime is not a hedge. For a product with this frequency profile it is the rational purchase, and
the two closest analogues — Pebbi at £34.99 lifetime, and Rezi adding a lifetime plan against 16%
monthly churn — both concluded the same.

**The constraint behind all of it:** median first-year value per payer in Western Europe is $25, and
freemium converts at about 2%. **Paid acquisition does not clear that at any price.** The viable
channels are French-language organic content, the caregiver-receives-a-guide loop, the neurodivergent-
parent community, and partnerships with platforms that already own the moment of need.

The "never paywalled" list in `07` §7.3 should be treated as immutable and enforced in code: anything
already created, allergy and medication and emergency-contact information, the caregiver's view, data
export, account deletion, and the second parent.

---

## 6. What happens next

`09-roadmap-and-backlog.md` has fourteen phases and a P0–P3 backlog. The order in brief:

**Phase −1 — stop the bleeding.** Fix the Supabase policy, close both AI proxies, rotate the key, set
a spend cap, fix the allergy bug. This needs credentials (D8) and nothing else. It should happen
regardless of whether you approve anything else in this document.

**Phases 1–3 — foundations.** Next.js monorepo, TypeScript, accounts, the household model, the design
system and token architecture.

**Phases 4–6 — the product.** Handover rebuilt properly, then Away, then Home.

**Phases 7–13 — AI layer, monetisation, analytics, notifications, QA, launch, iteration.**

The AI strategy (`06`) is deliberately conservative, and Milo's post-mortem is the reason. AI turns
messy input into structured fields, translates, and drafts prose from facts the parent supplied. **It
never invents a fact about a child, never sends anything on the parent's behalf, and never touches
allergy, medication or emergency information without explicit confirmation.**

---

## DECISIONS I NEED TO MAKE

Nine, in `11-decisions-required.md`. Only one blocks work starting today.

| | Decision | My recommendation | Blocks |
|---|---|---|---|
| **D1** | What is Colour Keeper? It is in no commit, branch or file I was given | If it was only ever an idea, say so and I'll fold per-person colour into the design system | Its own analysis only |
| **D2** | The masterbrand | **New consumer brand; MML stays as the legal entity; "mental load" becomes category vocabulary.** Changed from my earlier advice | Phase 12 |
| **D3** | Branded house, or separate brands per app? | **Branded house.** Abandon the `-ette` family; keep the idea inside the product | Phase 12 |
| **D4** | Instruct a trademark attorney, and when? | After D3, before launch and before buying domains. **Nothing in my research is clearance** — no register was reachable | Phase 12 |
| **D5** | Pricing and the free allowance | £24/yr, £49 lifetime, 2 free guides total. Plus sign-off on the never-paywalled list | Phase 8 |
| **D6** | France first, or the UK first? | **France first.** Note `.fr` needs an EU presence post-Brexit | Nothing structural |
| **D7** | Whether the `trips` exposure is reportable to the ICO/CNIL | I'll fix it, pull the access logs, and bring you the facts. Only you can decide to notify | Nothing |
| **D8** | **Access** — Supabase, Vercel, Anthropic, the Readied repo | — | **Everything. This is the only live blocker** |
| **D9** | Approve the direction and the order | One app with one household; Handover rebuilt first | Everything after Phase −1 |

Everything not on that list, I will decide and do: the stack, the schema, the component library, the
token architecture, the test strategy, CI, the security fixes, the bug fixes, the accessibility and
performance work, copy drafting, the French copy brief, analytics, and the order of work within any
phase.
