# 5. Branding evaluation, colour direction and design system

Covers deliverables 11, 12 and 13.

The brand manifest is treated here as strategic input to be tested, not a specification to
implement — which is what it asks for ("Everything here is a proposal to react to").

---

## 11. Branding evaluation

### The short version

The manifest is the strongest strategic document in the project. Three parts of it are excellent and
should be locked. Two are wrong and should be changed. One is a genuine open question that only the
product owner can settle.

| Element | Verdict |
|---|---|
| The voice rule — "give permission, never name the burden" | **Lock it.** Best decision in the document. |
| The outbound/inbound positioning | **Lock it.** Real, defensible, differentiating. |
| No italic display type | **Lock it.** Correct and unusually well-reasoned. |
| Newsreader + Figtree | **Keep**, with a caveat on the interface face. |
| The colour palette | **Revise.** Direction right, values fail accessibility. See below. |
| "Raspberry once per session" | **Revise.** Right instinct, wrong mechanism. |
| Two named apps, no masterbrand | **Disagree.** See 11.4 and `06`. |
| "MML / My Mental Load" as the umbrella | **Contradicts the voice rule.** See 11.5. |
| The names themselves | See `04`. |

---

### 11.1 The voice rule is the most valuable thing in the document

> *"Parents already know what they're carrying. Reciting it back is not empathy — it's pressure.
> Copy that lists the 11pm texts and the invisible labour is selling the problem. We sell the exit."*

This is a genuine strategic insight and it is rare. The entire mental-load category markets by
describing the burden back to the sufferer, which produces recognition ("yes, that's my life") but
also produces the feeling of being seen as a person who is failing. The manifest's alternative —
sell the exit, not the problem — is both kinder and commercially smarter, because relief converts
better than recognition.

The table of examples is correct on every line. "You can leave now" is a better headline than
anything in the current apps or, on the evidence, anything in the category.

**Lock it. Write it into the design system as a copy rule with the examples. Enforce it in review.**

The one thing to add: the rule needs a French twin, written by a French speaker rather than
translated. *"Vous pouvez y aller"* carries the permission; a literal translation of most of the
English lines will not. The manifest already says French and English must both sound like a person
rather than a translation — that needs a named owner and a budget, because it will not happen by
default.

### 11.2 The positioning is right and should be defended

Inbound (take your email, calendar and WhatsApp, hand back a summary of your own week) versus
outbound (take what is in your head, give it to somebody else). Every funded competitor is inbound.
Outbound is cheaper to build, far less privacy-invasive, and does something inbound structurally
cannot: it moves knowledge *out* of one person's head, which is the only thing that actually reduces
their load. Summarising your week back to you does not reduce anything.

This positioning also has a defensive property worth naming: it keeps the product out of a
head-on fight with funded calendar/assistant companies, and it keeps it out of the deep integration
work (Gmail scopes, calendar sync, WhatsApp) that would consume the entire engineering budget.

**Lock it.** And apply it as a filter: any proposed feature that requires ingesting the family's
existing digital exhaust is out of scope by definition.

### 11.3 Typography

