# Scalable Button Wiring — Data Attributes + Event Delegation

How new subtype-menu buttons write to the generated note **without any new JS**.
The goal: adding a button is a pure-HTML change. This note explains the two
ideas that make that possible and why the older approach didn't scale.

## The problem with the old wiring

The first version hard-wired one specific group:

```js
// OLD — pinned to name="techSubtype", listeners attached at load
var techSubtypeBtns = document.querySelectorAll('input[name="techSubtype"]');
techSubtypeBtns.forEach(function (btn) {
   btn.addEventListener('change', function () {
      if (btn.checked) upsertNoteLine('Reason: ', btn.dataset.line, [isStatusLine]);
   });
});
```

Two things trap it:

1. **The query names one group.** A new `csSubtype`/`ftSubtype` group is
   invisible — you'd copy the query and the loop for every menu.
2. **Listeners are bound per element, at page load.** Any button added later —
   especially one built dynamically in JS — never gets a listener, so it's dead.

## Idea 1 — Declarative behaviour (the button describes itself)

Instead of JS knowing each group by name, each control **declares what it does**
through `data-` attributes. The markup is the source of truth:

```html
<input type="radio" class="btn-check" name="techSubtype"
       data-line="Outage/Hard Down" data-note-prefix="Reason: ">
```

- `data-note-prefix` — the line's **identity** in the note. `upsertNoteLine`
  finds and replaces the line by this prefix, so re-selecting the *same* prefix
  overwrites rather than stacks.
- `data-line` — the value written after the prefix.
- `data-note-anchor` (optional) — where a brand-new line gets inserted.
- `data-note-group` (optional) — a mutually-exclusive slot; see Idea 3.

To add a button anywhere, you write this HTML. That's the whole change.

## Idea 2 — Event delegation (one listener for all, present and future)

Rather than attaching a listener to each button, attach **one** to a stable
ancestor (`document`) and inspect what actually changed. This is *event
delegation* — it leans on the fact that `change` events bubble up.

```js
// js/tsnotes.js
document.addEventListener('change', function (e) {
   var el = e.target;
   var prefix = el.dataset.notePrefix;
   if (!prefix) return;                 // ignore controls that aren't note-writers

   var anchors = noteAnchors(el.dataset.noteAnchor);

   if (el.type === 'checkbox') {
      upsertNoteLine(prefix, el.checked ? el.dataset.line : null, anchors);
   } else if (el.checked) {             // radio
      upsertNoteLine(prefix, el.dataset.line, anchors);
   }
});

function noteAnchors(name) {
   if (name === 'reason') return [isReasonLine, isStatusLine];
   return [isStatusLine];               // default: just under the status line
}
```

The `if (!prefix) return` guard is what keeps this safe: the listener sees
*every* `change` on the page (the T2-type radios, checkboxes, etc.), but only
acts on controls that opted in with `data-note-prefix`.

### Why delegation is the key to "scalable in the future"

A per-element listener can only bind to elements that **exist at bind time**. A
delegated listener on `document` handles elements that don't exist yet — so
buttons you generate at runtime work automatically, with zero extra wiring.
That single property is what turns "add a feature" into "add some HTML".

## Idea 3 — Mutually-exclusive groups (one line, swappable prefix)

Sometimes several controls should share **one slot** in the note — but each
writes a *different prefix*. Selecting Tech Support might write
`Reason: Outage/Hard Down`; switching to a Cx Service button should **remove
that whole line**, prefix and all, and replace it with `Cx Reason: Billing`.

`upsertNoteLine` alone can't do that: it matches lines by prefix, so a new,
different prefix wouldn't find the old line — you'd end up with two lines. The
missing piece is a way to say "these prefixes all compete for the same slot."

That's `data-note-group`. Controls sharing a group value form a mutually
exclusive set. When one is selected, the engine first **clears every *other*
prefix in the group**, then writes its own:

```js
if (el.dataset.noteGroup) {
   groupPrefixes(el.dataset.noteGroup).forEach(function (p) {
      if (p !== prefix) upsertNoteLine(p, null, anchors);  // remove siblings
   });
}
upsertNoteLine(prefix, el.dataset.line, anchors);           // write mine
```

The trick that keeps it scalable is **not** hand-maintaining a list of prefixes.
The group's members are discovered **live from the DOM** at click time:

```js
// Every distinct data-note-prefix currently tagged with this group.
function groupPrefixes(group) {
   var seen = {};
   var prefixes = [];
   document.querySelectorAll('[data-note-group="' + group + '"][data-note-prefix]')
      .forEach(function (c) {
         var p = c.dataset.notePrefix;
         if (p && !seen[p]) { seen[p] = true; prefixes.push(p); }
      });
   return prefixes;
}
```

So a new menu with a new prefix joins the exclusive set the instant its HTML
exists — nothing to register. Same philosophy as delegation: **the DOM is the
source of truth, queried on demand**, never a list you have to keep in sync.

> Prefixes that are *equal* within a group are already handled by
> `upsertNoteLine` (replace-in-place). The group only matters when the prefixes
> *differ* and you still want just one line.

## How the ideas combine with `upsertNoteLine`

Nothing here re-implements note logic. The engine just routes to the existing
[`upsertNoteLine`](note-line-anchors.md) helper and the `isStatusLine` /
`isReasonLine` predicates:

| Control type | On check | On uncheck |
| --- | --- | --- |
| Radio | writes/replaces its prefix's line | (radios don't uncheck) |
| Checkbox | writes its prefix's line | removes it (`value = null`) |

Radios that share a prefix within a group naturally replace each other's line
(same prefix → `upsertNoteLine` replaces in place). Give a group its own prefix
and it writes its own independent line.

## Adding a new subtype menu — the recipe

1. Add the radio/checkbox controls in the submenu markup.
2. On each, set `data-line="..."` and `data-note-prefix="..."`.
3. To make all subtype menus share **one swappable line**, add
   `data-note-group="subtype"` to each (a different prefix per menu; the group
   makes switching menus replace the whole line — Idea 3).
4. (Optional) `data-note-anchor="reason"` to place a new line under the Reason
   line instead of the status line.
5. There is no step 5. No JS.

**Two ways to share one line:**

- **Same prefix, no group** — every button writes `Reason: …`; selecting a new
  one replaces the value. Simplest, but the label is always "Reason".
- **Different prefixes, same `data-note-group`** — each menu has its own label
  (`Reason: `, `Cx Reason: `, …) and the group guarantees only one exists at a
  time. Use this when the prefix itself should change per subtype.

## What deliberately stays special-cased

The `tsCase` "Tech Support" tab drops an **empty** Light-Levels placeholder on
select (a different action — seed a blank line for a later paste to fill, not
write a `data-line`). That keeps its own small handler rather than being forced
into the declarative path. Not every behaviour should be generalised; this one
is genuinely different in kind.
