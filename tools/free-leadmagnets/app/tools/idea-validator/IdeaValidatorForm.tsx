"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { TextField, TextareaField } from "@/components/ui/Field";
import { RadioScale } from "@/components/ui/RadioScale";
import { calculateIdeaScore } from "@/lib/scoring/calculate";
import { SAMPLES, getSampleBySlug } from "@/lib/scoring/samples";
import type {
  CategoryKey,
  IdeaValidationInput,
  IdeaValidationResult,
  QualitativeAnswers,
  SelfScoreValue,
  SelfScores,
} from "@/lib/scoring/types";

import ResultPanel from "./ResultPanel";

// -----------------------------------------------------------------------------
// Static tables
// -----------------------------------------------------------------------------

const QUALITATIVE_KEYS = [
  "ideaName",
  "oneLiner",
  "icp",
  "problem",
  "alternatives",
  "assumptions",
  "wtpSignal",
  "distribution",
] as const satisfies readonly (keyof QualitativeAnswers)[];

const CATEGORY_KEYS = [
  "problemSeverity",
  "clearICP",
  "painfulAlternatives",
  "willingnessToPay",
  "founderAdvantage",
  "speedToMVP",
  "distributionAccess",
  "riskManageable",
] as const satisfies readonly CategoryKey[];

const ANSWER_ERROR_MESSAGES: Record<keyof QualitativeAnswers, string> = {
  ideaName: "Please enter an idea name.",
  oneLiner: "Please enter a one-line description.",
  icp: "Please describe your target user.",
  problem: "Please describe the problem.",
  alternatives: "Please describe current alternatives.",
  assumptions: "Please list your biggest assumptions.",
  wtpSignal: "Please provide a willingness-to-pay signal.",
  distribution: "Please describe your distribution access.",
};

const SCORE_ERROR_MESSAGE = "Please select a score.";

/**
 * Fields listed in the same visual order as the form. Used only to find and
 * focus the first invalid field on submit. Radio groups target their first
 * option's id (`${categoryKey}-1`) — that matches the id scheme used inside
 * `RadioScale` in Step 03.
 */
const FLAT_ORDER: ReadonlyArray<
  | { readonly kind: "answer"; readonly key: keyof QualitativeAnswers; readonly focusId: string }
  | { readonly kind: "score"; readonly key: CategoryKey; readonly focusId: string }
> = [
  { kind: "answer", key: "ideaName", focusId: "ideaName" },
  { kind: "answer", key: "oneLiner", focusId: "oneLiner" },
  { kind: "answer", key: "problem", focusId: "problem" },
  { kind: "score", key: "problemSeverity", focusId: "problemSeverity-1" },
  { kind: "answer", key: "icp", focusId: "icp" },
  { kind: "score", key: "clearICP", focusId: "clearICP-1" },
  { kind: "answer", key: "alternatives", focusId: "alternatives" },
  { kind: "score", key: "painfulAlternatives", focusId: "painfulAlternatives-1" },
  { kind: "answer", key: "wtpSignal", focusId: "wtpSignal" },
  { kind: "score", key: "willingnessToPay", focusId: "willingnessToPay-1" },
  { kind: "answer", key: "assumptions", focusId: "assumptions" },
  { kind: "score", key: "founderAdvantage", focusId: "founderAdvantage-1" },
  { kind: "score", key: "speedToMVP", focusId: "speedToMVP-1" },
  { kind: "answer", key: "distribution", focusId: "distribution" },
  { kind: "score", key: "distributionAccess", focusId: "distributionAccess-1" },
  { kind: "score", key: "riskManageable", focusId: "riskManageable-1" },
];