**"Never italic display type" is the sharpest observation in the manifest.** High-contrast italic
serif is the visual signature of the entire calm-premium-lifestyle category, and both existing apps
use it — Held's `.guide-names` and `.success-h` are `Fraunces` at `font-style: italic; font-weight:
300`. Moving to upright reads bookish rather than aspirational, and that is a meaningfully different
register. Agreed, and it does more differentiation work than the palette does, as claimed.

**Newsreader** for display: good choice. Free, variable, genuinely bookish, and unusual enough in
product UI to be recognisable. Two cautions: at small sizes it loses the character that justifies it,
so set a floor (roughly 20 px) below which it is not used; and its variable axes need to be pinned
to a small set of tokens or the interface will drift.

**Figtree** for interface: fine, but this is the weakest of the type decisions. Figtree is a
pleasant, extremely neutral geometric sans that is now very widely used, and it will do nothing to
distinguish the product. Its numerals and its narrow tabular behaviour are also unremarkable, which
matters because both surfaces are full of times, quantities and dates (`07:30`, `180 ml`, `4 nights`,
`2 ×`). Worth evaluating alongside a face with better figures and a tighter small-size fit — Inter
(for figures and screen legibility), Public Sans, or Söhne if a licence is acceptable. **This is a
low-stakes decision and not worth blocking on; Figtree is good enough to ship with.** But test it
against a screen of quantities before locking it.

Both faces must be **self-hosted** rather than loaded from Google Fonts. The current apps take a
render-blocking third-party request on every load, which is a performance cost and a GDPR wrinkle
(Google Fonts serving European users has been found problematic in German case law). Self-hosting
fixes both.

### 11.4 "Two named apps and no masterbrand" — I disagree

The manifest raises this as an open question and notes the cost: two names means two trademark
registrations. The cost is much larger than that.

Two independently named apps with no masterbrand means:

- Two acquisition stories to tell, two SEO surfaces to build authority on, and no compounding — a
  person who loves the care guide app has no reason to discover the packing app, because nothing
  connects them.
- No vehicle for the third, fourth or fifth product. Each new one starts from zero.
- No brand-level trust asset. Trust in a product handling children's health data is expensive to
  build and should accrue somewhere durable, not be rebuilt per app.
- Two trademark registrations *and* two domain portfolios *and* two privacy policies *and* two App
  Store listings — for a solo founder, this is the tail wagging the dog.

**Recommendation: an endorsed-brand architecture.** One masterbrand that owns the account, the trust,
the privacy relationship and the subscription; named surfaces beneath it that carry the emotional
weight and the marketing story. The lockup is `[Surface name]` with `by [Masterbrand]` set quietly
beneath — which is, notably, exactly what both current apps already do ("Held — My Mental Load",
"Readied · My Mental Load"). The instinct is already there in the code.

The unresolved part is *which* masterbrand, which is 11.5.

### 11.5 "MML / My Mental Load" breaks the brand's own best rule

This is the most important brand finding in this document, and it is a direct conflict inside the
material as supplied.

The voice rule says: **never name the burden.** The masterbrand is called **My Mental Load**. It is
printed under the product name on every screen of both apps.

*"Held — My Mental Load"* says, in two lines: here is your relief, and here is the thing you are
suffering from. The manifest's own "write this / not this" table rejects *"The mental load, finally
solved"* as marketing copy — and then the brand architecture puts the burden in the permanent
lockup, where it appears more often than any piece of copy ever will.

There are further problems:

- **It is descriptive, which makes it weak as a trademark** — the same objection the manifest
  correctly raises against "Held".
- **It is a category term owned by a discourse**, not by a company. Eve Rodsky, Emma's *Fallait
  demander*, Allison Daminger's cognitive-labour research. Building a masterbrand on it means
  building on shared vocabulary.
- **It frames the customer as a sufferer**, permanently, in the one piece of brand furniture that
  never changes.
- **It gendered-codes the brand.** "Mental load" is, in practice, a phrase used by and about mothers.
  If a stated goal is redistributing work between two parents, the masterbrand should not signal that
  this is the mother's app for managing her problem.
- **"Charge mentale" does not carry over cleanly** as a product name in French; it is a diagnostic
  term there too.

The brief is explicit that MML stays and that renaming it is not the objective of this project. I am
respecting that — **nothing in the roadmap depends on renaming it, and I am not proposing a rename
as a task.** But the brief also says to flag an exceptionally strong strategic reason if research
reveals one, and I think the conflict between the masterbrand and the brand's own governing voice
rule is exactly that. It is a genuine product-owner decision and it appears in `10` as **D2**, framed
with three options rather than a demand.

The narrow version of the decision, which is much easier: **whatever the legal entity is called, the
words "My Mental Load" do not have to appear in the product.** "MML" as an initialism is nearly inert
— it names nothing and burdens nobody. Keeping MML as the corporate and legal identity while never
expanding the acronym in the interface resolves most of the tension at zero cost.

### 11.6 The colour palette — direction right, values need work

**The strategic idea is correct.** Warmth from the ground rather than the accents; quiet accents so
the content is what you look at; siblings distinguished by accent alone. That is a good system and
it is a real improvement on the current state, where Held is forest green and Readied is clay and
they look like products from different companies.

**But the accessibility claims in the manifest do not hold.** I measured every pair. Results, all
computed against WCAG 2.2 (4.5:1 for normal text, 3:1 for large text and for UI component
boundaries):

**The stated rule — "All button fills clear 4.5:1 against white text":**

| Fill | vs white | AA normal |
|---|---|---|
| Lisette blue `#52738A` | **5.03** | pass |
| Jeannette petrol `#377278` | **5.47** | pass |
| Jeannette border `#3E7C82` | **4.76** | pass |
| Lisette border `#5D7F96` | **4.25** | **fail** |
| Raspberry `#D9577E` | **3.74** | **fail** |

