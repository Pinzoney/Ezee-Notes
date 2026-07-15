# "Does this line start with any of these prefixes?" — the `.some()` + starts-with idiom

A one-line pattern used in `startsWithAny` (and echoed in `upsertNoteLine`) to test a
string against a *whole list* of prefixes at once. Worth understanding because it shows up
anywhere the app asks "is this note line one of the managed ones?"

## The line

```js
function startsWithAny(line, prefixes) {
   return prefixes.some(function (p) { return line.indexOf(p) === 0; })
}
```

Reads as: **"Is there some prefix `p` in the array such that `line` begins with `p`?"**
Returns a **boolean** (`true`/`false`) — *not* a position, not a line number.

## Reading it from the inside out

| Piece | What it does | Example |
|---|---|---|
| `line.indexOf(p)` | position where substring `p` first appears in `line`, or `-1` if absent | `"WO #: 5".indexOf("WO #: ")` → `0` |
| `... === 0` | true only when `p` sits at the **very start** (a *starts-with* test, not *contains*) | `0 === 0` → `true` |
| `prefixes.some(fn)` | runs `fn` per element; returns `true` at the **first** element that passes, else `false` | short-circuits on first match |

## Why `=== 0` and not "contains"

`indexOf(p) === 0` means "found `p`, and it's at the front." Compare:

- `"Reason: WO #: broken".indexOf("WO #: ")` → `8` (contained, but *not* at the start)
- `=== 0` correctly rejects it; a plain `indexOf(p) !== -1` ("contains anywhere") would
  wrongly accept it.

We want the prefix to *own the line*, so it must be the first thing on it.

## The scaling property (the important part)

`.some()` walks the **entire** array on its own. One `startsWithAny(line, prefixes)` call
checks 3 prefixes or 30 — you never copy the line per prefix. To cover a new field you
grow the *array* (here, by adding a `data-note-prefix` in the HTML, which
`managedPrefixes()` / `groupPrefixes()` then pick up), and this function is unchanged.

## Readable equivalent

`line.indexOf(p) === 0` is exactly what the built-in `String.prototype.startsWith` does:

```js
prefixes.some(function (p) { return line.startsWith(p); });
```

The codebase keeps the `indexOf(...) === 0` spelling for consistency with the older idiom
in `upsertNoteLine`. Either is correct; `startsWith` just states the intent in words.

> **Gotcha:** `.some()` returns a boolean, `.filter()` returns an array, `.find()` returns
> the first matching element, `.findIndex()` returns its position. Reach for `.some()` only
> when the question is a yes/no — which is what a filter predicate like this one needs.

**Rule of thumb:** to ask "does X match *any* of a set of patterns," reach for
`set.some(p => test(x, p))`. It reads like the English question and short-circuits for free.
