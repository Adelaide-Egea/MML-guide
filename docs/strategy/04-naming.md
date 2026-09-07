# 4. Naming territories and candidate names

Deliverables 9 and 10. Research conducted 7 September 2026.

**Verification status, up front, because it matters.** Domain data was verified by RDAP against the
authoritative registries (Verisign, Nominet, AFNIC, Google Registry, Identity Digital). App Store
data was verified against Apple's public search API on the GB and FR storefronts. **Trademark
registers could not be reached** — UKIPO returned 403, TMview timed out, EUIPO's search API is not
publicly exposed, USPTO rejected programmatic access. Everything trademark-related below comes from
third-party indexes and general search. **It is triage, not clearance.** It tells you which names are
obviously dead, not which are safe.

---

## 4.1 The architecture question comes first, and I want to push back hard

The brand manifest proposes a system of French female diminutives — Lisette for the care guide,
Jeannette for packing, with Odette, Colette, Mariette and others held in reserve for future apps.
Individual name problems are fixable. **This one is architectural, and I think it should be
abandoned.** Three independent lines of evidence.

### It fails Aaker's own test for a house of brands

The Brand Relationship Spectrum (Aaker & Joachimsthaler, *California Management Review* 42:4, 2000)
is the standard framework, and Aaker's default recommendation is the **branded house**, with
independent naming requiring positive justification. The justification is *incompatible positioning*
— prestige versus budget, or brands that must not contaminate each other.

**Two apps sold to the same parents, solving adjacent problems in the same household, have no
incompatible positioning to protect.** They fail the test on the framework's own terms. What you give
up by naming them separately is the halo effect: with a branded house, every euro spent building
awareness of one product builds the other. Concretely, for a two-app portfolio that means three
domains and three link-authority pools instead of one; two App Store listings each starting at zero
ratings and competing for their own brand terms; no shared brand-search demand in paid acquisition;
no reason for a delighted care-guide user to infer the packing app exists or is any good; and three
clearance searches, three filing families across UK/EU/FR, three renewal cycles and three watch
services as a recurring line item.

I found **no successful precedent** for a small consumer company running multiple human-named apps as
separate brands. The successful small-portfolio pattern is uniformly branded house or sub-brand:
Notion, Linear, Bear, Things. Where independent names appear at small scale — 37signals with Basecamp
and HEY — the company runs very few and funds each as a full standalone business.

### The `-ette` suffix reads as "small, fake, feminine" in English

This is the strongest linguistic finding and it applies to the *system*, not to any one name. `-ette`
entered English from French and now carries three senses, all liabilities for a premium product:
**small or lesser** (kitchenette, novelette, launderette), **imitation** (leatherette, flannelette),
and **female, usually diminishing** (suffragette, usherette, majorette, bachelorette, ladette).

Oxford University Press on *suffragette*: the suffix was *"a diminutive and was often seen as
trivialising in intent, as well as distinctly patronizing"* — and its leatherette sense meant that
*"just as leatherette was a fake version of leather, so too, by implication, were the suffragettes
'fake'… versions of the suffragists."* Deborah Cameron's analysis finds the femininity these coinages
evoke is *"immature and unthreatening: more cute, bubbly and fun-loving than competent."*

**The crucial mechanism:** a single `-ette` name is stored as a whole word and doesn't trigger this.
Juliette is just a name. But a *family* of them, presented together, makes the morpheme salient. Once
someone notices "Lisette, Jeannette, and soon Odette", the suffix becomes visible and the diminutive
reading activates. **This risk exists only because of the architecture.** Note the irony: Answer.AI
uses exactly this suffix for its libraries precisely to signal "a small helper for the real thing."

### A feminine-coded parenting product measurably fails to reach fathers

This is the most serious finding in the naming research, because it is a direct hit on the stated
product goal rather than a branding nicety.

Donelle et al. (Western University, 2021) found parenting apps are *"very 'female.' Even the colour
schemes are yellow or pink and have flowers"* — producing *"a perpetually pink domain aimed mostly at
new mothers, and only parenthetically directed at new dads."* Fathers *"don't see themselves
represented in the available resources or they believe father-focused resources aren't as serious or
as trustworthy."* When the researchers recruited "all parents", only mothers responded.

