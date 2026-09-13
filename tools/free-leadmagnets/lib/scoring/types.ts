/**
 * Type definitions for the AI Idea Validator scoring engine.
 *
 * These types are shared between the pure scoring logic and (from Step 05
 * onwards) the React form. Nothing in this file imports React or any
 * browser API — it must remain safe to consume in Node.
 */

/** Stable identifier for each scoring category, in Issue #70 order. */
export type CategoryKey =
  | "problemSeverity"
  | "clearICP"
  | "painfulAlternatives"
  | "willingnessToPay"
  | "founderAdvantage"
  | "speedToMVP"
  | "distributionAccess"
  | "riskManageable";

/** The only valid values for a per-category self-score. */
export type SelfScoreValue = 1 | 2 | 3 | 4 | 5;

/** Free-text answers the user provides in the form. */
export interface QualitativeAnswers {
  ideaName: string;
  oneLiner: string;
  icp: string;
  problem: string;
  alternatives: string;
  assumptions: string;
  wtpSignal: string;
  distribution: string;
}

/** Key type for the qualitative answer fields — useful for cross-referencing. */
export type QualitativeFieldKey = keyof QualitativeAnswers;

/** Exactly one self-score per scoring category, required at submit time. */
export type SelfScores = Record<CategoryKey, SelfScoreValue>;

/** Complete, submit-ready input to the scoring engine. */
export interface IdeaValidationInput {
  answers: QualitativeAnswers;
  selfScores: SelfScores;
}

/** Per-category output produced by the scoring engine. */
export interface CategoryScore {
  key: CategoryKey;
  label: string;
  selfScore: SelfScoreValue;
  max: number;
  points: number;
  percent: number;
}

/**
 * The four possible verdicts. Wording is verbatim from Issue #70 and MUST NOT
 * be paraphrased — every UI surface should render one of these strings unmodified.
 */
export type Verdict =
  | "Build MVP"
  | "Validate with landing page/interviews"
  | "Research more"
  | "Pause or reshape";

/** Complete output of the scoring engine. */
export interface IdeaValidationResult {
  total: number;
  verdict: Verdict;
  categoryScores: CategoryScore[];
  strongest: CategoryScore[];
  weakest: CategoryScore[];
  recommendedActions: string[];
}
