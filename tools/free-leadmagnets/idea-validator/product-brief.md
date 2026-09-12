# Product Brief — AI Idea Validator

Related issue: #70 — TrackA-FreeTool-01 — Build AI Idea Validator
Parent issue: #59 — Announce Three-Product Build Lab and Boilerplate Track
Architecture reference: #63 — Day 08 Define Architecture and Tech Stack
Related asset: `templates/idea-validation/free-ai-idea-validation-canvas.md` (Issue #6)

Track: A — Free lead-magnet tools
Folder: `tools/free-leadmagnets`
Route: `/tools/idea-validator`
Owner: Ruthwik — @ruthwiklee
Reviewer: Hitesh — @hiteshiat1
Distribution: Sujay — @Sujay0908

Version: 0.1 (v0 MVP)
Status: Draft for Hitesh review (Step 01 of 10)

---

## 1. Problem Statement

AI-assisted builders can now create working prototypes in hours. Most of them build too quickly and skip the harder question: is this problem real, painful, and worth solving?

The result is a growing pile of demo apps that never reach real users because the underlying idea was never validated. Builders lose time, motivation, and money on ideas that were never going to work.

There is already a written AI Idea Validation Canvas in the repo (`templates/idea-validation/free-ai-idea-validation-canvas.md`), but a Markdown/Notion document has friction — copy it, paste it, fill it in, add up the score, look up the verdict, remember what the next action is. Most builders will not finish it.

An interactive tool that walks the builder through the canvas, calculates the score, returns the verdict, and suggests next actions makes the same discipline reachable in a few minutes.

## 2. Product Purpose / Goal

AI Idea Validator helps builders decide whether an idea is worth:

- Building as an MVP
- Validating first with a landing page or interviews
- Researching further
- Pausing or reshaping

The tool is the interactive version of the AI Idea Validation Canvas. It is the first free public AIPE Labs tool and is intended to become live proof that AIPE Labs helps builders move from idea → validation → product direction, distributed through Skool and X.

Non-goals for v0:

- The tool does not decide for the user. It scores what the user answers and returns a transparent verdict.
- The tool does not replace customer interviews, market research, or Hitesh's judgement.
- The tool does not use an external AI API in v0. Scoring is deterministic.

## 3. Target Users

Primary users (from Issue #70):

- AI-assisted builders with early app ideas.
- Indie hackers deciding what to build.
- Founders with several product ideas and no prioritisation system.
- Junior builders who can create demos but do not know whether the problem is real.

Secondary users:

- Skool members who are looking for a practical first exercise inside AIPE Labs.
- X visitors landing on the tool from a build-in-public post.

## 4. Core User Journey

From Issue #70, extended with the minimum interaction detail needed to build v0:

1. User lands on `/tools/idea-validator` and reads a short introduction.
2. User clicks Start — or Load example — to open the form.
3. User enters an idea name and one-line description.
4. User defines the target user / ICP.
5. User describes the problem and current alternatives.
6. User describes the biggest assumptions.
7. User provides a willingness-to-pay signal.
8. User provides a distribution access signal.
9. For each of the eight scoring categories, user self-scores on a 1–5 scale.
10. User submits the form.
11. Tool calculates a 100-point score deterministically.
12. Tool returns a verdict: Build MVP, Validate with landing page/interviews, Research more, or Pause or reshape.
13. Tool shows the category breakdown, strongest areas, weakest areas, and the recommended next three actions.
14. User can copy a plain-text summary to paste into Skool.
15. User can edit their answers and recalculate, or reset and start again.

## 5. MVP Scope

### Must include (verbatim from Issue #70)

- Idea input form
- Target user / ICP field
- Problem / pain field
- Current alternatives field
- Biggest assumptions field
- Willingness-to-pay signal
- Distribution access field
- 100-point scoring model
- Verdict output
- Next-action recommendations

### Additional v0 requirements derived from Issue #70 Prompts 03–10

- Landing / intro section that explains the tool
- Submit / calculate button
- Result section with total score, verdict, category breakdown, strongest and weakest areas, top three next actions
- Copyable summary for pasting into Skool
- Reset / start again button
- Example idea button that pre-fills sample data
- Mobile-friendly layout
- Basic form validation
- At least three sample ideas that can be scored end-to-end (used for QA and the example button)

## 6. Out of Scope (Do Not Build Yet)

From Issue #70, verbatim:

- Login
- Saved projects
- Payments
- Complex dashboard
- Advanced AI agent workflow
- Multi-user collaboration

Additional v0 exclusions:

- No database. No user accounts. No persistence across sessions.
- No external AI API for scoring, explanation, or generation.
- No email capture, waitlist, or lead form.
- No analytics beyond what Vercel provides by default.
- No internationalisation. English only.
- No dark-mode toggle for v0 (system-default is acceptable if it comes free with the styling choice).

## 7. Input Fields

Each field is clearly either a qualitative text answer or a numeric 1–5 self-score. Every scoring category has one 1–5 self-score. Some categories are paired with a qualitative field for context; others (founder advantage, speed to MVP, risk manageable) are numeric only in v0 because the canvas does not require additional text for them at this stage.

### Qualitative fields (free text)

| Field | Type | Required | Notes |
|---|---|---|---|
| Idea name | short text | yes | 1–80 chars |
| One-line description | short text | yes | 1–200 chars |
| Target user / ICP | short text | yes | Who is this for |
| Problem / pain | longer text | yes | What breaks today, and why it matters |
| Current alternatives | longer text | yes | How users solve it today, including the do-nothing option |
| Biggest assumptions | longer text | yes | What must be true for this idea to work |
| Willingness-to-pay signal | short text | yes | Any evidence users pay for this today |
| Distribution access | short text | yes | How the builder plans to reach the ICP |

### Numeric self-score fields (1–5)

All eight scoring categories are self-scored on a 1–5 scale, following the same scale the AI Idea Validation Canvas already uses (1 = mild / weak, 5 = urgent / strong). The 1–5 value is deterministically converted into the category's point value using the category's maximum from Issue #70.

| Category | Category max | Paired qualitative field |
|---|---:|---|
| Problem severity | 20 | Problem / pain |
| Clear ICP | 15 | Target user / ICP |
| Existing painful alternatives | 15 | Current alternatives |
| Willingness to pay | 15 | Willingness-to-pay signal |
| Founder / team advantage | 10 | — |
| Speed to MVP | 10 | — |
| Distribution access | 10 | Distribution access |
| Risk level manageable | 5 | — |

The scoring formula is defined in the next section.

## 8. Scoring Model

The scoring model comes verbatim from Issue #70. Total = 100 points across eight categories:

| Category | Max points |
|---|---:|
| Problem severity | 20 |
| Clear ICP | 15 |
| Existing painful alternatives | 15 |
| Willingness to pay | 15 |
| Founder / team advantage | 10 |
| Speed to MVP | 10 |
| Distribution access | 10 |
| Risk level manageable | 5 |
| **Total** | **100** |

### How a 1–5 self-score becomes points

For each category the tool applies:

```
points = round( (selfScore / 5) * categoryMax )
```

Examples:

- Problem severity self-score 4 → round(4/5 × 20) = 16 points
- Clear ICP self-score 5 → round(5/5 × 15) = 15 points
- Speed to MVP self-score 3 → round(3/5 × 10) = 6 points
- Risk level manageable self-score 2 → round(2/5 × 5) = 2 points

The total is the sum of all eight category points, rounded to the nearest integer. Score range: 0–100.

The formula is deterministic, transparent, and easy to explain in a Skool post. It is intentionally not weighted by qualitative text length — qualitative fields exist for the builder's own thinking and for the copyable summary, not to influence the score.

## 9. Verdict Logic

Verdict bands come verbatim from Issue #70:

| Score band | Verdict |
|---|---|
| 80–100 | Build MVP |
| 60–79 | Validate with landing page/interviews |
| 40–59 | Research more |
| Below 40 | Pause or reshape |

Boundary rules to encode explicitly (verified in tests):

- 80 → Build MVP
- 79 → Validate with landing page/interviews
- 60 → Validate with landing page/interviews
- 59 → Research more
- 40 → Research more
- 39 → Pause or reshape
- 0 and 100 must not throw

### Strongest and weakest areas

- Strongest areas = categories with the highest percentage of their maximum. Show up to three.
- Weakest areas = categories with the lowest percentage of their maximum. Show up to three.
- Ties break by the order the categories are listed in Issue #70.

### Recommended next actions

Recommendations are pre-written short prompts, one per category. The tool returns the three prompts attached to the three weakest categories, in order. This keeps the recommendation deterministic and explainable in v0.

Example mapping (final wording confirmed in Step 04):

| Weak category | Recommended action |
|---|---|
| Problem severity | Interview five target users about how often the problem happens and what it costs them |
| Clear ICP | Narrow the target user to one segment and describe them in one sentence |
| Existing painful alternatives | List three current alternatives and note what each one is missing |
| Willingness to pay | Test a paid pre-order, waitlist deposit, or landing page price |
| Founder / team advantage | Write one paragraph on why you are the right person to build this |
| Speed to MVP | Cut scope until a v0 can be built in one to two weeks |
| Distribution access | Pick one channel and post three times about the problem to test reach |
| Risk level manageable | List the top three risks and one mitigation for each |

## 10. Example Input

Reused verbatim from `templates/idea-validation/example-filled-saas-idea.md` so the tool's example is consistent with the existing lead-magnet asset:

- Idea name: AI Launch Checklist Builder
- One-line description: A simple tool that helps AI-assisted builders turn a prototype into a production launch checklist based on their app type, stack and current blockers.
- Target user / ICP: AI-assisted builders who have already created a prototype and want to reach production.
- Problem / pain: Builders finish a prototype and do not know what steps are required to make it production-ready and launchable.
- Current alternatives: Generic ChatGPT checklists, YouTube tutorials, scattered launch checklists, advanced DevOps/SRE guides.
- Biggest assumptions: Builders will use a stage-and-stack checklist over generic advice; a free checklist can be extended into a paid OS.
- Willingness-to-pay signal: Builders already pay £9–£59 for templates and checklists in this space.
- Distribution access: X and Skool audiences match the ICP tightly.

Self-scores:

| Category | Self-score (1–5) |
|---|---:|
| Problem severity | 4 |
| Clear ICP | 5 |
| Existing painful alternatives | 3 |
| Willingness to pay | 3 |
| Founder / team advantage | 5 |
| Speed to MVP | 5 |
| Distribution access | 3 |
| Risk level manageable | 4 |

## 11. Example Output

Applying the formula to the example above:

| Category | Self-score | Max | Points |
|---|---:|---:|---:|
| Problem severity | 4 | 20 | 16 |
| Clear ICP | 5 | 15 | 15 |
| Existing painful alternatives | 3 | 15 | 9 |
| Willingness to pay | 3 | 15 | 9 |
| Founder / team advantage | 5 | 10 | 10 |
| Speed to MVP | 5 | 10 | 10 |
| Distribution access | 3 | 10 | 6 |
| Risk level manageable | 4 | 5 | 4 |
| **Total** | | **100** | **79** |

Result panel content:

- Total score: 79 / 100
- Verdict: Validate with landing page/interviews
- Strongest areas: Clear ICP (100%), Founder / team advantage (100%), Speed to MVP (100%)
- Weakest areas: Existing painful alternatives (60%), Willingness to pay (60%), Distribution access (60%)
- Recommended next actions:
  1. List three current alternatives and note what each one is missing
  2. Test a paid pre-order, waitlist deposit, or landing page price
  3. Pick one channel and post three times about the problem to test reach

Note: the same idea totals 79 in the existing `example-filled-saas-idea.md` and also lands in the Validate band there. The category-level points differ slightly — the canvas assigns manual per-category values while the tool applies the deterministic 1–5 formula — but the total and the verdict agree. This alignment is a QA check in Step 08 and does not change the sample fixture.

## 12. Success Criteria

The v0 is a success when:

- A first-time visitor can complete the form and see a verdict in under three minutes.
- The score, verdict, and reasoning are transparent enough that the user can explain them to someone else.
- The tool works end-to-end on a mobile phone.
- At least three sample ideas produce three different verdicts across the four bands.
- The copyable summary can be pasted into a Skool comment without editing.
- Hitesh approves the first public demo.
- At least ten Skool members or X respondents use the tool and share their verdict.
- No secrets, no API keys, and no external dependencies are required to run the tool.

## 13. Definition of Done

From Issue #70, verbatim (14 items). Owner column added.

| # | Item | Owner |
|---:|---|---|
| 1 | Product brief exists | Engineer |
| 2 | Technical implementation plan exists | Engineer |
| 3 | MVP fields approved | Hitesh |
| 4 | Scoring logic defined | Engineer |
| 5 | UI prototype exists | Engineer |
| 6 | Form is wired to scoring | Engineer |
| 7 | Tool can score at least three sample ideas | Engineer |
| 8 | Result can be copied / shared to Skool | Engineer |
| 9 | Local QA passes | Engineer |
| 10 | Deployment checklist or live URL exists | Engineer, Sujay |
| 11 | Skool build post is published | Ruthwik |
| 12 | X build post is published | Sujay |
| 13 | Hitesh reviews and approves first demo | Hitesh |
| 14 | Learnings are captured for the paid boilerplate | Engineer, Hitesh |

Items 11, 12, and 13 sit outside the engineering delivery. The engineer supplies review-ready drafts and a working demo; publication and approval remain human handoffs.

## 14. Product Assumptions

1. Users are honest with their self-scores. The tool does not attempt to detect optimism bias; the copyable summary is designed to be shared publicly, which itself creates mild honesty pressure.
2. A 1–5 self-score plus qualitative context is enough for v0. If Skool feedback shows users want AI-assisted scoring, that becomes a v1 candidate.
3. Client-side scoring is sufficient. No backend is required for v0. Deployment is on Vercel with no environment variables.
4. Deterministic verdict bands are more useful than probabilistic recommendations at this stage. Builders trust a transparent formula more than a black-box score.
5. The tool sits inside a single Next.js application at `tools/free-leadmagnets/`. The other two Track A tools (Founder Launch Checklist, GitHub Issue Generator) will later live as sibling routes in the same app.
6. Every scoring rule, verdict boundary, and next-action prompt lives in one file (`lib/scoring/`) so the model can be tuned without touching the UI. This preserves the "make it easy to modify later" requirement.
7. The existing `templates/idea-validation/*` files are not modified. They remain the canonical written asset. The tool references them but does not replace them.
8. The example idea is intentionally reused from the existing filled canvas so the Skool audience recognises it from the earlier lead magnet.
9. Launch content for the tool lives at `tools/free-leadmagnets/idea-validator/launch/`, separate from the earlier canvas launch content at `templates/idea-validation/`. The two launches address different assets and should not be conflated.
10. The scoring formula and verdict bands may be revised after real-user feedback. Any change is a follow-up issue, not a silent tweak.
