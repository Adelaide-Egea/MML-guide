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

### D2 — Does "My Mental Load" appear in the product?

**Why I need you.** This is the one place where the brand contradicts itself, and it is a brand
decision, not a technical one.

Your voice rule is *"give permission, never name the burden."* The masterbrand is called *My Mental
Load*, and it is printed under the product name on every screen of both apps. The manifest's own
"write this / not this" table rejects *"The mental load, finally solved"* as copy — and then the
lockup says it permanently.

**The brief says MML stays and renaming it is not the objective. I have respected that: nothing in
the roadmap depends on a rename and I am not proposing one as a task.** But the brief also asked me
to flag an exceptionally strong strategic reason if one emerged, and this is it.

**Three options, in increasing order of change:**

- **(a) Keep everything as it is.** Simplest. The contradiction stays and will keep surfacing every
  time you write copy.
- **(b) Keep MML as the legal and corporate identity; never expand the acronym in the product.**
  "MML" as three letters names nothing and burdens nobody. The domain, the company and the
  contracts are untouched. Only the interface changes. **This is my recommendation** — it resolves
  most of the tension at essentially zero cost.
- **(c) Choose a new consumer-facing masterbrand** and keep MML as the legal entity behind it. Most
  work, cleanest result, and it gives you a registrable trademark for the umbrella rather than a
  descriptive phrase.

**Blocks:** the endorsement lockup in the design system, and the marketing site. Not urgent, but
needed before Phase 12.

---

### D3 — The two surface names

**Why I need you.** Naming is a brand decision and you own the brand.

**What I need.** A name for the Handover surface and a name for the Away surface, chosen from the
territories and candidates in `04-naming.md`, or a direction I should generate more within.

**What I have already done for you.** Existing-use research, App Store and domain checks, and a
pronunciation and linguistic assessment across English and French. What I cannot do is give you legal
clearance — see D4.

**What is not blocked.** Nothing. I will build using internal identifiers (`handover`, `away`)
throughout, so no route, table, component or repository needs renaming when you decide. The names
only need to exist before Phase 12.

---

### D4 — Trademark clearance: instruct an attorney, and when?

**Why I need you.** Filing requires an instructed attorney and a budget. I can prepare the brief and
the shortlist; I cannot file.

**My recommendation.** Do a professional clearance search in UKIPO, EUIPO and USPTO, classes 9 and
42, on the shortlist *before* launch and *before* buying premium domains — but *after* D3, so you are
paying to clear two names rather than eight. Roughly £1,000–2,000 for search and filing across the UK
and EU is the normal order of magnitude; confirm with your attorney.

**Note.** The manifest already correctly identifies that "Held" is unregistrable as a plain English
word describing the product. The same objection applies to "My Mental Load", which is relevant to D2.

---

### D5 — Confirm the pricing model and the free allowance

**Why I need you.** Price is a positioning statement, not a calculation.

**My recommendation, in full in `07`:** one household subscription across the whole ecosystem, no
per-app pricing. **£4.99/month or £39/year**, annual selected by default, with a generous
never-expiring free tier (3 guides/month, 2 packing lists/year, sharing and export always free, both
parents always free). No time-limited trial.

**What I need from you:** yes, or a different number. And confirmation of the "never paywalled" list
in `07` §7.3 — I intend to enforce it in code, which makes it hard to quietly erode later, which is
the point.

**Blocks:** Phase 8 only. Everything up to it is unaffected.

---

### D6 — Data protection: notification decision, if it comes to that

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

### D7 — Access

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

### D8 — Approve the direction, and the order

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
