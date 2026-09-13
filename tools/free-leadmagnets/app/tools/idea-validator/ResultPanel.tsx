"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { IdeaValidationResult, Verdict } from "@/lib/scoring/types";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ResultPanelProps {
  result: IdeaValidationResult | null;
  isStale?: boolean;
}

type CopyStatus = "idle" | "copied" | "error";

/**
 * Per-verdict visual treatment.
 *
 * Colour is a reinforcement, not the sole differentiator — the verdict text
 * itself (`result.verdict`) is unique for each band and always visible.
 * Small "Verdict" eyebrow label is coloured to match; badge uses a solid
 * high-contrast background against white text so it stays legible.
 */
type VerdictStyle = {
  card: string;
  eyebrow: string;
  badge: string;
};

const VERDICT_STYLES: Record<Verdict, VerdictStyle> = {
  "Build MVP": {
    card: "border-emerald-300 bg-emerald-50",
    eyebrow: "text-emerald-800",
    badge: "bg-emerald-700 text-white",
  },
  "Validate with landing page/interviews": {
    card: "border-sky-300 bg-sky-50",
    eyebrow: "text-sky-800",
    badge: "bg-sky-700 text-white",
  },
  "Research more": {
    card: "border-amber-300 bg-amber-50",
    eyebrow: "text-amber-900",
    badge: "bg-amber-700 text-white",
  },
  "Pause or reshape": {
    card: "border-rose-300 bg-rose-50",
    eyebrow: "text-rose-900",
    badge: "bg-rose-700 text-white",
  },
};

// -----------------------------------------------------------------------------
// Summary builder
// -----------------------------------------------------------------------------

/**
 * Build the plain-text summary that gets copied to the clipboard.
 * Derived exclusively from `result` — never reads form state, never calls the
 * scoring engine again, never touches the network. Same result always produces
 * the same string.
 */
