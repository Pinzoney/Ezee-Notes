# Subtype Menu System — How and Why

This document explains the collapsible "subtype menu" feature on the main notes
page (the area that shows Tech Support / Cx Service / FST fields once one of
the three subtype buttons is selected).

## The goal

- Three subtype buttons (`#tsCase`, `#csCase`, `#fieldST`), each with its own
  set of fields (a textbox + checkboxes).
- Nothing should be visible at all until one subtype is selected.
- Once a subtype is selected, **one shared bordered box** appears, containing
  only that subtype's fields.
- Switching between subtypes should animate smoothly (no snapping/jumping).

## The HTML structure

```html
<div class="subtypeMenuArea" id="subtypeMenuArea">       <!-- outer animator -->
  <div class="subtypeMenuArea-inner">                    <!-- outer clipper -->
    <div class="subtypeMenuArea-box">                    <!-- the visible border -->

      <div class="subtypeMenu" id="tsMenu">               <!-- per-submenu animator -->
        <div class="subtypeMenu-inner">                   <!-- per-submenu clipper -->
          <div class="subtypeMenu-content p-3">            <!-- actual padded content -->
            ... textbox / checkboxes ...
          </div>
        </div>
      </div>

      <!-- #csMenu and #ftMenu repeat the same 4-level structure -->

    </div>
  </div>
</div>
```

Each submenu (`#tsMenu`, `#csMenu`, `#ftMenu`) is **nested inside** the shared
bordered box, so they all share one border, but each animates its own
height independently based on whether its own radio button is checked.

## The CSS technique: animating to `auto` height

CSS cannot transition `height: auto` directly — browsers only animate
between two concrete values. The workaround used here is the
**CSS Grid `0fr` → `1fr` trick**:

```css
.subtypeMenu {
    display: grid;
    grid-template-rows: 0fr;             /* collapsed by default */
    transition: grid-template-rows 0.3s ease;
}

.subtypeMenu-inner {
    overflow: hidden;                    /* clips content while collapsed */
    min-height: 0;                       /* see "the min-size gotcha" below */
}
```

When the row's `fr` value transitions from `0fr` to `1fr`, the browser
animates the *track size*, which works out to roughly the element's natural
content height — giving a smooth grow/shrink animation without ever knowing
the exact pixel height in advance.

The expand/collapse is driven by the existing `:has()` pattern already used
elsewhere in this project:

```css
.col-8:has(#tsCase:checked) #tsMenu { grid-template-rows: 1fr; }
.col-8:has(#csCase:checked) #csMenu { grid-template-rows: 1fr; }
.col-8:has(#fieldST:checked) #ftMenu { grid-template-rows: 1fr; }

.col-8:has(#tsCase:checked) .subtypeMenuArea,
.col-8:has(#csCase:checked) .subtypeMenuArea,
.col-8:has(#fieldST:checked) .subtypeMenuArea {
    grid-template-rows: 1fr;
}
```

The outer `.subtypeMenuArea` expands whenever *any* subtype is checked
(so the bordered box appears at all), while each individual `.subtypeMenu`
only expands when *its own* radio is checked (so only one submenu's content
shows at a time inside that shared box).

## Two box-model gotchas this technique runs into

Both bugs below have the **same shape**: a CSS property that always renders
its own footprint (border, padding) was applied directly to the element that
is supposed to collapse to zero height. The fix in both cases is the same —
push that property one level deeper, onto a descendant *inside* the
`overflow: hidden` clipper.

### 1. Borders don't respect `grid-template-rows: 0fr`

If you put a `border` directly on the collapsing/clipping element, the
border still paints even at "zero" height — `overflow: hidden` only clips a
box's *children's* rendering, not the box's own border. That's why the
visible border lives on `.subtypeMenuArea-box`, a *child* of
`.subtypeMenuArea-inner` (the actual `overflow: hidden` element), rather than
on `.subtypeMenuArea-inner` itself or the animating `.subtypeMenuArea`.

### 2. Padding doesn't respect `grid-template-rows: 0fr` either ("the min-size gotcha")

This was the bug found after the first round of testing. `.subtypeMenu-inner`
originally had Bootstrap's `p-3` (1rem padding) applied directly to it. Even
with the grid row collapsed to `0fr`, padding is a fixed value — it can't be
shrunk to fit a 0-height box. The browser clamps the *content* area to 0 but
still renders the full padding, so a ~32px sliver (with the textbox's top
edge clipped inside it) stayed visible for every unselected submenu.

The fix: move the `p-3` off `.subtypeMenu-inner` and onto a new child wrapper
(`.subtypeMenu-content`) that lives *inside* the `overflow: hidden` element.
That way, when the grid row collapses, the entire padded content box —
padding included — is a descendant being clipped away, not part of the
clipper's own rendered box.

`min-height: 0` (added to both `*-inner` classes) is a separate, smaller fix:
by default, CSS Grid items have an implicit `min-height: auto`, meaning they
refuse to shrink below their own content's intrinsic size regardless of the
track's `0fr` sizing. Setting `min-height: 0` removes that implicit floor so
the grid item can actually reach zero height. It does **not** fix the padding
issue on its own — both fixes are needed together.

## Takeaway / rule of thumb for future collapsible elements

When building a `0fr`-collapsible region:

1. The **animating element** (`display: grid; grid-template-rows: 0fr/1fr`)
   should have no border/padding of its own.
2. Its single grid-item child (the **clipper**, `overflow: hidden`) should
   also have no border/padding, and should set `min-height: 0` to defeat the
   implicit content-based minimum size.
3. Any visible styling (border, padding, background) belongs on a further
   **content child**, nested inside the clipper.
