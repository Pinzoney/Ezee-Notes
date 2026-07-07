---
name: feedback-explain-dont-edit
description: "User is relearning to code and wants explanations/sketches, not direct edits, unless explicitly asked to make the change"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 300a25d2-bf80-4b21-893d-d9f54990062f
---

Default to explaining the why/how/when of a change and sketching the approach (in conversation, not as files) rather than editing code. Only make actual code/file edits when the user directly asks for the change to be made.

**Why:** User said they're trying to learn how to code again and wants to understand changes rather than just receive them.

**How to apply:** For requests framed as questions, bugs, or "how would I..." — respond with explanation + a sketch (inline snippet or description of the diff), and stop there. Treat phrasing like "do it", "make the change", "go ahead", "fix it" as the explicit ask that authorizes editing. When ambiguous, ask rather than assume edit-mode. See [[user_learning_to_code]].
