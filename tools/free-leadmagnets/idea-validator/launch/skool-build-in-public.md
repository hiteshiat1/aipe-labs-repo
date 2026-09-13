# Skool Post — Building the AI Idea Validator in Public

Related issue: #70
Owner: Ruthwik — @ruthwiklee
Reviewer: Hitesh — @hiteshiat1
Channel: Skool community
Format: Single long-form Skool post + first-comment
Draft status: review-ready

---

## Post Title

Working title:

> We built the AI Idea Validator — try it and tell us what breaks

Alternative:

> Free tool: pressure-test your AI idea before you build it

Pick the stronger one at post time. Do not use both.

---

## Post Body

### What we built

The AI Idea Validator is a small interactive tool that walks you through the AIPE Labs idea validation canvas and returns a structured verdict.

You enter an idea, describe the target user and the problem, list the current alternatives and your biggest assumptions, self-score every scoring dimension on a 1–5 scale, and hit Calculate.

You get back a score out of 100, one of four verdicts, a per-category breakdown, your strongest and weakest areas, three recommended next actions, and a plain-text summary you can copy in one click.

The tool is free, runs entirely in your browser, and does not ask you to sign in.

---

### Why we built it

The free AI Idea Validation Canvas we shared earlier works, but a Notion document has friction. Copy it, fill it in, add up the numbers, look up the verdict, remember what to do next. Most builders will not finish it.

An interactive version cuts that to a few minutes and forces every builder to answer the same eight questions before writing more code.

The message is unchanged:

> Validate before you overbuild.

---

### What it evaluates

Eight dimensions, weighted to add up to 100 points.

- Problem severity — 20
- Clear ICP — 15
- Existing painful alternatives — 15
- Willingness to pay — 15
- Founder / team advantage — 10
- Speed to MVP — 10
- Distribution access — 10
- Risk level manageable — 5

These are the same dimensions in the written canvas. The interactive tool applies them consistently.

---

### How the scoring works

Every dimension is a 1–5 self-score. That converts deterministically to points against the dimension's max:

- 4/5 on Problem severity → 16/20
- 3/5 on Distribution access → 6/10
- 5/5 on Risk level manageable → 5/5

Sum the eight to a total out of 100. The verdict comes from four fixed bands:

- 80–100 → Build MVP
- 60–79 → Validate with landing page/interviews
- 40–59 → Research more
- Below 40 → Pause or reshape

There is no AI black box here. No model is guessing whether your idea will succeed. The result reflects what you told the tool.

---

### What is in the v0

- Interactive form for all eight dimensions and the qualitative context around each
- Deterministic 100-point scoring
- Verdict with the exact wording above
- Per-category breakdown with points, self-score, and percentage
- Strongest and weakest areas, chosen from your own scores
- Three recommended next actions tied to your weakest areas
- Copyable plain-text summary to paste into Skool, share with a co-founder, or drop into your notes
- Three sample ideas you can load and score to see how a real run looks

---

### What we deliberately did NOT build

- No login
- No user accounts
- No database
- No saved projects
- No payments
- No external AI API
- No multi-user collaboration
- No analytics tracking beyond what Vercel provides by default

The v0 exists so we can find out if the scoring model is useful. If people use it and get value from the result, we know what to add next. If they do not, we know what to change first.

---

### What we want to learn

Specific questions we can only answer with your input:

1. Are these the right eight dimensions? Which one felt least useful for your idea?
2. Did the verdict match your gut about the idea, or did it feel off?
3. Are the recommended next actions specific enough to act on this week?
4. What did you expect the tool to do that it does not?
5. Which question in the form was hardest to answer honestly?

---

### Try it

[LIVE URL — TO BE ADDED AFTER DEPLOYMENT]

Score a real idea. Copy the summary. Paste it in the comments with your notes.

---

### Discussion prompt

If you have used it:

1. What score did you get, and does it match what you would have said before running through the tool?
2. Which category would you argue should be weighted differently, and why?

If you have not:

Drop the working title of your current idea and one sentence about who it is for. I will run it through the validator myself and post the result under your comment.

---

## Suggested first comment from Ruthwik

I ran the AI Launch Checklist Builder sample through the tool. That is the same idea we used in the filled-canvas example.

- Score: 79 / 100
- Verdict: Validate with landing page/interviews
- Strongest areas: Clear ICP, Founder / team advantage, Speed to MVP
- Weakest areas: Existing painful alternatives, Willingness to pay, Distribution access

The three weakest areas are exactly what I would have wanted a mentor to poke at. That is what I hoped the tool would do. Curious whether it does the same on your ideas.

---

## Notes for the owner

- Publish after Hitesh reviews the deployed URL.
- Replace the URL placeholder before posting. Do not add a Vercel preview URL that has not been confirmed.
- Do not edit the verdict wording anywhere in the post.
- If the post gets more than a handful of substantive replies, use the reply-engagement prompts from `templates/idea-validation/x-launch-posts.md` as a starting point for consistent tone across surfaces.
