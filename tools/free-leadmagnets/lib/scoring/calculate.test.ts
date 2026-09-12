import { describe, expect, it } from "vitest";

import {
  RECOMMENDED_ACTIONS,
  calculateIdeaScore,
  deriveNextActions,
  deriveVerdict,
  rankCategories,
  scoreCategory,
} from "./calculate";
import { CATEGORIES, TOTAL_MAX, getCategory } from "./categories";
import { SAMPLES } from "./samples";
import type {
  IdeaValidationInput,
  QualitativeAnswers,
  SelfScoreValue,
  SelfScores,
} from "./types";

// -----------------------------------------------------------------------------
// Fixtures / helpers
// -----------------------------------------------------------------------------

const emptyAnswers: QualitativeAnswers = {
  ideaName: "test",
  oneLiner: "test",
  icp: "test",
  problem: "test",
  alternatives: "test",
  assumptions: "test",
  wtpSignal: "test",
  distribution: "test",
};

function uniformScores(v: SelfScoreValue): SelfScores {
  return {
    problemSeverity: v,
    clearICP: v,
    painfulAlternatives: v,
    willingnessToPay: v,
    founderAdvantage: v,
    speedToMVP: v,
    distributionAccess: v,
    riskManageable: v,
  };
}

function inputWith(selfScores: SelfScores): IdeaValidationInput {
  return { answers: emptyAnswers, selfScores };
}

// The Sample #1 self-score shape — used by ranking tests independently of the fixture.
const sample1SelfScores: SelfScores = {
  problemSeverity: 4,
  clearICP: 5,
  painfulAlternatives: 3,
  willingnessToPay: 3,
  founderAdvantage: 5,
  speedToMVP: 5,
  distributionAccess: 3,
  riskManageable: 4,
};

// -----------------------------------------------------------------------------
// Catalogue
// -----------------------------------------------------------------------------

