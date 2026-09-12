# Technical Plan — AI Idea Validator

Related issue: #70 — TrackA-FreeTool-01 — Build AI Idea Validator
Parent issue: #59 — Announce Three-Product Build Lab and Boilerplate Track
Architecture reference: #63 — Day 08 Define Architecture and Tech Stack
Companion doc: `tools/free-leadmagnets/idea-validator/product-brief.md`

Version: 0.1 (v0 MVP)
Status: Draft for Hitesh review (Step 02 of 10)

This is a docs-only artefact. No code, no scaffolding, no dependencies are installed in Step 02. Everything here is a decision to be executed starting in Step 03.

---

## 1. Architecture

### Constraints (fixed by Issue #70 and Step 01 approval)

- Framework: **Next.js** (App Router).
- Language: **TypeScript** in strict mode.
- Styling: **Tailwind CSS** only — no shadcn, no component libraries.
- Rendering: static / server components by default; client components only where interactivity requires them.
- Scoring: **client-side, deterministic**. No AI API. No fetch to a scoring endpoint.
- Persistence: **none**. No database, no localStorage, no cookies. Every session starts fresh.
- Auth: **none**. No login, no email capture, no anonymous IDs.
- Payments: **none**.
- Hosting: **Vercel**.
- App root (repository path): **`tools/free-leadmagnets/`**. This is one Next.js application that will host all three Track A tools as sibling App Router routes over time.
- Public route for the first tool: **`/tools/idea-validator`** (served from `app/tools/idea-validator/page.tsx` inside the app).

### Non-goals for v0 (explicit)

