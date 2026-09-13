import type { IdeaValidationInput, Verdict } from "./types";

/**
 * A ready-to-score idea fixture.
 *
 * The `expectedTotal` and `expectedVerdict` fields are consumed by tests to
 * catch drift between the sample and the deterministic scoring formula. If
 * any category max, weight, or the formula changes, the tests will fail on
 * these fixtures until the expected values are updated deliberately.
 */
export interface SampleIdea {
  readonly slug: string;
  readonly label: string;
  readonly summary: string;
  readonly input: IdeaValidationInput;
  readonly expectedTotal: number;
  readonly expectedVerdict: Verdict;
}

/**
 * Sample #1 — locked to `templates/idea-validation/example-filled-saas-idea.md`.
 * Qualitative content is a direct paraphrase of the existing filled canvas.
 * Self-scores are chosen so `calculateIdeaScore` reproduces the same 79 total
 * and "Validate" verdict as the source canvas.
 */
const SAMPLE_1: SampleIdea = {
  slug: "ai-launch-checklist-builder",
  label: "AI Launch Checklist Builder",
  summary:
    "Reused from templates/idea-validation/example-filled-saas-idea.md. Lands in the Validate band.",
  input: {
    answers: {
      ideaName: "AI Launch Checklist Builder",
      oneLiner:
        "A simple tool that helps AI-assisted builders turn a prototype into a production launch checklist based on their app type, stack, and current blockers.",
      icp:
        "AI-assisted builders who have already shipped a prototype and want to reach production.",
      problem:
        "Builders finish a prototype and do not know what steps are required to make it production-ready and launchable.",
      alternatives:
        "Generic ChatGPT checklists, YouTube tutorials, scattered launch checklists, and advanced DevOps/SRE guides.",
      assumptions:
        "Builders will use a stage-and-stack checklist over generic advice; a free checklist can be extended into a paid OS.",
      wtpSignal:
        "Builders already pay £9–£59 for templates and checklists in this space.",
      distribution: "X and Skool audiences match the ICP tightly.",
    },
    selfScores: {
      problemSeverity: 4,
      clearICP: 5,
      painfulAlternatives: 3,
      willingnessToPay: 3,
      founderAdvantage: 5,
      speedToMVP: 5,
      distributionAccess: 3,
      riskManageable: 4,
    },
  },
  expectedTotal: 79,
  expectedVerdict: "Validate with landing page/interviews",
};

/**
 * Sample #2 — illustrative Build MVP band example.
 * Narrow ICP, high problem severity, real WTP signal from adjacent spend,
 * and founder distribution — but tempered by realistic speed and risk.
 *
 * Illustrative only. Not regulatory or medical advice.
 */
const SAMPLE_2: SampleIdea = {
  slug: "trialaudit-pharma-etmf",
  label: "TrialAudit — pharma eTMF compliance tool",
  summary:
    "Illustrative Build MVP band example. Narrow ICP, strong pain, clear WTP.",
  input: {
    answers: {
      ideaName: "TrialAudit",
      oneLiner:
        "A checklist and audit-trail tool that helps small clinical-trial sponsors keep their eTMF inspection-ready without a full CTMS.",
      icp:
        "Phase I / II clinical-trial sponsors running 1–3 active trials, with no dedicated GxP quality function.",
      problem:
        "Small sponsors and their CROs lose weeks preparing for inspections because their document trail is scattered across email, SharePoint, and CRO handovers. Missing files trigger regulatory findings.",
      alternatives:
        "Enterprise eTMF platforms priced for large pharma; ad-hoc SharePoint folders; expensive consultants brought in before every inspection.",
      assumptions:
        "Small sponsors will trust a specialised tool over an enterprise CTMS; the compliance checklist can be validated by a working GxP QA lead; procurement is workable via SaaS with per-trial pricing.",
      wtpSignal:
        "Sponsors already pay $20k+ per inspection for consultants; enterprise eTMF platforms cost $50k+/year.",
      distribution:
        "Founder is an ex-GxP QA lead with a direct network of 20+ small sponsors; DIA and ACRP communities are reachable.",
    },
    selfScores: {
      problemSeverity: 5,
      clearICP: 5,
      painfulAlternatives: 5,
      willingnessToPay: 4,
      founderAdvantage: 4,
      speedToMVP: 3,
      distributionAccess: 3,
      riskManageable: 3,
    },
  },
  expectedTotal: 85,
  expectedVerdict: "Build MVP",
};

/**
 * Sample #3 — illustrative Pause or reshape band example.
 * Broad ICP, generic problem, crowded alternatives, weak WTP signal, and
 * no distribution advantage. The Speed-to-MVP self-score is deliberately
 * higher to show that speed alone cannot rescue a weak idea.
 */
const SAMPLE_3: SampleIdea = {
  slug: "writemate-ai-generic-writing",
  label: "WriteMate AI — generic writing assistant",
  summary:
    "Illustrative Pause or reshape example. Broad ICP, crowded alternatives, weak WTP signal.",
  input: {
    answers: {
      ideaName: "WriteMate AI",
      oneLiner:
        "An AI-powered writing assistant that helps anyone write better emails, essays, and social posts.",
      icp: "Anyone who writes online.",
      problem:
        "People find writing hard and their output is not as engaging as they would like.",
      alternatives:
        "ChatGPT, Grammarly, Notion AI, Jasper, native writing apps, and hiring an editor.",
      assumptions:
        "A general-purpose AI writing tool can win against the big incumbents; users will pay for a general tool over free chat interfaces.",
      wtpSignal:
        "Some people pay for Grammarly and ChatGPT Plus.",
      distribution:
        "We plan to post on X and TikTok once the app is ready.",
    },
    selfScores: {
      problemSeverity: 2,
      clearICP: 1,
      painfulAlternatives: 1,
      willingnessToPay: 1,
      founderAdvantage: 2,
      speedToMVP: 4,
      distributionAccess: 1,
      riskManageable: 2,
    },
  },
  expectedTotal: 33,
  expectedVerdict: "Pause or reshape",
};

/** All shipped samples. Order is stable — index 0 is Sample #1, etc. */
export const SAMPLES: readonly SampleIdea[] = [
  SAMPLE_1,
  SAMPLE_2,
  SAMPLE_3,
] as const;

/** Look up a sample by its stable slug. */
export function getSampleBySlug(slug: string): SampleIdea | undefined {
  return SAMPLES.find((s) => s.slug === slug);
}
