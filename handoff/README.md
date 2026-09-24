# Domela — handoff for Claude (Phase 1 + Phase 2)

Branch: `cursor/phase1-print-hotel-fixes-218f`
Preview: https://mml-guide-git-cursor-phase1-print-hotel-fixes-218f-mml-guide.vercel.app
PR: https://github.com/Adelaide-Egea/MML-guide/pull/18

## What this zip contains
Key source files only (not the whole repo). Overlay onto a Domela checkout or use for review.

## Phase 1 (bugs fixed)
1. Print forces light tokens for dark-theme users (`print.css`)
2. Safety body stays mounted with `hidden` so allergies print (`c/page.tsx`)
3. `.hotel-row-now` overflow width removed
4. Hotel-card font-weights → 500 only
5. `--petrol` aliases to `--ink`
6. `.badge` defaults to sunk + ink
7. Print `break-inside: avoid` on rows/notes/greeting
8. No middle-dot UI chains; gender-neutral empty copy; no “Thursday”
9. Greeting/readiness does not use NBSP placeholder

## Phase 2 (features)
1. **Scenarios** — `Scenario` on `Handover` + `expectation`; `duration` derived (`household.ts`)
2. **Timeline spine** — time / room (cleaner) / bag (goingtoyours) in `c/page.tsx`
3. **Packing** — `PackItem.bag`, `comesHome`, `Trip.returnsOn`; packing UI on `/c`
4. **Readiness** — `guideCoverage()`; home leads with “N of M covered” + gap chips
5. **Scenario picker** — `/guide/new` six cards → live caregiver preview

## Copy notes (latest)
- Empty: “Write it once. They can ask it the rest.”
- Welcome: “…still there when you need it.” (not Thursday)

## Ask Claude to
Review UX/copy/visual polish against Domela product rules (no middle dots, 400/500 weights on caregiver view, tokens only, print survives dark theme). Suggest concrete file-level edits.
