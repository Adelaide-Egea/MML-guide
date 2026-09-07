# Naming — revised shortlist

Supersedes the shortlist in `docs/strategy/04-naming.md`. Two things changed: Relais
is withdrawn, and the product brief widened from a childcare handover to a handover
of anything you leave in someone else's care.

## Relais is withdrawn, and the objection was correct

Relay is a chain of roughly 1,000 outlets in France, in 400 stations and metro
stations and around twenty airports, owned by Lagardère Travel Retail. Under a 2010
decree, concessions on public transport land may operate as *débits de tabac
spéciaux*, and Relay stores use it — they are licensed tobacco retailers as well as
newsagents.

So the association is not a stray personal one. For a French audience, *relais* in a
retail context means the station kiosk, reinforced by *relais colis* parcel pickup
points. Neither is what a premium product about someone's children wants to evoke. I
should have caught this; a name has to be checked against the country it is being
sold into, not only against a dictionary.

## What the name now has to carry

The brief moved. It is no longer a childcare product with other uses bolted on — it
is one guide engine with several kinds of recipient: the grandparent, the nanny, the
cleaner, the dog sitter, the neighbour watering the plants. That rules out anything
that says *child*, *nanny*, *sitter*, *baby* or *nursery*, because those names would
have to be abandoned the first time someone uses it for the dog.

It also has to carry the thing that actually differentiates the product, which is
that the guide **answers back**. A caregiver asks a question and gets an answer drawn
only from what the parent wrote, in their own language. That is not a document.

| | Meanwhile | Carnet | Understudy |
| --- | --- | --- | --- |
| What it names | the occasion | the artefact | the person |
| Says nothing about children | yes | yes | yes |
| Ownable as a mark | yes | **weak in France** | yes |
| Works in French | poorly | natively | as theatre jargon only |
| Length for an app icon | 9 | 6 | 10 |
| `.house` domain | free | free | free |

## Why Carnet slipped from first to second

It is the warmest and most immediately meaningful of the three, and in French it
needs no explanation at all. Two findings weakened it.

**The category is already occupied by the word.** *Carnet de Bord* is a live French
app for *assistants familiaux* doing very nearly this job: per-child logs, PDF
transmission sheets, GDPR, hosted in France, and — for what it is worth — built on
Supabase. Its own marketing copy promises to reduce your *charge mentale*. Launching
"Carnet" into French childcare software means launching next to it.

**In France the word already belongs to a government document.** The *carnet de
santé* is the official child health record every French parent is handed at birth.
That gives instant comprehension and the wrong expectation: people will assume a
health record, and a common noun attached to an official document is close to
unregistrable for this category.

Neither is fatal in the UK, where *carnet* is an elegant borrowed word with none of
that baggage. But a name that is strong in one market and unownable in the other is
not a name that scales, and France is the market where the pitch is easiest.

## Recommendation: Meanwhile

Beyond being registrable and available, there is a product reason. *Carnet* names a
notebook, and the entire advance here is that this is not a notebook — it answers
questions, in another language, at 2am. Naming it after the paper artefact sells the
product as the thing it is replacing.

*Meanwhile* names the occasion instead: the stretch of time when you are not there
and someone else is holding it. That covers the child, the dog and the flat with no
strain, it stays true whether the handover is four hours or a fortnight, and it is
the same word whether the recipient is a grandparent or a cleaner. It is warm without
being cute, and it is not a word anyone else in this category is using.

Its weakness is real and worth stating: it does not translate into French. The French
product would run under the English name, which is common enough for software but
means the French pitch leans on the tagline rather than the name.

## Registration, checked

Queried against RDAP, which is the registry record rather than DNS:

| Domain | |
| --- | --- |
| `meanwhile.house` | available |
| `meanwhile.guide` | available |
| `carnet.house` | available |
| `understudy.house` | available |
| `meanwhilehq.com`, `meanwhileapp.com` | taken |
| every `tend.*` checked | taken — the reason Tend was dropped |

`.house` reads deliberately rather than as a fallback, and it suits a product about
someone else's home. None of this is a trademark search; that is worth paying a
professional for once the name is chosen, in Class 9 and Class 42, in the UK and the
EU.

## The decision I need from you

Pick the territory, not the spelling — the design system, the tokens and the code all
avoid product names, so switching costs nothing until we register something.

1. **Meanwhile** — my recommendation. Ownable, distinctive, names the occasion, poor
   in French.
2. **Carnet** — warmer and instantly understood, weak to own in France, and it
   undersells the interactive part.
3. **Understudy** — the most distinctive of the three and flattering to the caregiver,
   which helps adoption on the side of the user who did not choose the product. Long,
   and English-only.
