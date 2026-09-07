# Competitive colour audit: household, care-handover and adjacent apps

**Question being answered:** "I really want to make sure I'm not using something similar to
other house apps."

**Short answer:** the colours are mostly fine, but the *structure* is not. A warm beige page
with off-white cards and a deep petrol accent is the current house style of the premium end of
this category, not an escape from it. Hearth Display ships a token literally called
`--color-warm-background: #F4EBE3`, which is perceptually indistinguishable from the proposed
`#EFE7DA`. Separately, the raspberry `#D9577E` is a near-exact match for Kinedu's brand pink, and
serif headings over a sans UI — the Newsreader/Figtree pairing — is what Ohai, Skylight and Jam
already do. Details, and the territory that *is* still open, below.

---

## How these numbers were obtained

Everything in the tables was measured, not eyeballed. Three methods, in descending order of
authority:

1. **Named design tokens** pulled from the live stylesheets (`--color-warm-background`,
   `--color-td-primary`, `--e-global-color-accent`). When a company names a colour, that is its
   own answer, and it is quoted verbatim.
2. **Exact pixel sampling** of official App Store artwork — the 512px icon and the listing
   screenshots fetched from the iTunes Search API. Flat UI fills come back as exact hex values.
3. **Rendered-page sampling** via headless Chrome at 1400px wide, then a frequency count over the
   pixels. Used for brand colours that only exist in rendered CSS.

Adjacency is reported as **CIEDE2000 ΔE**, which models how different two colours look to a
person rather than how far apart their hex codes are. As a reading guide: under 10 a non-designer
will call them the same colour, 10–20 is recognisably the same family, and above 25 is clearly
different.

Everything was captured on 2026-09-07. Brands move; re-run before betting anything large on it.

---

## Part 1 — What each app actually uses

### Family calendar and household organisers

