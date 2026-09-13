/**
 * Pure scoring engine for the AI Idea Validator.
 *
 * This file MUST NOT import React, Next.js, browser APIs, network clients, or
 * any AI SDK. It runs in a Node test environment (Vitest) with zero setup.
 *
 * Every function here is deterministic: the same input always produces the
 * same output. Randomness, wall-clock time, and network I/O are forbidden.
 */

import { CATEGORIES, getCategory } from "./categories";
import type {
  CategoryKey,
  CategoryScore,
  IdeaValidationInput,
  IdeaValidationResult,
  SelfScoreValue,
  SelfScores,
  Verdict,
} from "./types";

// -----------------------------------------------------------------------------
// Recommended actions
// -----------------------------------------------------------------------------

/**
 * Deterministic mapping from category → recommended next action.
 *
 * Working copy — the exact wording may be lightly wordsmithed by Ruthwik in
 * Step 07 alongside the launch copy. When that happens, change these strings
 * here (the single source of truth) rather than duplicating them into the UI.
 */
export const RECOMMENDED_ACTIONS: Readonly<Record<CategoryKey, string>> = {
  problemSeverity:
    "Interview five target users about how often the problem happens and what it costs them.",
  clearICP:
    "Narrow the target user to one segment and describe them in one sentence.",
  painfulAlternatives:
    "List three current alternatives and note what each one is missing.",
  willingnessToPay:
    "Test a paid pre-order, waitlist deposit, or landing page price.",
  founderAdvantage:
    "Write one paragraph on why you are the right person to build this.",
  speedToMVP:
    "Cut scope until a v0 can be built in one to two weeks.",
  distributionAccess:
    "Pick one channel and post three times about the problem to test reach.",
  riskManageable:
    "List the top three risks and one mitigation for each.",
};

// -----------------------------------------------------------------------------
// Guards
// -----------------------------------------------------------------------------

/** True iff `v` is one of the five valid self-score values (1..5). */
function isValidSelfScore(v: unknown): v is SelfScoreValue {
  return v === 1 || v === 2 || v === 3 || v === 4 || v === 5;
}

// -----------------------------------------------------------------------------
// Individual category scoring
// -----------------------------------------------------------------------------

/**
 * Convert a 1–5 self-score into points for a single category.
 *
 *   points = round((selfScore / 5) * category.max)
 *
 * Because every category max is divisible by 5, the product is already an
 * integer for every valid input; `Math.round` is a defensive belt.
 *
 * Throws on any self-score outside the 1..5 integer range.
 */
export function scoreCategory(
  key: CategoryKey,
  selfScore: SelfScoreValue,
): CategoryScore {
  if (!isValidSelfScore(selfScore)) {
    throw new Error(
      `scoreCategory: invalid self-score for ${key}: expected an integer 1..5, got ${String(selfScore)}`,
    );
  }
  const meta = getCategory(key);
  const points = Math.round((selfScore / 5) * meta.max);
  const percent = Math.round((points / meta.max) * 100);
  return {
    key,
    label: meta.label,
    selfScore,
    max: meta.max,
    points,
    percent,
  };
}

// -----------------------------------------------------------------------------
// Verdict
// -----------------------------------------------------------------------------

/**
 * Map a total (0..100) to one of the four verdicts.
 * Wording is verbatim from Issue #70 and must not be paraphrased.
 *
 * Verdict boundaries:
 *   80–100 → Build MVP
 *   60–79  → Validate with landing page/interviews
 *   40–59  → Research more
 *   <40    → Pause or reshape
 *
 * Total function — never throws. Defensive on out-of-range totals:
 *   totals < 0    → "Pause or reshape"
 *   totals > 100  → "Build MVP"
 * `calculateIdeaScore` guarantees the total is in 0..100, so those branches
 * are a safety net for direct callers of `deriveVerdict`.
 */
export function deriveVerdict(total: number): Verdict {
  if (total >= 80) return "Build MVP";
  if (total >= 60) return "Validate with landing page/interviews";
  if (total >= 40) return "Research more";
  return "Pause or reshape";
}

// -----------------------------------------------------------------------------
// Ranking (strongest / weakest)
// -----------------------------------------------------------------------------

function orderOf(key: CategoryKey): number {
  return getCategory(key).order;
}

/**
 * Deterministic strongest / weakest ranking of category scores.
 *
 * Strongest = up to 3 categories, highest percentage first.
 *   Ties break by category order in Issue #70 (earlier first).
 *
 * Weakest = up to 3 categories chosen from those NOT in strongest,
 *   lowest percentage first. Ties break by category order in Issue #70
 *   (earlier first) — kept on the same axis as strongest so behaviour is
 *   consistent.
 *
 * Strongest and weakest are always disjoint by construction. Each list is at
 * most `min(3, availableCategories.length)` long.
 */
export function rankCategories(scores: CategoryScore[]): {
  strongest: CategoryScore[];
  weakest: CategoryScore[];
} {
  const byStrongest = [...scores].sort(
    (a, b) => b.percent - a.percent || orderOf(a.key) - orderOf(b.key),
  );
  const strongest = byStrongest.slice(0, 3);

  const strongestKeys = new Set(strongest.map((s) => s.key));
  const remaining = scores.filter((s) => !strongestKeys.has(s.key));
  const byWeakest = [...remaining].sort(
    (a, b) => a.percent - b.percent || orderOf(a.key) - orderOf(b.key),
  );
  const weakest = byWeakest.slice(0, 3);

  return { strongest, weakest };
}

// -----------------------------------------------------------------------------
// Next actions
// -----------------------------------------------------------------------------

/**
 * Return one recommended action per weakest category, in matching order.
 *
 * Length equals `weakest.length` (0..3). Never generates dynamic or random
 * suggestions — every category has a single fixed recommendation, and the
 * function's job is to pick the ones tied to the user's weakest areas.
 */
export function deriveNextActions(weakest: CategoryScore[]): string[] {
  return weakest.map((w) => RECOMMENDED_ACTIONS[w.key]);
}

// -----------------------------------------------------------------------------
// Top-level scoring
// -----------------------------------------------------------------------------

/**
 * Score a complete idea against the 100-point model.
 *
 * Iterates categories in `CATEGORIES` order (which is Issue #70 order) so the
 * output's `categoryScores` array is stable regardless of how the caller
 * happened to build the `SelfScores` object.
 *
 * Throws with a specific error message if any self-score is missing or
 * invalid — the UI must prevent this state before calling.
 */
export function calculateIdeaScore(
  input: IdeaValidationInput,
): IdeaValidationResult {
  if (!input || typeof input !== "object" || !input.selfScores) {
    throw new Error("calculateIdeaScore: missing input.selfScores");
  }
  const selfScores: SelfScores = input.selfScores;

  const categoryScores: CategoryScore[] = CATEGORIES.map((meta) => {
    const raw = selfScores[meta.key];
    if (!isValidSelfScore(raw)) {
      throw new Error(
        `calculateIdeaScore: invalid or missing self-score for ${meta.key}: got ${String(raw)}`,
      );
    }
    return scoreCategory(meta.key, raw);
  });

  const total = categoryScores.reduce((sum, s) => sum + s.points, 0);
  const verdict = deriveVerdict(total);
  const { strongest, weakest } = rankCategories(categoryScores);
  const recommendedActions = deriveNextActions(weakest);

  return {
    total,
    verdict,
    categoryScores,
    strongest,
    weakest,
    recommendedActions,
  };
}
