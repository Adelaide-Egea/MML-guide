# Naming — coined round

Supersedes both `docs/strategy/04-naming.md` and the Meanwhile/Carnet/Understudy
shortlist. Three rounds have now been run. This one changed method, not just
candidates, because the first two rounds were solving the wrong problem.

## Where the first two rounds went wrong

Round one proposed **Relais**. Relay is a chain of roughly 1,000 outlets in France
— 400 stations and metro stations, twenty airports — and under the 2010 decree on
transport concessions they are licensed tobacco retailers, reinforced by *relais
colis* parcel points. The objection was correct and the name is withdrawn.

Round two proposed **Meanwhile**. It is a good English word and a bad brand, for a
reason that only shows up when you say it to a French speaker: there is no French
equivalent, the `wh` cluster does not exist in French phonology, and the word cannot
be spelled from hearing it. A name that half your market cannot pronounce or type
into a search box is not a name, it is a liability.

Both failures share a cause. I was choosing **words that mean something**, and a word
that means something means something *in a particular language*, carries whatever
that language has already attached to it, and is usually already owned by someone.

## The brief, restated

- Does not have to mean anything.
- Must not already exist.
- Must be simple to say.
- Must be simple to find.
- Implicit from the two failures: must work identically in English and French.

That is a specification for a **coined** name, and it can be screened mechanically
rather than argued about.

## Screening method

**Phonetic rule.** A candidate only qualifies if an English speaker and a French
speaker, seeing it for the first time, say it the same way — and if either of them,
hearing it, spells it the same way. That rules out a lot of letters:

| Excluded | Why |
| --- | --- |
| `u` | English /uː/, French /y/ — different sound entirely |
| `ou` `au` `ai` `ei` | English reads them as diphthongs, French as single vowels |
| `c` `g` | Hard or soft depending on the following letter, in both languages |
| `h` `j` `w` `x` `y` | Absent, silent or differently valued in French |
| `th` `ch` `ph` | No French equivalent for the English values |

What survives is `o` (safest — /o/ in both), `a`, `e` and `i`, with `m n l r v s t p
k b d f`. Every name below is built only from those.

**Existence test.** Domain availability turned out to be useless. I checked 69
invented five- and six-letter strings against the `.com` registry and **69 of 69 were
already registered** — the pronounceable space was exhausted by squatters years ago.
Stripe, Notion and Vercel all bought their `.com` after choosing the name. So the
test that actually matters is whether a *business* is using the word:

1. App Store search for an exact or leading-token match, via the iTunes API. 108
   candidates screened, 59 came back with no app of that name.
2. Company and trademark search on the survivors, to catch businesses without an app.

## Shortlist

Six survived both. Ranked.

### 1. Marela — recommended

`ma-RE-la`. Three even syllables, no ambiguous letter, spells itself from hearing in
both languages. Warm without being sweet, and reads as a person's name without being
a common one — which matters, because the caregiver is going to *ask it questions*.
"Ask Marela where the sleeping bags are" is a sentence that works.

No app, no company and no trademark surfaced in any register searched.

### 2. Nolera

`no-LE-ra`. Calmer and more clinical than Marela, slightly more premium, entirely
ownable. The only holder found anywhere is a Japanese company registered in July 2026
in Hokkaido with no products and no web presence.

### 3. Nemba

`NEM-ba`. The phonetically bulletproof one: the `mb` cluster closes the first
syllable, so the `e` is /ɛ/ in both languages with no room for drift. Two syllables,
five letters, best of the six on an app icon. Blunter and less warm than Marela.

Two one-person consultancies use it, in England and Canada. Neither holds a
trademark; the software classes are clear.

### 4. Tanela

`ta-NE-la`. Softest of the six. A Lithuanian metal fabricator and a dormant Panama
holding company hold the word; neither is remotely adjacent and neither has search
presence worth competing with.

### 5. Tovela

`to-VE-la`. Pleasant, slightly less distinctive. One micro-business uses it, and only
because it is the founder's surname.

### 6. Kembo

`KEM-bo`. Short and punchy, same locked-vowel property as Nemba. Clear on the App
Store. Reads more like a product than a person, which cuts against the "ask it a
question" positioning.

## Rejected in this round, and why

| Name | Reason |
| --- | --- |
| Nella | An AI bedtime-story app for children, plus an AI finance assistant. Direct adjacency. |
| Aluna | Live US trademarks in Class 9 software, plus a respiratory-health app. |
| Venna | Two textile brands, a Brazilian social app, and a luxury *cannabis* brand. |
| Valma | Registered UK trademark for household **cleaning products** — the worst possible adjacency for a household app. |
| Orla, Otava, Nerola, Velva, Nimbo | Live apps under the exact name. |
| Nadela, Aveno | Too close to Nadella and Aveeno. |
| Nelva | A Belarusian womenswear brand with 120 stores. Software classes clear, but it owns the search results. |

## What to expect on domains

None of the six has a free `.com`; nothing sayable does. The realistic options are
`.house`, `.care` or `.app` at registration price, or buying the `.com` from its
current holder. That is a purchase decision, not a naming constraint, and it should
not drive the choice of name.

## The decision I need

Pick one of the six. The code carries no product name — `packages/core` is
deliberately name-free and the prototype now renders its name from a single constant
— so applying the choice is a one-line change plus the manifest, and nothing else in
the build is waiting on it.