Thomas & Lupton's discourse analysis of pregnancy apps found many *"condescend to expectant fathers
and trivialize their role."* *The Conversation*'s summary: *"There is no need to create gendered
apps… If app developers come to recognise this and make their apps more gender-neutral they may be
able to reach a much broader market."*

And the specific pattern proposed — a female first name attached to a domestic-labour helper — is the
one UNESCO formally recommended against in *I'd Blush If I Could* (2019). Female-gendered assistants
signal that women are *"obliging, docile and eager-to-please helpers, available at the touch of a
button."* The report's **first recommendation** is to end making digital assistants female by default,
and it notes female voices were chosen deliberately for assistants tied to household products while
navigation assistants more often got male ones.

**The synthesis.** Giving a female first name to a product whose job is to carry domestic labour
reproduces, at the level of the brand, the exact arrangement the product exists to dismantle: a woman
holding the household in her head. A father opening an app called *Lisette* — a name that in French
literally denotes a housemaid — is told, before he sees a single screen, that this is not addressed
to him. Section 3.7's whole argument is that the product works because the second person doesn't have
to adopt anything; but the *second parent* still has to feel invited.

### Human first names work for products you talk *to*, not products you work *with*

| Product | Outcome |
|---|---|
| Alexa, Siri, Cortana | Succeeded as conversational interfaces; became the textbook gendered-AI criticism. Cortana retired |
| **Amy & Andrew Ingram (x.ai)** | **Failed.** Launched 2014, acquired by Bizzabo 2021, product sunset 31 Oct 2021 |
| Clara (Clara Labs) | Same category, quietly absorbed |
| Otter, Jasper | Succeeded — and both are animal/generic nouns, not human first names |
| Claudette / Cosette / Lisette (Answer.AI) | Work well — as *developer library* names, where the whimsy honestly signals "small helper" |

A human name creates the expectation of an agent with a personality. The care guide produces a
structured document; the packing app produces a list. Neither is a conversational agent, and naming
them as if they were sets an expectation the product cannot meet.

### Where the family-names idea *should* live

Not in the brand architecture, where it is expensive and permanent. **Inside the product**, where it
is charming and reversible: a named guide format, a named mode, a named seasonal template. If a
conversational assistant is ever built, that is the right place for a human name — and at that point
choose one deliberately, with the UNESCO finding in view.

**Recommendation: a branded house.** One strong, non-gendered, non-diagnostic masterbrand, with the
surfaces as functional sub-names beneath it. That single decision resolves the `-ette` problem, the
gender problem, the SEO and paid-acquisition fragmentation, and roughly two-thirds of the trademark
cost.

---

## 4.2 The proposed names, individually

Even setting architecture aside, most of the shortlist is unusable. The two headline names are not
merely crowded — each has a meaning that is specifically wrong for the product it was assigned to.

### Lisette — three live conflicts, and the worst one is thematic

**Answer.AI ships a Python library called Lisette** (PyPI, GitHub, its own docs site) — a LiteLLM
wrapper, part of a deliberate family: Claudette (Anthropic), Cosette (OpenAI), Gaspard (Gemini),
Lisette (LiteLLM). The precise "French female diminutive" convention proposed here is **already an
occupied idiom in AI tooling.**

**Lisette is French theatre's archetypal *soubrette* — the maid.** She is the servant character in
**seventeen** of Marivaux's comedies; Lessing borrowed the role-name for five more. A standard French
literature resource makes the point explicitly: *"le diminutif «-ette» de Lisette suggère la position
hiérarchiquement inférieure du personnage."* **Naming a babysitter-handover app after French
literature's most recognisable housemaid is a strategic problem**, because the product's entire
positioning depends on the carer being a trusted person rather than staff.

