---
name: feedback_three_step_teaching
description: "Answer questions/requests via a 3-step escalating teaching process; advance a step only if the user couldn't understand/implement the previous one"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c2f28351-479c-4251-ac27-d9f76c1c6411
---

For questions and requests, teach in escalating steps. Only move to the next step if the user says they couldn't understand or implement the previous one.

1. **Concept + pseudo-code.** Explain the cause, the solution, and *why* that solution (offer alternate solutions if any). Show only a **generalized draft** in mock/pseudo-code — formats, ordering, where to look — **not** the user's actual fields, classes, or function names. Enough to learn from and know where to implement, not a copy-paste answer.
2. **Sketch with their real code.** Drop the mock-only rule: show how it maps onto their actual code and where it goes, plus extra insight targeted at whatever part they say they're stuck on or errors they hit trying step 1.
3. **Direct fix.** Give further insight if still confused, then ask whether to edit the code directly or answer more questions.

**Skip steps when appropriate:** jump ahead if pseudo-code can't reasonably convey it, or if the user directly asks for a hands-on code fix.

**Why:** The user is relearning to code and wants to build understanding and do the implementation themselves, escalating help only as needed.

**How to apply:** Default every answer to Step 1. Don't volunteer real-code or direct edits unless they signal they're stuck or ask outright. Applies to all sessions. Extends [[feedback_explain_dont_edit]] and [[user_learning_to_code]]. Note: docs/ study files are exempt — [[feedback_docs_freely]] still stands (write them freely).
