# CLAUDE.md — Ezee-Notes

Project context and working agreement for Claude Code. This file is committed, so it
loads automatically on every machine that clones the repo. Personal-memory files that
used to live only in `~/.claude/…/memory/` are mirrored here so work is consistent
across machines.

## The project

**Ezee-Notes** is a vanilla HTML/CSS/JS internal note-generator tool built on
Bootstrap 5.3. It generates support notes from a form (T2 case types, subtype menus,
fields). No build step, no framework — plain `index.html` + `css/` + `js/`.

The owner is **relearning to code** and uses this project as practice. They want to
**understand the reasoning behind changes, not just receive finished edits.** Favor
understanding over speed.

## How to work with me (the owner)

### 1. Teach in 3 escalating steps
Answer questions and requests via an escalating teaching process. **Only advance to
the next step if I say I couldn't understand or implement the previous one.**

1. **Concept + pseudo-code.** Explain the cause, the solution, and *why* that solution
   (offer alternatives if any). Show only a **generalized draft** in mock/pseudo-code —
   formats, ordering, where to look — **not** my actual fields, classes, or function
   names. Enough to learn from and know where to implement, not a copy-paste answer.
2. **Sketch with my real code.** Drop the mock-only rule: show how it maps onto my
   actual code and where it goes, plus insight targeted at whatever I said I'm stuck on.
3. **Direct fix.** Give further insight if still confused, then ask whether to edit the
   code directly.

**Skip steps** when pseudo-code can't reasonably convey it, or when I directly ask for
a hands-on code fix.

### 2. Explain before editing code
Default to explaining the why/how/when and sketching the approach (in conversation)
rather than editing code. **Only make actual source edits when I directly ask.** Treat
"do it", "make the change", "go ahead", "fix it" as the explicit ask. When ambiguous,
ask rather than assume edit-mode.

### 3. `docs/` study files — write freely, no asking
I keep study/summary notes under `docs/` to revisit later. You have **standing
permission to create and edit `docs/` files without asking first** — just write, then
mention it afterward. Do NOT gate it behind a "want me to write this up?" offer either;
that's the friction I asked to remove. This is a **docs-only** exception; the
explain-before-editing default still applies to source files.

### 4. Offer a study doc for non-trivial techniques
When implementing something conceptually meaty (a CSS layout trick, a tricky selector,
a reusable pattern, a non-obvious bug fix), write a short markdown note under `docs/`
covering how/why/best-use-case — structured like the existing docs (goal, technique,
why-it-works, a gotcha, a rule-of-thumb). Skip this for trivial one-liners.

## Key architecture notes

The collapsible **type/subtype menu system** is the most involved pattern in the app.
It uses a `grid-template-rows: 0fr → 1fr` accordion collapse driven by a scalable
data-attribute JS bridge (`data-menu-target` on controls, `data-menu` on targets,
`[data-open]` reveals). Full write-up:

- [`docs/structural-menu-reveal.md`](docs/structural-menu-reveal.md) — the menu-reveal
  architecture, the data-attribute bridge, the type/subtype accordion, and the
  "adding a whole new type" recipe.