- No shadcn/ui, no Radix, no headless UI libs.
- No Supabase, no Clerk, no NextAuth, no Prisma.
- No Stripe, no LemonSqueezy.
- No @ai-sdk/*, no OpenAI SDK, no Anthropic SDK.
- No Zustand, no Redux, no Jotai. React `useState` / `useReducer` are enough.
- No i18n, no dark-mode toggle, no analytics beyond what Vercel provides by default.

### One-line data flow

```
user fills form (client state)
   → onSubmit calls calculateIdeaScore(input) (pure TS function)
   → result rendered inline in the same page (no navigation)
   → user can copy summary or reset
```

No network calls at any step.

## 2. Route and directory structure

### Repository layout after Step 03

```
tools/
  free-leadmagnets/                    ← Next.js app root (Vercel "Root Directory" points here)
    README.md                          ← how to run locally, links back to the tool folder
    package.json
    package-lock.json                  ← committed
    tsconfig.json
    next.config.mjs
    next-env.d.ts                      ← generated, gitignored
    tailwind.config.ts
    postcss.config.mjs
    .eslintrc.json                     ← Next.js default
    .gitignore                         ← Next.js default (node_modules, .next, .env*)
    .nvmrc                             ← "20"
    vitest.config.ts
    app/
      layout.tsx                       ← root HTML shell, Tailwind base, fonts
      globals.css                      ← Tailwind directives only
      page.tsx                         ← "AIPE Labs — Free Tools" index with a link to /tools/idea-validator
      tools/
        idea-validator/
          page.tsx                     ← server component: metadata + intro + <IdeaValidatorForm />
          IdeaValidatorForm.tsx        ← 'use client' — the form
          ResultPanel.tsx              ← 'use client' — the result view
    components/
      ui/
        Button.tsx
        Field.tsx                      ← label + text input / textarea wrapper with error slot
        RadioScale.tsx                 ← 1–5 radio group
        ProgressBar.tsx                ← used in ResultPanel for category breakdown
    lib/
      scoring/
        types.ts
        categories.ts                  ← the eight categories in Issue #70 order (single source)
        calculate.ts                   ← calculateIdeaScore, deriveVerdict, deriveNextActions, ranking
        samples.ts                     ← ≥3 sample IdeaValidationInput fixtures
        calculate.test.ts              ← Vitest boundary + sample tests
      utils.ts                         ← cn() helper for Tailwind class merging (no library)
  paid-boilerplate/                    ← untouched
  free-leadmagnets/idea-validator/     ← docs folder for this tool (Steps 01, 02, 07, 08, 09, 10)
    product-brief.md                   ← Step 01 (done)
    technical-plan.md                  ← this file
    launch/                            ← Step 07
    qa-report.md                       ← Step 08
    deployment.md                      ← Step 09
    launch-checklist.md                ← Step 10
```

Files removed: `tools/free-leadmagnets/.gitkeep` (folder now has real content).

### Route table

| URL | File | Component type | Purpose |
|---|---|---|---|
| `/` | `app/page.tsx` | Server | Landing: "AIPE Labs — Free Tools", one link to the validator |
| `/tools/idea-validator` | `app/tools/idea-validator/page.tsx` | Server | Metadata + intro copy + mount client form |

### Metadata

- Root `layout.tsx` exports `metadata` with `title = "AIPE Labs — Free Tools"` and a short description.
- `app/tools/idea-validator/page.tsx` exports its own `metadata` object with title `"AI Idea Validator — AIPE Labs"` and description sourced from §2 of `product-brief.md`.

## 3. Component architecture and responsibilities

Component list is intentionally small. Each has one job.

| Component | File | Client / Server | Responsibility |
|---|---|---|---|
| Root layout | `app/layout.tsx` | Server | HTML shell, Tailwind base, font, `<body>` wrapper |
| Home page | `app/page.tsx` | Server | Static list of AIPE Labs free tools + link to `/tools/idea-validator` |
| Tool page | `app/tools/idea-validator/page.tsx` | Server | Page metadata + intro copy + mount `<IdeaValidatorForm />` |
| Form | `app/tools/idea-validator/IdeaValidatorForm.tsx` | Client | Form state, load-sample, reset, submit → compute → hand result to `<ResultPanel />` |
| Result | `app/tools/idea-validator/ResultPanel.tsx` | Client | Render `IdeaValidationResult`, copy summary, reset |
| Button | `components/ui/Button.tsx` | Server-compatible | Styled `<button>` primitive, variants: `primary`, `secondary`, `ghost` |
| Field | `components/ui/Field.tsx` | Server-compatible | Label + input or textarea + error slot; forwardRef, controlled |
| RadioScale | `components/ui/RadioScale.tsx` | Client | 1–5 radio group with keyboard nav (arrow keys), returns integer 1–5 or `null` when unselected |
| ProgressBar | `components/ui/ProgressBar.tsx` | Server-compatible | Simple horizontal bar for category percentages |

`components/ui/*` are pure presentational primitives. They know nothing about scoring. This keeps them reusable when the two other Track A tools land later.

## 4. TypeScript data model

All types live in `lib/scoring/types.ts` and are exported.

### 4.1 CategoryKey

Union of the eight scoring category identifiers, listed in the exact order they appear in Issue #70. Order matters — it's the deterministic tie-break axis (see §8).

```ts
export type CategoryKey =
  | "problemSeverity"
  | "clearICP"
  | "painfulAlternatives"
  | "willingnessToPay"
  | "founderAdvantage"
  | "speedToMVP"
  | "distributionAccess"
  | "riskManageable";
```

### 4.2 Category catalogue

Single source of truth for weights and labels; consumed by both scoring and UI.

```ts
// lib/scoring/categories.ts
export interface CategoryMeta {
  key: CategoryKey;
  label: string;         // human label used in UI and copyable summary
  max: number;           // max points (sum across all = 100)
  order: number;         // 0..7, position in Issue #70's list; used for tie-breaks
  qualitativeFieldKey?: keyof QualitativeAnswers; // paired free-text field, if any
}

export const CATEGORIES: readonly CategoryMeta[] = [
  { key: "problemSeverity",     label: "Problem severity",              max: 20, order: 0, qualitativeFieldKey: "problem" },
  { key: "clearICP",            label: "Clear ICP",                      max: 15, order: 1, qualitativeFieldKey: "icp" },
  { key: "painfulAlternatives", label: "Existing painful alternatives",  max: 15, order: 2, qualitativeFieldKey: "alternatives" },
  { key: "willingnessToPay",    label: "Willingness to pay",             max: 15, order: 3, qualitativeFieldKey: "wtpSignal" },
  { key: "founderAdvantage",    label: "Founder / team advantage",       max: 10, order: 4 },
  { key: "speedToMVP",          label: "Speed to MVP",                   max: 10, order: 5 },
  { key: "distributionAccess",  label: "Distribution access",            max: 10, order: 6, qualitativeFieldKey: "distribution" },
  { key: "riskManageable",      label: "Risk level manageable",          max:  5, order: 7 },
] as const;
```

### 4.3 QualitativeAnswers

```ts
export interface QualitativeAnswers {
  ideaName: string;         // 1–80 chars
  oneLiner: string;         // 1–200 chars
  icp: string;              // 1–400 chars
  problem: string;          // 1–1000 chars
  alternatives: string;     // 1–1000 chars
  assumptions: string;      // 1–1000 chars
  wtpSignal: string;        // 1–400 chars
  distribution: string;     // 1–400 chars
}
```

### 4.4 SelfScores

```ts
export type SelfScoreValue = 1 | 2 | 3 | 4 | 5;

// Exactly one entry per CategoryKey; must be present at submit time.
export type SelfScores = Record<CategoryKey, SelfScoreValue>;
```

### 4.5 IdeaValidationInput

The full submitted input. This is what the form produces and what the scoring function consumes.

```ts
export interface IdeaValidationInput {
  answers: QualitativeAnswers;
  selfScores: SelfScores;
}
```

### 4.6 CategoryScore

```ts
export interface CategoryScore {
  key: CategoryKey;
  label: string;
  selfScore: SelfScoreValue;   // 1–5
  max: number;                 // from CATEGORIES
  points: number;              // integer, 0..max, from the formula in §5
  percent: number;             // integer 0..100, = round(points / max * 100)
}
```

### 4.7 Verdict

```ts
export type Verdict =
  | "Build MVP"
  | "Validate with landing page/interviews"
  | "Research more"
  | "Pause or reshape";
```

Wording is fixed and verbatim from Issue #70.

### 4.8 IdeaValidationResult

```ts
export interface IdeaValidationResult {
  total: number;                        // 0..100 integer
  verdict: Verdict;
  categoryScores: CategoryScore[];      // exactly 8, in Issue #70 order
  strongest: CategoryScore[];           // 0..3 entries
  weakest: CategoryScore[];             // 0..3 entries, disjoint from strongest
  recommendedActions: string[];         // 0..3 entries, aligned to weakest
}
```

The form's transient state uses `Partial<QualitativeAnswers>` and `Partial<SelfScores>` while the user is filling it in. `IdeaValidationInput` is only constructed after validation passes.

## 5. Scoring architecture

All scoring lives in `lib/scoring/calculate.ts` as pure functions. No React, no `window`, no side effects. Fully testable with Vitest.

### 5.1 Public API

```ts
export function calculateIdeaScore(input: IdeaValidationInput): IdeaValidationResult;

// Internal helpers exported for tests
export function scoreCategory(key: CategoryKey, selfScore: SelfScoreValue): CategoryScore;
export function deriveVerdict(total: number): Verdict;
export function rankCategories(scores: CategoryScore[]): { strongest: CategoryScore[]; weakest: CategoryScore[] };
export function deriveNextActions(weakest: CategoryScore[]): string[];
```

### 5.2 Category → points formula

For each category:

```
points = Math.round((selfScore / 5) * category.max)
```

Deterministic, transparent, easy to explain. Because both `selfScore` and `max` are integers and `5` is the divisor, `Math.round` never faces a `.5` boundary for any of the eight categories:

| Category | max | Products max × selfScore / 5 | All results integer? |
|---|---:|---|---|
| Problem severity | 20 | 4, 8, 12, 16, 20 | ✓ |
| Clear ICP | 15 | 3, 6, 9, 12, 15 | ✓ |
| Painful alternatives | 15 | 3, 6, 9, 12, 15 | ✓ |
| Willingness to pay | 15 | 3, 6, 9, 12, 15 | ✓ |
| Founder advantage | 10 | 2, 4, 6, 8, 10 | ✓ |
| Speed to MVP | 10 | 2, 4, 6, 8, 10 | ✓ |
| Distribution access | 10 | 2, 4, 6, 8, 10 | ✓ |
| Risk manageable | 5 | 1, 2, 3, 4, 5 | ✓ |

So `Math.round` is defensive; the input space produces integers directly. Tests will lock this behaviour.

### 5.3 Sum of maxima

Sum of `category.max`:

```
20 + 15 + 15 + 15 + 10 + 10 + 10 + 5 = 100  ✓
```

A Vitest test asserts this at build time so no accidental edit can silently break the total.

### 5.4 Percent per category

```
percent = Math.round((points / max) * 100)
```

Only used for the strongest / weakest ranking display, not for the total.

### 5.5 Total

```
total = sum of all eight `points` values
```

Integer, in `[0, 100]`. Passed to `deriveVerdict`.

### 5.6 Verdict mapping

```ts
export function deriveVerdict(total: number): Verdict {
  if (total >= 80) return "Build MVP";
  if (total >= 60) return "Validate with landing page/interviews";
  if (total >= 40) return "Research more";
  return "Pause or reshape";
}
```

Wording: verbatim from Issue #70. Do not paraphrase.

## 6. Exact verdict rules

Verbatim from Issue #70:

| Total | Verdict |
|---|---|
| 80–100 | Build MVP |
| 60–79 | Validate with landing page/interviews |
| 40–59 | Research more |
| Below 40 | Pause or reshape |

## 7. Boundary handling

Every boundary the issue implies is covered by an explicit Vitest test.

| Input total | Expected verdict | Test |
|---:|---|---|
| 0 | Pause or reshape | verdict.boundary.zero |
| 39 | Pause or reshape | verdict.boundary.39 |
| 40 | Research more | verdict.boundary.40 |
| 59 | Research more | verdict.boundary.59 |
| 60 | Validate with landing page/interviews | verdict.boundary.60 |
| 79 | Validate with landing page/interviews | verdict.boundary.79 |
| 80 | Build MVP | verdict.boundary.80 |
| 100 | Build MVP | verdict.boundary.100 |

Additional guards:

- `deriveVerdict(-1)` and `deriveVerdict(101)` should not throw. `-1` falls through to `"Pause or reshape"`; `101` still matches `>= 80` and returns `"Build MVP"`. This is a defensive check; scoring should never produce these values, but the function must remain total.
- `calculateIdeaScore` throws a typed error if any of the eight `selfScores` is missing or outside 1..5. The UI prevents this state, but the pure function must fail loudly if called incorrectly.

## 8. Strongest and weakest category logic

Deterministic, no randomness, disjoint lists.

### 8.1 Algorithm

```ts
function rankCategories(scores: CategoryScore[]): { strongest: CategoryScore[]; weakest: CategoryScore[] } {
  // scores arrive already in Issue #70 order (from CATEGORIES)
  const byStrongest = [...scores].sort((a, b) => b.percent - a.percent || orderOf(a) - orderOf(b));
  const strongest = byStrongest.slice(0, 3);

  const strongestKeys = new Set(strongest.map(s => s.key));
  const remaining = scores.filter(s => !strongestKeys.has(s.key));
  const byWeakest = [...remaining].sort((a, b) => a.percent - b.percent || orderOf(a) - orderOf(b));
  const weakest = byWeakest.slice(0, 3);

  return { strongest, weakest };
}
```

Where `orderOf(s) = CATEGORIES.find(c => c.key === s.key)!.order`.

### 8.2 Tie-break rule (documented for reviewers)

- **Strongest:** sort by percentage descending. Ties break by category order in Issue #70 (earlier first). This means when several categories are equal, Problem severity beats Clear ICP beats Painful alternatives, etc.
- **Weakest:** computed from the categories that did not make it into strongest. Sort by percentage ascending. Ties break by category order in Issue #70 (earlier first) — same direction as strongest, kept consistent to avoid a second axis.
- **Disjointness:** enforced by construction — strongest is computed first, weakest draws only from the leftover set. A category can never appear on both lists.
- **List lengths:** each list holds up to 3 entries. If there are fewer than 6 total categories with distinct enough percentages, the lists still fill from the sorted arrays, so both are exactly `min(3, remaining.length)` long.

### 8.3 Edge cases covered by tests

- All eight categories at 100% (input `selfScores = 5,5,5,5,5,5,5,5`): strongest = first 3 by order (Problem severity, Clear ICP, Painful alternatives); weakest = next 3 by order (Willingness to pay, Founder advantage, Speed to MVP). Every category is 100%, but the lists are stable and non-overlapping.
- All eight at 0%: symmetric — strongest = first 3 by order; weakest = next 3 by order.
- The Step-01 example (selfScores `4,5,3,3,5,5,3,4`): strongest = Clear ICP / Founder / Speed (100%); weakest = Painful alternatives / Willingness to pay / Distribution (60%). Locked by a test.

## 9. Next-action recommendation logic

Static, deterministic, no AI. One recommended action string per category. When the tool returns weakest categories, it returns the same-length array of matching action strings.

### 9.1 Category → action mapping

Working copy, to be lightly wordsmithed by Ruthwik in Step 07. Kept in `lib/scoring/calculate.ts` as a constant map keyed by `CategoryKey`:

| Category | Recommended action |
|---|---|
| problemSeverity | Interview five target users about how often the problem happens and what it costs them |
| clearICP | Narrow the target user to one segment and describe them in one sentence |
| painfulAlternatives | List three current alternatives and note what each one is missing |
| willingnessToPay | Test a paid pre-order, waitlist deposit, or landing page price |
| founderAdvantage | Write one paragraph on why you are the right person to build this |
| speedToMVP | Cut scope until a v0 can be built in one to two weeks |
| distributionAccess | Pick one channel and post three times about the problem to test reach |
| riskManageable | List the top three risks and one mitigation for each |

### 9.2 Function

```ts
export function deriveNextActions(weakest: CategoryScore[]): string[] {
  return weakest.map(w => RECOMMENDED_ACTIONS[w.key]);
}
```

Output length matches `weakest.length` (0..3).

## 10. Form validation

Validation is client-side and reactive. The submit button is disabled until the form is valid; on invalid submit attempt (e.g. via Enter), the first invalid field receives focus and shows its error.

### 10.1 Required fields

All eight qualitative fields and all eight self-scores must be present before submit is allowed.

| Field | Required | Empty state → error |
|---|---|---|
| Idea name | yes | "Give the idea a short name." |
| One-line description | yes | "Describe the product in one sentence." |
| Target user / ICP | yes | "Who is this for?" |
| Problem / pain | yes | "Describe the problem this solves." |
| Current alternatives | yes | "How do they solve it today?" |
| Biggest assumptions | yes | "What must be true for this idea to work?" |
| Willingness-to-pay signal | yes | "Any evidence users pay for this today?" |
| Distribution access | yes | "How will you reach them?" |
| Self-score × 8 | each required | "Pick a score from 1 to 5." |

### 10.2 Character limits

Enforced with `maxLength` on the DOM plus a validation guard on submit.

| Field | Min | Max |
|---|---:|---:|
| Idea name | 1 | 80 |
| One-line description | 1 | 200 |
| ICP | 1 | 400 |
| Problem, alternatives, assumptions | 1 each | 1000 each |
| WTP signal, distribution | 1 each | 400 each |

### 10.3 Score validation

Self-score values are constrained to the union `1 | 2 | 3 | 4 | 5` via `RadioScale`. There is no free-text score input. Invalid values are impossible from the UI; the pure function still guards against them.

### 10.4 Empty / invalid / submit / reset states

| State | Behaviour |
|---|---|
| Empty | All fields empty; self-scores unselected; submit disabled; no result shown. |
| Partial | User has filled some fields; per-field errors appear on blur once touched; submit stays disabled. |
| Valid | Submit enabled. Clicking triggers `calculateIdeaScore` synchronously; result renders inline below the form (no navigation, no scroll jump). |
| Invalid submit | Guarded: `<button disabled>`; keyboard Enter is intercepted; first invalid field scrolls into view. |
| Edit after result | Any change to any field marks the result as stale; a "Recalculate" affordance appears. |
| Reset | Clears all fields, self-scores, errors, and result. Confirmation not required — undo pattern is left as a future improvement. |
| Load sample | Populates all fields and self-scores from a chosen sample; result is not auto-calculated (user still clicks Submit) to keep the mental model consistent. |

## 11. Result experience

Rendered by `ResultPanel.tsx` and driven by `IdeaValidationResult`.

Sections, top to bottom:

1. **Score card** — big total `NN / 100`, verdict badge with band-appropriate colour (Tailwind `bg-emerald-*` for Build MVP, `bg-sky-*` for Validate, `bg-amber-*` for Research more, `bg-rose-*` for Pause or reshape). Verdict text is verbatim from §4.7.
2. **Category breakdown** — eight rows, each with label, `points/max`, and a `ProgressBar` showing `percent`. Rendered in Issue #70 order.
3. **Strongest areas** — bulleted list of up to three category labels with their percentages.
4. **Weakest areas** — same shape as strongest.
5. **Recommended next 3 actions** — ordered list of up to three strings from `deriveNextActions`.
6. **Copyable summary** — read-only `<textarea>` with a "Copy" button. Format:
   ```
   AI Idea Validator — {ideaName}
   Score: {total} / 100 — {verdict}
   
   Strongest:
   - {label} ({percent}%)
   ...
   
   Weakest:
   - {label} ({percent}%)
   ...
   
   Next 3 actions:
   1. {action}
   2. {action}
   3. {action}
   
   Scored with the AIPE Labs AI Idea Validator.
   ```
   Copy uses `navigator.clipboard.writeText`; if unavailable, the textarea is pre-selected and the button becomes "Select all — copy manually". No external clipboard library.
7. **Reset button** — same behaviour as §10.4 reset row.

Accessibility notes for the result:

- The Score card announces itself via an `aria-live="polite"` region so screen readers pick up the new verdict when the form is submitted.
- The verdict badge relies on both colour and text — the label is always visible; colour is decorative.

## 12. Sample ideas

Sample ideas live in `lib/scoring/samples.ts` as fully-typed `IdeaValidationInput` fixtures. Three samples cover three verdict bands; a fourth is a stretch. All are usable by:

- the "Load example" affordance in the form (dropdown of sample labels),
- Vitest tests in `calculate.test.ts`,
- the QA report in Step 08.

| # | Working title | Source | Target verdict band | Reason for choosing it |
|---:|---|---|---|---|
| 1 | AI Launch Checklist Builder | Verbatim qualitative from `templates/idea-validation/example-filled-saas-idea.md`; self-scores `4,5,3,3,5,5,3,4` | Validate with landing page/interviews (79) | Continuity with the existing lead magnet; recognisable to Skool members. Locked by product-brief §11. |
| 2 | To be authored in Step 04 — pharma clinical-trial compliance tool | New | Build MVP (target 82–88) | Exercises the top band. Narrow ICP, strong pain, high WTP, real distribution constraint (justifies not being a 100). |
| 3 | To be authored in Step 04 — generic "AI content assistant for everyone" | New | Pause or reshape (target 25–35) | Exercises the bottom band. Broad ICP, weak differentiation, low WTP, crowded alternatives. |
| 4 (optional stretch) | To be authored in Step 04 — small-town restaurant menu translator | New | Research more (target 45–55) | Fills the mid-low band for QA completeness. Skippable if time-boxed. |

Constraints on sample authoring in Step 04:

- Every sample sets all eight qualitative fields at realistic length (no lorem ipsum).
- Every sample sets all eight self-scores explicitly.
- Every sample includes an `expectedTotal` and `expectedVerdict` field on a QA-only wrapper (used by tests only, not shown in UI) so Vitest can assert the fixture matches the deterministic output.

## 13. Testing strategy

### 13.1 Scope

Vitest for the scoring logic only. No component tests for v0. No Playwright / Cypress. This is deliberate:

- Scoring is the only piece where correctness is non-obvious.
- Components are thin, largely presentational, and covered by manual QA in Step 08.

### 13.2 Configuration

- `vitest.config.ts` at the app root.
- Test file colocated with the code: `lib/scoring/calculate.test.ts`.
- Runner: `npm test` → `vitest run`.
- Dev loop: `npm run test:watch` → `vitest`.

### 13.3 Test list

Grouped by `describe` block. Names shown are the intended `it()` descriptions.

**describe: category catalogue**
- categories sum to 100 exactly
- categories are ordered as listed in Issue #70
- each category appears exactly once

**describe: scoreCategory**
- selfScore 1 yields the expected minimum points for each category
- selfScore 3 yields the mid points for each category
- selfScore 5 yields exactly `max` for each category
- selfScore out of range throws

**describe: calculateIdeaScore — arithmetic**
- all-1 input scores 20 total
- all-3 input scores 60 total
- all-5 input scores 100 total
- known Sample #1 input scores exactly 79

**describe: deriveVerdict — boundaries**
- 0 → Pause or reshape
- 39 → Pause or reshape
- 40 → Research more
- 59 → Research more
- 60 → Validate with landing page/interviews
- 79 → Validate with landing page/interviews
- 80 → Build MVP
- 100 → Build MVP

**describe: rankCategories**
- Sample #1 strongest = Clear ICP, Founder, Speed
- Sample #1 weakest = Painful alternatives, Willingness to pay, Distribution
- strongest and weakest are always disjoint
- all-equal percentages tie-break by Issue #70 order

**describe: deriveNextActions**
- returns one action per weakest entry, in the same order
- returns an empty array when weakest is empty
- every category has a mapped action

**describe: samples**
- each sample produces the expected verdict band
- each sample matches its declared `expectedTotal` and `expectedVerdict`

### 13.4 Success threshold

All tests must pass with zero failures and zero skips before Step 08 "Local QA passes" is checked off. Coverage is not enforced as a numeric threshold in v0 — the test list above is exhaustive for scoring.

## 14. Deployment

### 14.1 Vercel project settings

| Setting | Value |
|---|---|
| Framework preset | Next.js (auto-detected) |
| Root Directory | `tools/free-leadmagnets` |
| Build Command | `npm run build` (default from Next.js preset) |
| Install Command | `npm ci` (default) |
| Output Directory | `.next` (default) |
| Node.js version | 20.x |
| Environment variables | **None.** v0 requires zero env vars. |

### 14.2 Local commands

Documented in `tools/free-leadmagnets/README.md`:

| Command | Purpose |
|---|---|
| `nvm use` | Reads `.nvmrc` and switches to Node 20 |
| `npm ci` | Reproducible install from `package-lock.json` |
| `npm run dev` | Local dev at `http://localhost:3000/tools/idea-validator` |
| `npm run build` | Production build; must exit 0 |
| `npm run start` | Serve the production build locally for smoke test |
| `npm test` | Vitest, one-shot |
| `npm run test:watch` | Vitest, watch mode |
| `npm run lint` | `next lint` |
| `npm run typecheck` | `tsc --noEmit` |

### 14.3 Production verification (post-deploy smoke test)

Documented in `deployment.md` in Step 09. Preview here:

1. Open `https://<preview-url>/tools/idea-validator`.
2. Confirm intro copy renders and no console errors are present.
3. Click "Load example" (Sample #1). Every field populates.
4. Click "Calculate". Result appears; total is `79`; verdict is "Validate with landing page/interviews".
5. Click "Copy summary". Paste into a scratch buffer; verify format matches §11.
6. Click "Reset". Form clears; result disappears.
7. Repeat with a manually entered idea to confirm the flow works end-to-end.
8. On mobile viewport (390 × 844): scroll through the form; radio scales are tappable with thumb; result is legible.
9. Keyboard-only pass: Tab through every field, arrow keys navigate `RadioScale`, Enter submits, Escape does nothing.

### 14.4 Rollback

Vercel keeps immutable deployments. Rollback = promote a previous deployment. Documented in `deployment.md`.

## 15. Dependencies

Exact list; nothing else is allowed without an explicit change to this plan.

### 15.1 Runtime `dependencies`

| Package | Version bound | Why |
|---|---|---|
| `next` | ^15 latest stable | Framework. Exact version pinned in `package-lock.json`. |
| `react` | ^19 latest paired with Next 15 | Framework. |
| `react-dom` | matches `react` | Framework. |

### 15.2 `devDependencies`

| Package | Version bound | Why |
|---|---|---|
| `typescript` | ^5 latest | Types. |
| `@types/react` | matches `react` | Types. |
| `@types/react-dom` | matches `react-dom` | Types. |
| `@types/node` | ^20 | Types for Node builtins in config files. |
| `tailwindcss` | ^3 latest | Styling. |
| `postcss` | required by Tailwind | Build step. |
| `autoprefixer` | required by Tailwind | Build step. |
| `eslint` | matches `eslint-config-next` | Linting. |
| `eslint-config-next` | matches Next major | Linting. |
| `vitest` | ^2 latest | Scoring tests. |

### 15.3 Explicitly forbidden in v0

The following do **not** appear in `package.json`. Any PR adding them requires a separate approved issue.

- `@supabase/*`, `@prisma/*`, `drizzle-orm`, `kysely`, or any DB client.
- `next-auth`, `@clerk/*`, `@auth0/*`, or any auth SDK.
- `stripe`, `lemonsqueezy`, or any payment SDK.
- `ai`, `@ai-sdk/*`, `openai`, `@anthropic-ai/sdk`, `@google/generative-ai`.
- `zustand`, `redux`, `@reduxjs/toolkit`, `jotai`, `recoil` — React state suffices.
- `@radix-ui/*`, `shadcn-ui`, `@headlessui/*`, `@mui/*`, `chakra-ui`.
- `axios`, `swr`, `@tanstack/react-query` — the tool makes no network calls.
- Any analytics library. Vercel default analytics can be enabled at deploy time without a package.

### 15.4 CSS

- Tailwind only. No CSS-in-JS runtime (no `styled-components`, no `emotion`).
- `components/ui/*` uses a tiny local `cn()` helper in `lib/utils.ts` that joins truthy class strings. No `clsx`, no `tailwind-merge` unless a real conflict emerges — noted as a follow-up, not a v0 dep.

## 16. Security and privacy

Because there is no backend and no persistence, the security surface is small. Still documented so future revisions do not silently expand it.

- **No PII collected.** The tool never sends user input off the device.
- **No cookies, no localStorage, no sessionStorage, no IndexedDB.** All form state lives in in-memory React state and is discarded on refresh.
- **No third-party scripts** other than what Next.js and Vercel emit by default. Vercel Analytics is not enabled in v0.
- **No inbound API surface.** No `app/api/*` routes exist in v0.
- **Content Security Policy** is not custom-configured for v0. Next.js defaults are accepted; a strict CSP can be added later without changing product behaviour.
- **Clipboard** access uses `navigator.clipboard.writeText` on user gesture only. On browsers that block it, the textarea fallback still works.
- **Rendered user input** goes through React, which escapes by default. No `dangerouslySetInnerHTML` anywhere.
- **Dependencies** are pinned via `package-lock.json`. Dependabot is not configured for the app in v0 (repo-wide config is a separate epic).
- **No secrets.** `.env*` files are gitignored and not required. If a future revision adds env vars, they must be documented in `deployment.md` and reviewed by Hitesh.
- **Copy-summary output** is plain text; there is no HTML injection vector even when pasted into rich editors.

## 17. Mapping to Issue #70 Definition of Done

Each DoD item is anchored to the step that fulfils it.

| # | DoD item | Fulfilled in | Verified by |
|---:|---|---|---|
| 1 | Product brief exists | Step 01 ✓ | `tools/free-leadmagnets/idea-validator/product-brief.md` |
| 2 | Technical implementation plan exists | Step 02 (this file) | This file's presence and Hitesh review |
| 3 | MVP fields approved | Step 02 §2, §3 (subject to review) | Hitesh comment on this file |
| 4 | Scoring logic defined | Step 04 | `lib/scoring/calculate.ts` + Vitest suite |
| 5 | UI prototype exists | Step 03 | `npm run dev` shows the form |
| 6 | Form wired to scoring | Step 05 | Submit yields a `IdeaValidationResult` |
| 7 | Tool can score ≥3 sample ideas | Step 04 (samples) + Step 05 (Load example) | Vitest + manual QA in Step 08 |
| 8 | Result can be copied / shared to Skool | Step 06 | Copy button + formatted summary text |
| 9 | Local QA passes | Step 08 | `qa-report.md` with `npm run build` and `npm test` output |
| 10 | Deployment checklist or live URL exists | Step 09 | `deployment.md` |
| 11 | Skool build post published | Handoff (Ruthwik) | Draft ready in Step 07 |
| 12 | X build post published | Handoff (Sujay) | Draft ready in Step 07 |
| 13 | Hitesh reviews and approves first demo | Handoff (Hitesh) | Comment on #70 |
| 14 | Learnings captured for paid boilerplate | Step 10 | `launch-checklist.md` learnings section |

## 18. Implementation sequence for Steps 03–10

Each step is a small, reviewable change. Each step must be signed off before the next begins.

### Step 03 — Page Skeleton

Scaffold the Next.js app at `tools/free-leadmagnets/` per §2. No scoring logic yet. Deliverables:

- `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.json`, `.gitignore`, `.nvmrc`, `next-env.d.ts` shape.
- `app/layout.tsx`, `app/globals.css`, `app/page.tsx`.
- `app/tools/idea-validator/page.tsx` renders intro + a non-functional form (fields present, submit disabled, no scoring).
- `components/ui/*` primitives.
- `README.md` with local commands from §14.2.

Acceptance: `npm run build` exits 0; the route renders; the form is visible; no scoring anywhere yet.

### Step 04 — Types + Scoring

Implement `lib/scoring/*` per §4 and §5. Deliverables:

- `types.ts`, `categories.ts`, `calculate.ts`, `samples.ts` (three real samples + optional fourth), `calculate.test.ts`.

Acceptance: `npm test` passes with the full test list from §13.3; `calculate.ts` has zero React imports.

### Step 05 — Wire Form to Scoring

Connect `IdeaValidatorForm.tsx` to `calculateIdeaScore`. Deliverables:

- Controlled form with `useState` (no `useReducer` unless it simplifies the code substantially).
- Load-example dropdown wired to `samples.ts`.
- Submit → validate → compute → set result state.
- Reset → clear all state.

Acceptance: a user can complete the form and see a result end-to-end.

### Step 06 — Result Experience

Implement `ResultPanel.tsx` per §11. Deliverables:

- Score card, verdict badge, category breakdown, strongest, weakest, next 3 actions.
- Copyable summary with clipboard + textarea fallback.
- Reset button.

Acceptance: the panel renders correctly for Samples #1, #2, #3; the copy summary matches the format in §11.

### Step 07 — Skool + X content

Create five Markdown drafts under `tools/free-leadmagnets/idea-validator/launch/`:

- `skool-build-in-public.md`
- `skool-feedback-request.md`
- `x-announcement.md`
- `x-demo.md`
- `x-thread-outline.md`

Tone matches the existing `templates/idea-validation/skool-post.md` and `x-launch-posts.md`. No hype, practical CTA.

Acceptance: files exist and read as review-ready drafts.

### Step 08 — QA

Produce `tools/free-leadmagnets/idea-validator/qa-report.md` with:

- `npm run build` output (verbatim tail).
- `npm test` output.
- `npm run lint` and `npm run typecheck` output.
- Manual QA table walking every acceptance-checklist item.
- Boundary verification via samples and one-off inputs.
- Bugs found + fixes applied (if any).

Acceptance: all items check green.

### Step 09 — Deployment

Produce `deployment.md`:

- Vercel settings per §14.1.
- Rollback procedure.
- Smoke-test checklist per §14.3.

Acceptance: file exists; Sujay can act on it.

### Step 10 — Launch and Feedback

Produce `launch-checklist.md` with per-owner tasks (Hitesh, Sujay, Ruthwik), feedback prompts, metrics to capture, and the learnings section required by DoD item 14.

Acceptance: file exists and covers all Prompt 10 subsections from Issue #70.

## 19. Remaining risks or genuinely unresolved decisions

**Confirmed defaults — I will proceed with these unless told otherwise:**

1. **Node 20 LTS + Next.js 15 + React 19.** These are the current stable versions on Vercel's platform for new projects. The plan pins majors (`^15`, `^19`, `^20`) and locks exact versions in `package-lock.json`.
2. **A single-Vercel-project deployment** with Root Directory set to `tools/free-leadmagnets`. No monorepo tooling. If the AIPE Labs org later adopts Turborepo / Nx, this app will move without breaking its route contract.
3. **No `vercel.json` at repo root.** Root Directory setting handles it. Any redirect / header rules can go in `next.config.mjs`.
4. **No error boundary component in v0.** Next.js's default `app/error.tsx` is added at the app root as a minimal fallback that shows "Something went wrong — try Reset". A richer error UX is a follow-up.
5. **No route for a shared `/tools` index in v0.** Home page (`/`) is the tools index. When Tool #2 lands, a proper `app/tools/page.tsx` can be added without changing this tool's route.

**Small risks worth naming:**

6. **Vercel Root Directory + monorepo detection.** The first deploy needs a human to set Root Directory in the Vercel dashboard. This is documented in `deployment.md` (Step 09) and called out in the launch checklist (Step 10). Missed configuration would produce a "no framework detected" error on the first build; recovery is a two-click fix.
7. **Clipboard on iOS Safari older than 13.4.** `navigator.clipboard.writeText` requires HTTPS and a user gesture and returns a promise that can reject. The textarea fallback covers older versions; documented in §11.
8. **The plan wordsmiths eight next-action strings.** Ruthwik should treat the strings in §9.1 as first drafts. Any changes must land in `lib/scoring/calculate.ts` (single source), not scattered across UI files.
9. **Sample #2 and #3 authoring.** Titles are proposed; the full qualitative text and exact self-scores are Step 04 work. Two risks: (a) the self-scores chosen must actually produce the target verdict band under the deterministic formula — every sample includes an `expectedTotal` in its fixture so tests catch a mistake here; (b) Sample #2's clinical-trial framing should not be read as legal or regulatory advice — safe to caveat as "illustrative" in the intro copy.
10. **Analytics stay off in v0.** Metrics for the launch checklist (Step 10) will be manually captured from Vercel's built-in view counts and Skool/X's native analytics — no `analytics.md` field-tracking plan for v0.

None of these are blockers for Step 03.
