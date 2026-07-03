# One-Direction Box Shadows — Blur vs. Spread

This note explains how to make a `box-shadow` appear on only **one side** of
an element (e.g. the right-side shadow on `.spanLIndiv`), and why zeroing the
Y offset alone doesn't get you there.

## The four values of box-shadow

```css
box-shadow: 3px 0.2px 3px rgba(0, 0, 0, 0.308);
/*          │    │     │
            │    │     └─ blur radius  → softens + grows shadow ALL directions
            │    └─────── offset-Y     → slides shadow down (up if negative)
            └──────────── offset-X     → slides shadow right (left if negative)
                                          (4th value — spread — omitted here)  */
```

There's an optional **4th value**, the *spread radius*, that we need below:

```css
box-shadow: <offset-x> <offset-y> <blur> <spread> <color>;
```

## Why offset-Y: 0 still leaves a shadow all around

The shadow begins as an exact copy of the box. Then two independent things
happen:

1. **Offset** (values 1 & 2) *slides* that copy right/down.
2. **Blur** (value 3) *inflates* the copy outward on **every** side and
   softens its edge.

So even with `offset-Y: 0`, a `3px` blur still bleeds above and below the
element. Offset moves the shadow; blur grows it in all directions. Those two
are what fight you when you want a single-sided shadow.

## The fix: pull the shadow in with a negative spread

The spread radius grows (positive) or shrinks (negative) the shadow **before**
blur is applied. Shrink it inward by roughly the blur amount to kill the
perpendicular bleed, then let the offset push what's left out one side:

```css
/* Right-side shadow only */
box-shadow: 3px 0px 3px -2px rgba(0, 0, 0, 0.308);
/*          │   │   │    │
            │   │   │    └─ spread: -2px → shrinks shadow on all sides
            │   │   └────── blur: 3px
            │   └────────── offset-Y: 0
            └────────────── offset-X: 3px → still shoves it right          */
```

**Mechanism:** negative spread shrinks the shadow inward on every edge, which
cancels the top/bottom halo. The horizontal offset then slides the remaining
shadow out past the right edge, so only that side shows.

## The rule of thumb

> Make the **offset ≥ blur + |spread|** on the axis you want the shadow, and
> set **spread negative** (about `-1` to `-2` × blur) to cancel the
> perpendicular bleed.

If the offset is too small relative to the blur, a faint halo peeks out the
other sides — nudge the offset up or make the spread more negative until it's
clean.

## Copy-paste examples

```css
/* Right only  */  box-shadow:  4px  0    4px -3px rgba(0,0,0,0.3);
/* Left only   */  box-shadow: -4px  0    4px -3px rgba(0,0,0,0.3);
/* Bottom only */  box-shadow:  0    4px  4px -3px rgba(0,0,0,0.3);
/* Top only    */  box-shadow:  0   -4px  4px -3px rgba(0,0,0,0.3);
```

For a shadow on two adjacent sides (e.g. bottom-right), offset **both** axes
and keep the same negative spread:

```css
/* Bottom-right */ box-shadow: 4px 4px 4px -2px rgba(0,0,0,0.3);
```