Also live: **Lisette** womenswear sewing patterns (Liesl Gibson, under Butterick since 2015) and
**Lisette-L Montreal**, a Canadian apparel manufacturer, ~65 staff. The latter appears to hold **US
registration 7166587** (filed 2018, registered Sept 2023) in classes **9, 18, 25, 35** — though the
class 9 goods are *phone cases*, not software, so the specification is narrow.

### Jeannette — a common French noun for an ironing board

The *Dictionnaire de l'Académie française* gives three senses; the everyday modern one is **"planche
à repasser de petites dimensions… employée pour le repassage des cols, poignets, emmanchures"** — the
small board for pressing sleeves and collars. **Larousse gives the ironing board as the only
definition.**

For a French-market app about **domestic logistics**, this is not a neutral coincidence. It is the
single most on-the-nose drudgery object in the French home.

And **Biscuiterie Jeannette** is far stronger than "a madeleine brand." Founded 1850, ~40% of the
French madeleine market by volume in the 1970s, nearly died in 2013, **saved by a 344-day worker
occupation and crowdfunding**, relaunched 2015, 175th anniversary in 2025 with a France 3 serialised
documentary, *Entreprise du Patrimoine Vivant* label, factory tours. A beloved, media-active heritage
brand with a resistance narrative. In France, Jeannette means madeleines; your app would be second.

*One item checked and cleared:* I found no evidence that *jeannette* carries a pejorative slang sense
for an effeminate man in current French. The adjacent term is *Jeanneton* (19th-century argot for a
servant girl of loose morals).

### The rest of the shortlist

| Name | Verdict | Why |
|---|---|---|
| **Ninon** | **Disqualified** | Apple's search treats it as a misspelling of **Nikon**. Searching "ninon" on the GB *and* FR App Store returns SnapBridge, Nikon Wireless Mobile Utility, Flickr, Lightroom, Canon, NIKON IMAGE SPACE. You would compete against a global camera brand for your own name, permanently, with no recourse. Separately: *ninon* is English for sheer curtain fabric; Ninon de l'Enclos was a courtesan. Also **helloninon.com was registered 16 May 2026 via a French registrar** — someone may be building a Ninon brand now |
| **Cosette** | **Strike immediately** | In *Les Misérables*, a child exploited as unpaid domestic labour by the Thénardiers. For an app about handing your children to a carer, the worst available connotation in French literature. Also an Answer.AI library |
| **Lucette** | **Drop** | **A prescription combined oral contraceptive pill sold in France.** For a French product aimed at mothers, a name that returns contraceptive results is a hard no. Also a former Paris cosmetics startup, acquired 2020 |
| **Odette** | Drop | **Odette International** is the European automotive standards body — it owns the OFTP/OFTP2 protocol used across the industry and issues "Odette IDs". An established B2B tech brand, not a passive holder |
| **Colette** | Drop | The Paris concept store closed in 2017 doing €32M/year and Andelman **refused to sell the name**; it returned as a Grand Palais pop-up in autumn 2025. The equity is actively curated. Nine competing App Store results |
| **Aliette** | **Cleanest of the set** | See below |
| **Mariette** | Credible second | One adjacent US registration in animal feed. App Store search dilutes it toward *Marie Claire* |
| Margot, Juliette, Manon, Elise, Suzette, Babette, Josette, Henriette | Drop | Crowded App Store, strong cultural referents, or both |

**Aliette** is the one name that clears every gate I could check: **zero App Store results on GB and
FR**, `.co.uk` / `.app` / `.family` free, every compound `.com` free (getaliette, alietteapp,
usealiette, helloaliette), no software or SaaS use found, no unfortunate meaning. Its liability is
**Aliette® — a registered Bayer trademark** for a fosetyl-aluminium fungicide, in commercial use
since 1978. That is Nice class 5, about as far from class 9/42 consumer software as it is possible to
get, but Bayer is a well-resourced enforcer and a reputation-based objection (Art. 8(5) EUTMR / s.5(3)
TMA) needs a lawyer's opinion, not a search engine's. Secondary association: Aliette de Bodard, an
award-winning SF novelist — a person, not a brand.

