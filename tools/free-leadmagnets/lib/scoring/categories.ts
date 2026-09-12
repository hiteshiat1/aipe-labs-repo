import type { CategoryKey, QualitativeFieldKey } from "./types";

/**
 * Metadata for a single scoring category.
 *
 * `order` is the deterministic tie-break axis used by strongest/weakest ranking.
 * It equals the category's zero-based index in Issue #70's list.
 *
 * `qualitativeFieldKey` links a category to its paired free-text field, when
 * one exists. Three categories (founder advantage, speed to MVP, risk
 * manageable) are numeric-only in v0 and have no paired qualitative field.
 */
export interface CategoryMeta {
  readonly key: CategoryKey;
  readonly label: string;
  readonly max: number;
  readonly order: number;
  readonly qualitativeFieldKey?: QualitativeFieldKey;
  readonly description: string;
  readonly minLabel: string;
  readonly maxLabel: string;
}

/**
 * The eight scoring categories, in Issue #70 order.
 * Weights sum to exactly 100 — asserted by a test in `calculate.test.ts`.
 */
export const CATEGORIES: readonly CategoryMeta[] = [
  {
    key: "problemSeverity",
    label: "Problem severity",
    max: 20,
    order: 0,
    qualitativeFieldKey: "problem",
    description:
      "How painful is the problem for the target user right now?",
    minLabel: "Mild inconvenience",
    maxLabel: "Urgent / business-critical",
  },
  {
    key: "clearICP",
    label: "Clear ICP",
    max: 15,
    order: 1,
    qualitativeFieldKey: "icp",
    description:
      "How clearly is the ideal customer profile defined?",
    minLabel: "Vague / broad",
    maxLabel: "Named segment",
  },
  {
    key: "painfulAlternatives",
    label: "Existing painful alternatives",
    max: 15,
    order: 2,
    qualitativeFieldKey: "alternatives",
    description:
      "How painful are the current alternatives compared to the proposed solution?",
    minLabel: "Fine as-is",
    maxLabel: "Actively painful",
  },
  {
    key: "willingnessToPay",
    label: "Willingness to pay",
    max: 15,
    order: 3,
    qualitativeFieldKey: "wtpSignal",
    description:
      "How strong is the signal that the ICP will actually pay?",
    minLabel: "No evidence",
    maxLabel: "Already paying",
  },
  {
    key: "founderAdvantage",
    label: "Founder / team advantage",
    max: 10,
    order: 4,
    description:
      "Do you have a real edge — background, network, or access — that makes you the right person to build this?",
    minLabel: "No edge",
    maxLabel: "Clear edge",
  },
  {
    key: "speedToMVP",
    label: "Speed to MVP",
    max: 10,
    order: 5,
    description:
      "How quickly can you get a useful v0 in front of real users?",
    minLabel: "Months of work",
    maxLabel: "1–2 weeks",
  },
  {
    key: "distributionAccess",
    label: "Distribution access",
    max: 10,
    order: 6,
    qualitativeFieldKey: "distribution",
    description:
      "How direct is your access to the people you want to build for?",
    minLabel: "No channel",
    maxLabel: "Direct access",
  },
  {
    key: "riskManageable",
    label: "Risk level manageable",
    max: 5,
    order: 7,
    description:
      "How manageable are the legal, privacy, trust, or dependency risks for a v0?",
    minLabel: "Serious risks",
    maxLabel: "Small / mitigable",
  },
] as const;

/** Sum of all category maxima. Must equal 100 — enforced by tests. */
export const TOTAL_MAX: number = CATEGORIES.reduce((sum, c) => sum + c.max, 0);

/** Look up a category by key. Throws if the key is unknown. */
export function getCategory(key: CategoryKey): CategoryMeta {
  const found = CATEGORIES.find((c) => c.key === key);
  if (!found) {
    throw new Error(`getCategory: unknown category key "${key}"`);
  }
  return found;
}