describe("category catalogue", () => {
  it("has exactly 8 categories", () => {
    expect(CATEGORIES.length).toBe(8);
  });

  it("has weights that sum to exactly 100", () => {
    expect(TOTAL_MAX).toBe(100);
    expect(CATEGORIES.reduce((s, c) => s + c.max, 0)).toBe(100);
  });

  it("uses the exact category keys and order from Issue #70", () => {
    expect(CATEGORIES.map((c) => c.key)).toEqual([
      "problemSeverity",
      "clearICP",
      "painfulAlternatives",
      "willingnessToPay",
      "founderAdvantage",
      "speedToMVP",
      "distributionAccess",
      "riskManageable",
    ]);
  });

  it("assigns 0..7 order values in sequence", () => {
    expect(CATEGORIES.map((c) => c.order)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("has unique category keys", () => {
    const keys = CATEGORIES.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("uses the exact maximum points from Issue #70", () => {
    const maxes = Object.fromEntries(
      CATEGORIES.map((c) => [c.key, c.max] as [string, number]),
    );
    expect(maxes).toEqual({
      problemSeverity: 20,
      clearICP: 15,
      painfulAlternatives: 15,
      willingnessToPay: 15,
      founderAdvantage: 10,
      speedToMVP: 10,
      distributionAccess: 10,
      riskManageable: 5,
    });
  });
});

// -----------------------------------------------------------------------------
// scoreCategory — individual scoring
// -----------------------------------------------------------------------------

describe("scoreCategory", () => {
  it("returns exactly max points for self-score 5, for every category", () => {
    for (const c of CATEGORIES) {
      const cs = scoreCategory(c.key, 5);
      expect(cs.points).toBe(c.max);
      expect(cs.percent).toBe(100);
    }
  });

  it("returns max/5 points for self-score 1, for every category", () => {
    for (const c of CATEGORIES) {
      const cs = scoreCategory(c.key, 1);
      expect(cs.points).toBe(Math.round(c.max / 5));
    }
  });

  it("returns mid points for self-score 3, for every category", () => {
    for (const c of CATEGORIES) {
      const cs = scoreCategory(c.key, 3);
      expect(cs.points).toBe(Math.round((3 * c.max) / 5));
    }
  });

  it("produces only integer points across every category × self-score", () => {
    for (const c of CATEGORIES) {
      for (const s of [1, 2, 3, 4, 5] as SelfScoreValue[]) {
        const cs = scoreCategory(c.key, s);
        expect(Number.isInteger(cs.points)).toBe(true);
      }
    }
  });

  it("computes percent as round((points / max) * 100)", () => {
    for (const c of CATEGORIES) {
      for (const s of [1, 2, 3, 4, 5] as SelfScoreValue[]) {
        const cs = scoreCategory(c.key, s);
        expect(cs.percent).toBe(Math.round((cs.points / c.max) * 100));
      }
    }
  });

  it("returns a CategoryScore that mirrors the catalogue label and max", () => {
    const cs = scoreCategory("problemSeverity", 4);
    expect(cs.label).toBe(getCategory("problemSeverity").label);
    expect(cs.max).toBe(20);
    expect(cs.selfScore).toBe(4);
    expect(cs.points).toBe(16);
  });

  it.each([0, 6, -1, 1.5, NaN])(
    "throws on invalid self-score %s",
    (bad) => {
      expect(() =>
        scoreCategory("problemSeverity", bad as unknown as SelfScoreValue),
      ).toThrow();
    },
  );
});

// -----------------------------------------------------------------------------
// calculateIdeaScore — arithmetic totals
// -----------------------------------------------------------------------------

describe("calculateIdeaScore — arithmetic totals", () => {
  it.each([
    [1, 20],
    [2, 40],
    [3, 60],
    [4, 80],
    [5, 100],
  ] as const)(
    "all-%d self-scores produce total %d",
    (score, expected) => {
      const r = calculateIdeaScore(
        inputWith(uniformScores(score as SelfScoreValue)),
      );
      expect(r.total).toBe(expected);
    },
  );

  it("returns eight category scores in Issue #70 order", () => {
    const r = calculateIdeaScore(inputWith(uniformScores(3)));
    expect(r.categoryScores.map((c) => c.key)).toEqual(
      CATEGORIES.map((c) => c.key),
    );
  });

  it("throws with a category-specific message when a self-score is missing", () => {
    const scores = { ...uniformScores(3) } as Partial<SelfScores>;
    delete scores.willingnessToPay;
    expect(() =>
      calculateIdeaScore({
        answers: emptyAnswers,
        selfScores: scores as SelfScores,
      }),
    ).toThrow(/willingnessToPay/);
  });

  it("throws when input.selfScores is missing entirely", () => {
    expect(() =>
      calculateIdeaScore({
        answers: emptyAnswers,
      } as unknown as IdeaValidationInput),
    ).toThrow();
  });

  it("throws when input itself is null-ish", () => {
    expect(() =>
      calculateIdeaScore(null as unknown as IdeaValidationInput),
    ).toThrow();
  });

  it("is deterministic across repeated calls", () => {
    const input = inputWith(uniformScores(3));
    expect(calculateIdeaScore(input)).toEqual(calculateIdeaScore(input));
  });
});

// -----------------------------------------------------------------------------
// deriveVerdict — boundaries
// -----------------------------------------------------------------------------

describe("deriveVerdict — boundaries", () => {
  it.each([
    [0, "Pause or reshape"],
    [39, "Pause or reshape"],
    [40, "Research more"],
    [59, "Research more"],
    [60, "Validate with landing page/interviews"],
    [79, "Validate with landing page/interviews"],
    [80, "Build MVP"],
    [100, "Build MVP"],
  ] as const)("total %d → %s", (total, expected) => {
    expect(deriveVerdict(total)).toBe(expected);
  });

  it("uses the verbatim Issue #70 wording for the mid band", () => {
    // Explicit guard against any drift toward paraphrases such as
    // "Validate first" or "Landing page and interviews".
    expect(deriveVerdict(70)).toBe("Validate with landing page/interviews");
  });

  it("does not throw for out-of-range totals", () => {
    expect(() => deriveVerdict(-1)).not.toThrow();
    expect(() => deriveVerdict(101)).not.toThrow();
    expect(deriveVerdict(-1)).toBe("Pause or reshape");
    expect(deriveVerdict(101)).toBe("Build MVP");
  });
});

// -----------------------------------------------------------------------------
// rankCategories — strongest / weakest
// -----------------------------------------------------------------------------

describe("rankCategories", () => {
  it("returns at most 3 strongest and at most 3 weakest", () => {
    const r = calculateIdeaScore(inputWith(uniformScores(3)));
    expect(r.strongest.length).toBeLessThanOrEqual(3);
    expect(r.weakest.length).toBeLessThanOrEqual(3);
  });

  it("keeps strongest and weakest disjoint", () => {
    const r = calculateIdeaScore(inputWith(uniformScores(3)));
    const sKeys = new Set(r.strongest.map((s) => s.key));
    for (const w of r.weakest) {
      expect(sKeys.has(w.key)).toBe(false);
    }
  });

  it("ranks strongest descending by percent (Sample #1 shape)", () => {
    const r = calculateIdeaScore(inputWith(sample1SelfScores));
    expect(r.strongest.map((s) => s.key)).toEqual([
      "clearICP",
      "founderAdvantage",
      "speedToMVP",
    ]);
    // All three at 100%
    expect(r.strongest.every((s) => s.percent === 100)).toBe(true);
  });

  it("ranks weakest ascending by percent (Sample #1 shape)", () => {
    const r = calculateIdeaScore(inputWith(sample1SelfScores));
    expect(r.weakest.map((s) => s.key)).toEqual([
      "painfulAlternatives",
      "willingnessToPay",
      "distributionAccess",
    ]);
    // All three at 60%
    expect(r.weakest.every((s) => s.percent === 60)).toBe(true);
  });

  it("breaks ties by Issue #70 category order (earlier first) — all equal input", () => {
    const r = calculateIdeaScore(inputWith(uniformScores(3)));
    expect(r.strongest.map((s) => s.key)).toEqual([
      "problemSeverity",
      "clearICP",
      "painfulAlternatives",
    ]);
    expect(r.weakest.map((s) => s.key)).toEqual([
      "willingnessToPay",
      "founderAdvantage",
      "speedToMVP",
    ]);
  });

  it("rankCategories on an empty array returns empty lists", () => {
    const r = rankCategories([]);
    expect(r.strongest).toEqual([]);
    expect(r.weakest).toEqual([]);
  });

  it("is deterministic across repeated calls on the same input", () => {
    const a = calculateIdeaScore(inputWith(sample1SelfScores));
    const b = calculateIdeaScore(inputWith(sample1SelfScores));
    expect(a.strongest.map((s) => s.key)).toEqual(b.strongest.map((s) => s.key));
    expect(a.weakest.map((s) => s.key)).toEqual(b.weakest.map((s) => s.key));
  });
});

// -----------------------------------------------------------------------------
// RECOMMENDED_ACTIONS + deriveNextActions
// -----------------------------------------------------------------------------

describe("RECOMMENDED_ACTIONS + deriveNextActions", () => {
  it("has a non-empty recommendation for every category", () => {
    for (const c of CATEGORIES) {
      const action = RECOMMENDED_ACTIONS[c.key];
      expect(typeof action).toBe("string");
      expect(action.length).toBeGreaterThan(0);
    }
  });

  it("returns one action per weakest category, in matching order", () => {
    const r = calculateIdeaScore(inputWith(sample1SelfScores));
    expect(r.recommendedActions.length).toBe(r.weakest.length);
    for (let i = 0; i < r.weakest.length; i++) {
      expect(r.recommendedActions[i]).toBe(
        RECOMMENDED_ACTIONS[r.weakest[i].key],
      );
    }
  });

  it("returns exactly 3 actions when there are 3 weakest categories", () => {
    const r = calculateIdeaScore(inputWith(uniformScores(3)));
    expect(r.recommendedActions.length).toBe(3);
  });

  it("returns an empty array when weakest is empty", () => {
    expect(deriveNextActions([])).toEqual([]);
  });

  it("is deterministic across repeated calls", () => {
    const input = inputWith(sample1SelfScores);
    expect(calculateIdeaScore(input).recommendedActions).toEqual(
      calculateIdeaScore(input).recommendedActions,
    );
  });

  it("produces relevant actions for tied-weakest categories (Sample #1)", () => {
    const r = calculateIdeaScore(inputWith(sample1SelfScores));
    // Same 60% tier: painfulAlternatives, willingnessToPay, distributionAccess.
    // We do not assert English content — only that the mapping is stable.
    expect(r.recommendedActions).toEqual([
      RECOMMENDED_ACTIONS.painfulAlternatives,
      RECOMMENDED_ACTIONS.willingnessToPay,
      RECOMMENDED_ACTIONS.distributionAccess,
    ]);
  });
});

// -----------------------------------------------------------------------------
// Sample fixtures
// -----------------------------------------------------------------------------

describe("sample fixtures", () => {
  it("ships at least three samples", () => {
    expect(SAMPLES.length).toBeGreaterThanOrEqual(3);
  });

  it("uses unique slugs", () => {
    const slugs = SAMPLES.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(SAMPLES.map((s) => [s.slug, s] as const))(
    "sample %s matches its declared expectedTotal and expectedVerdict",
    (_slug, sample) => {
      const r = calculateIdeaScore(sample.input);
      expect(r.total).toBe(sample.expectedTotal);
      expect(r.verdict).toBe(sample.expectedVerdict);
    },
  );

  it("Sample #1 (AI Launch Checklist Builder) scores exactly 79 — Validate band", () => {
    const r = calculateIdeaScore(SAMPLES[0].input);
    expect(r.total).toBe(79);
    expect(r.verdict).toBe("Validate with landing page/interviews");
  });

  it("Sample #2 lands in the Build MVP band (80..100)", () => {
    const r = calculateIdeaScore(SAMPLES[1].input);
    expect(r.total).toBeGreaterThanOrEqual(80);
    expect(r.total).toBeLessThanOrEqual(100);
    expect(r.verdict).toBe("Build MVP");
  });

  it("Sample #3 lands in the Pause or reshape band (<40)", () => {
    const r = calculateIdeaScore(SAMPLES[2].input);
    expect(r.total).toBeLessThan(40);
    expect(r.verdict).toBe("Pause or reshape");
  });
});