| App | Dominant brand colour | Background treatment | Secondary / accent | Typography | Feel |
|---|---|---|---|---|---|
| **Skylight** ([skylightframe.com](https://www.skylightframe.com/)) | `#2178AF` slate blue (token `--color-skylight-blue`) | **Warm off-white `#FBF7F4`**, plus mint `#D3EFE1` and cream `#FFF7E6` bands | Coral `#F66951`, emerald/petrol `#043A3C`, sage `#B7CBBF`, lavender `#EEE2F7` | **P22 Mackinac Pro (serif) headings + Matter (grotesk) UI** | Warm editorial homeware; the most "premium calm" brand in the category |
| **Hearth Display** ([hearthdisplay.com](https://www.hearthdisplay.com/)) | `#003648` deep petrol (tokens `--text-color`, `--accent-color`) | **Warm beige `#F4EBE3`** (`--color-warm-background`) and off-white `#FBF7F3` (`--color-off-white`) | Teal `#00D0CD`, lime `#CAED6A`, lavender `#C89DFD`, peach `#FF805A`, blush `#FFA5E3` | Civil Premium (sans) + Aeonik Fono (mono) | Deep petrol on cream; the closest structural twin to the proposal |
| **Ohai.ai** ([ohai.ai](https://www.ohai.ai/)) | `#F27830` orange (icon measures `#E67A31`) | **Warm cream `#FDECD7`** | **Muted slate blue `#7D95B3`**, slate ink `#334155`, peach `#FFCEB8` | **Source Serif 4 headings + Inter UI** | Warm editorial with a 3D mascot; serif-led and calm |
| **Jam** ([jamfamilycalendar.com](https://www.jamfamilycalendar.com/)) | Periwinkle `#A695FF` | **Warm off-white `#F8F4F1`** | Mint `#B2E7D4`, yellow `#FFDE43`, coral `#F8A8A8`, ink `#222133` | **Tobias (serif) headings + Sunset Gothic** | Warm pastel editorial, softer and more feminine |
| **Cozi** ([cozi.com](https://www.cozi.com/)) | `#159AD2` cyan-blue in app; icon is teal `#1BC7D5` + green `#9AD3AA` + amber `#F9AE1F` | Plain white | Per-person rainbow chips | Open Sans / Lato | Friendly utilitarian, visibly of an older web era |
| **FamilyWall** ([familywall.com](https://familywall.com/)) | `#4785EC` blue | Plain white | Teal `#1ABC9C`, purple `#AC81E6`, yellow `#F8D000` | Brandon Grotesque + Open Sans | Bright generic app blue |
| **TimeTree** (not on the brief, included as a category leader) | `#2FCC87` green | Plain white | Yellow `#F8E868` | — | Clean, light, Japanese-consumer minimal |

**Could not verify — reported as unknown rather than guessed:**

- **Maple** — acquired by Wander and sunsetting 31 Dec 2026. [growmaple.com](https://www.growmaple.com/)
  now serves only a farewell notice on a cream `#F8F8F0` ground, and the App Store listing
  (id 1551070188) returns no results, so its real product palette is no longer observable.
- **OurHome** — `ourhomeapp.com` does not resolve, and no matching current App Store listing was
  found. Treat as defunct.
- **Picniic** — `picniic.com` does not resolve; an App Store search for "Picniic" returns only
  unrelated calendar apps. Treat as defunct.
- **Milo** — shut down. Y Combinator lists the company as
  [Inactive](https://www.ycombinator.com/companies/milo) and the founder announced closure. Note
  that `heymilo.ai` is an unrelated recruitment tool, not this product.

### Childcare, nanny and handover

| App | Dominant brand colour | Background | Secondary / accent | Typography | Feel |
|---|---|---|---|---|---|
| **Brightwheel** ([mybrightwheel.com](https://mybrightwheel.com/)) | Magenta `#880392` and indigo `#5463D6`; navy `#003388` in CSS | White; icon sits on cream `#FAFAF0` | Multi-colour dot mark: `#29B9BA`, `#FE593D`, `#FECC39`, `#50A06B`, `#5F678E` | Avenir Next / Inter | Saturated edtech, high-energy |
| **Famly** ([famly.co](https://www.famly.co/)) | `#4E169D` deep purple (icon) / `#591AB2` (site) | White, with cream `#FEF9EC` and mint `#EDFCF6` panels | Lilac `#E2D3F9` | Matter | Bold purple B2B SaaS |
| **Kinedu** ([kinedu.com](https://www.kinedu.com/)) | Blue `#0087D9` | White | **Pink `#DB4D7B`**, green `#45C94F`, amber `#F9BA48`; site CSS also carries `#D6336C` and `#F7567C` | Proxima Nova / Plus Jakarta Sans | Bright multi-colour child development |
| **Tinybeans** ([tinybeans.com](https://tinybeans.com/)) | `#FF4B4C` red-coral | **Warm off-white `#FAF6F3`** | Raspberry `#E41D55`, pale pink `#F4C6D3` | Urbane Rounded + DM Sans + Owners | Warm, photo-led, memory-keeping |
| **Bubble** ([joinbubble.com](https://joinbubble.com/)) | `#8845EC` purple | White and cream `#F0F0E8` | Mint `#60D0A0`, amber `#F0B040`, blue `#2058D8` | Agrandir + Roboto | Bold, youthful, marketplace |
| **Sitly** ([sitly.com](https://www.sitly.com/)) | Magenta `#A50C7E` | White | Yellow `#F8E038` | Lilita One + Open Sans | Loud, playful, cheap-and-cheerful |
| **Koru Kids** ([korukids.co.uk](https://www.korukids.co.uk/)) | **Deep pine `#003932`** (`--e-global-color-primary`) | **Creams `#FEF3EC` and `#FFF9EB`**, sage `#EAF2EF` | Accent pink `#FF3855` (`--e-global-color-accent`), pink `#FF7488`, muted teal-grey `#4D7470` | Circular + Abernathy | Warm, confident, London-startup |
| **Bright Horizons** ([brighthorizons.com](https://www.brighthorizons.com/)) | Navy `#20445E` | White | Green `#00844D`, yellow `#F1BF00` | — | Institutional and corporate |

Bright Horizons' marketing site would not render in headless Chrome, so its colours come from the
[Bright Horizons Family app icon](https://apps.apple.com/us/app/bright-horizons-family/id1557887617)
instead. Note that this app is published under Famly's developer account — Bright Horizons runs
on white-labelled Famly software — but the icon carries Bright Horizons' own sun-and-hills mark,
not Famly's purple.

### Pet care and pet sitting

| App | Dominant brand colour | Background | Secondary / accent | Typography | Feel |
|---|---|---|---|---|---|
| **Rover** | `#01BD70` green (App Store icon) | White | — | — | Confident, single-colour marketplace |
| **Wag** | `#00BF8E` green-teal (icon) | White / photography | Deep green `#005840` | — | Similar to Rover, slightly cooler |
| **Pawshake** | `#00AFEE` sky blue | White | Deep blue `#006890` | Roboto | Plain, functional, unbranded-feeling |
| **11pets** | Yellow `#FFCC00` on the icon; lilac `#B880F8` dominates the in-app UI | White | Cyan `#00D0E8` | Roboto + Pacifico | Inconsistent between icon and product |
| **Tractive** ([tractive.com](https://tractive.com/)) | `#1A73E9` blue (`theme-color` `#1A73E8`) | White | Purple `#8942FE`, dark `#121623` | Poppins | Hardware-tech, closest to a Google blue |

Rover's press room [publishes logos but no hex codes](https://www.rover.com/blog/press/tab/media-resource/),
and rover.com blocks headless browsers, so `#01BD70` is sampled from the current iOS app icon.
The 2016 press JPEG reads around `#2CB472`, but it is JPEG-compressed — treat both as approximate.

### Home management, maintenance and shared to-do

| App | Dominant brand colour | Background | Secondary / accent | Typography | Feel |
|---|---|---|---|---|---|
| **Thumbtack** ([thumbtack.com](https://www.thumbtack.com/)) | `#07344A` deep petrol navy (primary CTA) | White with large warm interior photography | — | — | Restrained, photographic, premium-marketplace |
| **HomeZada** ([homezada.com](https://www.homezada.com/)) | Plum / aubergine `#4A3651` | White | Teal `#0A8D9A`, orange `#F27B2D` | Lato | Dated but genuinely unusual hue |
| **Todoist** ([todoist.com](https://todoist.com/)) | `#E44232` (`--color-td-primary`) | Mostly white in practice, but the warm secondaries are named tokens: `--bg-color: #FFF9EB`, `#FAE8D6`, `#FFF5EB` | Blue `#316FEA`, green `#438952` | Graphik + Inter, with Caecilia (slab serif) accents | Warm-neutral productivity, quietly premium |
| **Tody** ([todyapp.com](https://todyapp.com/)) | Blue `#3B62D9` (`--color-blue`); icon `#3089E5` | White, mint `#EAFCF7`, cream `#FAFBF9` | Coral `#F0715C`, green `#4CAF5F`, ink `#131B3A` | Poppins + Inter + Nunito | Clean, slightly clinical |
| **Sweepy** ([sweepy.com](https://sweepy.com/)) | Sky blue `#2EC7FF` | White with pale sky `#CAF1FF` gradients | — | Nunito | Light, soft, cheerful |
| **OurGroceries** ([ourgroceries.com](https://www.ourgroceries.com/)) | Green `#8DC73F` with red `#C42329` (icon) | White with pale green `#D4E7B8` | — | Lato + Roboto | Plain, functional, unstyled |

**Could not verify:** **Centriq**. `centriq.com` is now an IT training company, and the home
inventory app of that name has no current App Store listing. **Setapp's home apps** is not a
brand — Setapp is a Mac subscription bundle, so there is no palette to audit; the individual
apps inside it would each need auditing separately.

---

## Part 2 — Direct answers

### A. What are the dominant colour patterns?

Across the 26 apps verified above, six clusters, and the largest is not the one most people
expect:

**1. Bright saturated blue on white — 7 apps.** Cozi `#159AD2`, FamilyWall `#4785EC`, Kinedu
`#0087D9`, Tractive `#1A73E9`, Pawshake `#00AFEE`, Sweepy `#2EC7FF`, Tody `#3B62D9`. This is the
default. It reads as "app", carries no opinion, and is what a founder is usually trying to avoid.

**2. Warm neutral ground with a deep petrol or ink anchor — 6 apps.** Hearth, Skylight, Ohai,
Jam, Koru Kids, Thumbtack. **This is the fastest-growing cluster and it is where the proposed
palette lands.** Every recently-funded, design-led entrant in the family-organiser space is here.
Todoist is a partial member: warm cream page, but a red brand colour.

**3. Purple / violet — 4 apps.** Brightwheel `#880392`, Famly `#4E169D`, Bubble `#8845EC`,
11pets `#B880F8`. Concentrated in childcare, where it seems to signal "software for professionals
who work with children".

**4. Green and mint — 4 apps.** Rover `#01BD70`, Wag `#00BF8E`, TimeTree `#2FCC87`,
OurGroceries `#8DC73F`. Pet care has effectively standardised on green.

**5. Red, coral and pink-forward — 3 apps.** Tinybeans `#FF4B4C`, Todoist `#E44232`,
Sitly `#A50C7E`.

**6. Deep plum or institutional navy — 2 apps.** HomeZada `#4A3651`, Bright Horizons `#20445E`.

### B. Is warm beige + muted slate blue common or uncommon?

**The warm beige ground is common. The muted slate blue as a primary is not. But the combination
is not as distinctive as the colours in isolation suggest, because the beige is doing most of the
visual work.**

Warm grounds, measured against the proposed `#EFE7DA`:

| App | Their warm ground | ΔE from `#EFE7DA` | Verdict |
|---|---|---|---|
| Hearth Display | `#F4EBE3` (`--color-warm-background`) | **2.8** | Same colour |
| Skylight | `#FFF7E6` (`--color-sunshine`) | **3.7** | Same colour |
| Koru Kids | `#FFF9EB` (`--e-global-color-4466ea1`) | **3.8** | Same colour |
| Todoist | `#FFF9EB` (`--bg-color`) | **3.8** | Same colour |
| Famly | `#FEF9EC` | **3.9** | Same colour |
| Ohai | `#FDECD7` | **4.3** | Same colour |

The off-white card colour is worse. Four competitors sit within ΔE 1.6 of the proposed
`#FAF6F0`: Hearth `#FBF7F3` (1.0), Tinybeans `#FAF6F3` (1.5), Skylight `#FBF7F4` (1.5), Jam
`#F8F4F1` (1.6). Those are not similar colours, they are the same colour.

The slate blue is better news. Nothing in the field uses a *desaturated* slate blue as its
primary. The nearest neighbours:

| App | Colour | ΔE from `#52738A` | Note |
|---|---|---|---|
| Skylight | `#2178AF` | 8.0 | Same hue family, distinctly more saturated. It is Skylight's wordmark colour. |
| Tody | `#3B62D9` | 9.8 | Much bluer and brighter |
| Brightwheel | `#5463D6` | 9.8 | Indigo, not slate |
| Ohai | `#7D95B3` | 14.3 | **A genuinely muted slate blue (S 26%, identical to yours), used as a secondary text colour** |

So: a muted slate blue *primary* is uncommon and worth keeping. What is not uncommon is the
overall impression of "slate blue mark on a pale warm ground" — Skylight already owns that
silhouette, and Ohai already pairs muted slate blue with cream.

### C. Is raspberry `#D9577E` crowded?

**Yes, and one collision is severe.**

| App | Their pink | ΔE from `#D9577E` |
|---|---|---|
| **Kinedu** | `#DB4D7B` | **1.8 — effectively the same colour** |
| Kinedu | `#F7567C` | 6.1 |
| Kinedu | `#D6336C` | 6.6 |
| Tinybeans | `#E41D55` | 10.0 |
| Koru Kids | `#FF7488` | 11.0 |
| Koru Kids | `#FF3855` | 12.3 |

Apps using pink or coral prominently: **Kinedu** (pink is one of four brand colours),
**Tinybeans** (`#FF4B4C` is the whole identity, with `#E41D55` and `#F4C6D3` supporting),
**Koru Kids** (`#FF3855` is the named accent token), **Sitly** (`#A50C7E` magenta),
**Brightwheel** (`#880392` magenta-purple plus `#F840A8`), **Skylight** (coral `#F66951` on CTAs
and pink event chips), **Hearth** (blush `#FFA5E3` in its chip palette), **Jam** (coral
`#F8A8A8`), **Todoist** (`#E44232`), **Tody** (coral `#F0715C`).

Two mitigations worth weighing. First, the proposed use is narrow — a completion state, not an
identity — so it will never appear at the scale Tinybeans uses its red. Second, most of the
category's pink is *hotter and lighter* than `#D9577E`; the muted, slightly dusty quality is
less common than the hue itself. But Kinedu at ΔE 1.8 is a real match, and pink chips are
near-universal in family calendars, which weakens pink's ability to carry a specific meaning like
"done".

### D. Is serif-heading typography common or rare?

**Rare across the whole field, but standard among the apps closest in positioning.** This is the
finding most likely to change the plan.

Serif or partly-serif headings, verified from the loaded font files:

- **Ohai** — **Source Serif 4** for headings, **Inter** for UI. This is structurally the same
  choice as Newsreader + Figtree, using a sibling typeface.
- **Skylight** — **P22 Mackinac Pro** for section headings, **Matter** for UI.
- **Jam** — **Tobias** for headings, Sunset Gothic for UI.
- **Todoist** — **Caecilia**, a slab serif, alongside Graphik and Inter.

Everyone else is sans-only: Cozi (Open Sans/Lato), FamilyWall (Brandon Grotesque),
Brightwheel (Avenir Next), Famly (Matter), Kinedu (Proxima Nova), Tinybeans (Urbane
Rounded/DM Sans), Bubble (Agrandir), Sitly (Lilita One), Koru Kids (Circular), Tractive and
Tody (Poppins), Sweepy (Nunito), Pawshake and 11pets (Roboto), Hearth (Civil Premium with an
Aeonik Fono mono companion).

So serif headings are four of the 26 — but three of those four are Ohai, Skylight and Jam, which
are exactly the apps a well-designed household organiser would be compared against.

### E. Which apps would this palette be confusable with?

Concretely, in order of risk:

**1. Hearth Display — highest risk, and it is structural rather than incidental.** Hearth's
published tokens are `--color-warm-background: #F4EBE3` (ΔE 2.8 from your page), `--color-off-white:
#FBF7F3` (ΔE 1.0 from your cards) and a deep petrol `#003648` as both text and accent colour.
That is the same three-layer construction as the proposal: warm beige page, warm off-white cards,
deep petrol brand. Hearth is also the closest product — a family calendar and household task
display — and shares the "calm, premium, not childish" positioning. Someone who has seen Hearth
will find the proposed palette familiar without being able to say why.

**2. Skylight — highest-visibility risk.** Warm off-white `#FBF7F4` (ΔE 1.5), slate blue
`#2178AF` (ΔE 8.0), deep petrol `#043A3C`, serif headings, mint and pastel event chips. Skylight
is the most heavily reviewed and marketed brand in this space — its own homepage cites TODAY,
CNET, Wirecutter, The Verge and Good Morning America — so it largely defines what "warm, calm
family organiser" looks like to the target audience.

**3. Ohai — closest on typography and on the slate blue specifically.** Warm cream `#FDECD7`
(ΔE 4.3), a muted slate blue `#7D95B3` at exactly your saturation, and Source Serif 4 headings
over an Inter UI. The one thing keeping these apart is that Ohai's *primary* is orange
`#F27830` while yours is the slate blue.

**4. Kinedu — a single-colour collision.** `#DB4D7B` versus `#D9577E` is ΔE 1.8. Different
category, so the risk is lower, but the colour is not yours.

**5. Jam — warm ground plus serif headings.** `#F8F4F1` (ΔE 1.6) with Tobias headings. Jam's
periwinkle-and-pastel accent palette keeps it distinguishable overall.

Worth stating plainly: nothing here is a *duplicate*. The proposal will not be mistaken for any
one of these apps. The problem is the aggregate — it will read as a competent member of an
existing visual genre rather than as its own thing.

### F. What territory is genuinely under-used?

Grounded in the gaps the measurements actually show, not in general colour advice:

**1. A mid-tone warm ground.** Every warm competitor sits at lightness 92–97 — cream, not beige.
The proposed `#EFE7DA` at L 91 is already slightly deeper than the field, and pushing further
(putty, clay or oatmeal at L 84–88, roughly `#E2D6C4` through `#D8CCBA`) is unoccupied. It also
reads as more expensive: pale cream reads as "soft app", a genuine mid-tone reads as paper stock
and interiors. This is the single cheapest change, because it keeps the warmth the founder
clearly wants while stepping out of the cluster.

**2. Olive, moss and khaki.** Completely absent. Nothing in the field sits in the desaturated
yellow-green range (hue 60–100 at low saturation). The only green-yellow is OurGroceries'
bright `#8DC73F`. A deep olive around `#4A5233` or a muted moss reads calm, domestic and adult,
and it pairs naturally with a warm beige ground without either colour fighting.

**3. Ochre, tobacco and caramel as structural mid-tones.** Ohai owns bright orange, but nobody
uses a *desaturated* warm mid-tone — something like `#9A6E3A` or `#B08040` — as a primary. It is
the most natural companion to a beige ground and it is empty.

**4. Oxblood, burgundy and deep brick.** All the reds in the field are bright and light
(`#FF4B4C`, `#E44232`, `#FF3855`). A dark, low-lightness red around `#7A2E33` would be
unmistakable in this category, and would let pink retire from the completion role where it is
currently competing with everyone's per-person chip colours.

**5. A dark-first identity.** Not one consumer app in this set leads with a dark ground. Skylight
and Hearth use deep petrol as an accent and Thumbtack as a button, but none of them makes dark
the primary expression. Given that the product's own design notes describe a grandparent reading
at 2am, a brand where the dark theme is the hero — rather than the compatibility mode — would be
both distinctive and substantively right.

**On typography:** the serif/sans split is now the category default among the direct
competitors, so it will not differentiate on its own. Two adjacent moves are still open. First,
**serif for body text and not just headings** — every serif user in the field confines it to
display sizes; setting the actual content in a text serif would be genuinely unusual and suits a
product that is fundamentally a document being handed to someone. Second, if Newsreader stays,
**pair it with something that has more texture than Figtree.** Figtree is a geometric-humanist
sans in the same family of feeling as Poppins, Circular, Agrandir and Nunito, all of which are
already in the field; a neo-grotesque or a more idiosyncratic humanist would carry more of the
brand's weight than the serif alone currently does.

---

## Part 3 — Recommendation in one paragraph

Keep the muted slate blue: it is the most defensible element and nothing owns it. Move the page
ground deeper and greyer, away from cream and towards putty or clay, which breaks the sub-ΔE-5
cluster with Hearth, Skylight, Ohai, Koru Kids, Todoist and Famly while keeping the warmth.
Retire raspberry `#D9577E` from the completion role — it is a near-exact match for Kinedu and
pink chips are ubiquitous in family calendars, so it cannot carry a specific meaning; olive or a
deep brick would do the job and claim empty ground. The petrol secondary `#377278` is fine but
crowded at the dark end by Hearth `#003648`, Thumbtack `#07344A` and Skylight `#043A3C`, so keep
it genuinely mid-tone rather than letting it drift darker. On type, either commit to the serif
properly by taking it down into body text, or drop it — a display-only serif over a geometric
sans is precisely what the three nearest competitors already ship.

---

## Part 4 — What was verified, and what it costs to act on

The numbers above were re-measured independently before anything was decided, because the
recommendation turns on them. CIEDE2000, against the shipped tokens:

| Shipped | Nearest in category | ΔE | Reading |
|---|---|---|---|
| Card `#FAF6F0` | Hearth `#FBF7F3` | **1.0** | the same colour |
| Card `#FAF6F0` | Tinybeans `#FAF6F3`, Skylight `#FBF7F4` | **1.5** | the same colour |
| Card `#FAF6F0` | Jam `#F8F4F1` | **1.6** | the same colour |
| Raspberry `#D9577E` | Kinedu `#DB4D7B` | **1.8** | the same colour |
| Ground `#EFE7DA` | Hearth `#F4EBE3` | **2.8** | indistinguishable |
| Lisette blue `#4D6C82` | Skylight `#2178AF` | 9.1 | distinct |
| Jeannette petrol `#377177` | Ohai `#003648` | 20.7 | distinct |

So the accents the founder chose are the safe part of the palette. The collisions are all in the
neutrals — which is also the part the manifest specified loosely, as "warm ground, light card",
rather than by name.

Ranked by how much of the screen each one occupies, which is the only ranking that matters here:

1. **The card is the worst.** It is the largest surface in the product and it is within ΔE 1.6 of
   four separate apps.
2. **The ground is second**, at ΔE 2.8 from one.
3. **Raspberry is third and not urgent.** It is a completion colour, no completion state exists in
   the product yet, and it currently paints nothing.

### Why the ground cannot move on its own

Every accent was solved to *exactly* its 4.5:1 target on `#EFE7DA` — Lisette blue clears by
0.02, petrol by 0.01. There is no headroom, so darkening the ground by any amount fails all of
them at once. A search over 1,164 warm grounds in the uncrowded L\* 83–88 band returned nothing
that both clears the category by ΔE 8 and keeps the accents untouched: the two constraints are
mutually exclusive. A deeper ground therefore costs a second, larger correction to colours the
founder named:

| | Manifest | Shipped | On a `#E0D2BC` ground |
|---|---|---|---|
| Lisette blue | `#52738A` | `#4D6C82` (ΔE 2.6) | `#445F73` (ΔE 7.3) |
| Jeannette petrol | `#377278` | `#377177` (ΔE 0.4) | `#306369` (ΔE 5.3) |
| Ink muted | `#7C7468` | `#6E675D` (ΔE 5.2) | `#615B52` (ΔE 9.7) |

ΔE 2.6 is invisible side by side. ΔE 7.3 is not.

### The three options, all built and photographed

**A — ship as is.** The founder's palette exactly. Distinctive blue, category-standard neutrals.
Currently the default.

**B — remove the white card.** `--surface` becomes `#EFE7DA`, separation carried by
`--hairline: #D3C6AE` and no shadow. This deletes the worst collision outright and costs nothing:
every contrast pair is already verified against that value, because it is the ground. It does not
address the ground itself.

**C — deepen the ground.** `--paper: #E0D2BC`, `--surface: #EFE7DA` — the manifest's ground
becomes the card, and a putty ground sits beneath it. Lands in the empty L\* band, keeps the whole
palette warm, and looks more expensive. Costs the accent drift in the table above.

**Recommendation: C.** It is the only one that actually answers the question that was asked, the
drift is small in absolute terms, and every colour in it is still recognisably the founder's. But
the palette is a brand decision and this one is not close enough to make unilaterally — B is a
free improvement that could be taken on its own if C is unwanted.

### Raspberry

Nothing near `#D9577E` clears Kinedu: ΔE 12 in that region of the wheel is already a visibly
different colour, and the closest candidates that separate cleanly (`#B66E6F`, `#A76E7B`) are
dusty roses that lose the celebratory quality the completion colour exists for. It is a real
either/or rather than a correction. Since raspberry paints nothing today, it is left at the
manifest value and should be settled when the first completion state is designed.
