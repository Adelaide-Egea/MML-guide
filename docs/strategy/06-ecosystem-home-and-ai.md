# 6. Ecosystem, Home and AI

Covers deliverables 6, 13 and 14.

---

## 6.1 The ecosystem recommendation

### The question

Should MML be separate apps, modules in one app, a family of products sharing an account, or one
core product with extensions?

### The recommendation

**One application. One account. One household. Multiple named *surfaces* inside it, not multiple
installable apps.**

Concretely:

```
MML (one web application, installable as a PWA, one domain)
│
├── Household          the shared object: people, ages, needs, preferences, caregivers
│   └── this is the platform; everything else is a view over it
│
├── Home               what needs attention, and the two or three things you can do now
│
├── Handover           produce a care guide for whoever is looking after your children
├── Away               produce packing lists and travel preparation for the household
└── (future surfaces)  each one a new verb over the same household
```

Named surfaces get their own entry point, their own accent colour, their own App Store-style landing
page and their own marketing story. They do **not** get their own codebase, account, database,
subscription, or install.

### Why

**1. The data argues for it.** Both existing apps are downstream of the same object: an accurate
description of your children. Held collects it richly; Readied collects a thinner copy. Any
architecture that stores that twice is wrong. Once you accept one household record, you have
accepted one account, one database and one authorisation model — and at that point separate apps buy
you nothing but duplicated work.

**2. The frequency argues for it.** Neither product is used weekly. Two episodic products that each
have to earn their own install, their own re-engagement and their own subscription will each fail
that test alone. Combined, the *household* has a plausible reason to persist even though each
surface is occasional.

**3. The economics argue for it.** One founder plus one engineer cannot maintain two production
codebases with two design systems, two auth models and two billing integrations. The current state
already demonstrates the cost: every fix must be made twice, by hand, in two 2,500-line files.

**4. Cross-surface intelligence only exists if the data is shared.** "You're away next weekend and
your mother is having the children — shall I get the guide ready?" requires the trip and the child
profile to be in the same place. Separate apps cannot do this at all.

**5. It is reversible in the right direction.** Starting unified and later extracting a standalone
app is straightforward. Starting fragmented and later merging means a data migration, an account
merge and a re-onboarding of every existing user. Choose the reversible option.

### What is explicitly shared

| Shared | Decision |
|---|---|
| Account | **Yes.** One identity, one login, one billing relationship. |
| Household | **Yes.** The core object. People, relationships, caregivers, preferences. |
| Profile data | **Yes.** Enter a child once. Every surface reads the same record. |
| AI | **Yes.** One gateway, one policy, one audit log, one spend budget. |
| Home | **Yes.** One Home. See 6.2. |
| Notifications | **Yes.** One preference centre and one sending path, with per-surface topics. |
| Subscription | **Yes.** One. See `07`. |
| Design system | **Yes** for structure; **per-surface accent** for identity. See `05`. |
| Entry points | **Yes** — each surface has its own URL and can be marketed and linked to directly. |

### What is deliberately *not* shared

- **Tone within a surface.** Handover is calm and reassuring at the door; Away is brisk and
  practical. Same voice, different tempo.
- **Session shape.** Handover is one sitting, one artefact. Away is a build that you return to for
  days. Do not force one navigation pattern onto both.
- **The second user.** Handover's second user is a caregiver with read access and one reply channel.
  Away's second user is a partner with equal write access. These are different permission models and
  should stay different.

### The one thing that would change this recommendation

If Colour Keeper turns out to be a genuinely unrelated product for a different audience — not a
family/household product at all — then it should be a separate thing outside this architecture
rather than forced into it. I cannot assess that without seeing it (decision **D1**).

---

## 6.2 MML Home

### The question the brief asks

*"What does a person need when they open MML?"* — and it is the right question, because the honest
answer for most family apps is "nothing, they opened it out of guilt".

### The answer

When someone opens MML they are in one of exactly three states:

1. **They came to do a specific thing.** "I need a guide for Saturday." They have a task. Home's job
   is to not be in the way — get them into it in one tap.
2. **Something is happening soon and they half-remember it.** "We're away next week, was there
   something?" Home's job is to say what is coming and what is not yet ready.
3. **They opened it with no goal.** Rare, and the most dangerous state, because this is where every
   other product in the category dumps a wall of widgets and manufactures anxiety. Home's job here
   is to be *finishable* — to be readable in five seconds and then let them close it.

### The design principle

**Home should be finishable.** You should be able to reach the end of it. A dashboard you can never
finish reading is a dashboard that generates guilt, and guilt is the exact emotion this brand exists
to remove. If there is nothing that needs attention, Home should say so plainly and stop.

