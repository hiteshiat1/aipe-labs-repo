# AI Idea Validator — Deployment

Related issue: #70 — TrackA-FreeTool-01 — Build AI Idea Validator
Companion docs: `product-brief.md`, `technical-plan.md`, `qa-report.md`
Step 09 of 10 — deployment configuration, procedure, and smoke-test playbook.
Status document version: 0.1

---

## 1. Production URL

**[NOT DEPLOYED — AUTHORIZATION REQUIRED]**

The application has passed every engineering gate and is deploy-ready, but the actual production deployment cannot be completed by the engineering agent in-session. The blockers are named in §10 and the exact human handoff steps are in §4. This section will be replaced with the real Vercel production URL (e.g. `https://<project>.vercel.app` or a bound custom domain) once §4 is executed and §5 completes cleanly.

No URL has been fabricated. Do not assume any URL until this section shows a real one.

---

## 2. Hosting

**Vercel.**

- Deployment target confirmed by the approved technical plan §14.1.
- Static prerender only — no server components require request-time data. `next build` currently reports both routes as `○ (Static)`, so a Vercel Static / Edge Network deploy is sufficient. No Serverless Functions are needed for v0.
- No env vars, no server-side secrets, no external services.

---

## 3. Project configuration

Approved from the technical plan §14.1 — do not deviate.

| Setting | Value | Notes |
|---|---|---|
| Framework preset | **Next.js** | Vercel autodetects from `package.json` + `next.config.mjs`. |
| Root Directory | **`tools/free-leadmagnets`** | Critical — the Next.js app lives inside a monorepo-style docs repo, not at the repo root. If Root Directory is left blank, the deploy will fail with a "no framework detected" error. |
| Install Command | **`npm ci`** | Reproducible install from `package-lock.json`. Vercel's default is `npm install`; override this. |
| Build Command | **`npm run build`** | Vercel default for Next.js — leave the Vercel-provided default if it says `next build`. |
| Output Directory | `.next` | Vercel default; do not override. |
| Node.js Version | **20.x** | `.nvmrc` targets 20. The plan pins `engines.node: ">=20 <23"` in `package.json` so 20 and 22 both work; 20 is the deploy standard. |
| Environment variables | **None** | v0 requires zero env vars. Any addition needs an approved product-brief revision. |
| Serverless Functions region | Vercel default | No Functions are shipped; region is moot for v0. |
| Vercel Analytics | Off | Not in v0 scope. |
| Vercel Speed Insights | Off | Not in v0 scope. |
| Auto-deploy previews on PR | On (Vercel default) | Enables preview URLs for review before merge. |
| Auto-deploy on push to `main` | On (Vercel default) | Production URL updates when `main` is updated via merged PR. |

The tool does not need `vercel.json` at the repo root — every setting above is configured in the Vercel dashboard.

---

## 4. Deployment procedure

This procedure is written so that anyone on the team (Hitesh, Sujay, or Ruthwik) can execute it end-to-end. It is designed to be run **once** by a human with the required Vercel + GitHub access; every subsequent deploy is automatic via GitHub → Vercel integration.

### 4.1 Phase A — Get the work into the repository

At the time of this Step 09 report, none of the Step 01–08 work has been committed (see §10 blocker 1 for the reason — the step-by-step review loop deliberately deferred commits to the deployment gate). A single reviewer on the team must:

1. Make sure the local clone has the Step 01–08 files under `tools/free-leadmagnets/` — either from the engineering agent's handoff bundle, or by pulling from the branch/PR the agent produced through an approved workflow. Verify by running from the repo root:

   ```bash
   ls tools/free-leadmagnets/package.json \
      tools/free-leadmagnets/idea-validator/product-brief.md \
      tools/free-leadmagnets/idea-validator/technical-plan.md \
      tools/free-leadmagnets/idea-validator/qa-report.md \
      tools/free-leadmagnets/idea-validator/deployment.md \
      tools/free-leadmagnets/idea-validator/launch/skool-build-in-public.md
   ```

   All six paths should exist.

2. Create the feature branch (name per README):

   ```bash
   git checkout -b feature/idea-validator
   ```

3. Add the Step 01–08 files. There are two directory subtrees plus the deleted `.gitkeep`:

   ```bash
   git add tools/free-leadmagnets/
   git rm  tools/free-leadmagnets/.gitkeep    # already deleted on disk; this stages the deletion
   git status --short
   ```

   Expected `git status --short`: a `D` line for `.gitkeep` and `A` lines for every file created in Steps 01–08 (~40 files total). No files should be listed outside `tools/free-leadmagnets/`. If anything else appears, stop and investigate before continuing.

