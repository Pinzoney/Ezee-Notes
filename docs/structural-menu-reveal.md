# Structural Menu Reveal — Scaling the Collapsible Subtype Menus

How the subtype tabs open their menus **without a new CSS rule or JS function per
menu**. Adding a menu becomes: one tab + one `<div>`, both tagged with a matching
attribute. This note explains the two halves of that and *why* it isn't 100% CSS.

## The collapse mechanism (unchanged)

Each menu animates open via a grid trick: `grid-template-rows: 0fr` (closed) →
`1fr` (open), with an `overflow: hidden` inner wrapper. That part is per-element
and never conflicts between menus — every menu obeys only its own computed value.
The question this doc answers is purely: **what flips a given menu to `1fr`?**

## The old wiring — one rule per menu

The reveal used to name every tab/menu pair explicitly:

```css
.col-8:has(#tsCase:checked) #tsMenu   { grid-template-rows: 1fr; }
.col-8:has(#csCase:checked) #csMenu   { grid-template-rows: 1fr; }
.col-8:has(#fieldST:checked) #ftMenu  { grid-template-rows: 1fr; }
```

Two costs: a new menu means a new CSS rule, and the outer "area" reveal listed
every tab too. Neither scales.

## Half 1 — the OUTER area reveal is pure CSS

The wrapping `.subtypeMenuArea` should open whenever the case type is NPS **and**
*any* tab is selected. That "any tab" is expressible structurally — the tabs are
the only inputs inside `#t2SubtypeGroup`:

```css
.col-8:has(#npsCase:checked):has(#t2SubtypeGroup input:checked) .subtypeMenuArea {
   grid-template-rows: 1fr;
}
```

`:has(#t2SubtypeGroup input:checked)` = "contains a checked input somewhere inside
the tab group." A 4th tab is automatically covered — it's just another `input` in
the group. One rule, no per-tab list.

> Assumption traded for brevity: the tab group holds **only** tab radios. If you
> ever nest another checkable input in `#t2SubtypeGroup`, tighten it to
> `:has(#t2SubtypeGroup > .btn-check:checked)`.

## Half 2 — the INNER menu reveal needs a JS bridge

You cannot make the *specific* menu reveal pure-CSS here, and the reason is
structural: the tab radios live in `#t2SubtypeGroup`, but the menus live far away
in `.subtypeMenuArea`. CSS `:has()` can scope a panel to a checked control only
when they share a wrapper — and co-locating them would break either the
`btn-group` tab row (tabs must be contiguous) or the `.btn-check:checked + label`
styling (input and label must be adjacent siblings). So CSS can't *dynamically*
link a distant tab to its panel.

The bridge: let a data attribute carry the link, and let JS flip it.

```html
<!-- tab declares which menu it drives -->
<input ... id="tsCase" data-menu-target="ts">
<!-- menu declares who it is -->
<div class="subtypeMenu" id="tsMenu" data-menu="ts">
```

```css
/* one rule for every menu, present and future */
.subtypeMenu[data-open] { grid-template-rows: 1fr; }
```

```js
// In the delegated `change` listener, BEFORE the note-prefix guard (tabs have no
// data-note-prefix, so they'd be ignored otherwise).
if (el.dataset.menuTarget && el.checked) {
   document.querySelectorAll('.subtypeMenu').forEach(function (m) {
      // toggleAttribute(name, force): sets when force is truthy, removes otherwise.
      // One pass opens the match and closes every sibling.
      m.toggleAttribute('data-open', m.dataset.menu === el.dataset.menuTarget);
   });
}
```

`el.dataset.menuTarget` reads `data-menu-target` (HTML dashes → JS camelCase). The
`&& el.checked` guard matters because only the newly-selected radio fires `change`.

## Why the bridge is the right trade

The one honest cost is that the inner reveal is no longer 100% CSS. That's the
unavoidable price of the tabs-and-panels-in-separate-containers layout: you either
accept a one-line JS bridge or restructure the DOM (and lose the tab-row look). The
bridge is the lighter price, and it composes with the declarative philosophy used
elsewhere — behaviour is declared by attributes, JS just routes it.

## Adding a new subtype menu — the recipe

1. Add a tab radio with `data-menu-target="x"` (unique short key).
2. Add a `<div class="subtypeMenu" data-menu="x">…</div>` in the menu box.
3. There is no step 3. The outer area rule, the `[data-open]` rule, and the bridge
   already cover it — no new CSS, no new JS.

## The type-level accordion — the same pattern, one layer up

Each T2 **type** (NPS Case, TR Audit, Distress List) wraps *all* of its fields and
subtype menus in a `.t2TypeMenuArea` that collapses/expands with the exact same
`0fr → 1fr` grid trick — so switching types slides the old block closed and the new
one open. It reuses the **same JS bridge** as the subtype menus, just matched on a
different set of elements:

```js
// type radios carry data-menu-target; type wrappers carry data-menu
if (el.name == 'btnT2Type' && el.dataset.menuTarget && el.checked) {
   document.querySelectorAll('.t2TypeMenuArea').forEach(function (m) {
      m.toggleAttribute('data-open', m.dataset.menu === el.dataset.menuTarget);
   });
}
```

```html
<input ... id="npsCase" name="btnT2Type" data-menu-target="npsMain">
<div class="t2TypeMenuArea" id="npsTypeMenu" data-menu="npsMain">
   <div class="mainClipper-inner">        <!-- the ONE clip wrapper (see below) -->
      … all of this type's fields + subtype menus …
   </div>
</div>
```

```css
.t2TypeMenuArea[data-open] { grid-template-rows: 1fr; }
```

Two things make this work that are easy to miss:

- **One clip wrapper is mandatory.** The `0fr` trick only clips a *single* grid
  track. The type wrapper holds several sibling blocks (a number field, the tab row,
  the subtype area), so they must all sit inside **one** `overflow:hidden; min-height:0`
  child (`.mainClipper-inner`). Without it, extra children land in implicit `auto`
  rows the `0fr` never collapses, and they spill out even when "closed."
- **Never put the wrapper in the `display:none` list.** A collapse-animated element
  hides via its `0fr` height, not `display`. If it's also `display:none`, the
  `[data-open]` rule (which only touches `grid-template-rows`) can never bring it
  back — it stays invisible forever. Display-toggle hiding and collapse hiding are
  two *different* strategies; a given element uses exactly one.

### The default-selected type needs `data-open` in the HTML

The bridge fires on the `change` event only. The type that's `checked` on page load
never fires one, so it would render collapsed. Give **that one** wrapper a literal
`data-open` attribute so it starts open; the bridge removes it correctly the moment
you switch away. Non-default types get no `data-open`.

### Adding a whole new type — the recipe

1. Add the type radio (`name="btnT2Type"`) with a unique `data-menu-target="y"`.
2. Wrap that type's fields + subtype menus in
   `<div class="t2TypeMenuArea" data-menu="y"><div class="mainClipper-inner">…</div></div>`.
3. If it's the default-checked type, add `data-open` to the wrapper.
4. There is no step 4 for behaviour. The `.t2TypeMenuArea[data-open]` rule and the
   bridge already cover it. (Per-field `display` reveals like `#caseNum` still need
   their own `:has(#thisType:checked) …` rule, since those hide by display, not collapse.)

## The mental model

> The `0fr/1fr` collapse is per-element and conflict-free. Reveal *logic* is where
> duplication hides: express it **structurally** (`:has` on a container) where the
> control and target share an ancestor; **bridge it with a data attribute + JS**
> where they don't. Either way, adding a menu is adding markup — never editing the
> rule that reveals it.