const emptyAnswers: QualitativeAnswers = {
  ideaName: "",
  oneLiner: "",
  icp: "",
  problem: "",
  alternatives: "",
  assumptions: "",
  wtpSignal: "",
  distribution: "",
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function isFormComplete(
  answers: QualitativeAnswers,
  scores: Partial<SelfScores>,
): boolean {
  const answersOk = QUALITATIVE_KEYS.every(
    (k) => answers[k].trim().length > 0,
  );
  const scoresOk = CATEGORY_KEYS.every((k) => scores[k] !== undefined);
  return answersOk && scoresOk;
}

/**
 * Type adapter around `<RadioScale>` — narrows the `number` onChange to
 * `SelfScoreValue`. As of Step 08, error rendering + aria-invalid live inside
 * `RadioScale`; we just pass the error string through.
 */
function RadioScaleField({
  scoreKey,
  legend,
  hint,
  value,
  onChange,
  error,
  minLabel,
  maxLabel,
}: {
  scoreKey: CategoryKey;
  legend: string;
  hint: string;
  value: SelfScoreValue | undefined;
  onChange: (v: SelfScoreValue) => void;
  error?: string;
  minLabel: string;
  maxLabel: string;
}) {
  return (
    <RadioScale
      name={scoreKey}
      legend={legend}
      hint={hint}
      error={error}
      value={value ?? null}
      onChange={(v) => onChange(v as SelfScoreValue)}
      minLabel={minLabel}
      maxLabel={maxLabel}
      required
    />
  );
}

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export default function IdeaValidatorForm() {
  const [answers, setAnswers] = useState<QualitativeAnswers>(emptyAnswers);
  const [scores, setScores] = useState<Partial<SelfScores>>({});
  const [answerErrors, setAnswerErrors] = useState<
    Partial<Record<keyof QualitativeAnswers, string>>
  >({});
  const [scoreErrors, setScoreErrors] = useState<
    Partial<Record<CategoryKey, string>>
  >({});
  const [result, setResult] = useState<IdeaValidationResult | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [sampleSlug, setSampleSlug] = useState<string>("");

  const canSubmit = isFormComplete(answers, scores);

  // ---------------------------------------------------------------------------
  // Change handlers
  // ---------------------------------------------------------------------------

  function updateAnswer<K extends keyof QualitativeAnswers>(
    key: K,
    value: string,
  ) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (answerErrors[key]) {
      setAnswerErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    // Any post-result edit marks the visible result as stale.
    if (result) setIsStale(true);
    // Editing invalidates the currently selected sample choice.
    if (sampleSlug) setSampleSlug("");
  }

  function updateScore(key: CategoryKey, value: SelfScoreValue) {
    setScores((prev) => ({ ...prev, [key]: value }));
    if (scoreErrors[key]) {
      setScoreErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (result) setIsStale(true);
    if (sampleSlug) setSampleSlug("");
  }

  // ---------------------------------------------------------------------------
  // Sample loader
  // ---------------------------------------------------------------------------

  function handleSampleSelect(e: ChangeEvent<HTMLSelectElement>) {
    const slug = e.target.value;
    setSampleSlug(slug);
    if (!slug) return; // placeholder option — do nothing
    const sample = getSampleBySlug(slug);
    if (!sample) return;
    setAnswers(sample.input.answers);
    setScores(sample.input.selfScores);
    setAnswerErrors({});
    setScoreErrors({});
    // A fresh sample supersedes any previous result — the user must click Calculate.
    setResult(null);
    setIsStale(false);
  }

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  function handleReset() {
    setAnswers(emptyAnswers);
    setScores({});
    setAnswerErrors({});
    setScoreErrors({});
    setResult(null);
    setIsStale(false);
    setSampleSlug("");
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const newAnswerErrors: Partial<Record<keyof QualitativeAnswers, string>> = {};
    const newScoreErrors: Partial<Record<CategoryKey, string>> = {};

    for (const key of QUALITATIVE_KEYS) {
      if (answers[key].trim().length === 0) {
        newAnswerErrors[key] = ANSWER_ERROR_MESSAGES[key];
      }
    }
    for (const key of CATEGORY_KEYS) {
      if (scores[key] === undefined) {
        newScoreErrors[key] = SCORE_ERROR_MESSAGE;
      }
    }

    setAnswerErrors(newAnswerErrors);
    setScoreErrors(newScoreErrors);

    const hasErrors =
      Object.keys(newAnswerErrors).length > 0 ||
      Object.keys(newScoreErrors).length > 0;

    if (hasErrors) {
      for (const item of FLAT_ORDER) {
        const invalid =
          item.kind === "answer"
            ? Boolean(newAnswerErrors[item.key])
            : Boolean(newScoreErrors[item.key]);
        if (invalid) {
          const el =
            typeof document !== "undefined"
              ? document.getElementById(item.focusId)
              : null;
          if (el && typeof (el as HTMLElement).focus === "function") {
            (el as HTMLElement).focus();
          }
          return;
        }
      }
      return;
    }

    // All fields present. Trim qualitative answers before calculation so the
    // downstream result reflects what the scoring engine actually consumed.
    const trimmedAnswers: QualitativeAnswers = {
      ideaName: answers.ideaName.trim(),
      oneLiner: answers.oneLiner.trim(),
      icp: answers.icp.trim(),
      problem: answers.problem.trim(),
      alternatives: answers.alternatives.trim(),
      assumptions: answers.assumptions.trim(),
      wtpSignal: answers.wtpSignal.trim(),
      distribution: answers.distribution.trim(),
    };
    const validScores: SelfScores = {
      problemSeverity: scores.problemSeverity as SelfScoreValue,
      clearICP: scores.clearICP as SelfScoreValue,
      painfulAlternatives: scores.painfulAlternatives as SelfScoreValue,
      willingnessToPay: scores.willingnessToPay as SelfScoreValue,
      founderAdvantage: scores.founderAdvantage as SelfScoreValue,
      speedToMVP: scores.speedToMVP as SelfScoreValue,
      distributionAccess: scores.distributionAccess as SelfScoreValue,
      riskManageable: scores.riskManageable as SelfScoreValue,
    };
    const input: IdeaValidationInput = {
      answers: trimmedAnswers,
      selfScores: validScores,
    };
    const newResult = calculateIdeaScore(input);
    setResult(newResult);
    setIsStale(false);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Load-example widget */}
      <div className="mt-10 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label
          htmlFor="sampleSlug"
          className="block text-sm font-medium text-slate-900"
        >
          Load an example
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Prefill the form with a sample idea, then click Calculate. You can
          edit any field before calculating.
        </p>
        <select
          id="sampleSlug"
          value={sampleSlug}
          onChange={handleSampleSelect}
          className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 sm:w-96"
        >
          <option value="">Choose an example…</option>
          {SAMPLES.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-12" noValidate>
        {/* 1. Idea Summary */}
        <section aria-labelledby="section-idea" className="space-y-6">
          <h2
            id="section-idea"
            className="text-xl font-semibold text-slate-900"
          >
            1. Idea summary
          </h2>
          <TextField
            id="ideaName"
            label="Idea name"
            hint="A short name for the idea. 1–80 characters."
            maxLength={80}
            required
            value={answers.ideaName}
            onChange={(e) => updateAnswer("ideaName", e.target.value)}
            error={answerErrors.ideaName}
          />
          <TextField
            id="oneLiner"
            label="One-line description"
            hint="What does this product do in one sentence? 1–200 characters."
            maxLength={200}
            required
            value={answers.oneLiner}
            onChange={(e) => updateAnswer("oneLiner", e.target.value)}
            error={answerErrors.oneLiner}
          />
        </section>

        {/* 2. Problem */}
        <section aria-labelledby="section-problem" className="space-y-6">
          <h2
            id="section-problem"
            className="text-xl font-semibold text-slate-900"
          >
            2. Problem
          </h2>
          <TextareaField
            id="problem"
            label="What problem are you solving?"
            hint="Describe the problem in plain language. What breaks today, and why does it matter?"
            maxLength={1000}
            required
            value={answers.problem}
            onChange={(e) => updateAnswer("problem", e.target.value)}
            error={answerErrors.problem}
          />
          <RadioScaleField
            scoreKey="problemSeverity"
            legend="Problem severity — self-score"
            hint="How painful is the problem for the target user right now?"
            value={scores.problemSeverity}
            onChange={(v) => updateScore("problemSeverity", v)}
            error={scoreErrors.problemSeverity}
            minLabel="Mild inconvenience"
            maxLabel="Urgent / business-critical"
          />
        </section>

        {/* 3. Target user / ICP */}
        <section aria-labelledby="section-icp" className="space-y-6">
          <h2 id="section-icp" className="text-xl font-semibold text-slate-900">
            3. Target user / ICP
          </h2>
          <TextareaField
            id="icp"
            label="Who is this for?"
            hint="Be specific about segment, role, or context. Avoid 'everyone'."
            maxLength={400}
            required
            value={answers.icp}
            onChange={(e) => updateAnswer("icp", e.target.value)}
            error={answerErrors.icp}
          />
          <RadioScaleField
            scoreKey="clearICP"
            legend="Clear ICP — self-score"
            hint="How clearly is the ideal customer defined?"
            value={scores.clearICP}
            onChange={(v) => updateScore("clearICP", v)}
            error={scoreErrors.clearICP}
            minLabel="Vague / broad"
            maxLabel="Named segment"
          />
        </section>

        {/* 4. Existing alternatives */}
        <section
          aria-labelledby="section-alternatives"
          className="space-y-6"
        >
          <h2
            id="section-alternatives"
            className="text-xl font-semibold text-slate-900"
          >
            4. Existing alternatives
          </h2>
          <TextareaField
            id="alternatives"
            label="How do they solve this today?"
            hint="List the tools, workarounds, or do-nothing option users rely on now."
            maxLength={1000}
            required
            value={answers.alternatives}
            onChange={(e) => updateAnswer("alternatives", e.target.value)}
            error={answerErrors.alternatives}
          />
          <RadioScaleField
            scoreKey="painfulAlternatives"
            legend="Existing painful alternatives — self-score"
            hint="How painful are the current alternatives compared to your proposed solution?"
            value={scores.painfulAlternatives}
            onChange={(v) => updateScore("painfulAlternatives", v)}
            error={scoreErrors.painfulAlternatives}
            minLabel="Fine as-is"
            maxLabel="Actively painful"
          />
        </section>

        {/* 5. Willingness to pay */}
        <section aria-labelledby="section-wtp" className="space-y-6">
          <h2 id="section-wtp" className="text-xl font-semibold text-slate-900">
            5. Willingness to pay
          </h2>
          <TextareaField
            id="wtpSignal"
            label="Any evidence users pay for this today?"
            hint="Existing subscriptions, hired help, DIY time cost, or past purchases in this space."
            maxLength={400}
            required
            value={answers.wtpSignal}
            onChange={(e) => updateAnswer("wtpSignal", e.target.value)}
            error={answerErrors.wtpSignal}
          />
          <RadioScaleField
            scoreKey="willingnessToPay"
            legend="Willingness to pay — self-score"
            hint="How strong is the signal that the ICP will actually pay?"
            value={scores.willingnessToPay}
            onChange={(v) => updateScore("willingnessToPay", v)}
            error={scoreErrors.willingnessToPay}
            minLabel="No evidence"
            maxLabel="Already paying"
          />
        </section>

        {/* 6. Biggest assumptions */}
        <section
          aria-labelledby="section-assumptions"
          className="space-y-6"
        >
          <h2
            id="section-assumptions"
            className="text-xl font-semibold text-slate-900"
          >
            6. Biggest assumptions
          </h2>
          <TextareaField
            id="assumptions"
            label="What must be true for this idea to work?"
            hint="List the assumptions you are making about the user, problem, market, or technology."
            maxLength={1000}
            required
            value={answers.assumptions}
            onChange={(e) => updateAnswer("assumptions", e.target.value)}
            error={answerErrors.assumptions}
          />
        </section>

        {/* 7. Founder / team advantage */}
        <section aria-labelledby="section-founder" className="space-y-6">
          <h2
            id="section-founder"
            className="text-xl font-semibold text-slate-900"
          >
            7. Founder / team advantage
          </h2>
          <RadioScaleField
            scoreKey="founderAdvantage"
            legend="Founder / team advantage — self-score"
            hint="Do you have a real edge — background, network, or access — that makes you the right person to build this?"
            value={scores.founderAdvantage}
            onChange={(v) => updateScore("founderAdvantage", v)}
            error={scoreErrors.founderAdvantage}
            minLabel="No edge"
            maxLabel="Clear edge"
          />
        </section>

        {/* 8. Speed to MVP */}
        <section aria-labelledby="section-speed" className="space-y-6">
          <h2
            id="section-speed"
            className="text-xl font-semibold text-slate-900"
          >
            8. Speed to MVP
          </h2>
          <RadioScaleField
            scoreKey="speedToMVP"
            legend="Speed to MVP — self-score"
            hint="How quickly can you get a useful v0 in front of real users?"
            value={scores.speedToMVP}
            onChange={(v) => updateScore("speedToMVP", v)}
            error={scoreErrors.speedToMVP}
            minLabel="Months of work"
            maxLabel="1–2 weeks"
          />
        </section>

        {/* 9. Distribution access */}
        <section
          aria-labelledby="section-distribution"
          className="space-y-6"
        >
          <h2
            id="section-distribution"
            className="text-xl font-semibold text-slate-900"
          >
            9. Distribution access
          </h2>
          <TextareaField
            id="distribution"
            label="How will you reach your ICP?"
            hint="An existing audience, community, channel, partner, or offer that connects you to real users."
            maxLength={400}
            required
            value={answers.distribution}
            onChange={(e) => updateAnswer("distribution", e.target.value)}
            error={answerErrors.distribution}
          />
          <RadioScaleField
            scoreKey="distributionAccess"
            legend="Distribution access — self-score"
            hint="How direct is your access to the people you want to build for?"
            value={scores.distributionAccess}
            onChange={(v) => updateScore("distributionAccess", v)}
            error={scoreErrors.distributionAccess}
            minLabel="No channel"
            maxLabel="Direct access"
          />
        </section>

        {/* 10. Risk */}
        <section aria-labelledby="section-risk" className="space-y-6">
          <h2
            id="section-risk"
            className="text-xl font-semibold text-slate-900"
          >
            10. Risk level manageable
          </h2>
          <RadioScaleField
            scoreKey="riskManageable"
            legend="Risk level manageable — self-score"
            hint="Legal, privacy, trust, or dependency risks — how manageable are they for a v0?"
            value={scores.riskManageable}
            onChange={(v) => updateScore("riskManageable", v)}
            error={scoreErrors.riskManageable}
            minLabel="Serious risks"
            maxLabel="Small / mitigable"
          />
        </section>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {canSubmit
              ? "All fields complete. Ready to calculate."
              : "Complete every field and self-score to calculate."}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={handleReset}>
              Reset
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              Calculate
            </Button>
          </div>
        </div>
      </form>

      <ResultPanel result={result} isStale={isStale} />
    </>
  );
}
