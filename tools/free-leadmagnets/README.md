# AIPE Labs — Free Lead-Magnet Tools

Next.js App Router application that hosts the AIPE Labs free public tools.

## Current tool

- **AI Idea Validator** — route: `/tools/idea-validator`

Sibling routes are reserved for the other two Track A tools (parent issue #59), to be added as follow-up work:

- `/tools/launch-checklist` — Founder Launch Checklist App (not yet built)
- `/tools/issue-generator` — GitHub Issue Generator for AI-built apps (not yet built)

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 3
- Node 20 LTS (see `.nvmrc`)
- No database, no authentication, no payments, no external AI APIs

## Local development

Requirements: Node 20 LTS and npm.

```bash
cd tools/free-leadmagnets
nvm use              # switches to Node 20 per .nvmrc
npm ci               # reproducible install from package-lock.json
npm run dev          # http://localhost:3000
```

Then open:

- <http://localhost:3000/> — tools index
- <http://localhost:3000/tools/idea-validator> — the tool

## npm scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | ESLint via `next lint` |
| `npm run typecheck` | `tsc --noEmit` |

## Implementation state

This is a build-in-public deliverable for Issue #70. Each step is a small, reviewable change.

- **Step 03 — Page skeleton** *(current step)* — All fields render. The **Calculate** button is disabled because scoring is not yet wired up.
- **Step 04 — Types + scoring logic** — Adds `lib/scoring/*` with the deterministic 100-point model, ≥3 sample fixtures, and Vitest tests.
- **Step 05 — Wire form to scoring** — Connects the form to `calculateIdeaScore`, enables Calculate, adds "Load example" and Reset behaviour.
- **Step 06 — Result experience** — Rich result panel with total, verdict, category breakdown, strongest/weakest, next actions, and copyable summary.
- **Step 07 — Launch content** — Skool and X drafts under `tools/free-leadmagnets/idea-validator/launch/`.
- **Step 08 — QA** — `qa-report.md` with build and test output.
- **Step 09 — Deployment** — `deployment.md` with the Vercel checklist.
- **Step 10 — Launch and feedback** — `launch-checklist.md` with per-owner tasks.

Docs artefacts live at `tools/free-leadmagnets/idea-validator/`:

- `product-brief.md` — Step 01
- `technical-plan.md` — Step 02
- Later steps add QA report, deployment guide, and launch checklist.
