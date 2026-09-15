# Domela — brand pitch

*The household guide*

---

## 1. Objective

**Business objective.** Prove that a household will pay to hand over its knowledge once, and that the person receiving it will actually use it. Everything else is downstream.

**Brand objective.** Own the handover. When someone in London thinks "I need to explain the house to someone else," the word that arrives should be Domela — not a note app, not a chore chart, not a WhatsApp thread.

**The measure of success is not installs.** It is: did the second reader open it, unprompted, more than once. A brand that gets bought but not opened is a brand that churns in six weeks.

---

## 2. The problem

Every household runs on knowledge that lives in one person's head. Where the spare key is. Which cloth is for the pan. That the little one will claim she's allowed screens after dinner, and she isn't.

When you leave, you try to transfer all of it in a text message on the way out of the door. It fails predictably. She forgets, or she guesses, or she calls you in a meeting. So you either micromanage or you come home to a routine you don't recognise.

**The enemy is the long text message.** Name it, everywhere.

---

## 3. Positioning

**Domela is the guide you write once.** Photos of the exact thing, so nothing has to be interpreted. A timeline, so she knows what matters when. And she can ask it questions and get answers in her own language, without asking you.

| Domela is | Domela is not |
|---|---|
| The handover | A chore app |
| One household, one guide | A family organiser |
| A reference she consults | A task list you assign |
| Warm, adult, plain | "Mum life", pastel, cursive |

**The dignity rule.** The second reader is a competent adult doing a job. Every word in the product treats her that way. No completion policing, no reporting back, no surveillance framing. This is the single thing that differentiates Domela from everything adjacent, and it is a brand decision before it is a copy decision.

---

## 4. The name

**Domela.** Built on *dom* — home in Latin (*domus*) and, critically, in Polish, Czech, Croatian and Russian. Your buyer reads it as domestic. Your second reader in London, who is often Polish or Romanian, reads her own word for house.

| Test | Result |
|---|---|
| "You should try Domela." | Stands alone, sounds like a brand |
| Spell from hearing | One stress, one spelling |
| Warmth | Vowel ending, soft consonants |
| Namespace | No company, app or mark found. **Clearance still required — §9** |
| Second reader | Legible across Slavic and Romance languages |

**Why not Domelum.** The `-um` ending reads as Latin motto or prescription, the English eye says DOME-lum while the Latin says do-MEH-lum, and it sits phonetically nearer the industrial *Dom-* brands — Domestos, Dometic, Domel. Domela steps away from all three.

**The line to say after the name, always:** *Domela — the household guide.* It does the explaining so the name doesn't have to.

---

## 5. Voice

| Rule | Example |
|---|---|
| Short declaratives | "The bins go out Tuesday night." |
| You address the writer. The guide addresses the reader. | To you: "Add a photo." To her: "The spare key is here." |
| Photos replace adjectives | Never "the good blue cloth". Show it. |
| No apology, no hedging | Not "if you could just…". "Tuesday night." |
| Never cute | No emoji in product chrome. Emoji in her content is her choice. |

---

## 6. The mark

**The D is the door.** A capital D whose counter is cut through to the baseline, so the letter reads as an open doorway. Not a house, not a roof, not a key — those are the three clichés of the category. Inside the doorway sits a small square, the punctum: the note left for whoever comes in. The opening is deliberately narrow (2.5 units at 48-unit scale) so the letter still reads as a D at 16–24px.

| Asset | Spec |
|---|---|
| App icon | Pine tile `#18241F`, corner radius 22% of tile, D in paper `#EEF0ED`, punctum in marigold `#D9923A` |
| On light | D in pine `#18241F`, punctum marigold |
| Monochrome | D in pine, no punctum. Use below 24px |
| Reversed | Pine tile, D in paper `#EEF0ED` |
| Minimum size | 16px. Below 24px, drop the punctum |
| Clear space | One punctum-width on all sides |
| Counter opening | 2.5 units at 48-unit scale. Do not widen — it stops reading as a D below 32px |

