# Sharing Styles Between Classes — Composition vs. Inheritance

This note explains why buttons like `#btnPasteOntLght` use **two** classes
(`btnSwitch btnGenFunc`) instead of one, and why that's the right call in
plain CSS.

## The goal

Reuse the shared "switch button" look (flex layout, font, hover/active
colors) across several buttons, while letting some of them opt out of just
the border and min-width — without duplicating the shared styles or
accidentally breaking buttons that use the base look alone.

## The technique: base class + modifier class, combined on the element

```css
/* css/addmainnotes.css */
.btnSwitch,
.btnSwitch-Res {
   display: flex;
   align-items: center;
   justify-content: center;
   min-width: 86px;
   border: 2px red solid;
   font-family: 'Roboto Condensed';
   --bs-btn-hover-border-color: rgb(250, 204, 1);
   --bs-btn-hover-bg: rgba(250, 204, 1, 0.137);
}

.btnGenFunc {
   border: 0;
   background: transparent;
   min-width: none;
}
```

```html
<button class="btnSwitch btnGenFunc" id="btnPasteOntLght">...</button>
```

## Why it works: the cascade *is* the inheritance mechanism

Plain CSS has no `@extend`/class-inheritance like Sass does. The native way
to say "give this element class A's styles, but override two properties" is
to put **both classes on the same element** and let the cascade merge them:

- Both `.btnSwitch` and `.btnGenFunc` have equal specificity (one class
  each).
- `.btnGenFunc` is declared *later* in the stylesheet, so on the properties
  they both set (`border`, `min-width`), it wins.
- Every property `.btnGenFunc` doesn't mention (`display`, `align-items`,
  `font-family`, the `--bs-btn-*` hover variables) just falls through from
  `.btnSwitch` untouched.

So the element ends up with the full `.btnSwitch` look, minus border and
min-width, plus a transparent background — without either rule needing to
know about the other.

## The gotcha: don't fold the modifier into the base class

It's tempting to simplify by merging `.btnGenFunc`'s overrides straight into
`.btnSwitch` and dropping one class. That breaks any element that uses
`.btnSwitch` **alone**, expecting the bordered/min-width look — which
already exists elsewhere in this codebase
([trgen.html:96](../trgen.html#L96), `class="btn btnSwitch"`, no modifier).
Merging would silently strip that button's border too.

The same trap applies to `.btnSwitch-Res` — it's *also* just `.btnSwitch`
plus its own extra overrides (`font-size`, a different border color/width),
following the identical pattern.

## Rule of thumb

- One class = one concern. `.btnSwitch` = shared shape/behavior;
  `.btnGenFunc` / `.btnSwitch-Res` = a variant that overrides a couple of
  specific properties.
- Combine classes on the element (`class="base modifier"`) to compose looks
  — this is the plain-CSS equivalent of inheritance, and it's what keeps
  the base class reusable on its own elsewhere.
- Only reach for a preprocessor (`@extend`, Sass placeholders) if you need
  true inheritance semantics — not needed here since this project is
  vanilla CSS with no build step.