The two border shades are excused by the manifest's own rule that they are for 3 px accents only and
never as a fill behind text — that rule is correct and should be kept. **Raspberry is not excused.**
It is defined as the completion colour, and completion states are exactly where a filled badge or
button with white text appears. At 3.74:1 it fails AA for normal text.

**Muted text fails on both surfaces:**

| Pair | Ratio | Verdict |
|---|---|---|
| Muted `#7C7468` on ground `#EFE7DA` | **3.76** | fails AA for body text |
| Muted `#7C7468` on card `#FAF6F0` | **4.28** | fails AA for body text |

Muted text is used for the secondary line under almost everything. At these values it fails for a
person with normal vision in good light, let alone the manifest's own stated user: *"a stressed
person in bad light with one hand free."*

**Accent-coloured text on the page background fails:**

| Pair | Ratio |
|---|---|
| Lisette blue on ground | **4.10** |
| Jeannette petrol on ground | **4.46** |
| Raspberry on ground | **3.05** |

So a link, or a coloured label, set on the beige page fails AA. It passes on the card
(`4.67` / `5.08`) but not on the ground, which means the same token is compliant in one place and
not in another — the most dangerous kind of failure, because it will pass a spot check.

**Dark mode has one hard failure:**

| Pair | Ratio | Verdict |
|---|---|---|
| Raspberry `#D9577E` on dark card `#39434B` | **2.70** | fails even for large text |
| Raspberry on dark ground `#2B333A` | **3.43** | large text only |
| Muted `#A8A093` on dark card | **3.90** | fails for body text |

Raspberry is unchanged between light and dark. It cannot be — it needs a lighter dark-mode variant.

**Surface separation is very low.** Card against ground is **1.14:1** in light and **1.27:1** in
dark. That is close to invisible. The consequence is not a compliance failure (WCAG does not require
surface contrast) but a usability one: card boundaries will effectively not exist in bright sunlight
or on a cheap screen. The fix is not more contrast between the fills — that would break the calm
ground-carries-the-warmth idea — it is **a visible 1px border on every card**, with the border
meeting 3:1 against both surfaces.

**For fairness, the current palettes are worse.** Held's muted `#A8B8B0` on linen is **1.99:1** and
its secondary `#7A8E85` is **3.34:1**. Readied's warning gold `#C99A3E` on linen is **2.42:1** — and
it is used for warning text, which is the worst possible place for the lowest-contrast colour in the
system. The proposed palette is a clear improvement; it just is not yet compliant.

**Recommended revisions** (direction preserved, values corrected):