4. Commit using the convention from `CONTRIBUTING.md`:

   ```bash
   git commit -m "feat: ship v0 AI Idea Validator (Issue #70)"
   ```

   A single commit is fine because the review artefacts (`product-brief.md`, `technical-plan.md`, `qa-report.md`) already capture the step-by-step decision trail.

5. Push the branch and open a PR:

   ```bash
   git push -u origin feature/idea-validator
   ```

   Open a PR into `main`. Assign Hitesh as reviewer. Reference Issue #70 in the description ("Closes #70 pending Step 10 launch execution" — do **not** actually close the issue until Step 10 completes DoD items 11–14). The PR template at `.github/PULL_REQUEST_TEMPLATE.md` will guide the checklist.

6. Wait for Hitesh's review + branch-protection checks to pass, then merge the PR into `main`.

### 4.2 Phase B — Create the Vercel project

Performed **once** by a Vercel user with Owner/Admin rights on the AIPE Labs Vercel team:

1. Log into Vercel at <https://vercel.com>.
2. **Add New… → Project → Import Git Repository**. Select `hiteshiat1/aipe-labs-repo`. Authorize the Vercel GitHub App if prompted.
3. In the "Configure Project" step:
   - **Project name:** `aipe-labs-free-tools` (or any name your team convention prefers).
   - **Framework preset:** Next.js (should auto-detect).
   - **Root Directory:** `tools/free-leadmagnets`. Click **Edit** next to Root Directory and enter this exact string. **This is the setting most likely to be missed.**
   - **Build & Development Settings** — override only if the shown defaults differ from §3:
     - Install Command: `npm ci`
     - Build Command: `npm run build` (or leave as Vercel default `next build`)
     - Output Directory: `.next` (default)
   - **Environment Variables:** leave empty. Do not add any.
   - **Node.js Version:** set to `20.x` in the project settings after creation (`Settings → General → Node.js Version`).
4. Click **Deploy**.
5. Wait for the first build to complete (typically ~1–2 min). Vercel returns a URL of the form `https://<project>-<hash>.vercel.app`.
6. Under `Settings → Domains`, note whether a custom domain is required. Custom-domain setup is **out of scope** for Step 09 — if the team wants one (e.g. `tools.aipelabs.com`), that is a separate follow-up.

### 4.3 Phase C — Record the production URL

Once the deploy is live:

1. In this file, replace the entire "**[NOT DEPLOYED — AUTHORIZATION REQUIRED]**" line in §1 with the real production URL:
   ```
   <https://…vercel.app>
   ```
2. Commit the update on a docs branch (`docs/deployment-url`) and open a small PR. Do not push directly to `main`.

### 4.4 Phase D — Update launch content placeholders

The Step 07 launch drafts contain `[TOOL URL]` and `[LIVE URL — TO BE ADDED AFTER DEPLOYMENT]` placeholders. Do **not** modify them in the same PR as the deploy — the Step 09 spec explicitly says the primary Step 09 deliverable is deployment documentation + verified URL, not launch-content edits. Placeholders should be replaced in a Step 10 PR by Ruthwik / Sujay when they schedule publication.

---

## 5. Production smoke test

Run every step against the real Vercel production URL from §1 (or a preview URL for pre-merge verification). Every result must be recorded honestly — a `NOT TESTED` outcome is preferable to a fabricated `PASS`.

Legend: `[ ]` unchecked → `[PASS]` / `[FAIL]` / `[NOT TESTED]` after the run.

### 5.1 Homepage

- [ ] `GET /` returns HTTP 200.
- [ ] Page renders "Free Tools" H1 and a single card linking to `/tools/idea-validator`.
- [ ] Clicking the card lands on `/tools/idea-validator` (client-side navigation via `next/link`).

### 5.2 Tool page — initial state

