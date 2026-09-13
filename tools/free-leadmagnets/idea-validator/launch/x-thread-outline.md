# X Thread Outline — AI Idea Validator

Related issue: #70
Owner: Sujay — @Sujay0908
Reviewer: Hitesh — @hiteshiat1
Channel: X (formerly Twitter)
Format: Founder-led multi-post thread (~9 posts)
Draft status: outline — final wording set by Sujay at post time

---

## Positioning

The thread's job is to make an AI-assisted builder who is about to start coding a new idea stop, reflect, and try the tool. Not to sell them a subscription. The tone is founder-led and dry. No hype, no fake urgency, no invented numbers.

The message across every post is:

> Validate before you build. Not "do not build".

---

## Post 1 — Hook

**Objective**
Get an AI-assisted builder who is one afternoon away from starting to code to stop and pay attention.

**Suggested message**

> Most AI builders don't lose weeks because they can't ship. They lose weeks because they shipped the wrong thing.
>
> Small thread on a free tool we made to catch that before it happens. 👇

**Visual (optional)**
None, or a static screenshot of the tool's intro line: "Validate before you build."

---

## Post 2 — The problem with jumping into development

**Objective**
Sharpen the pain. Make the reader recognise themselves in the pattern.

**Suggested message**

> Cursor, Claude, and Lovable make it possible to build a prototype in an afternoon.
>
> That is speed, not signal.
>
> A fast prototype cannot fix a fuzzy ICP, a mild problem, or a market where nobody pays for adjacent tools today.

**Visual**
None.

---

## Post 3 — What we built

**Objective**
Introduce the tool concretely and without hype.

**Suggested message**

> So we built the **AI Idea Validator**.
>
> A free interactive canvas that walks you through 8 questions, asks you to self-score each on 1–5, and returns one of four verdicts.
>
> No login. No DB. No external AI. Deterministic scoring based on your inputs.

**Visual (optional)**
A short GIF (3–5 seconds) of loading a sample and pressing Calculate.

---

## Post 4 — The 8 dimensions

**Objective**
Show the substance without dumping documentation.

**Suggested message**

> The 8 dimensions we score, and their weights:
>
> - Problem severity — 20
> - Clear ICP — 15
> - Painful alternatives — 15
> - Willingness to pay — 15
> - Founder / team advantage — 10
> - Speed to MVP — 10
> - Distribution access — 10
> - Risk manageable — 5
>
> Total 100.

**Visual (optional)**
A screenshot of the form's numbered sections.

---

## Post 5 — How the 1–5 scoring works

**Objective**
De-mystify the arithmetic so the tool feels transparent, not magical.

**Suggested message**

> How your 1–5 becomes a number:
>
> `points = (selfScore / 5) × categoryMax`
>
> A 4/5 on Problem severity = 16/20. A 3/5 on Distribution = 6/10.
>
> Sum the eight. Same input always gives the same result. No black box.

**Visual (optional)**
A cropped screenshot of one filled-in category with visible self-score + points/max.

---

## Post 6 — The verdict bands

**Objective**
Give the reader the payoff structure — four fixed bands, no ambiguity.

**Suggested message**

> Verdict bands (verbatim from the tool):
>
> 80–100 → Build MVP
> 60–79 → Validate with landing page/interviews
> 40–59 → Research more
> <40 → Pause or reshape
>
> "Validate" is not "Build". "Research" is not "Give up". The wording is intentional.

**Visual (optional)**
A screenshot of the coloured verdict badge for the sample idea (Validate band).

---

## Post 7 — What the result gives you

**Objective**
Show that the result is more than a number — it is a structured next step.

**Suggested message**

> Beyond the score, every result gives you:
>
> - Category breakdown with % per dimension
> - Your top 3 strongest areas
> - Your top 3 weakest areas — framed as "what to validate"
> - 3 recommended next actions tied to your weakest categories
> - A copyable plain-text summary you can paste anywhere

**Visual**
A screenshot of the full Result panel for the sample idea.

---

## Post 8 — What we intentionally left out of v0

**Objective**
Build-in-public credibility. Show restraint. Signal that we know what we chose not to build and why.

**Suggested message**

> What the v0 does NOT have, on purpose:
>
> - No login
> - No user database
> - No saved projects
> - No payments
> - No external AI API
> - No collaboration
>
> First we find out if the scoring model is useful. Then we add.

**Visual**
None.

---

## Post 9 — Call to action + feedback

**Objective**
Convert readers into users, and users into feedback.

**Suggested message**

> The tool is here: [TOOL URL]
>
> Two things we would love from you:
>
> 1. Score a real idea and reply with your verdict.
> 2. Tell us which of the 8 dimensions felt off or missing.
>
> No sign-up. No email capture. Just the tool.

**Visual (optional)**
Let X render the link preview of the tool page.

---

## Notes for Sujay

- Post each tweet as a reply to the previous one so the whole thread reads as a single unit on the timeline.
- Do not tag unrelated accounts.
- Reply to every substantive comment within 24 hours. Use the reply-engagement prompts from `templates/idea-validation/x-launch-posts.md` when they fit.
- If a comment surfaces a genuine bug or a real gap in the eight dimensions, open a follow-up GitHub issue before the tool changes so the thread has a public paper trail.
- Track: post views, thread completions, tool clicks, reply count, and verdict distribution shared by replies. No conversion or revenue metrics — this is a learning launch, not a marketing funnel.

---

## Do not

- Do not fabricate a URL. Leave `[TOOL URL]` until Hitesh confirms the live URL after deployment.
- Do not attach a demo screenshot with a fake score.
- Do not claim the tool predicts success or replaces customer research.
- Do not promise a paid version, a launch date, or a specific roadmap item that has not been publicly committed.