| Role | Proposed | Revised | Reason |
|---|---|---|---|
| Muted text (light) | `#7C7468` | darken to ≥ **4.5:1** on ground | body text must pass |
| Accent-as-text | same as fill | separate **`--accent-text`** token, darker | text and fill have different jobs |
| Raspberry (light) | `#D9577E` | darken for fill-with-white-text; keep the current hue as a **surface/edge** colour only | 3.74:1 is not enough for a filled state |
| Raspberry (dark) | `#D9577E` | lighten to ≥ 4.5:1 on card | 2.70:1 is a hard failure |
| Card | fill only | add **`--border-card`** at ≥ 3:1 | cards must exist in sunlight |

None of this changes the strategy. It changes six hex values and adds three tokens.

### 11.7 "Raspberry appears once per session" — right instinct, wrong rule

*"It stops working the moment it becomes decoration"* is exactly right. But "once per session" is not
implementable in any honest way: sessions are not well-defined in a PWA that is backgrounded and
resumed, and the rule would mean the second of two completions in one sitting is rendered as a
non-event.

Restate it as a **semantic** rule rather than a **counting** rule:

> Raspberry means *finished*. It appears only at the moment a thing is completed, and it appears
> nowhere else in the interface — not on primary buttons, not on links, not on progress, not on
> errors, not on decoration.

That preserves the intent (it stays rare because completions are rare), is enforceable in code as a
single `--accent-complete` token used by exactly one component, and does not misfire.

### 11.8 What the manifest gets right that is easy to lose

- **"Not a family operating system."** The single most valuable constraint in the document. It rules
  out the entire feature set that has killed this category.
- **"We do one moment well."** Keep as the feature filter.
- **"Not aspirational. No women in sunglasses."** Correct, and it rules out the stock photography
  that would otherwise creep in.
- **"Warm does not mean vague."** This is the line that should govern the palette revisions above.
- **"Legible to a stressed person in bad light with one hand free."** This is an accessibility
  requirement written in brand language, and it is a better brief than most accessibility policies.
  It is also, as measured, not currently met.

---

## 12. Recommended colour and design direction

### The model: one system, per-surface accent

```
STRUCTURE — identical across every surface
  ground, card, border, ink, muted, focus ring, radii, spacing, type scale, motion

ACCENT — one variable, swapped per surface
  --accent            fill for primary actions
  --accent-text       accent used as text (darker; separate token)
  --accent-edge       3px borders and accents only
  --accent-subtle     tinted background wash

SEMANTIC — identical across every surface, never accent-coloured
  --complete          the raspberry role, one component only
  --critical          allergies, medication, "read this first"
  --warning
```

Two surfaces cannot be told apart by structure, spacing, type or tone — only by accent. Held and
Readied currently differ in accent *and* type scale *and* card radius *and* shadow *and* button
shape, which is why they read as unrelated products.

**Per-person colour** (the thing Colour Keeper may be about) is a fourth, separate scale, with its
own rules: every value verified against both surfaces at 3:1; distinguishable under deuteranopia,
protanopia and tritanopia; and **always paired with a symbol**, so colour is reinforcement and never
the only carrier of identity. Held's existing `KID_IDENTITIES` array already pairs colour with an
emoji, which is the right shape — the values just need verifying.

### Hierarchy without heaviness

The brand wants calm, and calm is usually achieved by flattening contrast — which is what produces
the accessibility failures above. The way out is to build hierarchy from **size, weight, space and
position** rather than from colour intensity. Ink stays at 7.86:1 and does the work; the accent is
used sparingly and never as the only signal; muted text is used less, and is legible when used.

### Dark mode

Ship it. Both apps already have it and it is genuinely used by this audience — bedside, at 11pm, in a
dark hallway on the way out. It needs its own verified values rather than an inversion, and it needs
the raspberry fix above.

### Motion

Both apps already use restrained transitions and Readied's breathing cue on the generation screen is
the best moment in either product. Codify: 150–250 ms, ease-out, no bounce, no confetti, full
`prefers-reduced-motion` support. Motion signals state change; it never celebrates.

