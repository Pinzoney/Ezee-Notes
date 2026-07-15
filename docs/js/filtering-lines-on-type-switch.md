# Filtering the Note When Switching Types — Let the DOM Own the List

> **Status: IMPLEMENTED.** Option A below is live in the `t2TypeGroup` change handler
> (`js/tsnotes.js`) — `managedPrefixes()` + `startsWithAny()` + the `!startsWithAny(...)`
> filter clause, with the new type's header prepended once at the end. This note is kept as
> the *why* behind that code.

When you switch T2 type (NPS ⇄ TR Audit ⇄ Distress), the previous type's fields
(`Case #:`, `Reason:`, `WO #:`, `Type:`, `Subtype:` …) should drop out of `genNote`,
while the universal lines (`Light Levels`, `Resolution`) stay. This note is the plan for
doing that **without** hand-maintaining a per-type list that drifts out of sync with the
HTML.

## The key insight

The two kinds of lines are already distinguishable by the HTML:

- **Type-specific fields** are each written by a control that carries a
  **`data-note-prefix`** attribute (`Case #: `, `WO #: `, `Reason: `, `Type: `,
  `Subtype: `, `Cause: `, `Issue: ` …).
- **Universal lines** are *not* control-driven — they're written programmatically
  (`LL_PREFIX` in the paste / `tsCase` handlers, `Resolution:` from the template). No
  element has `data-note-prefix="Light Levels…"` or `="Resolution: "`.

So "does this line belong to a type?" has a self-maintaining answer: **is its prefix one
of the `data-note-prefix` values present in the DOM?** Drop those; everything else
survives. No list to keep updated — add a control tomorrow and it's covered for free.

## Recommended approach (option A): derive the managed prefixes from the DOM

Same move as the existing `groupPrefixes()`, just document-wide instead of per-group.

### 1. A helper to collect every managed prefix (pure-helpers section)

```js
// Every distinct data-note-prefix declared anywhere in the app. These are the
// "type-owned" lines; anything else in the note (Light Levels, Resolution) is universal.
function managedPrefixes() {
   var seen = {};
   var prefixes = [];
   document.querySelectorAll('[data-note-prefix]').forEach(function (c) {
      var p = c.dataset.notePrefix;
      if (p && !seen[p]) { seen[p] = true; prefixes.push(p); }
   });
   return prefixes;
}

// line starts with any prefix in the list  (same shape used in upsertNoteLine)
function startsWithAny(line, prefixes) {
   return prefixes.some(function (p) { return line.indexOf(p) === 0; });
}
```

(These controls are static, so you *could* compute `managedPrefixes()` once at load and
cache it. Querying live each switch is also fine and matches how `groupPrefixes` works —
pick either; switches are rare and user-driven.)

### 2. Extend the filter in the `t2TypeGroup` change handler

The current filter keeps everything except type headers and status lines:

```js
var filtered = stripCaseLine(lines).filter(function (line) {
   return !previousLines.includes(line) && line !== 'Resolved' && line !== 'Follow-up Needed'
}).map(function (line) {
   return isLightLevelLine(line) ? LL_PREFIX : line
})
```

Add one clause — drop any line whose prefix is DOM-managed:

```js
var managed = managedPrefixes();

var filtered = stripCaseLine(lines).filter(function (line) {
   return !previousLines.includes(line)          // type headers      (already had)
       && !isStatusLine(line)                     // Resolved/FU        (already had)
       && !startsWithAny(line, managed);          // ← NEW: all type fields
}).map(function (line) {
   return isLightLevelLine(line) ? LL_PREFIX : line   // keep blanking LL, unchanged
})
```

Then the per-type scaffold (`if (e.target.id === 'trAudit') { … }`) re-adds the **new**
type's fields, and the universal lines pass through untouched.

## Why you don't need to know the *previous* type

You wipe **all** type fields, not just the outgoing type's, then let the incoming
scaffold rebuild. That sidesteps having to figure out which type you came from (the
change event only tells you the new one). Light Levels still gets blanked by the existing
`.map` (matching the `[data-ll-role]` input reset), and Resolution rides through.

## The alternatives (and why not)

- **B — explicit blocklist** (`{ npsCase: [...], trAudit: [...] }` of prefixes): dead
  simple to read, but duplicates knowledge that already lives in the HTML. It *will*
  drift the first time you add a control and forget to update the map.
- **C — rebuild the whole note from control state** on every change (treat `genNote` as a
  pure projection of the fields/selections): most robust long-term, but it's a
  rearchitecture — overkill for now.

Option A fits the data-attribute philosophy already powering `upsertNoteLine`,
`groupPrefixes`, and the menu-reveal bridge.

> **Gotcha:** this rule assumes universal lines (Light Levels, Resolution) never gain a
> `data-note-prefix` control. If you later add, say, a Resolution *button* with
> `data-note-prefix="Resolution: "`, it becomes "managed" and would start getting wiped on
> switch. If that happens, either keep Resolution control-free or add an explicit
> keep-list for the few universal prefixes.

**Rule of thumb:** when you need "the set of X the app manages," derive it from the
attributes already in the DOM instead of restating it in JS. One source of truth, zero
upkeep as the app grows.

## Tomorrow's checklist

1. Add `managedPrefixes()` and `startsWithAny()` to the pure-helpers section.
2. Add the `!startsWithAny(line, managed)` clause to the filter in the `t2TypeGroup`
   handler.
3. Test each direction: NPS → TR Audit → Distress → back, confirming old fields drop and
   Light Levels / Resolution stay.
4. Watch the one edge case: a field whose value you *wanted* to carry across a switch
   (if any) — decide whether to preserve it explicitly.
