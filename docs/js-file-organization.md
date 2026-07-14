# Organizing a Vanilla JS File — "Setup → Definitions → Wiring"

There's no compiler-enforced order for a plain `.js` file, but there is a strong,
near-universal convention. The goal of this note is a repeatable layout so a file reads
top-to-bottom without scrolling back to find where something came from.

## The core principle: group by role, not by feature

A file grouped **by feature** puts everything about one thing together (all the popover
code, then all the type-switch code, then all the paste code). It's readable per-feature
but scatters constants, helpers, and listeners throughout the file.

A file grouped **by role** stacks the *kinds* of code, so each section only depends on
the sections above it:

```
1. Constants / config        magic strings & tunable values
2. DOM references            cached getElementById / querySelector lookups
3. Pure helpers              no side effects: predicates, formatters, parsers
4. Core logic                functions that mutate shared state
5. Wiring / event listeners  "when X happens, do Y" — the entry points
6. Init                      kickoff calls that run on load
```

## Why this order

Each section depends only on the ones **above** it: constants depend on nothing,
helpers use constants, core logic uses helpers, listeners use everything. Reading
top-down you always meet a value or function **before** the code that consumes it.

- **Constants at the top** = one place to tune magic values; nothing can read them
  before they exist.
- **Helpers before core** = you understand the small pure pieces before the function
  that orchestrates them.
- **Listeners last** = all the "entry points" (the things the user triggers) sit
  together, and by then every function they call is already defined above.

## The hoisting gotcha (why "it runs fine" is misleading)

JS lets an out-of-order file *appear* to work, which hides the problem:

- **`function foo() {}` declarations hoist fully** — callable before their line. This is
  why a listener near the top can call a helper defined near the bottom.
- **`var x = …` hoists the declaration but not the value** — `x` is `undefined` from the
  top of scope until its assignment line runs.
- **`const` / `let` are in the "temporal dead zone"** — referencing them before their
  line throws, rather than giving `undefined`.

So a constant defined halfway down still works *if* the only code reading it is inside a
listener callback that fires later (after the whole script has parsed). It breaks the
moment top-level code reads it before its definition line. Don't rely on "it happens to
run late enough" — hoist constants and DOM refs to the top yourself.

> **Gotcha:** the one real risk when reordering an existing file is this hoisting
> behavior. As long as constants and DOM references end up **above** everything that
> reads them at load time, moving whole `function`/listener blocks around is safe —
> function declarations are hoisted regardless of position.

## When to stop using one file

Single-file "by role" is right up to a few hundred lines. Past that, the next step is
splitting by concern into ES modules (`popovers.js`, `noteWriter.js`, `lightLevels.js`)
wired with `import` / `export`. That's a larger change and only worth it once the single
file is genuinely hard to navigate — don't reach for it early.

**Rule of thumb:** order sections so each one only depends on the sections above it
(constants → DOM → helpers → core → listeners → init). If you catch yourself scrolling
*up* to find where a value was defined, it's in the wrong section.