**Do not:** outline the mark, add a gradient, widen the doorway, sit the mark on marigold, or place the wordmark inside the tile.

The icon tile is pine rather than clay. A light tile at 60px on a phone home screen disappears into a light wallpaper; a dark tile with a light letterform holds. It also matches the OG image.

---

## 7. Colour

The ground is neutral. Not cream, not sage. The product's content is photographs of a real household — the cloth, the bottle, the key, the child's inhaler — and any tinted ground casts every one of them. Neutral is not timidity; it is the only choice that lets the actual product look right. The brand lives in the ink and the accent, never in the paper.

| Token | Hex | Role |
|---|---|---|
| Paper | `#EEF0ED` | Page ground. Near-white, faint cool cast |
| Surface | `#FFFFFF` | Cards, inputs, anything raised |
| Sunk | `#E2E6E1` | Wells, unselected chips |
| Hairline | `#DBDFD9` | Dividers |
| Pine | `#18241F` | All primary text, the mark, the icon tile |
| Sage | `#56645D` | Secondary text |
| Marigold | `#D9923A` | Interactive fills, buttons, the punctum |
| Marigold deep | `#8A5310` | Marigold as small text, links, icons on light ground |
| Moss | `#2F7A45` | Done state only |
| Brick | `#A8231F` | Safety only, and never colour alone |

**Retired:** chalk `#FBF6EE`, sand `#F1E7D8`, clay `#E3D3BC`, and the sage ground `#DFE8E5`. Warm cream with a serif display and a warm clay accent is currently the most recognisable machine-generated design signature on the web. Sage-and-marigold is the same cliché one step left. Both read as "calm lifestyle". The buyer is not buying calm — she is buying relief from holding it all in her head.

**Three surfaces, not five.** Paper, surface, sunk, with a real step between each.

**Subject identity hues are subordinate.** They are user content, not brand. No screen should show more than three hues at once, counting brand.

### Contrast, checked

| Pair | Role |
|---|---|
| Pine on paper / surface | Body text |
| Sage on paper / surface | Secondary text |
| Pine text on marigold fill | Buttons — never white on marigold |
| Marigold deep on paper | Small accent text / icons |
| Brick on paper / brick-tint | Safety only |

Run `npm run test:contrast` — the build fails if a pair slips.

## 8. Type

| Role | Face | Spec |
|---|---|---|
| Display | **Fraunces** (recommended) or Newsreader | Minimum 20px |
| UI and body | Figtree | Body **17px**, not 15 |
| Timeline times | Figtree | Tabular numerals on. Times must align to scan |

**Kill the ALL-CAPS tracked-out eyebrow.** Section headings are 17px, sentence case, full-strength pine. The only surviving eyebrow is the safety label, where the shout is earned.

**On the display face.** Fraunces carries more warmth than Newsreader at the same size and holds a Latin-rooted name well. Both are on Google Fonts.

## 9. Before anything ships

- [ ] UKIPO search, classes 9 and 42
- [ ] EUIPO search, classes 9 and 42
- [ ] USPTO search, classes 9 and 42
- [ ] App Store and Google Play exact-match search for "Domela"
- [ ] Companies House name check
- [ ] Domains: `domela.com`, `domela.app`, `domela.co`, plus `getdomela.com` as fallback
- [ ] Google "domela" in French, Polish, Portuguese, Italian, Spanish and Romanian for accidental meanings
- [ ] If clear, **file the UK word mark before launch.** Cheap relative to a rebrand

---

## 10. Next three moves

1. **Run the clearance.** Everything downstream is blocked on it, and I have been wrong before by recommending a name I hadn't checked.
2. **Pick the display face.** Fraunces or Newsreader, side by side, 33px, decide in five minutes.
3. **Start the handover test.** Eight households with a real absence in the next fortnight. One metric: did the second reader open it, unprompted, more than once.

The brand is now far enough along that it is no longer the thing holding you back. The test is.
