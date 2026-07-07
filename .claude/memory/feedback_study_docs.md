---
name: feedback-study-docs
description: "User likes a written markdown summary doc for non-trivial CSS/JS techniques, in addition to in-chat explanations"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 300a25d2-bf80-4b21-893d-d9f54990062f
---

When implementing a non-trivial technique (e.g. a CSS layout trick, a tricky selector, a box-model gotcha), in addition to explaining it in conversation, offer or create a short markdown summary doc under `docs/` covering the how/why and best-use-cases — don't just rely on the in-chat explanation disappearing into scrollback.

**Why:** User asked for this twice in one session for the subtype-menu feature (once explicitly — "make a separate file with a summary... so I can study it later" — and again for follow-up changes), consistent with [[user_learning_to_code]]: they're relearning to code and want material they can revisit, not just a one-time explanation.

**How to apply:** After finishing an explain-then-implement cycle for something conceptually meaty (new CSS technique, non-obvious bug fix, a reusable pattern), proactively suggest writing a short doc, or just write one if the user's phrasing already implies they want to study it later. Keep docs in `docs/` (created in this project), structured like the existing `subtype-menu-notes.md` / `subtype-menu-connection-and-visibility.md`: goal, technique, why-it-works, a relevant gotcha, and a "best use case" / "rule of thumb" takeaway. Don't do this for trivial one-liner fixes — reserve it for things worth re-reading later.
