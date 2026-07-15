# Note-Line Upsert & Anchors — One Writer for Every Line

How a single function, `upsertNoteLine(prefix, value, anchors)`, keeps every managed
line in the generated note (Reason, Cause, Light Levels, Case #, WO #, …) correct
**without bespoke split/filter/splice code per line**. Adding a new line-writer
becomes: one data-attribute in the HTML, zero new sync logic. This note explains the
`prefix`/`value`/`anchors` contract and — the part that trips people up — how anchors
decide *where a brand-new line lands*.

## The identity of a line is its `prefix`

Every managed line is `prefix + value`, e.g. `"Case #: " + "12345"`. The **prefix** is
the line's identity: `upsertNoteLine` finds the line by
`lines.findIndex(l => l.indexOf(prefix) === 0)` (starts-with). That single idea gives
three behaviours for free:

- **Update** — prefix already present → replace the value in place, position untouched.
- **Insert** — prefix absent → add it (anchors decide where; see below).
- **Remove** — `value == null` → delete the line (and a trailing blank if it leaves one).

A live text field wires straight into this: on `input`, pass `field.value` as the
value, or `null` when the field is empty, and the same function updates/creates/removes
the line as you type.

## Anchors only matter on **insert**

This is the key mental model. When the line already exists it's replaced in place, so
anchors are never consulted. Anchors answer exactly one question: **"the first time
this line appears, where does it go?"**

An anchor is a **predicate** — a function `(line) => boolean`. `anchors` is an *ordered
list* of them. Insertion logic:

```js
var at = 0;                                 // fallback: after line 0 (the type header)
for (var i = 0; i < anchors.length; i++) {
   var idx = lines.findIndex(anchors[i]);   // first line matching this predicate
   if (idx !== -1) { at = idx; break; }     // stop at the FIRST anchor that hits
}
lines.splice(at + 1, 0, '', prefix + value); // insert a blank + the line, AFTER it
```

Two consequences worth memorising:

1. **Order = priority with fallbacks.** `noteAnchors('reason')` returns
   `[isReasonLine, isStatusLine]` = *"sit after the Reason line if one exists, else
   after the status line."* That ordered list is how Light Levels reliably stacks
   **below** Reason.
2. **Insertion is always _after_ an anchor** (`at + 1`), never before. To place a line
   *above* something, anchor on whatever sits **above** it. That's why Case # anchors on
   the **type header** (`isTypeLine`) — inserting after the header puts it above
   `Resolved`.

## `isTypeLine` — anchoring to the top

```js
function isTypeLine(line) {
   return [...t2TypeBtns].some(btn => btn.dataset.line === line);
}
```

It returns true only when `line` exactly equals one type button's `data-line`
(`"T2 NPS Case Review"`, etc.) — i.e. "is this the header at the top of the note?"
`upsertNoteLine` then inserts right after it.

> **Gotcha:** this depends on every type button having a **non-empty** `data-line`.
> If one were `data-line=""`, `isTypeLine("")` is true and `findIndex` would match the
> first **blank** line in the note, dropping the new line in the wrong place. Keep type
> `data-line`s non-empty and unique.

## Adding a new managed line

1. **HTML** — mark the control: `data-note-prefix="WO #: "` (its identity) and, for a
   live field, the `numField` class. Optionally `data-note-anchor="case"` to steer
   placement.
2. **Placement** — if the default (after the status line) isn't right, add a case to
   `noteAnchors` returning the ordered predicate list you want.
3. **JS** — nothing, if it's a radio/checkbox (the global `change` listener already
   dispatches by `data-note-prefix`) or a `numField` (the shared `input` listener does).

**Rule of thumb:** don't hand-roll split/filter/splice for a new line. Give it a
`prefix`, decide its anchor, and let `upsertNoteLine` own update/insert/remove.
