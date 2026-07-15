# The Tab→Panel Seam & the z-index Stacking Trap

Why the subtype tabs' bottom border looked "white," and the scalable fix. Two
lessons here: one about **z-index not meaning what it looks like**, and one about
**applying a style only in the state that needs it**.

## The symptom

The subtype tabs (Tech Support / Cx Service / FST) showed a **white/missing bottom
border** when no tab was selected. Recoloring `.btn-check:checked + .btnSubtype-tab`'s
`border-bottom` changed nothing — because with no tab selected that rule matches
nothing; it was a red herring. The base border computes to `1.5px #e05020` (orange)
on all four sides, so the border wasn't *white* — it was being **covered**.

## Cause 1 — the seam overlap

The panel below the tabs, `.subtypeMenuArea`, had:

```css
.subtypeMenuArea { margin-top: -1px; z-index: 10; position: relative; }
```

`margin-top: -1px` pulls the panel **up 1px so it overlaps the tab row's bottom
edge**. That overlap is deliberate — it's a *seam-merge* so an open panel fuses with
the selected tab into one continuous border instead of stacking into a 2px double
line. The bug was that it ran **unconditionally**, even when the panel was collapsed
and there was nothing to merge with — so it just sat on top of the tabs' bottom
border and hid it.

## Cause 2 — why the tabs lost the overlap (the stacking trap)

The tabs are `z-index: 20`. The panel is only `z-index: 10`. So the tabs should win
and stay on top… but they don't. The reason is the rule everyone forgets:

> **`z-index` only compares elements within the *same* stacking context.**

The tabs live inside `#npsSubtypeGroup`, which is `position: relative; z-index: 5`.
That makes the group its **own stacking context**, and the tabs' `z-index: 20` is
*trapped inside it* — it orders the tabs against each other, but it can't lift them
out of the group. To the outside world the entire group paints at level **5**.

The panel (`z-index: 10`) is a sibling at that outer level. `10 > 5`, so the panel
paints over the whole group — tabs included. A big inner `z-index` can't beat a
small outer one across a context boundary.

```
outer context
├─ #npsSubtypeGroup  z-index:5  ← this is what competes outside
│   └─ .btnSubtype-tab z-index:20  ← trapped; only orders siblings in here
└─ .subtypeMenuArea  z-index:10  ← 10 > 5, so it wins over the whole group
```

## The fix — apply the seam only when the panel is open

The overlap is only wanted while a menu is actually open. That state is already
signalled by `data-open` on the inner menu, so gate the margin with `:has()`:

```css
/* seam only while a panel is open — one rule, every type */
.subtypeMenuArea:has(.subtypeMenu[data-open]) {
   margin-top: -1px;
}
```

- **Closed:** no negative margin → no overlap → tabs keep their full orange border.
- **Open:** margin returns → panel merges with the selected tab.

It's scalable: `:has(.subtypeMenu[data-open])` reads the same open-state attribute the
JS bridge already maintains, so every current and future type is covered by this one
rule — no per-type duplication.

## The same trap again, flipped — making the *open* tab merge

Fixing the closed state exposed a second bug: when a tab *was* selected, the panel
overlapped it again (good) but the selected tab showed an orange line where it should
look borderless/merged. The merged look actually needs **two** things in the open
state, and we'd only restored one:

1. **The overlap** — the `-1px` seam pulls the panel onto the tab's bottom edge. ✅
2. **The selected tab must *win* that overlap.** Its bottom border is painted **white**
   (`.btn-check:checked + .btnSubtype-tab { border-bottom: 2px white }`) so it erases
   the panel's orange top border underneath — *but only if the tab paints on top of
   the panel.* If the panel wins, its orange top border shows through as a line.

Ingredient 2 is the **exact same stacking trap as Cause 2, just reversed.** For the
*closed* bug we needed the tab to **lose** the seam (so it wouldn't cover the panel).
For the *open* merge we need the tab to **win** it. But the tab is still trapped in
`#npsSubtypeGroup` at effective `z-index: 5`, and the panel is `10` — so the panel
wins and you see the line.

The fix is to let the group outrank the panel:

```css
#npsSubtypeGroup, #traSubtypeGroup, #disSubtypeGroup {
   position: relative;
   z-index: 13;   /* was 5 — must beat .subtypeMenuArea (10) so the selected
                     tab's white bottom border wins the seam and merges */
}
```

Safe in the closed state: the conditional rule removes the `-1px` there, so there's no
overlap to win or lose. It only bites in the open state — exactly where we want the
tab on top. And the two *unselected* tabs have orange bottom borders, so painting them
over the panel's orange top border is invisible; only the selected (white) tab visibly
merges. That's the classic connected-tab result.

## Gotcha to remember

A **0-height / transparent** element can still "cover" something via a negative
margin: it doesn't need a background to win a pixel — it just needs to overlap and
sit higher in the stack. Don't assume "nothing to paint" means "can't obscure."

## Rule of thumb

- Debugging a "wrong color" border? First confirm the border's *computed* color. If
  it's correct but looks wrong, you're looking at a **cover**, not the border.
- A style that's only meaningful in one UI state (an overlap seam, a merge, a
  connect) should be **scoped to that state** (`:has()`, `[data-open]`, `:checked`),
  not left on the base rule where it leaks into every other state.
- When `z-index` "doesn't work," check whether the element is trapped inside an
  ancestor that created its own **stacking context** (`position` + `z-index`,
  `transform`, `opacity < 1`, `filter`, `will-change`, grid/flex + `z-index`, …).
- The *same* overlap can need the *opposite* stacking in different states: here the
  tab must sit **below** the panel when closed (don't cover it) but **above** it when
  open (merge the seam). Solve each state on its own terms — don't assume one
  z-order is "correct" for the whole component.
