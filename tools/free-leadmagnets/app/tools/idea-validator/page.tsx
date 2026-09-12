import type { Metadata } from "next";
import IdeaValidatorForm from "./IdeaValidatorForm";

export const metadata: Metadata = {
  title: "AI Idea Validator — AIPE Labs",
  description:
    "Score your idea out of 100 based on your own inputs and decide whether to build an MVP, validate with a landing page or interviews, research more, or pause.",
};

export default function IdeaValidatorPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="border-b border-slate-200 pb-8">
        <p className="text-sm font-medium uppercase tracking-wider text-sky-700">
          AIPE Labs · Free Tool
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          AI Idea Validator
        </h1>
        <p className="mt-4 text-lg text-slate-700">
          Validate before you build.
        </p>
        <p className="mt-3 text-slate-600">
          Fill in the canvas below with honest answers about your idea. The tool scores it
          out of 100 based only on what you tell it, then returns one of four verdicts —
          build MVP, validate with landing page/interviews, research more, or pause or
          reshape — with the next few actions worth taking. The result reflects your
          inputs, not a prediction about the idea itself.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Nothing you type here is stored or sent anywhere. Scoring runs entirely in your
          browser.
        </p>
      </header>

      <IdeaValidatorForm />
    </main>
  );
}