This is the concrete, testable expression of "makes life feel lighter, not another system to
maintain". It also gives a hard design constraint: **Home has a maximum length, and empty is a
first-class state, not a failure state.**

### Structure

```
┌──────────────────────────────────────┐
│  Good morning                        │   ← time and name, no metrics
│                                      │
│  ── One thing ─────────────────────  │   ← at most ONE proactive item.
│  Claire has Élise on Saturday.       │     Never zero-to-many. One, or none.
│  Her guide is from March.            │
│  [ Refresh it ]     [ It's fine ]    │   ← both answers are one tap
│                                      │
│  ── Coming up ─────────────────────  │   ← read-only. Nothing to maintain.
│  Sat 12   Claire, 6–11pm             │
│  Fri 18   Bordeaux, 4 nights         │
│                                      │
│  ── Start something ───────────────  │   ← the surfaces, as verbs
│  Hand over  ·  Pack                  │
│                                      │
└──────────────────────────────────────┘
```

Note what is absent: no completion percentages, no streaks, no badge counts, no "you have 7
outstanding items", no charts, no "family score". Every one of those is a mechanism for making
someone feel behind, and this brand has explicitly ruled that out.

### The "One thing" slot is the whole design

At most one proactive suggestion, ever. Not a feed. If there are three candidates, Home shows the
best one and says nothing about the others. The reasons:

- One suggestion can be evaluated in two seconds. A list must be triaged, and triage is work.
- One suggestion can be dismissed with one tap and genuinely gone.
- One suggestion forces us to be right. A feed lets us be lazy and offload the ranking onto the
  user.
- If we are wrong once, the cost is small. If we are wrong five times on one screen, the user stops
  reading Home forever.

Dismissal must be honest: "It's fine" means it does not come back for this event.

### Home vs per-surface homes: the recommendation

**One MML Home, and each surface has a landing view rather than a home.**

The distinction matters. A *home* is where you go when you have no goal. A *landing view* is where
you arrive when you have already chosen the surface — it shows that surface's saved objects (your
guides; your trips) and the primary action.

Rationale:

- Three homes means three places where something might be waiting, which is three things to check.
  That is more mental load, not less — the precise failure the brand exists to avoid.
- Cross-surface intelligence has no home if every surface has its own. "You're away and someone else
  has the children" is inherently a Home observation.
- Direct entry still works: a link straight to `/handover` skips Home entirely, which is what you
  want for marketing, for App Store deep links, and for a returning user with a specific task.

Home is the default landing for a signed-in user with no deep link, and it is where notifications
resolve to.

### Home must earn its place

A hard rule for build: **Home ships only when it has something true to say.** A Home that shows
"Nothing needs you today" from day one is honest and calm. A Home that shows fake widgets to look
substantial is the thing we are trying not to build. If in Phase 3 the only honest Home is a greeting,
a short "coming up" list and two buttons, ship that.

---

## 6.3 AI strategy

### The governing rule

**AI does the typing. The parent does the deciding.**

Every proposal below is tested against that sentence. If a feature has the model deciding something
about a child on the parent's behalf, it does not ship in that form.

There is a second rule, inherited from Readied's architecture and elevated to policy:

**Anything that must be correct is computed, not generated.** Quantities, dates, times, allergies,
medication, emergency numbers, and the structure of every document are produced by deterministic
code. The model writes prose, translates, and interprets messy input. It is never the source of
truth for a fact.

This is not caution for its own sake. It is what makes the product trustworthy in a category where
the cost of a confident error is a child eating something they are allergic to.

### Where AI genuinely adds value

Ranked by value-per-unit-of-risk.

**1. Turning messy input into structure. (Highest value.)**
A parent types "she has 2 bottles of 210ml Kendamil a day and won't sleep without the blind fully
down". Deterministic parsing of that is hopeless; a model does it well. Readied already does this in
`buildNotesPrompt()` and it is the best AI use in the portfolio. **This is where most of the AI
budget should go.** It removes the single biggest friction in both apps — the volume of form-filling
— and it fails safe, because the output is a proposed structured field the parent can see and
correct before it is used.

**2. Translation. (High value, high risk, must be constrained.)**
The wedge for the whole business. Also the place where a subtle error is most dangerous: Held's
prompt already contains a rule that negations must survive translation intact, which exists because
a model softened "she doesn't warn you before she falls asleep" into a cue to watch for. Rules:
UI chrome is translated by hand in a lookup table, never by the model; the parent's own words are
translated by the model; safety-critical lines are shown in both languages side by side; and every
translated document carries a visible note that it was machine-translated.