### What "premium" means here

Not gloss, not gradients, not glass. Premium in this category means: it loads instantly, nothing is
misaligned, the document you produce looks like it was designed, the French reads like French, and
nothing ever shouts at you. That is achievable with this palette and this type, and it is mostly an
execution-quality question rather than a visual-design one.

---

## 13. Design system architecture

### Layered tokens

Three layers, because per-surface theming and dark mode both need a semantic indirection:

```
1. PRIMITIVE   raw values, referenced by nothing but layer 2
   --blue-600: #52738A;  --space-4: 16px;  --text-lg: 18px;

2. SEMANTIC    role names — this is what components use
   --surface-page, --surface-card, --border-card,
   --text-primary, --text-muted, --text-on-accent,
   --accent, --accent-text, --accent-edge, --accent-subtle,
   --complete, --critical, --focus-ring

3. COMPONENT   only where a component genuinely needs an override
   --button-primary-bg: var(--accent);
```

Light/dark swaps layer 2. Per-surface accent swaps a handful of layer-2 values via a
`data-surface="handover"` attribute on a wrapper. Components never reference layer 1. This is
enforceable with a lint rule.

### Scales

- **Spacing:** 4 px base — 4, 8, 12, 16, 24, 32, 48, 64. No arbitrary values.
- **Radii:** three only — 8 (controls), 16 (cards), 999 (pills). Both current apps use 8/10/11/12/13/
  14/15/16/18/24 more or less at random, which is a large part of why they feel unresolved.
- **Type:** a fixed scale with Newsreader above 20 px and the interface face below.
- **Elevation:** two levels. Prefer borders to shadows; shadows do not survive print or PDF export,
  and export is a primary output of this product.

### Component inventory

**Foundations:** Button (primary / secondary / quiet / destructive), Input, Textarea, Select,
Checkbox, Radio, Chip (single and multi-select, with `aria-pressed`), Stepper, Segmented control,
Time and Date input, Field (label + hint + error, wired for `aria-describedby`).

**Layout:** Card, Section, List row, Sheet, Modal, Toast (with the working Undo pattern from
Readied), Page header, Sticky footer action bar.

**Patterns:** Question step (the unit both flows are built from), Progress, Person avatar
(colour + symbol), Person picker, Empty state, Loading state, Error state with a route forward, AI
suggestion card (proposal + interpretation + accept/dismiss), Critical fact banner, Share sheet,
Document renderer (screen / print / PDF / image — one component, four targets).

**Documented states for every component:** default, hover, focus-visible, active, disabled,
loading, error, and empty. Both current apps have components with no focus state at all.

### Accessibility, built in rather than audited later

- Every interactive element is a real `<button>` or `<a>`. No `<div onclick>`.
- Visible `:focus-visible` ring on everything, at 3:1 against its background.
- Minimum target 44 × 44 px. Readied mostly meets this; Held's emoji picker does not.
- **Remove `maximum-scale=1.0, user-scalable=no`** from both apps. This is a one-line fix that
  removes a WCAG failure, and it can be done immediately, independently of everything else.
- Focus moves to the new step heading on navigation, and the change is announced.
- Loading and error states are live regions.
- Colour never carries meaning alone.
- axe-core in CI on every route.
- Manual VoiceOver pass on the three critical journeys before launch.

### Distinctiveness within one family

The rule: **surfaces are siblings, not twins** — the manifest's own phrase, and it is the right one.
Same ink, same ground, same spacing, same type, same components, same voice. Different accent,
different iconography motif, different tempo of copy. A person who has used one should find the
other immediately familiar and still know which one they are in.

The masterbrand endorsement (`[Surface] by [Masterbrand]`) is set in the interface face at small
size, low emphasis, and appears once per screen at most — in the header on the surface's landing
view, and in the footer of every generated document. Never twice on one screen, which both current
apps do.
