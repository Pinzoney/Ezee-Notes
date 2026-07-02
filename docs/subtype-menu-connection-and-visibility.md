# Subtype Menu — Seamless Connection & Conditional Visibility

Follow-up to [subtype-menu-notes.md](subtype-menu-notes.md). That doc covers
how the menu animates open/closed and clips its content. This one covers two
things added afterward: making the selected button visually fuse with the
menu below it, and making the whole subtype section appear/disappear based
on which top-level case type is selected.

## 1. Making the selected button "flow into" the menu border

### The goal

When a subtype button (Tech Support / Cx Service / FST) is selected, its
bottom edge should look like it merges directly into the menu box below it —
no visible double border line at the seam.

### The technique: overlap + repaint, not removal

```css
.subtypeMenuArea {
    margin-top: -1px;   /* pulls the menu up by exactly one border-width */
    position: relative;
    z-index: 1;
}

#t2SubtypeGroup {
    position: relative;
    z-index: 2;
}

.btn-check:checked + .btnSubtype {
    border-bottom: 2px white solid;
}
```

Three separate ideas combine here:

- **`margin-top: -1px`** overlaps the menu's top border directly on top of
  the button row's bottom border, collapsing what would otherwise be two
  adjacent 1px lines into one shared pixel row.
- **Stacking order** (`position: relative` + `z-index`) decides *which*
  element's border wins that shared pixel row. Plain, non-positioned
  elements paint in DOM order by default — since the menu comes after the
  button group in the HTML, it would normally paint on top, burying the
  button's edge. Giving the button group a higher `z-index` than the menu
  flips that, so the button visually sits above the seam.
- **Recoloring instead of deleting the border** (`.btn-check:checked + .btnSubtype { border-bottom: 2px white solid; }`)
  keeps the button's box size stable — no layout jump — while making that
  edge invisible against the (white) page background, so it reads as "no
  border" without actually being zero-width.

### Why `.btn-check:checked + .btnSubtype`, not `.btnSubtype.active`

The first attempt used a `.active` class selector. That never matched: these
are native radio `.btn-check` toggle buttons (no `data-bs-toggle="button"`),
so Bootstrap never adds an `.active` class to them via JS — the only source
of truth for "is this one selected" is the `:checked` state on the sibling
`<input>`. This project already follows that pattern everywhere else (e.g.
`.col-8:has(#tsCase:checked) #tsMenu {...}`), so `.btn-check:checked + .btn...`
is the selector that's actually consistent with how every other piece of
conditional styling here works.

### Why this didn't need `!important`

`.btn-check:checked + .btnSubtype` has higher specificity than the base
`.btnSubtype` rule (two classes + a pseudo-class vs. one class), so it wins
the cascade on its own. `!important` is only needed when you can't win on
specificity or source order — reach for a more specific selector first.

### Best use case for this pattern

Any "tab-like" UI where a row of toggle controls sits directly above a
content panel and you want the selected control to look structurally joined
to its panel (classic example: Bootstrap's own `nav-tabs` + `tab-content`).
Reusable recipe:

1. Overlap the shared border by exactly its width (`margin-top: -<width>`).
2. Make the control row a positioned element with a higher `z-index` than
   the panel, so its border paints on top of the seam.
3. On the *selected* control only, recolor (don't remove) the border edge
   touching the panel so it matches the shared background.

## 2. Gating visibility behind multiple independent conditions

### The goal

- The subtype buttons and their menu should only exist at all when
  `#npsCase` (the NPS Case type) is selected — picking TR Audit or T2 Chat
  should make the whole subtype section disappear.
- Switching back to NPS Case should restore whatever subtype was previously
  selected, without needing JavaScript to remember/restore state.

### The technique: chaining `:has()` to AND conditions together

```css
.caseNumField,
#btnRes,
#t2SubtypeGroup {
    display: none;
}

.col-8:has(#npsCase:checked) #t2SubtypeGroup {
    display: inline-flex;
}

.col-8:has(#npsCase:checked):has(#tsCase:checked) .subtypeMenuArea,
.col-8:has(#npsCase:checked):has(#csCase:checked) .subtypeMenuArea,
.col-8:has(#npsCase:checked):has(#fieldST:checked) .subtypeMenuArea {
    grid-template-rows: 1fr;
}
```

Each `:has(...)` is evaluated independently against `.col-8`'s descendants.
Chaining several of them onto the same selector (`:has(A):has(B)`) means
**both** must be true for the rule to match — it behaves like a logical AND
across otherwise-unrelated checkboxes/radios anywhere in the subtree, with
no JavaScript and no need for the two inputs to be related in the DOM.

### Why the inner `#tsMenu` / `#csMenu` / `#ftMenu` rules didn't need the same gate

Those rules only control which *individual* submenu is expanded once
`.subtypeMenuArea` (the outer box) is already open. Since `.subtypeMenuArea`
itself collapses to `0fr` whenever NPS Case isn't selected, everything inside
it is already hidden as a side effect — there's no visible difference
whether the inner rows think they're "open" or not while their container has
zero height. Only gate the outermost element that actually needs to change
behavior; let collapsed ancestors hide their descendants for free.

### Why no JavaScript reset was needed for "reappearing" state

The subtype radio buttons' `:checked` state is native browser state — it
doesn't get cleared just because a *different* radio group (`btnT2Type`)
changes. Switching to TR Audit and back to NPS Case never touches
`btnSubtype`'s radios at all, so whichever one was checked before is still
checked after, and the `:has()` rules re-evaluate live and immediately show
the right menu again. This is a general advantage of state-via-`:checked` +
`:has()` over state-via-JS-classes: the browser keeps it consistent for you.

### Best use case for this pattern

Any UI element whose visibility legitimately depends on **two or more**
independent toggle/radio controls at once (e.g., "only show field X if
category A *and* sub-option B are both selected"). Chaining `:has()` keeps
that logic declarative and centralized in CSS instead of needing a JS
`change` listener that manually toggles a class based on combined state.
