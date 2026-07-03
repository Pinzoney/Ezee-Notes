# Positioning Popovers — Placement, Stacking, and Boundaries

This note ties together three separate things that all affect *where* a
Bootstrap popover lands and *what it sits on top of*. They're easy to confuse
because a misbehaving popover "looks like one bug" but is usually one of these
three independent levers. The running example is the `?` help icon
(`bi bi-question-circle`) next to **Modem LL** in `index.html`.

The three levers:

1. **Placement** — which side of the trigger it opens on, and how it aligns.
2. **Stacking (z-index)** — whether it paints *over* or *under* other elements.
3. **Boundary** — a wall it isn't allowed to cross.

---

## 0. First: the two-line init that powers all popovers

Bootstrap does **not** auto-start popovers. Something has to construct them:

```js
// js/tsnotes.js
const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
const popoverList = [...popoverTriggerList].map(el => new bootstrap.Popover(el /* , options */))
```

Two gotchas learned the hard way:

- **A syntax error anywhere in the file kills this.** `new.bootstrap.Popover`
  (a period instead of a space) is a *parse-time* `SyntaxError`, so the whole
  file refuses to run and **no** popovers initialize — even though the init
  line itself is fine. Check DevTools → Console for a red error.
- **Don't initialize the same element twice.** Bootstrap stores one instance
  per element, so a second `new bootstrap.Popover(sameEl, ...)` *overwrites*
  the first. Whichever runs last wins — which means options on the earlier
  instance are silently ignored. Keep one init path per element.

---

## 1. Placement — `bottom` is "bottom + centered"

```html
<i data-bs-toggle="popover" data-bs-placement="bottom" ...></i>
```

`data-bs-placement="bottom"` does **not** mean "straight down." It means
**bottom edge + horizontally centered** on the trigger. So half the popover's
width extends to the *left* of the icon. If the icon is near the left of the
content, that left half spills toward the sidemenu.

```
   placement: "bottom"           placement: "bottom-start"
        [icon]                         [icon]
     ┌──────────┐                      ┌──────────┐
     │ popover  │                      │ popover   │
     └──────────┘                      └──────────┘
     centered (spills left)            left edge pinned, grows right
```

To pin the popover's **left edge to the icon** and grow rightward, you want
Popper's `bottom-start` alignment. **Catch:** Bootstrap's own `placement`
option only accepts `top` / `bottom` / `left` / `right` / `auto` — the
`-start` / `-end` variants are a Popper feature, so `data-bs-placement="bottom-start"`
silently fails. You reach it through `popperConfig` (see §3).

---

## 2. Stacking — why the popover paints over the sidemenu

A Bootstrap popover ships with a **default `z-index` of 1070**, set via a CSS
variable on the class:

```css
.popover { --bs-popover-zindex: 1070; }
```

Our `.sidemenu` was `z-index: 5`. 1070 ≫ 5, so the popover always painted on
top. To keep the sidemenu above the popover, its z-index has to *beat* 1070:

```css
.sidemenu { z-index: 1075; }   /* was 5 */
```

### The stacking-context catch (the part that bites later)

`z-index` only compares elements **within the same stacking context**. It is
not a global ranking — a `z-index: 9999` trapped inside a low context can lose
to a `z-index: 1` element in a higher one. A plain numeric bump works here only
because `.sidemenu` and the popover both resolve against the **root** context
(`.mainrow`, their shared ancestor, is `position: static` and creates no
context).

An element creates a **new stacking context** — trapping its descendants — when
it has any of:

- `position: relative | absolute` **with** a `z-index` value (not `auto`)
- `position: fixed | sticky`
- a `transform`, `filter`, `perspective`, `clip-path`, or `mask`
- `opacity` less than `1`
- `will-change` naming any of the above
- `isolation: isolate`

> If the z-index trick ever mysteriously stops working, it's almost always
> because a *wrapper* around one of the elements gained one of these
> properties and formed a new context.

---

## 3. Boundary — a hard wall the popover can't cross

Placement (`bottom-start`) *aligns* the popover but doesn't stop it crossing a
specific edge. For a true wall, use Popper's **`preventOverflow`** modifier,
pointed at a boundary element. We use `.mainnotes`, whose **left edge is the
sidemenu's right border**, so "stay inside `.mainnotes`" == "don't enter the
sidemenu."

```js
// js/tsnotes.js — opt-in via data-boundary="<selector>" on the trigger
const boundary = el.dataset.boundary ? document.querySelector(el.dataset.boundary) : null

new bootstrap.Popover(el, boundary ? {
   popperConfig(defaultConfig) {
      return {
         ...defaultConfig,
         modifiers: [
            ...defaultConfig.modifiers,
            { name: 'preventOverflow', options: { boundary, altAxis: true, padding: 4 } }
         ]
      }
   }
} : {})
```

```html
<i data-bs-toggle="popover" data-bs-placement="bottom" data-boundary=".mainnotes" ...></i>
```

Why each option matters:

- **`boundary`** — the element the popover isn't allowed to leave. Its edge is
  the wall.
- **`altAxis: true`** — *the setting everyone misses.* For a `bottom`
  placement, Popper's **main** axis is vertical; horizontal shoving is the
  **alt (cross)** axis, and it's **off by default**. Without this, the boundary
  is ignored horizontally and the popover still spills left. Turning it on lets
  Popper slide the popover **right** to stay inside the wall.
- **`padding: 4`** — a small gap so it doesn't touch the border.

`popperConfig(defaultConfig => …)` hands you the config Bootstrap already built;
you spread it and append your modifier. Appending a same-named modifier
(`preventOverflow`) **merges** with Bootstrap's by name — later options win — so
you're tweaking the existing one, not adding a duplicate.

