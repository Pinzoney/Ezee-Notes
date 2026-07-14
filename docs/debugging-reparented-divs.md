# Debugging a Broken Layout When Your `</div>` Tags Actually Balance

A classic "I must have deleted a `</div>`" bug — an element jumps to the wrong place —
often is **not** a missing tag at all. This note is the mental model and the two tools
for finding it fast.

## Missing vs. mis-placed close

- **Missing** `</div>` → the open/close counts **don't** balance. Everything after the
  gap nests one level too deep, and the running depth ends at +1 (or more).
- **Mis-placed** `</div>` → counts **still balance to zero**, but a close lands in the
  wrong spot, so a block gets **re-parented** — pulled out of the container it belonged
  to, or pushed into one it didn't. The layout breaks even though the HTML is "valid."

The giveaway: if the tag count balances, stop looking for a missing tag. Look for a
close that fires one block too early or too late.

## Tool 1 — count nesting depth per line

Walk the file, `+1` for every `<div`, `-1` for every `</div>`, and print the running
depth next to each structural line. Where the depth is when you reach an element tells
you exactly which container it's sitting in.

```js
// node -e '...'  — depth AFTER processing each line
let depth = 0;
lines.forEach((ln, i) => {
   depth += (ln.match(/<div\b/g) || []).length;
   depth -= (ln.match(/<\/div>/g) || []).length;
   if (/* a landmark line: a column, a form, the thing that moved */)
      console.log(i + 1, "depth=" + depth, ln.trim());
});
```

If two elements you expect to be **siblings** show the same depth but one closes before
the other opens, they're siblings. If one should be **inside** the other, its depth
should be one deeper while the parent is still open. A parent that closes at a lower
line number than you expect = the "early close" bug.

## Tool 2 — `git diff` the file

If it worked before, the fastest answer is `git diff -- file.html` (or diff against the
last good commit). A re-parenting bug shows up as a `</div>` that moved a few lines, or
an added/removed close near where the misbehaving element now lives. The diff tells you
the *intended* nesting for free — no need to reverse-engineer it.

## Why the layout actually breaks (the Bootstrap grid case)

A `.row` is `display:flex; flex-wrap:wrap`, sized so its column children add up to 12
(e.g. `col-8` + `col-4`). Eject one child's content into the row as an **extra** flex
item and the total exceeds 12 columns, so `flex-wrap` pushes the last column onto a new
line — the element appears *under* its neighbour instead of beside it. The fix is never
"add width"; it's "put the stray element back inside the column it belongs to."

> **Gotcha:** indentation can lie. After a hand restructure, a `</div>` may be indented
> as if it closes an inner block while actually closing an outer one (or vice-versa).
> Trust the depth count, not the whitespace.

**Rule of thumb:** *tags balance but layout is wrong → something got re-parented.* Count
the depth (or diff against the last good commit) to find the close that lands one block
too early, and move it, don't add a new one.