**3. Writing the prose around structured facts. (Good value, low risk.)**
The warm one-line intro, the comfort paragraph, the "if they get upset" guidance written as prose
rather than a list. Held does this well already.

**4. Noticing a gap and asking about it. (Good value — as a question, never as an answer.)**
"You haven't said anything about medication — is there any?" is useful. Silently adding a medication
row is not. The distinction is absolute.

**5. Seasonal and contextual knowledge. (Moderate value.)**
Typical weather for a place in a month, so a packing list can be right without a weather API.
Readied does this and it works.

**6. Cross-surface connection. (High potential value, not yet earned.)**
"You're away the weekend your mother has the children — the guide is from March." This requires the
unified household to exist first. Phase 7, not before.

### Where AI should not go

- **Reading your email, calendar or messages.** The brand manifest is explicit — *"Nothing here is
  autonomous. It doesn't read your email or watch your calendar."* I agree, and not only for brand
  reasons: inbound ingestion is what every competitor does, it is a large privacy liability, it is
  expensive, and it drags the product back into the "inbound" category the positioning deliberately
  rejects.
- **Medical, dietary, developmental or behavioural advice.** Absolute prohibition. The model
  restates what the parent wrote; it never adds clinical guidance. This needs to be a hard rule in
  the system prompt *and* a filter on output.
- **Generating a child's needs from their age.** "Most 3-year-olds nap after lunch" in a document
  the parent will send as fact about their own child is unacceptable. Age-banding decides which
  *questions* to ask, never which *answers* to assume.
- **Autonomous sending.** Nothing leaves the household without an explicit human action.
- **Emotional labour.** No "you're doing great". No encouragement. The voice guide rules it out and
  it is right.

### The four buckets the brief asks for

**WHAT AI SHOULD DO — silently, no confirmation needed:**
Translate UI-adjacent free text on request. Write connective prose around facts the parent supplied.
Produce seasonal weather context. Format and order a document. Extract structure from free text *for
display as an editable draft*.

**WHAT AI SHOULD SUGGEST — visible, one tap to accept or dismiss:**
"I read '2 × 210ml a day' as 4.2 L for the trip — right?" Missing-information prompts. A relevant
Home suggestion. Reuse of a previous guide or list. Every one of these appears as a proposal with
the model's interpretation shown, and the parent's edit always wins.

**WHAT AI SHOULD AUTOMATE — genuinely without asking:**
Almost nothing, and that is the correct answer for this brand. The defensible list: re-running a
translation when the parent edits the source text; recalculating derived quantities when an input
changes; regenerating prose when a structured fact changes. All of these are recomputation of
something the parent already asked for, not new decisions.

**WHAT AI MUST NEVER DO WITHOUT EXPLICIT APPROVAL:**
Send anything to anyone. Add, remove or alter a safety-critical fact — allergy, medication, emergency
contact, the "important, read first" line. Change a quantity the parent stated. Soften or drop a
negation. Add advice the parent did not give. Share data with a third party. Train on household
data. Infer a child's needs from their age.

### Privacy and trust architecture

- **Data minimisation at the boundary.** The prompt receives only the fields needed for the specific
  task. Names can be tokenised for tasks that do not need them (weather does not need to know your
  children are called Élise and Charlotte).
- **No training on customer data.** Contractually with the model provider, and stated plainly in the
  privacy notice.
- **Server-side prompts.** The client sends structured data; the system prompt and model are owned
  by the server. This is also the security fix from `SECURITY-IMMEDIATE.md`.
- **An audit trail.** Every generation records which fields went out, which model, when, and what
  came back, so a parent can be told exactly what was sent. This is a GDPR requirement in practice
  and a trust feature in marketing.
- **Show the seams.** When the model has interpreted something, say so and show the interpretation.
  Readied's "handled" list — "here is each point from your notes and what I did with it" — is
  exactly right and should be standard across every surface.
- **Always a way to turn it off.** Every AI-touched output must have a deterministic fallback that
  produces something complete and usable. Readied already proves this is achievable.
- **A model-independent core.** Route through one internal gateway so the provider can change
  without touching product code.

### Cost control

With no accounts and open proxies, current AI spend is uncapped and unattributable. The rebuild must
give every generation an owner, a cost and a budget: per-account monthly generation allowances,
cached deterministic output where the inputs have not changed, small fast models for extraction and
larger ones only for the final prose pass, and a hard account-level cap that degrades to the
deterministic path rather than failing. This is also the mechanism that makes the free tier safe to
offer.