The result: the popover opens centered under the icon, but the instant
centering would push its left edge past the sidemenu, it slides right instead.
The arrow keeps pointing at the icon.

---

## 4. Rich content — a carousel inside the popover

Putting real HTML (like a crossfade carousel) inside a popover hits three
separate traps. Miss any one and it fails silently.

### Trap A — content gets escaped

By default a popover treats content as **text**, so your markup shows up as
literal `<div>…`. You need `html: true`. We keep the markup in an inert
`<template>` and hand its `innerHTML` to the popover:

```html
<template id="popCarouselTemplate">
   <div id="popCarousel" class="carousel slide carousel-fade" data-bs-ride="carousel">…</div>
</template>
```

```js
options.content = document.querySelector('#popCarouselTemplate').innerHTML
options.html = true
```

> **Why a `<template>`?** Its contents are inert and *not* part of the live
> document, so the `id="popCarousel"` inside it doesn't collide with the copy
> Bootstrap injects into the popover. Without the template you'd have two
> elements sharing one `id`.

### Trap B — the sanitizer eats the carousel

This is the sneaky one. Bootstrap **sanitizes** popover HTML by default, and its
allowlist does **not** include `data-bs-ride`, `data-bs-target`, or
`data-bs-slide`. So the markup renders, but the carousel's wiring is stripped
and the controls do nothing. Fix:

```js
options.sanitize = false
```

Only do this with **your own static markup** — never with anything a user could
supply, since it disables XSS protection.

### Trap C — injected components don't auto-start

Bootstrap's data API only auto-inits components present **at page load**. The
carousel is injected later, when the popover opens, so `data-bs-ride` never
fires on its own. Start it in the `shown.bs.popover` handler:

```js
const carousel = tip.querySelector('.carousel')
if (carousel) bootstrap.Carousel.getOrCreateInstance(carousel)
```

(`carousel-fade` is the class that makes it *cross*fade instead of slide.)

### Trap D — the popover width jumps during the crossfade

Symptom: every time the carousel changes slides, the popover briefly gets
wider, then snaps back.

Cause: a popover **hugs its content** (shrink-to-fit), so it has no width of its
own — it measures its content and sizes to that. A `.carousel-item` is
`width: 100%`, which normally resolves against a full-width parent. Inside a
shrink-to-fit popover there's no fixed width to resolve against, so the browser
sizes the popover to the *preferred width of the content*. During a crossfade
Bootstrap sets **both** the outgoing and incoming slides to `display: block`,
so for the length of the transition two slides feed into that measurement and
the popover grows — then shrinks back when the old slide returns to
`display: none`.

Fix: give the carousel a **definite width** so `width: 100%` resolves against a
fixed number instead of the content:

```css
#popCarousel { width: 240px; }
```

> Gotcha: an `<img class="w-100">` is *also* `width: 100%` — the same circular
> reference. Anchoring needs a real fixed width somewhere in the chain (the
> carousel, the popover body, or an image with an explicit/intrinsic width).

This is the same lesson as the sizing behaviour generally: **anything that
hugs its content needs a fixed dimension somewhere if its content can change
size at runtime**, or it will re-measure and jump.

## 5. Keeping a hover popover open (so you can use its content)

`trigger: "hover"` only watches the **trigger icon** — the moment the cursor
leaves it to reach the carousel, the popover hides. Interactive content is
therefore impossible with plain hover.

The fix is to drive it manually and treat *trigger + popover* as one hover zone:

```js
options.trigger = 'manual'          // we control show/hide
// open on trigger hover:
el.addEventListener('mouseenter', () => { cancelHide(); popover.show() })
el.addEventListener('mouseleave', scheduleHide)   // hide after a short delay
// keep open while over the popover tip:
el.addEventListener('shown.bs.popover', () => {
   const tip = document.getElementById(el.getAttribute('aria-describedby'))
   tip.addEventListener('mouseenter', cancelHide)  // cancels the pending hide
   tip.addEventListener('mouseleave', scheduleHide)
})
```

The key ideas:

- **The short hide *delay* is what bridges the gap.** `mouseleave` on the icon
  doesn't hide immediately — it schedules a hide ~150 ms out. If the cursor
  lands on the popover in that window, `mouseenter` on the tip cancels it. That
  tiny grace period is what lets you cross the empty space between the two.
- **Find the tip via `aria-describedby`.** When shown, Bootstrap sets that
  attribute on the trigger to the live popover's `id` — the stable, public way
  to grab the popover element (don't rely on the private `.tip` property).
- **Accessibility note:** hover-only popovers aren't keyboard/touch friendly.
  For anything essential, consider a `click` trigger instead.

---

## Quick decision guide

| You want… | Reach for | Where |
| --- | --- | --- |
| Open on a different side | `data-bs-placement="top\|bottom\|left\|right"` | HTML |
| Pin left edge to trigger, grow right | Popper `placement: "bottom-start"` | `popperConfig` (JS) |
| Popover to go *behind* something | raise that element's `z-index` above 1070 (mind stacking contexts) | CSS |
| A wall it can't cross | `preventOverflow` `{ boundary, altAxis: true }` | `popperConfig` (JS) |
| Put HTML/a carousel inside | `html: true` + `sanitize: false` + init on `shown` | JS |
| Keep it open while hovered | `trigger: "manual"` + hide-delay + tip listeners | JS |

**Rule of thumb:** placement decides *where it prefers to be*; boundary decides
*where it's forbidden to go*; z-index decides *what it covers*. They're three
separate knobs — reach for the one that matches the symptom.
