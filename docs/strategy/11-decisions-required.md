# 11. Decisions I need to make

Deliverable 19.

Everything not on this list, I will decide and do. This list is deliberately short: it contains only
questions where the answer depends on your judgement about the product, the brand, the business or
the legal position — not on analysis I can perform myself.

Naming candidates referenced below are set out in `04-naming.md`.

---

### D1 — Colour Keeper: what is it?

**Why I need you.** It does not exist in the repository, in any of its 70 commits, in any branch, or
in the files supplied. I have not analysed it and I will not invent an analysis of a product I have
not seen.

**What I need.** The concept, sketches, code, a deployed URL, or a paragraph. Any of these is enough.

**If the answer is "it was only ever an idea"**, that is a perfectly good answer and I will treat the
per-person colour-and-symbol system as a design-system feature (which it should be regardless) and
close the product line.

**Blocks:** its own analysis. Blocks nothing else.

---

### D2 — The masterbrand

**Why I need you.** This is the one place where the brand contradicts itself, and it is a brand
decision, not a technical one.

Your voice rule is *"give permission, never name the burden."* The masterbrand is called *My Mental
Load*, and it is printed under the product name on every screen of both apps. The manifest's own
"write this / not this" table rejects *"The mental load, finally solved"* as copy — and then the
lockup says it permanently.

**The brief says MML stays and renaming it is not the objective. I have respected that: nothing in
the roadmap depends on a rename and I am not proposing one as a task.** But the brief also asked me
to flag an exceptionally strong strategic reason if one emerged. **One emerged, and it is stronger
than the voice contradiction that originally prompted this item.** Full detail in `04` §4.5; the four
findings in brief:

1. **"My Mental Load" is probably unregistrable as a word mark** — s.3(1)(c) TMA 1994 and Art. 7(1)(c)
   EUTMR both refuse signs that exclusively describe the purpose of the goods, and this is close to a
   paradigm case. You would end up with a figurative mark plus a disclaimer on the words, holding
   rights you cannot enforce.
2. **Competitors already use the term as their brand** — *Mental Load*, *Mental Loadless* (shipping,
   FR+EN, €3.99/mo), *Tribe Family*'s "Mental Load Score", *The Mental Load Project*. These are not
   passive collisions; they are rivals, and some are ahead of us.
3. **MOLO is a near-homophone of MML in your home market** — London-based, VC-backed, positioned as
   *"makes the invisible load visible, manageable, and shared"*, trademarked *The Modern Load™*.
4. **Guilt-adjacent framing measurably backfires** via moral licensing (`03` §3.6). The voice rule
   turns out to be empirically correct, which makes contradicting it in the logo more costly than a
   matter of taste.

**Three options — note that my recommendation has changed:**

- **(a) Keep everything as it is.** The contradiction stays, the trademark position stays weak, and
  you are in a naming fight with at least three competitors.
- **(b) Keep MML as the legal identity; never expand the acronym in the product.** *This was my
  earlier recommendation and I now think it is the worst of the three.* You keep the descriptive
  baggage for anyone who looks the acronym up, while forfeiting the searchability that made the phrase
  attractive — and "MML" alone collides with MML Capital Partners (London PE, €2.7bn AUM, French
  offices) and carries no meaning you have not paid to install.
- **(c) Choose a new consumer-facing masterbrand, keep MML as the legal entity, and run "mental load"
  / *charge mentale* as category vocabulary in SEO copy, App Store keywords and press.** **This is now
  my recommendation.** It is the standard split — the category term is how people find you, the brand
  name is how they feel — and it resolves the trademark problem, the competitive collision and the
  voice contradiction in one move. Candidates are in `04` §4.6; my lead is **Relay / Relais**.

**Blocks:** the endorsement lockup in the design system, and the marketing site. Needed before
Phase 12, and before any premium domain purchase.

---

### D3 — The naming architecture, then the names

**Why I need you.** Naming is a brand decision and you own the brand. But the research turned up an
architectural objection that I think should be settled before any individual name is picked.

**My recommendation, argued at length in `04` §4.1: abandon the French female-diminutive naming system
in favour of a branded house.** One non-gendered masterbrand, with the surfaces named functionally
beneath it. Three independent reasons:

1. **Aaker's framework says a house of brands must be justified by incompatible positioning**, and two
   apps sold to the same parents have none. What you forfeit is the halo effect, and what you take on
   is three domains, two zero-rating App Store listings, no shared brand-search demand, no cross-sell
   inference, and three trademark filing families with three renewal cycles.
