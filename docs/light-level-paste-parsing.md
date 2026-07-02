# Modem Light-Level Paste Button — How It Works

The "Modem LL" button (`#btnPasteOntLght`) lets a Tier 2 agent copy raw light-
level output from any of three tools, click once, and have the OLT and ONT Rx
levels land in the two fields next to it (`#oltRx`, `#ontRx`) — always the same
end result regardless of which tool the text came from. Logic lives in
[js/tsnotes.js](../js/tsnotes.js).

## The goal

- One button, three possible input formats, one consistent output.
- Extract exactly two numbers — **OLT Rx** and **ONT Rx** — and ignore
  everything else (notably Altiplano's TX line).
- Append ` dBm` units so the fields read like `-18.5 dBm`.

## Step 1 — reading the clipboard

```js
navigator.clipboard.readText().then(function (text) { ... });
```

`readText()` returns a Promise that resolves with whatever text is on the
clipboard. Two things to know:

- It only works in a **secure context** — `https://` or `localhost`. Opening
  the page as a `file://` path off disk will fail. This is fine here because
  the page is hosted on GitHub Pages (https).
- It must be triggered by a **user gesture** (the button click counts), and the
  browser may show a one-time permission prompt.

This is the read-side counterpart to the copy button's
`navigator.clipboard.writeText(...)`.

## Step 2 — detecting the format by signature

Rather than asking the user which tool they used, the parser picks each format
apart by a **distinctive substring** that only that format contains:

| Format | Signature | Example |
|---|---|---|
| SMX | `(OLT/ONT):` | `Rx Lvl dBm (OLT/ONT):-26.000/-19.208` |
| Field Tool | `OLT Rx Power:` | `OLT Rx Power: 0.0dBm` |
| Altiplano | `Measured at OLT` / `Measured at ONT` | multi-line block |

Because each signature is unique, the checks can run in any order without one
format's text accidentally matching another's pattern.

## Step 3 — the regex extraction

One number pattern is reused everywhere:

```
-?\d+(?:\.\d+)?
```

- `-?` — an optional leading minus (light levels are usually negative).
- `\d+` — one or more digits.
- `(?:\.\d+)?` — an optional `.` followed by decimals. `(?: ... )` is a
  **non-capturing group**: it groups the "dot + decimals" so `?` can make the
  whole thing optional, without creating a separate capture we'd have to skip
  over. The only capture we care about is the outer `( ... )` around the whole
  number.

### SMX — two numbers on one line

```js
text.match(/\(OLT\/ONT\):\s*(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/i)
```

`\(OLT\/ONT\):` matches the literal `(OLT/ONT):` (parentheses and slash are
escaped because they're special in regex). Then two number captures separated
by an escaped `\/`. Group 1 → OLT, group 2 → ONT.

### Field Tool — two labelled lines

```js
text.match(/OLT Rx Power:\s*(-?\d+(?:\.\d+)?)/i)
text.match(/ONT Rx Power:\s*(-?\d+(?:\.\d+)?)/i)
```

Straightforward: match the label, `\s*` to skip any spaces, capture the number.
(`0.0dBm` has no space before the unit — `\s*` allows zero spaces, so it still
matches; we capture just `0.0` and stop before `dBm`.)

### Altiplano — value on the *next* line, and the TX trap

```
RX signal Level (Measured at OLT)
-18.5 dBm
TX signal level (Measured at ONT)   <-- must be ignored
5.9 dBm
RX signal level (Measured at ONT)
-19.1 dBm
```

```js
text.match(/Measured at OLT\)\s*(-?\d+(?:\.\d+)?)/i)               // OLT
text.match(/RX signal level \(Measured at ONT\)\s*(-?\d+(?:\.\d+)?)/i) // ONT
```

Two subtleties here:

- **`\s*` bridges the newline.** In regex, `\s` matches any whitespace
  *including* line breaks. So `Measured at OLT\)\s*(number)` happily jumps from
  the label line down to the number on the following line — no manual
  line-splitting needed.
- **The `RX` prefix is load-bearing.** Both the TX and the RX lines end in
  `(Measured at ONT)`, so matching on "ONT" alone would grab the wrong number
  (the TX `5.9`). Requiring `RX signal level (Measured at ONT)` skips the TX
  line. This is exactly why the TX line is safe to leave in the copied text —
  it can't be mistaken for the value we want.

The `/i` flag on every pattern makes matching case-insensitive, which covers
the real-world inconsistency in the source (`RX signal Level` vs
`RX signal level`).

## Step 4 — filling the fields

```js
if (levels.olt != null) oltRxField.value = levels.olt + ' dBm';
if (levels.ont != null) ontRxField.value = levels.ont + ' dBm';
```

`parseLightLevels` returns `{ olt, ont }`, using `null` for anything it
couldn't find (e.g. a format that only provided one value). The `!= null`
guard — loose `!=`, which treats both `null` and `undefined` as "missing" —
means a field is only overwritten when we actually parsed a value for it,
rather than being blanked out.

## Step 5 — the per-field success/fail icon

After a paste, each field flashes a green check (`\F26A`) if a value landed in
it, or a red X (`\F623`) if not — shown *inside* the field on the right.

### You can't nest an element inside an `<input>`

`<input>` is a void/replaced element — it can't have child elements, so you
can't literally drop an `<i>` inside it. The fix is to **overlay** the icon on
top of the input using an absolutely-positioned pseudo-element on the
surrounding `.input-group` wrapper:

```css
.input-group:has(#oltRx),
.input-group:has(#ontRx) {
   position: relative;              /* anchor for the absolute icon */
}

.input-group:has(#oltRx) .form-control,
.input-group:has(#ontRx) .form-control {
   padding-right: 1.75rem;          /* reserve room so the icon never overlaps the value */
}

.input-group.paste-ok::after,
.input-group.paste-fail::after {
   position: absolute;
   right: 0.5rem;
   top: 50%;
   transform: translateY(-50%);     /* vertical centering */
   font-family: "bootstrap-icons";
   pointer-events: none;            /* clicks pass through to the input */
   z-index: 5;
}

.input-group.paste-ok::after   { content: '\F26A'; color: #198754; }
.input-group.paste-fail::after { content: '\F623'; color: #dc3545; }
```

Three details worth calling out:

- **`position: relative` on the wrapper** makes it the positioning context, so
  `right`/`top` on the `::after` are measured from the input-group's edges, not
  the page's. It's scoped with `:has()` so it only affects these two fields, not
  every `.input-group` on the page.
- **`pointer-events: none`** means the overlaid icon doesn't intercept clicks —
  the user can still click through it to focus and edit the field.
- **The glyph comes from `content` + the icon font**, the same technique
  `.btnSwitch-Res:before` already uses. `\F26A` / `\F623` are the private-use
  code points Bootstrap Icons maps its glyphs to.

### The JS just toggles a class

```js
function setFieldStatus(field, ok) {
    var group = field.closest('.input-group');
    if (!group) return;
    group.classList.remove('paste-ok', 'paste-fail');
    group.classList.add(ok ? 'paste-ok' : 'paste-fail');
    setTimeout(function () {
        group.classList.remove('paste-ok', 'paste-fail');
    }, 2500);
}
```

`field.closest('.input-group')` walks up from the input to its wrapper, so we
don't need IDs on the wrappers. We remove both state classes before adding one
(so a repeat paste can flip check↔X cleanly), then auto-clear after 2.5s so a
stale icon doesn't linger over a field the user later edits. The `ok` flag is
just `levels.olt != null` / `levels.ont != null` — check when a value was
parsed for that field, X when it wasn't (or when the clipboard read threw).

## Step 6 — the global "Paste failed" toast

The per-field X shows *which* field got no value, but there wasn't room in the
submenu for a tooltip explaining *why*. Instead, a single toast pinned to the
bottom-center of the viewport says "Paste failed" when a paste yields nothing
usable.

### Fixed positioning + a `.show` class

```css
.paste-toast {
   position: fixed;                 /* pinned to the viewport, ignores page scroll */
   left: 50%;
   bottom: 1.5rem;
   transform: translateX(-50%) translateY(1rem);  /* center horizontally, start nudged down */
   opacity: 0;
   pointer-events: none;
   transition: opacity 0.2s ease, transform 0.2s ease;
   z-index: 1080;
}

.paste-toast.show {
   opacity: 1;
   transform: translateX(-50%) translateY(0);      /* slide up into place */
}
```

- **`position: fixed`** takes the toast out of the document flow and pins it to
  the viewport, so it floats over the layout regardless of where the button is
  or how the page is scrolled.
- **`translateX(-50%)` is the horizontal-centering half** of the transform:
  `left: 50%` puts the element's *left edge* at center, and pulling back by half
  its own width recenters it. That `-50%` has to be repeated in the `.show`
  state — a `transform` fully replaces the previous one, so dropping it would
  make the toast jump to the right as it animates.
- **`opacity` + `pointer-events: none`** hide it without `display: none`, so the
  `transition` can actually animate (you can't transition to/from
  `display: none`) and the invisible toast never blocks clicks.

### Firing it only on total failure

```js
if (levels.olt == null && levels.ont == null) {
    showPasteToast('Paste failed');   // in the .then, unrecognized format
}
// ...and in the .catch, when the clipboard read itself throws
```

The toast only appears when **both** values are missing (unrecognized text) or
the clipboard read rejects — a *partial* parse is left to the per-field icons,
so the user isn't told "failed" when one value did land. `showPasteToast`
clears any pending hide-timer before setting a new one (`clearTimeout`), so
rapid repeat clicks reset the 3s countdown instead of the toast vanishing early.

## Rule of thumb / reuse

For any "paste messy text from N sources → structured fields" button:

1. **Detect by a unique signature substring**, don't ask the user the source.
2. **Reuse one well-tested number/value sub-pattern** across every format.
3. Watch for **near-duplicate labels** (the RX/TX-at-ONT trap) — anchor the
   match on whatever token actually disambiguates them.
4. Use **`\s*` to cross newlines** when a value sits on the line after its
   label, instead of splitting and indexing lines by hand.
5. Return `null` for missing pieces and **guard writes**, so a partial parse
   never clobbers a field with empty/`undefined`.