*Note:* the `.fr` domains for Aliette, Ninon, Mariette and Henriette are all held via **NAMECARE**, a
corporate brand-protection registrar. That is consistent with defensive registration by a large
company, though WHOIS redaction means the registrant could not be confirmed.

---

## 4.3 Domains: the structural picture

Three facts dominate.

1. **Every bare `.com` on the shortlist is registered.** Several are explicitly brokered —
   lisette.com and jeannette.com on Afternic nameservers, babette.com on Squadhelp, suzette.com on
   GoDaddy NameFind. Acquirable in principle, likely four to five figures.
2. **Every bare `.fr` is registered.** For a France-first strategy this is the sharpest constraint in
   the whole exercise. Note also that `.fr` requires an EU/EEA/Swiss presence post-Brexit — fine via a
   French entity, not via a UK one.
3. **`.co.uk`, `.app` and `.family` are where the room is.** `.app` was free for Lisette, Jeannette,
   Aliette, Ninon, Mariette, Cosette and Suzette; `.family` free for nearly everything; `lisette.co.uk`,
   `aliette.co.uk`, `lucette.co.uk`, `ninon.co.uk` all free. `.app` is on the HSTS preload list so it is
   HTTPS-only, which is fine for a modern web app and reads as deliberate rather than as a fallback.

**Practical implication for the branded house.** Aim for one bare `.com` for the masterbrand — this is
the domain worth paying for, because in a branded house it is the *only* one that has to carry
authority — plus `.fr` and `.co.uk` for the same word. Surfaces then live at paths
(`brand.com/handover`), not on their own domains, which is precisely the SEO consolidation the
architecture is meant to buy.

---

## 4.4 Naming territories

Five territories, tested against the criteria in the brief. Territory 1 is where I would go.

### Territory A — Handover (recommended)

**Concept.** Name the moment of transfer, not the burden and not the helper. The product's entire
differentiation is that knowledge moves *out* of one head and into another; the naming should say so.

- **Emotional positioning:** competent, warm, unbothered. Nobody is failing; something is being passed
  on, the way it is between professionals.
- **Linguistic logic:** ordinary transfer vocabulary — pass, hand, relay, brief, keys, threshold.
- **Relationship to MML:** describes the mechanism the umbrella brand exists to perform.
- **Scalability:** strong. A handover is a general shape: to a carer, to a trip, to a colour scheme,
  to next term. Each future surface is a different *thing* being handed over.
- **Gender:** neutral by construction. Solves §4.1's third problem outright.
- **French:** excellent, and this is the strongest argument for the territory. *Transmission*,
  *relais*, *passation*, *le relais* all read naturally, and *cahier de transmission* is already the
  established French frame (§3.5). **A territory that speaks French natively is worth a great deal to
  a France-first strategy.**
- **Risk:** "handover" is descriptive in English, so bare descriptive words are weak marks. Use a
  metaphor within the territory (Relay, Baton, Threshold) rather than the literal word.

**Candidates:** **Relay** / **Relais**, **Baton**, **Passe**, **Overlap**, **Doorstep**,
**Threshold**, **Handoff** *(taken — a direct competitor)*.

**My preference within it: Relay / Relais.** It is the same word in both languages with the same
meaning and near-identical spelling; it means a deliberate, practised, trusted transfer between people
running the same race; it is warm without being cute; and it is completely non-gendered. Its cost is
crowding — "relay" is a common English word with existing software uses, so clearance work and a
compound `.com` are likely. Worth the effort.

### Territory B — Carried / Held-by-something

**Concept.** The existing *Held* instinct, generalised: the feeling of something being taken off you.

- **Emotional positioning:** relief, safety, being supported.
- **Scalability:** moderate. Emotional-state names describe how the *user* feels, which becomes
  repetitive across a portfolio.
- **French:** weak. *Tenu*, *porté*, *soutenu* are all awkward as brand names.
- **Risk:** these are exactly the crowded wellness-adjacent words. "Held" itself is heavily used.
- **Candidates:** Carry, Kept, Steady, Anchor, Ballast, Lighter.

