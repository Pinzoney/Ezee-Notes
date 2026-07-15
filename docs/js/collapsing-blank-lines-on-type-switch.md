# Blank Lines Slip Through Marker-Based Filters — Collapse the Runs

## Goal

Stop blank lines from **accumulating above the Light Levels line** every time you switch
T2 type. Each switch was leaving 1–2 extra blank lines behind, and they piled up on every
flip back and forth.

## Why it happened

The type-switch filter in the `t2TypeGroup` handler removes lines by their **marker**:

- type headers → matched via `previousLines`
- status lines → matched via `isStatusLine`
- type fields → matched via `startsWithAny(line, managedPrefixes())`

A **blank line has no marker.** `startsWithAny('', prefixes)` is `false` (`''.indexOf(p)`
is `-1` for any non-empty `p`), it's not a header, not a status line — so **every blank
survives filtering.** Meanwhile each type's `.splice` inserts 2 blank separators. New
blanks go in, old blanks never come out → they stack up right above the first surviving
universal line (Light Levels).

### The 1-vs-2 asymmetry (the tell)

Switching **away from NPS** netted +1 blank, but **away from TR Audit** netted +2. That's
`stripCaseLine`: it deletes the `Case #:` line *and the blank directly above it*. Only NPS
has a `Case #:` line, so only leaving NPS earns that one-blank "discount." Same leak, two
different net counts — which is what made it look type-specific when it wasn't.

## The fix

Collapse any run of 2+ consecutive blank lines down to a single blank, as a final pass on
`filtered` — **after both `if` blocks**, right before the `genNote.value` assignment:

```js
filtered = filtered.filter(function (line, i, arr) {
   return line !== '' || arr[i - 1] !== '';   // keep non-blanks; drop a blank that follows a blank
})
```

Read the predicate as: *"keep this line if it's not blank, OR if the previous line wasn't
blank."* The only thing dropped is a blank whose predecessor is also blank — the 2nd, 3rd,
… blank in a run. At `i = 0`, `arr[-1]` is `undefined` (≠ `''`), so a leading blank is
always kept.

## Why it works

- **Idempotent.** Single separators are already single, so they're untouched; only
  accidental pile-ups get capped at one. Flip types any number of times and you always land
  back on the template's exact structure.
- **Runs of any length → 1.** The `.filter` callback's third arg (`arr`) peeks at the
  *original* neighbor, so in a run `[_, _, _]` every blank after the first sees a blank
  predecessor and is dropped, leaving one.
- **Reuses `filtered`, no new variable.** `filtered` is already the whole note body by that
  point (new type block + surviving universal lines); the header is prepended separately and
  is never blank, so it can't form a pair with `filtered[0]`.

## Gotcha

Placement matters: collapse **after** both `.splice` blocks, not right after the initial
`.filter`. Only the late pass also normalizes the **seam** between the freshly-spliced type
block and the leftover universal lines — which is exactly where the stray blank was landing.

## Rule of thumb

When a filter selects lines by a marker (prefix, header text, a class), remember that
**"empty" is not a marker.** Blank/whitespace-only lines pass straight through, so if
you're also *inserting* blanks, normalize them separately — a collapse-consecutive-blanks
pass is the cheap, idempotent way to do it.