- [ ] `GET /tools/idea-validator` returns HTTP 200.
- [ ] Page title in the browser tab reads `AI Idea Validator — AIPE Labs`.
- [ ] Meta description is present (readable via View Source or the browser's DevTools → Elements panel searching for `<meta name="description"`).
- [ ] "Validate before you build." tagline is visible.
- [ ] No JavaScript console errors on load.
- [ ] Form renders all 10 numbered sections.
- [ ] "Load an example" dropdown is present with the placeholder option `Choose an example…`.
- [ ] **Calculate** button renders with the `disabled` attribute in DOM (Elements panel).
- [ ] **Reset** button renders and is clickable.
- [ ] Placeholder result panel visible with `— / 100` and "Verdict will appear here". No calculated numbers.

### 5.3 Load Example — sample list

Open the "Load an example" dropdown. All three of these sample labels must appear:

- [ ] `AI Launch Checklist Builder`
- [ ] `TrialAudit — pharma eTMF compliance tool`
- [ ] `WriteMate AI — generic writing assistant`

### 5.4 Sample #1 — AI Launch Checklist Builder

- [ ] Load the sample. Every text field populates; all 8 self-scores show a selected tile.
- [ ] Placeholder result stays (Load does not auto-calculate).
- [ ] Click **Calculate**.
- [ ] Total renders **79 / 100** (exactly).
- [ ] Verdict badge renders **Validate with landing page/interviews** (exactly, verbatim).
- [ ] Verdict card uses the sky/blue band styling.

### 5.5 Sample #2 — TrialAudit — pharma eTMF compliance tool

- [ ] Load and Calculate.
- [ ] Total renders **85 / 100**.
- [ ] Verdict badge renders **Build MVP**.
- [ ] Verdict card uses the emerald/green band styling.

### 5.6 Sample #3 — WriteMate AI — generic writing assistant

- [ ] Load and Calculate.
- [ ] Total renders **33 / 100**.
- [ ] Verdict badge renders **Pause or reshape**.
- [ ] Verdict card uses the rose band styling.

(There is no built-in sample for the Research more band. To exercise it, manually fill in the form with self-scores that sum to a mid-range total, e.g. all-`2`s = 40, and confirm the verdict is **Research more**.)

### 5.7 Result experience — deep sections (against Sample #1)

- [ ] "Category breakdown" section shows all 8 categories in Issue #70 order, with a progress bar and `{selfScore}/5 self-score · {points}/{max} pts · {percent}%` metadata for each.
- [ ] "Strongest areas" card lists 3 entries — for Sample #1 these are Clear ICP, Founder / team advantage, Speed to MVP (all 100%).
- [ ] "Weakest areas to validate" card lists 3 entries — for Sample #1 these are Existing painful alternatives, Willingness to pay, Distribution access (all 60%).
- [ ] "Recommended next actions" is an ordered list of 3 items, each with a numbered badge.
- [ ] "Copy summary" button visible below.

### 5.8 Edit-after-result

- [ ] With a result on screen, change any qualitative field (e.g. add a word to the "Problem" textarea).
- [ ] Stale banner appears at the top of the result panel: *"Your inputs changed. Recalculate to update this result."*
- [ ] The previous result stays visible (score, verdict, breakdown all unchanged).
- [ ] Copy summary still produces the previously-calculated result, not the edited inputs.
- [ ] Click **Calculate** again. New result replaces old; stale banner disappears.

### 5.9 Reset

- [ ] Click **Reset**. All text fields become empty; all self-score tiles deselect.
- [ ] Result disappears; placeholder returns.
- [ ] "Load an example" dropdown returns to `Choose an example…`.
- [ ] Any error messages are cleared.

### 5.10 Copy summary — success path

- [ ] With Sample #1 result visible, click **Copy summary**.
- [ ] Button label flips to `Copied!` briefly (~2 s), then returns to `Copy summary`.
- [ ] Green status text *"Result summary copied to your clipboard."* appears next to the button for the same window.
- [ ] Paste the clipboard into any text editor. Verify the plain-text summary contains all of:
  - Heading `AI Idea Validator Result`
  - `Score: 79 / 100`
  - `Verdict: Validate with landing page/interviews`
  - `Strongest areas:` block listing 3 entries with percentages
  - `Weakest areas to validate:` block listing 3 entries with percentages
  - `Next actions:` block with 3 numbered items
  - Footer `— Scored with the AIPE Labs AI Idea Validator`

### 5.11 Copy summary — failure fallback (optional)

Difficult to trigger in a normal browser; on iOS Safari older than 13.4 or in an insecure context (http://), `navigator.clipboard` may be unavailable.

- [ ] If reproducible, verify the fallback `<textarea readOnly>` appears with the summary text pre-populated.
- [ ] Focusing the textarea selects all content (Tab + Ctrl/Cmd+C works).
- [ ] The `Copy summary` button remains clickable for a retry.

If not reproducible in the tester's environment, mark as `NOT TESTED` — do not fabricate.

---

## 6. Responsive verification

Run against the real production URL at three viewports. Chrome DevTools' Device Toolbar (`Cmd/Ctrl+Shift+M`) provides sufficient fidelity for v0; a real device pass is welcome but not required for the DoD.

Method column: `Device Toolbar` (Chrome/Firefox emulation) or `Real device` (physical phone/tablet/laptop). **The engineering environment could not perform real-viewport testing** — that limitation is documented in `qa-report.md` §7 and this deploy step is the point where it gets closed.

| Viewport | Result | Method | Checklist |
|---|---|---|---|
| **~375 × 667** (iPhone SE / mobile) | [ ] | | (a) No horizontal scrolling anywhere. (b) All text fields comfortably fillable with the on-screen keyboard. (c) 1–5 radio tiles are tappable without accidental double-hits (`h-10 w-10` = ~40 px). (d) Score/verdict cards stack vertically. (e) Strongest/weakest cards stack vertically. (f) Progress bars fit the viewport. (g) Copy Summary button is easy to reach one-handed. |
| **~768 × 1024** (iPad portrait / tablet) | [ ] | | (a) No horizontal scrolling. (b) Score card + verdict card go side-by-side (2/3 split). (c) Strongest and weakest cards go side-by-side (2 cols). (d) Category breakdown reads cleanly. (e) All copy stays inside the `max-w-3xl` centred column. |
| **~1440 × 900** (desktop laptop) | [ ] | | (a) Content stays within the centred `max-w-3xl` column with generous whitespace either side. (b) Result hierarchy scans top-to-bottom without clipping. (c) All progress bars are full-width within the card, not stretched to the viewport. |

Additional visual checks (any viewport):

- [ ] Focus rings visible on Tab through the form and result buttons.
- [ ] All four verdict band colours (emerald / sky / amber / rose) have readable contrast for the verdict text (WCAG AA at normal weight).
- [ ] `prefers-reduced-motion`: the tool contains no motion-triggered animations, so the `motion-reduce:` variant should be a no-op. Confirm no bar transitions animate on result appearance.

If any row above is `[FAIL]`, capture a screenshot into a follow-up issue rather than editing this doc.

---

## 7. Privacy / network verification

Run against the live URL with the browser's DevTools **Network** tab open (`Cmd/Ctrl+Option/Shift+I → Network`). Reload the page cleanly (Cmd/Ctrl+Shift+R to bypass cache).

Expected observations:

- [ ] All requests on load come from the same Vercel origin (`.vercel.app` or the bound custom domain) — HTML, CSS, fonts, JS chunks only.
- [ ] Zero requests to third-party analytics domains (`google-analytics.com`, `googletagmanager.com`, `analytics.vercel.com`, `posthog.com`, `mixpanel.com`, `segment.com`, `hotjar.com`).
- [ ] Zero requests to any AI provider (`api.openai.com`, `api.anthropic.com`, `generativelanguage.googleapis.com`).
- [ ] Zero requests to any authentication provider or database.
- [ ] Filling the form and clicking Calculate produces **no additional network requests**. Scoring runs entirely in the browser.
- [ ] Clicking Copy summary produces **no additional network requests**. The clipboard API is browser-local.
- [ ] `Application` tab → `Storage` shows: 0 cookies for the site, no localStorage entries, no sessionStorage entries, no IndexedDB databases.
- [ ] View Source on `/tools/idea-validator`: no `<meta name="robots" content="noindex">` present (the tool must be discoverable).
- [ ] View Source: `<meta name="viewport" content="width=device-width, initial-scale=1">` present (Next.js emits this by default).
- [ ] View Source: `<title>AI Idea Validator — AIPE Labs</title>` and `<meta name="description" content="…">` present.

Record each observation as `[PASS]` / `[FAIL]` / `[NOT TESTED]`. Anything unexpected — especially an outbound request to a domain not on the allow-list above — is a **P0 blocker** and must be investigated before public launch.

---

## 8. Rollback procedure

Vercel keeps every deployment immutable and instantly promotable, so rollback is a two-click operation. Documented for on-call ergonomics.

### 8.1 Fast rollback (Dashboard)

1. Vercel → the project → **Deployments** tab.
2. Locate the previous known-good deployment (typically the one immediately before the bad one — Vercel shows the commit message and time).
3. Click the `⋯` menu on that row → **Promote to Production**.
4. Confirm. The production URL now serves the older build within seconds. No cache purge needed for a full static rollback.

### 8.2 Rollback via `git revert`

If the bad deploy came from a merged PR and you want the repo state to also revert:

1. Locally on `main`:
   ```bash
   git pull
   git revert <bad-merge-commit-sha> -m 1
   ```
   The `-m 1` tells `git revert` to keep `main`'s side of the merge (i.e. the state before the merge).
2. Open a PR titled `revert: temporarily roll back v0 idea validator (issue #NN)`. Get a fast review; Vercel will auto-deploy the reverted state when the PR merges.

### 8.3 When to roll back

- Sample #1 no longer produces 79 / Validate with landing page/interviews.
- The clipboard write starts throwing uncaught errors on any evergreen browser (Chrome, Firefox, Safari, Edge).
- The tool leaks user input to any external network endpoint.
- A verdict string ever renders paraphrased ("Validate first", "Build the MVP", etc.).

Non-blockers that do **not** justify a rollback: bundle-size drift within a few KB, `next lint` deprecation warnings, dev-time Vitest audit findings.

---

## 9. Known non-blocking notes

Carried forward from `qa-report.md` §11. None gate this deployment; documenting them so the deploy operator knows what the expected background noise is.

1. **Vitest dev-dependency audit findings** — 7 CVEs in `esbuild`/`vite`/`@vitest/mocker` transitives. Dev-time only, not in the deployed bundle. Fix requires bumping Vitest to `^3`, which needs a plan amendment.
2. **`next lint` deprecation notice** — expected on Next 15; codemod migration is a follow-up when the org bumps to Next 16.
3. **Node 20 vs Node 22 mismatch** — `.nvmrc` is `20`; the engineering sandbox happens to run on Node 22, and `package.json` `engines.node: ">=20 <23"` accepts both. Vercel should run under Node 20 per §3.
4. **Responsive verification was static-source-only during QA (Step 08)** — this deployment step is the point at which a real-browser viewport pass gets closed. See §6.
5. **No custom domain configured yet** — v0 ships on the auto-assigned `*.vercel.app` URL. Custom-domain wiring is out of scope for Step 09.

---

## 10. Deployment status

**BLOCKED.**

Deployment cannot be completed by the engineering agent in-session because five authorization / access boundaries stack. Each one alone would be enough to make deployment a human step; together they make it unambiguous.

**Blocker 1 — The Step 01–08 work is not in the repository yet.** By design of the step-by-step review loop (every step's brief includes "Do NOT commit / push / open a PR"), all files created in Steps 01 through 08 are currently untracked in the working tree. `git status --short` shows ~40 `??` entries under `tools/free-leadmagnets/` and a single `D tools/free-leadmagnets/.gitkeep`. Vercel deploys from a Git commit; there is nothing to deploy until Phase A of §4.4 lands the code on a branch.

**Blocker 2 — The engineering agent has no GitHub write access** to `hiteshiat1/aipe-labs-repo`. The repo is public, so cloning and reading was possible throughout Steps 01–08; pushing requires a token/credential the agent does not hold.

**Blocker 3 — `main` is a protected branch** per `docs/sprint01-repo-setup-plan.md`. Even with credentials, pushes must go through a PR reviewed by Hitesh. This is the correct workflow; bypassing it is prohibited by the Step 09 instructions ("Do not bypass branch protection").

**Blocker 4 — The engineering agent has no Vercel authorization.** No API token, no `vercel` CLI login, no configured project. The Vercel MCP available in the Anthropic connector registry is (a) not connected in this session and (b) exposes only read-only observation tools (`list_projects`, `get_project`, `list_deployments`, `get_deployment`) — even if connected it could not *create* a deployment.

**Blocker 5 — No headless browser is available** in the engineering sandbox for the real-viewport smoke test that §6 requires. This isn't a hard blocker on deployment itself, but it means the responsive checklist in §6 must be closed by a human with an evergreen browser after the deploy.

### What is engineering-complete right now

- `npm ci` runs clean on the sandbox.
- `npm test`: 58/58 passing.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.
- `npm run build`: exit 0. Idea Validator route bundle: **9.27 kB**, First Load JS: **112 kB**, both routes prerender as static.
- Configuration in §3 is verified against the codebase (`package.json`, `.nvmrc`, `next.config.mjs`) — no drift.
- Deployment procedure in §4 is written for a human executor.
- Smoke-test playbook (§5), responsive checklist (§6), and privacy checks (§7) are ready to be walked through against the real URL.
- Rollback procedure (§8) is ready.

### What must happen before this status can flip to `LIVE`

Phase A (get code on the repo), Phase B (create the Vercel project), Phase C (record the real URL) from §4. Then §5 and §6 must be walked to green.

### Not to be marked complete under any circumstance

- Issue #70 DoD item 11 (Skool build post published) — Ruthwik handoff, post-launch.
- Issue #70 DoD item 12 (X build post published) — Sujay handoff, post-launch.
- Issue #70 DoD item 13 (Hitesh reviews and approves first demo) — needs a live URL to demo against.
- Issue #70 DoD item 14 (Learnings captured for the paid boilerplate) — Step 10 output.

The status line in §1 is the single source of truth for whether the tool is live. Do not paraphrase it.