### Territory C — The artefact

**Concept.** Name the thing produced — the note, the card, the guide.

- **Emotional positioning:** practical, reassuring, tangible. Low promise, high credibility.
- **Scalability:** good, and it maps cleanly to a branded house where surfaces are named by output.
- **French:** good — *fiche*, *carnet*, *mémo*, *le petit carnet* are all natural.
- **Risk:** unambitious, and descriptive-artefact names are weak trademarks. Also puts you closer to
  the £3 Etsy PDF anchor in perception, which §3.2 says is the thing to escape.
- **Candidates:** Carnet, Fiche, Ledger, Brief, Docket, The Card.

### Territory D — Domestic place

**Concept.** Hearth, doorway, table, key hook — the physical furniture of a household.

- **Emotional positioning:** rooted, calm, homely.
- **Scalability:** good — a house has many rooms and objects.
- **French:** mixed. *Foyer* is lovely but also means a care home. *Seuil* (threshold) works well.
- **Risk:** **heavily colonised.** Hearth is a $699 competitor; Nest is Google's; Hive is British Gas.
  This is the most crowded territory in consumer software.
- **Candidates:** Seuil, Landing, Porch, Keyhook, Mantel.

### Territory E — Invented / abstract

**Concept.** A coined word with no dictionary meaning.

- **Emotional positioning:** whatever you invest in it; nothing at the start.
- **Scalability:** unlimited. **Trademark position: the strongest available** — invented marks are
  inherently distinctive and registrable across all classes.
- **French:** controllable by construction.
- **Risk:** requires marketing spend to install meaning, which §3.6 says you will not have — organic
  and community are the only affordable channels here, and they reward names that explain themselves.
- **Verdict:** the right answer for a funded company, the wrong answer for this one.

---

## 4.5 The masterbrand problem — this is now the most urgent naming decision

The brief says not to redesign the project around changing the MML name, and I have not. But the
research turned up a strategic reason serious enough that the brief's own exception clause applies,
so I am putting it plainly and leaving the decision with you (`11-decisions-required.md`, D2).

**1. "My Mental Load" is probably unregistrable as a word mark.** Under s.3(1)(c) TMA 1994 and Art.
7(1)(c) EUTMR, a sign is refused if it consists exclusively of indications designating the kind or
intended purpose of the goods. EUIPO guidance applies this where the sign *"is immediately perceived
by the relevant public as providing information about the goods and services applied for."* "MY
MENTAL LOAD" for software that manages the mental load is close to a paradigm refusal, and "My" is
unlikely to rescue it. Realistic outcomes are a figurative mark with a disclaimer on the words, or a
long acquired-distinctiveness route requiring evidence you do not have. Either way you hold rights you
cannot enforce against a competitor describing their product accurately.