2. **The `-ette` suffix reads as "small, fake, feminine" in English.** A single such name is invisible;
   a *family* of them makes the morpheme salient and activates the diminutive reading. Answer.AI uses
   the identical suffix for its libraries precisely to signal "a small helper for the real thing".
3. **Feminine-coded parenting products measurably fail to reach fathers.** Donelle et al. (2021) found
   fathers *"don't see themselves represented… or believe father-focused resources aren't as serious
   or as trustworthy"*; UNESCO's first formal recommendation in *I'd Blush If I Could* was to stop
   making domestic-helper assistants female by default. **This is a direct hit on the stated goal of
   shared responsibility**, not a branding nicety.

**Separately, the two headline names should be dropped on their own merits.** *Lisette* is a live
Answer.AI Python library **and** French theatre's archetypal housemaid — the *soubrette* in seventeen
Marivaux plays — which is specifically wrong for a child-handover product. *Jeannette* is the everyday
French common noun for a **sleeve ironing board** (Larousse gives no other definition) and a
175-year-old madeleine brand with a worker-occupation resistance narrative and national TV coverage —
specifically wrong for a domestic-logistics product in France. *Ninon* is disqualified because Apple's
own search returns Nikon products for it on both storefronts. *Lucette* is a contraceptive pill sold
in France. *Cosette* is the abused child servant in *Les Misérables*.

**If you want to keep the family-names idea** — and it is a genuinely lovely idea — the place for it
is *inside* the product: a named guide format, a named mode, a named assistant if one is ever built.
There it is charming and reversible. In the brand architecture it is expensive and permanent.

**What I need:** agreement on branded-house versus separate brands, then a masterbrand from `04` §4.6
or a direction to generate more within.

**What is not blocked.** Nothing. I will build using internal identifiers (`handover`, `away`)
throughout, so no route, table, component or repository needs renaming when you decide. Names only
need to exist before Phase 12.

---

### D4 — Trademark clearance: instruct an attorney, and when?

**Why I need you.** Filing requires an instructed attorney and a budget. I can prepare the brief and
the shortlist; I cannot file.

**Important caveat on what I was able to check.** I verified domains by RDAP against the authoritative
registries and App Store listings against Apple's own search API, and those findings are solid. **I
could not reach a single trademark register** — UKIPO returned 403, TMview timed out, EUIPO's search
API is not publicly exposed, USPTO rejected programmatic access. Everything trademark-related in `04`
comes from third-party indexes. **It is triage, not clearance:** it tells you which names are
obviously dead, not which are safe.

**My recommendation.** Instruct a professional clearance search *before* launch and *before* buying
premium domains, but *after* D3, so you pay to clear one or two names rather than seventeen. Scope it
to cover **UKIPO, EUIPO and INPI in classes 9, 42, 35 and 41/44**, plus the Madrid register for EU/UK
designations, plus French *dénomination sociale* and RCS checks — **a French company name can ground
an opposition without any trademark** — plus a UK common-law passing-off sweep. Roughly £1,000–2,000
for search and filing across the UK and EU is the normal order of magnitude; confirm with your
attorney.

**Two specific instructions to include.** If *Aliette* survives D3, ask for an opinion on **Bayer's
registered Aliette fungicide mark** — it is class 5, about as distant as it is possible to get from
class 9, but Bayer is a well-resourced enforcer and a reputation-based objection under Art. 8(5) EUTMR
/ s.5(3) TMA is exactly the question a search engine cannot answer. And note that personal forenames
are registrable in the EU and UK but are inherently weaker and coexist more readily, which cuts both
ways.

**Two things still outstanding that I could not do from here:** a manual **Google Play** search of the
shortlist (its results are JavaScript-rendered and could not be extracted reliably), which I will do
once I have a browser session available.

**Note.** The manifest already correctly identifies that "Held" is unregistrable as a plain English
word describing the product. The same objection applies with more force to "My Mental Load" — see D2.

---

### D5 — Confirm the pricing model and the free allowance

**Why I need you.** Price is a positioning statement, not a calculation.

**My recommendation, in full in `07` — revised downward after the competitive research.** One
household subscription across the whole ecosystem, no per-app pricing:

- **£24 / year** (the default), **£49 lifetime**, £3.49/month de-emphasised
- **Free tier: 2 care guides in total** — an absolute lifetime count, not a monthly rate
- Sharing, export, editing and re-sending always free; both parents always free; no time-limited trial
- **£3.99 one-off guide** for the genuinely occasional parent, credited against an upgrade

**What changed and why it matters.** An earlier draft said £4.99/month or £39/year with three free
guides *per month*. Both numbers were wrong. £39 was benchmarked against Cozi — but Cozi is a
20-million-user family operating system, and **every direct handover rival prices at $19.99–29.99 a
year** (Handoff $19.99, Handover $24.99, Gosling $29.99, Pebbi £19.99). Pricing above all of them
while doing less than the incumbent was indefensible. And three free guides a month against a real
usage rate of **six to twelve a year** meant nobody would ever have reached the paywall.

**What I need from you:** yes, or different numbers. And explicit confirmation of the "never
paywalled" list in `07` §7.3 — I intend to enforce it in code, which makes it hard to quietly erode
later, which is the point.

**Blocks:** Phase 8 only. Everything up to it is unaffected.

---

### D6 — Launch market: France first, or the UK first?

**Why I need you.** This is a business decision with legal and cost consequences, and it changes the
order of content, copy and possibly company structure.

**My recommendation: France first, UK close behind.** The reasoning is in `03` §3.5. In short: the
*cahier de transmission* already normalises written care handover in France, so the pitch is *"le
cahier de transmission, mais dans l'autre sens"* with zero market-education cost; *charge mentale* has
been mainstream French vocabulary since 2017; **not one of the eight direct competitors has a French
version**; and French organic search is materially less saturated with AI-generated comparison content
than English — which matters enormously, because `07` §7.5 concludes that **paid acquisition is not
affordable at this ARPU**, so organic is effectively the only channel.

**The costs you should weigh.** Western Europe converts slightly worse than North America (2.0% vs
2.6% at day 35) and realises less per payer ($25 vs $32). French family apps skew free or cheap. And
**`.fr` requires an EU/EEA/Swiss presence post-Brexit**, so a French-domiciled entity may be needed —
that is your call, not mine.

**Blocks:** nothing structural. I will build bilingual from the first line either way, because
translation is the core differentiator (`03` §3.7). This decision changes which language gets the
content and copy investment first, not what gets built.

---

### D7 — Data protection: notification decision, if it comes to that

**Why I need you.** Only the data controller can decide whether to notify a regulator.

**The situation.** The `trips` table is currently readable by anyone with the publishable key, which
is printed in the deployed page source. It contains children's names, ages and parents' notes. The
`security.html` page told you this was fixed; it was not — the policy it installed grants
unconditional read access, and the built-in test never checked for it. Full detail in
`SECURITY-IMMEDIATE.md`.

**What I will do without asking.** Fix it, as the first task, as soon as I have access.

**What I need from you afterwards.** I will pull the Supabase access logs and establish whether the
table was ever actually read by anyone other than the app. With those facts, you decide whether this
is reportable to the ICO and/or the CNIL. I will draft whatever is needed either way.

**Note:** if the table has only ever held your own test data, this is a non-event and we simply move
on. The logs will tell us.

---

### D8 — Access

**Why I need you.** I cannot do the security work, pull the analytics, or deploy anything without
credentials.

**What I need:**
- Supabase project access (the project referenced in the client code)
- Vercel access to both projects
- Anthropic console access, or someone to rotate the key and set a spend cap on my instruction
- GitHub write access to whichever repository holds Readied — it is not in this one

**Blocks:** Phase −1 entirely. This is currently the only thing standing between the analysis and the
fix.

---

### D9 — Approve the direction, and the order

**Why I need you.** The rest is execution.

The two decisions embedded in the plan that are worth your explicit agreement rather than silent
acceptance:

1. **One application, one account, one household, named surfaces inside it** — rather than separate
   apps. Argued in `06` §6.1. This is the most consequential structural choice in the plan and it is
   expensive to reverse.
2. **Handover is rebuilt first, Away second.** Away has the better code; Handover has the better
   product, the stronger differentiation, the translation wedge, and the caregiver as a second user
   and distribution channel.

---

## Not decisions

For the avoidance of doubt, I am not asking you about, and will simply do: the stack, the schema, the
component library, the token architecture, the test strategy, the CI setup, the security fixes, the
bug fixes, the accessibility work, the performance work, the copy drafting, the French copy brief,
the analytics implementation, the GDPR documentation drafting, or the order of work within any phase.
