# Docs Index

Study/summary notes for Ezee-Notes, grouped by primary topic. Several notes span more
than one area — the **tags** in brackets show every area a note actually touches. When
you're hunting for "how did we implement X," scan the tags, not just the folder: a note
lives in one folder but may be exactly what you need for a different kind of feature.

## `css/` — styling & layout

- [css-class-composition.md](css/css-class-composition.md) `[CSS]` — composing utility /
  component classes; when to combine vs. add a new class.
- [directional-box-shadows.md](css/directional-box-shadows.md) `[CSS]` — one-sided /
  directional box-shadow technique.
- [tab-panel-seam-and-stacking.md](css/tab-panel-seam-and-stacking.md) `[CSS]` — fusing a
  selected tab into its panel (hiding the seam) and the z-index stacking that requires.
- [popover-positioning.md](css/popover-positioning.md) `[CSS][JS]` — Bootstrap popover
  placement, z-index stacking, and boundary containment (three independent levers).
- [subtype-menu-notes.md](css/subtype-menu-notes.md) `[CSS][HTML]` — the collapsible
  subtype menu: `grid-template-rows` accordion animation + content clipping.
- [subtype-menu-connection-and-visibility.md](css/subtype-menu-connection-and-visibility.md) `[CSS]`
  — fusing the selected button into the menu, and showing/hiding the section by case type.

## `js/` — functions & logic

- [js-file-organization.md](js/js-file-organization.md) `[JS]` — the standard role-based
  file order (constants → DOM refs → helpers → core → listeners → init).
- [note-line-anchors.md](js/note-line-anchors.md) `[JS]` — `upsertNoteLine` and the
  prefix/anchor contract: one writer for every managed note line.
- [scalable-note-controls.md](js/scalable-note-controls.md) `[JS][HTML]` — data-attributes
  + event delegation so a new button writes to the note with no new JS.
- [structural-menu-reveal.md](js/structural-menu-reveal.md) `[JS][CSS][HTML]` — the
  `data-menu-target` / `data-menu` / `data-open` bridge that scales the menu reveal, plus
  the "add a whole new type" recipe.
- [light-level-paste-parsing.md](js/light-level-paste-parsing.md) `[JS]` —
  `parseLightLevels`: pulling OLT/ONT values out of several paste formats with regex.
- [filtering-lines-on-type-switch.md](js/filtering-lines-on-type-switch.md) `[JS]` —
  dropping the previous type's fields on a type switch by deriving the managed prefixes
  from the DOM.
- [starts-with-any-idiom.md](js/starts-with-any-idiom.md) `[JS]` — reading
  `startsWithAny`: the `.some()` + starts-with pattern for "does this line match any of a
  set of prefixes?"
- [collapsing-blank-lines-on-type-switch.md](js/collapsing-blank-lines-on-type-switch.md) `[JS]`
  — why blank lines slip through marker-based filters and pile up on type switch, and the
  collapse-consecutive-blanks fix (with the `stripCaseLine` 1-vs-2 asymmetry).

## `html/` — markup & structure

- [debugging-reparented-divs.md](html/debugging-reparented-divs.md) `[HTML]` — when the
  `<div>` tags balance but the layout still breaks: finding a re-parenting bug by counting
  nesting depth or diffing against the last good commit.