**2. Competitors already own the term as a brand.** *Mental Load* (an AI household companion),
*Mental Loadless* (shipping iOS app, FR+EN, €3.99/mo), *Tribe Family* (computes a "Mental Load
Score"), *The Mental Load Project*, *The Mental Load Chronicles*, AlphaMa, The Mom App. **These are
not name collisions — they are competitors, and several are further along.**

**3. MOLO is a near-homophone in your home market.** London-based, VC-backed, *"makes the invisible
load visible, manageable, and shared"*, trademarked *The Modern Load™*. **MOLO / MML** is close
enough to cause real confusion in a category where you are both selling to London parents.

**4. "MML" as an acronym is crowded and, worse, empty.** MML Capital Partners is a London private
equity firm founded 1988 with €2.7bn AUM, 150 portfolio companies and French offices. MML is also
Music Macro Language. But the deeper problem is semantic emptiness: three-letter acronyms carry no
meaning until you have spent enough to install one, and a consumer app portfolio cannot buy that. An
acronym standing for a phrase you have decided not to say aloud is a phrase in a trench coat.

**5. It contradicts the brand voice rule in the most visible place possible.** The manifest's rule is
*"give permission, never name the burden."* A masterbrand called *My Mental Load* names the burden in
the logo, the App Store listing, the email sender name, the receipt, the push notification and the
home-screen icon. The voice guide forbids in body copy exactly what the masterbrand does at maximum
volume — and the masterbrand wins, because it is more visible. **And §3.6 shows this is not merely
inelegant: guilt-adjacent framing measurably backfires through moral licensing.**

**Three coherent resolutions, in my order of confidence:**

1. **Change the masterbrand** to something embodying permission rather than diagnosis, and keep
   "mental load" / *charge mentale* as **category vocabulary** — in SEO copy, App Store keywords, and
   press, where naming the problem is how you get found. This is the standard split: the category term
   is how people search; the brand name is how they feel. It gets you the searchability and instant
   comprehension without the trademark problem, the competitive collision, or the voice contradiction.
2. **Keep it and accept the brand is problem-framed**, rewriting the voice guide to match. Coherent,
   but it discards the differentiator and puts you in a direct naming fight with Mental Loadless and
   MOLO.
3. **Retreat to "MML"** and hope the expansion fades. **The worst option** — you keep the descriptive
   baggage for anyone who looks it up while forfeiting all the searchability that made the phrase
   attractive in the first place.

**On France:** *la charge mentale* is more culturally embedded in France than "mental load" is in the
UK, so the *concept* travels perfectly. The *brand* does not. "Ma Charge Mentale" is even more
transparently descriptive, and *charge* carries "burden" more heavily than English "load". There is
also a positioning trap: in France the term is politically loaded feminist vocabulary with a specific
author and argument attached, and adopting it as a brand recruits you into that argument — narrowing
the audience to mothers and compounding the reach problem in §4.1.

---

## 4.6 Recommended shortlist

Ranked, with the caveat that none of this is clearance.

| Rank | Name | Territory | Why | Blocker |
|---|---|---|---|---|
| 1 | **Relay / Relais** | Handover | Same word, same meaning, both languages. Non-gendered. Says exactly what the product does. Warm without being cute | Crowded common word; bare `.com` almost certainly unavailable; needs real clearance |
| 2 | **Seuil / Threshold** | Handover / Place | The doorway is the literal moment of handover. *Seuil* is elegant in French; Threshold is dignified in English | Two words rather than one across markets, which weakens a single masterbrand |
| 3 | **Baton** | Handover | Vivid, concrete, non-gendered, identical in French (*bâton* — though the circumflex complicates the domain) | Slightly sporty; the accent is a real practical friction |
| 4 | **Carnet** | Artefact | Natural in French, borrowed and understood in English, evokes a small trusted book | Descriptive-ish; sits near the Etsy anchor |
| 5 | **Aliette** | (Founder's set) | The only proposed name that clears App Store, domains and software use | Bayer's class 5 mark needs a legal opinion; and it still carries every architectural problem in §4.1 |

**What I would do.** Adopt a branded house under a single non-gendered masterbrand from the Handover
territory, with **Relay/Relais** as the lead candidate. Name surfaces functionally beneath it — *the
care guide*, *the packing list* — rather than giving them brand names of their own. Keep "mental load"
and *charge mentale* as category vocabulary in marketing, never in the brand. Hold the French
family-name idea for an in-product feature where it is charming and reversible.

---

## 4.7 Before anything is committed

Three things I could not do from this environment, all of which must happen before a name is chosen:

1. **Formal clearance** on UKIPO, EUIPO and INPI for classes **9, 42, 35 and 41/44**, plus the Madrid
   register for EU/UK designations, plus French *dénomination sociale* and RCS checks (a French company
   name can ground an opposition without a trademark), plus a UK common-law passing-off sweep. Note
   that personal forenames are registrable in the EU and UK but are inherently weaker and coexist more
   readily — which cuts both ways.
2. **A manual Google Play search** for the shortlist. Play's results are JavaScript-rendered and could
   not be extracted reliably.
3. **A lawyer's opinion on Bayer's Aliette mark** if that name goes forward.

Per the brief, nothing has been renamed in code, routes or repositories at this stage.