function buildSummary(result: IdeaValidationResult): string {
  const lines: string[] = [];
  lines.push("AI Idea Validator Result");
  lines.push("");
  lines.push(`Score: ${result.total} / 100`);
  lines.push(`Verdict: ${result.verdict}`);

  if (result.strongest.length > 0) {
    lines.push("");
    lines.push("Strongest areas:");
    for (const s of result.strongest) {
      lines.push(`- ${s.label} (${s.percent}%)`);
    }
  }

  if (result.weakest.length > 0) {
    lines.push("");
    lines.push("Weakest areas to validate:");
    for (const w of result.weakest) {
      lines.push(`- ${w.label} (${w.percent}%)`);
    }
  }

  if (result.recommendedActions.length > 0) {
    lines.push("");
    lines.push("Next actions:");
    result.recommendedActions.forEach((a, i) => {
      lines.push(`${i + 1}. ${a}`);
    });
  }

  lines.push("");
  lines.push("— Scored with the AIPE Labs AI Idea Validator");

  return lines.join("\n");
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function ResultPanel({
  result,
  isStale = false,
}: ResultPanelProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset copy feedback whenever the result identity changes (new calculation,
  // sample loaded, or reset). Also ensures the timeout doesn't fire after
  // unmount.
  useEffect(() => {
    setCopyStatus("idle");
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [result]);

  async function handleCopy() {
    if (!result) return;
    const summary = buildSummary(result);
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(summary);
        setCopyStatus("copied");
        if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopyStatus("idle"), 2000);
      } else {
        setCopyStatus("error");
      }
    } catch {
      // Clipboard write can reject on permission denial, insecure context, or
      // browsers without the API. Fall back to the manual-select textarea.
      setCopyStatus("error");
    }
  }

  if (result === null) {
    return <PlaceholderPanel />;
  }

  const style = VERDICT_STYLES[result.verdict];

  return (
    <section
      aria-labelledby="result-heading"
      className="mt-12 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {isStale && (
        <p
          role="status"
          className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          Your inputs changed. Recalculate to update this result.
        </p>
      )}

      <h2
        id="result-heading"
        className="text-2xl font-bold tracking-tight text-slate-900"
      >
        Your result
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Based on the answers and self-scores you provided.
      </p>

      {/* Score + verdict */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="mt-6 grid gap-4 sm:grid-cols-5"
      >
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 sm:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total score
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-5xl font-bold tabular-nums text-slate-900">
              {result.total}
            </span>
            <span className="text-2xl font-semibold text-slate-400">
              {" "}/ 100
            </span>
          </div>
          <div className="mt-4">
            <ProgressBar
              value={result.total}
              label="Total score"
              className="h-3"
            />
          </div>
        </div>

        <div
          className={cn(
            "rounded-lg border-2 p-5 sm:col-span-3",
            style.card,
          )}
        >
          <div
            className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              style.eyebrow,
            )}
          >
            Verdict
          </div>
          <div className="mt-2">
            <span
              className={cn(
                "inline-block rounded-md px-3 py-1.5 text-base font-semibold shadow-sm sm:text-lg",
                style.badge,
              )}
            >
              {result.verdict}
            </span>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="mt-10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Category breakdown
        </h3>
        <ul className="mt-4 space-y-4">
          {result.categoryScores.map((cs) => (
            <li key={cs.key}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className="text-sm font-medium text-slate-900">
                  {cs.label}
                </span>
                <span className="text-xs text-slate-500 tabular-nums">
                  {cs.selfScore}/5 self-score
                  <span
                    className="mx-1.5 text-slate-300"
                    aria-hidden="true"
                  >
                    ·
                  </span>
                  {cs.points}/{cs.max} pts
                  <span
                    className="mx-1.5 text-slate-300"
                    aria-hidden="true"
                  >
                    ·
                  </span>
                  {cs.percent}%
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar
                  value={cs.percent}
                  label={cs.label}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Strongest / Weakest */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <RankSection
          title="Strongest areas"
          items={result.strongest}
          borderClass="border-emerald-200"
          bgClass="bg-emerald-50/60"
          headingClass="text-emerald-800"
          emptyMessage="None to highlight."
        />
        <RankSection
          title="Weakest areas to validate"
          items={result.weakest}
          borderClass="border-amber-200"
          bgClass="bg-amber-50/60"
          headingClass="text-amber-900"
          emptyMessage="None to flag."
        />
      </div>

      {/* Recommended next actions */}
      {result.recommendedActions.length > 0 && (
        <div className="mt-10">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Recommended next actions
          </h3>
          <ol className="mt-4 space-y-3">
            {result.recommendedActions.map((action, i) => (
              <li key={`${i}-${action}`} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white"
                >
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700">
                  <span className="sr-only">Action {i + 1}: </span>
                  {action}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Copy summary */}
      <div className="mt-10 border-t border-slate-200 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="primary" onClick={handleCopy}>
            {copyStatus === "copied" ? "Copied!" : "Copy summary"}
          </Button>
          {copyStatus === "copied" && (
            <span role="status" className="text-sm text-emerald-700">
              Result summary copied to your clipboard.
            </span>
          )}
        </div>
        {copyStatus === "error" && (
          <div role="alert" className="mt-3">
            <p className="text-sm text-amber-800">
              Your browser did not allow copying automatically. Select the text
              below and copy it manually.
            </p>
            <textarea
              readOnly
              value={buildSummary(result)}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-2 min-h-[240px] w-full rounded-md border border-slate-300 bg-white p-3 font-mono text-xs text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              aria-label="Result summary — select and copy manually"
            />
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Copies your total, verdict, strongest and weakest areas, and next
          three actions as plain text.
        </p>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

function RankSection({
  title,
  items,
  borderClass,
  bgClass,
  headingClass,
  emptyMessage,
}: {
  title: string;
  items: IdeaValidationResult["strongest"];
  borderClass: string;
  bgClass: string;
  headingClass: string;
  emptyMessage: string;
}) {
  return (
    <div className={cn("rounded-lg border p-4", borderClass, bgClass)}>
      <h3
        className={cn(
          "text-sm font-semibold uppercase tracking-wider",
          headingClass,
        )}
      >
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex flex-wrap items-baseline justify-between gap-x-3"
            >
              <span className="text-sm font-medium text-slate-900">
                {item.label}
              </span>
              <span className="text-xs tabular-nums text-slate-600">
                {item.points}/{item.max} pts
                <span className="mx-1.5 text-slate-300" aria-hidden="true">
                  ·
                </span>
                {item.percent}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Placeholder (result === null)
// -----------------------------------------------------------------------------

function PlaceholderPanel() {
  return (
    <section
      aria-labelledby="result-heading"
      className="mt-12 rounded-xl border border-dashed border-slate-300 bg-white p-6 shadow-sm"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="result-heading"
          className="text-xl font-semibold text-slate-900"
        >
          Your result
        </h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          Awaiting input
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Complete the form and click Calculate to see your result. It will include
        your total score out of 100, an overall verdict, per-category breakdown,
        your strongest and weakest areas, three recommended next actions, and a
        copyable summary you can share with a co-founder or paste into Skool or
        X.
      </p>

      <div className="mt-6 flex flex-col gap-4 rounded-lg bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total score
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-slate-400">—</span>
            <span className="text-xl text-slate-400"> / 100</span>
          </div>
        </div>
        <div className="rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-500">
          Verdict will appear here
        </div>
      </div>
    </section>
  );
}
