// ============================================================
// Constants
// ============================================================

var REASON_PREFIX = 'Reason: ';
var LL_PREFIX = 'Light Levels (OLT/ONT): ';
var TR_TYPE_PREFIX = 'Type: ';
var TR_SUBTYPE_PREFIX = 'Subtype: ';
var CASENUM_PREFIX = 'Case #: '
var NUM_PREFIX = 'WO #: ';

// ============================================================
// DOM references & module state
// ============================================================

var t2TypeBtns = document.querySelectorAll("input[type=radio][name=btnT2Type]")
var btnRes = document.querySelector("button[type=button][name=btnRes]")
var t2TypeGroup = document.getElementById('t2TypeGroup')
var npsSubtypeGroup = document.getElementById('npsSubtypeGroup')
var caseNumField = document.getElementById('caseNum')
var woNumField = document.getElementById('woNum');
var checkboxes = document.querySelectorAll("input[type=checkbox][name=normSteps]")
var stepsTextArea = document.getElementById('tsSteps')
var butClear = document.getElementById('clrCheck');
var copyOutNote = document.getElementById('copyNote');
var genNote = document.getElementById('generatedNote');
var tsCaseBtn = document.getElementById('tsCase');
var pasteToast = document.getElementById('pasteToast');
var pasteToastTimer;

// ============================================================
// Pure helpers
// ============================================================

// ---- Note-line predicates & helpers ----

//Funtion for Case # field live update

function stripCaseLine(lines) {
   var idx = lines.findIndex(function (line) { return line.startsWith('Case #:') })
   if (idx === -1) return lines
   var start = (idx > 0 && lines[idx - 1] === '') ? idx - 1 : idx
   return lines.slice(0, start).concat(lines.slice(idx + 1))
}

function isStatusLine(line) { return line === 'Resolved' || line === 'Follow-up Needed'; }
function isReasonLine(line) { return line.indexOf(REASON_PREFIX) === 0; }
function isLightLevelLine(line) { return line.indexOf(LL_PREFIX) === 0; }
function isTrTypeLine(line) { return line.indexOf(TR_TYPE_PREFIX) === 0; }
function isTrSubtypeLine(line) { return line.indexOf(TR_SUBTYPE_PREFIX) === 0; }
function isNumLine(line) { return line.indexOf(NUM_PREFIX) === 0; }

function isTypeLine(line) {
   return [...t2TypeBtns].some(function (btn) { return btn.dataset.line === line; });
};

// Map a friendly data-note-anchor name to the predicate list upsertNoteLine
// expects. Default drops the line just under the status (Resolved) line.
function noteAnchors(name) {
   if (name === 'reason') return [isReasonLine, isStatusLine];
   if (name === 'case') return [isTypeLine];
   return [isStatusLine];
}

// Every distinct data-note-prefix currently in a note group. Queried live from
// the DOM, so controls added later join the exclusive set automatically.
function groupPrefixes(group) {
   var seen = {};
   var prefixes = [];
   document.querySelectorAll('[data-note-group="' + group + '"][data-note-prefix]').forEach(function (c) {
      var p = c.dataset.notePrefix;
      if (p && !seen[p]) { seen[p] = true; prefixes.push(p); }
   });
   return prefixes;
}

//every distinc prefix in the app, for general "template" filtering
function managedPrefixes() {
   var seen = {};
   var prefixes = [];
   document.querySelectorAll('[data-note-prefix]').forEach(function (c) {
      var p = c.dataset.notePrefix;
      if (p && !seen[p]) { seen[p] = true; prefixes.push(p); }
   });
   return prefixes
}

function startsWithAny(line, prefixes) {
   return prefixes.some(function (p) { return line.indexOf(p) === 0; })
}

// ---- Light levels ----

// Combined-line format, e.g. "-26.000 / -19.208 dBm" (N/A when a value is missing).
function formatLightLevels(levels) {
   var olt = levels.olt != null ? levels.olt : 'N/A';
   var ont = levels.ont != null ? levels.ont : 'N/A';
   return olt + ' / ' + ont + ' dBm';
}

function parseLightLevels(text) {
   // #2 SMX — "Rx Lvl dBm (OLT/ONT):-26.000/-19.208"
   var smx = text.match(/\(OLT\/ONT\):\s*(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/i);
   if (smx) return { olt: smx[1], ont: smx[2] };

   // #3 Provisioning/Field.tac "OLT Rx Power: 0.0dBm" / "ONT Rx Power: 0.0dBm"
   var ftOlt = text.match(/OLT Rx(?: Power)?:?\s*(-?\d+(?:\.\d+)?)/i);
   var ftOnt = text.match(/ONT Rx(?: Power)?:?\s*(-?\d+(?:\.\d+)?)/i);
   if (ftOlt || ftOnt) return { olt: ftOlt && ftOlt[1], ont: ftOnt && ftOnt[1] };


   /* // #1 Altiplano — Format:
RX signal Level (Measured at OLT) -15.8 dBm
TX signal level (Measured at ONT)  5.6 dBm
RX signal level (Measured at ONT) -16.5 dBm */

   var altOlt = text.match(/Measured at OLT\)\s*(-?\d+(?:\.\d+)?)/i);
   var altOnt = text.match(/RX signal level \(Measured at ONT\)\s*(-?\d+(?:\.\d+)?)/i);
   if (altOlt || altOnt) return { olt: altOlt && altOlt[1], ont: altOnt && altOnt[1] };

   return { olt: null, ont: null };
}

// ---- UI feedback ----

// Flash a check (ok) or X (fail) inside a field, then clear it after a moment.
function setFieldStatus(field, ok) {
   var group = field.closest('.input-group');
   if (!group) return;
   group.classList.remove('paste-ok', 'paste-fail');
   group.classList.add(ok ? 'paste-ok' : 'paste-fail');
   setTimeout(function () {
      group.classList.remove('paste-ok', 'paste-fail');
   }, 2500);
}

// Global toast for when a paste doesn't yield any usable levels.
function showPasteToast(message) {
   if (!pasteToast) return;
   pasteToast.textContent = message;
   pasteToast.classList.add('show');
   clearTimeout(pasteToastTimer);
   pasteToastTimer = setTimeout(function () {
      pasteToast.classList.remove('show');
   }, 3000);
};

// ---- Popover setup ----

function buildPopover(el) {
   const options = {}
   const boundaryEl = el.dataset.boundary ? document.querySelector(el.dataset.boundary) : null
   if (boundaryEl) {
      options.popperConfig = (defaultConfig) => ({
         ...defaultConfig,
         modifiers: [
            ...defaultConfig.modifiers,
            { name: 'preventOverflow', options: { boundary: boundaryEl, altAxis: true, padding: 4 } }
         ]
      })
   }
   const tpl = el.dataset.contentTemplate ? document.querySelector(el.dataset.contentTemplate) : null
   if (tpl) {
      options.content = tpl.innerHTML
      options.html = true
      options.sanitize = false
   }
   const hoverable = el.dataset.hoverable === 'true'
   if (hoverable) options.trigger = 'manual'
   const popover = new bootstrap.Popover(el, options)
   if (hoverable) makeHoverable(el, popover)
   return popover
}

function makeHoverable(el, popover) {
   let hideTimer
   const cancelHide = () => clearTimeout(hideTimer)
   const scheduleHide = () => { hideTimer = setTimeout(() => popover.hide(), 150) }

   el.addEventListener('mouseenter', () => { cancelHide(); popover.show() })
   el.addEventListener('mouseleave', scheduleHide)

   el.addEventListener('shown.bs.popover', () => {
      const tip = document.getElementById(el.getAttribute('aria-describedby'))
      if (!tip) return
      tip.addEventListener('mouseenter', cancelHide)
      tip.addEventListener('mouseleave', scheduleHide)
      const carousel = tip.querySelector('.carousel')
      if (carousel) bootstrap.Carousel.getOrCreateInstance(carousel)
   })
}

// ============================================================
// Core logic — note-line writer
// ============================================================

function upsertNoteLine(prefix, value, anchors) {
   var lines = genNote.value.split('\n');
   var existing = lines.findIndex(function (line) { return line.indexOf(prefix) === 0; });

   if (value == null) {
      if (existing !== -1) {
         lines.splice(existing, 1);
         if (lines[existing] === '') lines.splice(existing, 1);
         genNote.value = lines.join('\n');
      }
      return;
   }

   if (existing !== -1) {
      lines[existing] = prefix + value;                 // replace in place
   } else {
      var at = 0;                                        // fallback: after the type line
      for (var i = 0; i < anchors.length; i++) {
         var idx = lines.findIndex(anchors[i]);
         if (idx !== -1) { at = idx; break; }
      }
      lines.splice(at + 1, 0, '', prefix + value);
   }
   genNote.value = lines.join('\n');
}

// ============================================================
// Event listeners
// ============================================================

//t2Type Button change logic

t2TypeGroup.addEventListener('change', function (e) {
   if (e.target.name !== 'btnT2Type') return

   // On a type switch, reset every light-level input so they match the blanked note line
   document.querySelectorAll('[data-ll-role]').forEach(function (f) { f.value = '' })

   var lines = genNote.value.split('\n');
   var previousLines = [...t2TypeBtns].map(function (btn) { return btn.dataset.line })
   var mngdPrefixes = managedPrefixes();
   var filtered = stripCaseLine(lines).filter(function (line) {
      return !previousLines.includes(line)
         && !isStatusLine(line)
         && !startsWithAny(line, mngdPrefixes);
   }).map(function (line) {
      return isLightLevelLine(line) ? LL_PREFIX : line   // keep the LL line, wipe its value
   })

   if (e.target.id === 'npsCase') {
      var statusLine = btnRes.classList.contains('active') ? 'Follow-up Needed' : 'Resolved'
      filtered.splice(0, 0,
         '',
         CASENUM_PREFIX + caseNumField.value,
         statusLine,
         '',
         REASON_PREFIX,
      )
   }

   if (e.target.id === 'trAudit') {
      var subTypeChkd = document.querySelector('#traSubtypeGroup input:checked');
      var subBtnChkd = subTypeChkd && document.querySelector('.subtypeMenu[data-menu="' + subTypeChkd.dataset.menuTarget + '"] input:checked')
      filtered.splice(0, 0,
         '',
         NUM_PREFIX + woNumField.value,
         '',
         TR_TYPE_PREFIX + (subTypeChkd ? subTypeChkd.dataset.line : ''),
         TR_SUBTYPE_PREFIX + (subBtnChkd ? subBtnChkd.dataset.line : '')
      )
   }

   filtered = filtered.filter(function (line, i, arr) {
      return line !== '' || arr[i - 1] !== '';
   })

   genNote.value = e.target.dataset.line + '\n' + filtered.join('\n')
});

//case# field live update

document.querySelectorAll('.numField').forEach(function (field) {
   field.addEventListener('input', function () {
      var prefix = field.dataset.notePrefix;
      var value = field.value.trim() ? field.value : null;
      upsertNoteLine(prefix, value, noteAnchors(field.dataset.noteAnchor))
   });
});

btnRes.addEventListener('click', function () {
   setTimeout(function () {
      var isActive = btnRes.classList.contains('active')
      btnRes.textContent = isActive ? 'FU needed' : 'Resolved'

      var lines = genNote.value.split('\n')
      var updated = lines.map(function (line) {
         if (line === 'Resolved' || line === 'Follow-up Needed') {
            return isActive ? 'Follow-up Needed' : 'Resolved'
         }
         return line
      })
      genNote.value = updated.join('\n')
   }, 0)
});

btnRes.addEventListener('mouseenter', function () {
   if (!btnRes.classList.contains('active')) {
      btnRes.textContent = 'Follow-up?'
   }
})

btnRes.addEventListener('mouseleave', function () {
   btnRes.textContent = btnRes.classList.contains('active') ? 'FU needed' : 'Resolved'
});

// --- Declarative note-writing logic ------------------------------------
//   data-note-prefix="Reason: "   the line's identity (upsert replaces by it)
//   data-line="..."               the value written after the prefix
//   data-note-anchor="reason"     optional: where a NEW line is inserted
//   data-note-group="subtype"     optional: a mutually-exclusive slot. Selecting
//                                 any control in the group first clears every
//                                 OTHER prefix in it, so switching to a button
//                                 with a different prefix replaces the whole
//                                 line (prefix and all), not just its value.
// Radios replace their prefix's line on select; checkboxes add on check and
// remove on uncheck.

document.addEventListener('change', function (e) {
   var el = e.target;

   if (el.name == 'btnT2Type' && el.dataset.menuTarget && el.checked) {
      document.querySelectorAll('.t2TypeMenuArea').forEach(function (m) {
         m.toggleAttribute('data-open', m.dataset.menu === el.dataset.menuTarget);
      });
      return;
   }

   if (el.dataset.menuTarget && el.checked) {
      var scope = el.closest('.t2TypeMenuArea') || document;
      scope.querySelectorAll('.subtypeMenu').forEach(function (s) {
         s.toggleAttribute('data-open', s.dataset.menu === el.dataset.menuTarget);
      });
   }

   var prefix = el.dataset.notePrefix;
   if (!prefix) return;

   var anchors = noteAnchors(el.dataset.noteAnchor);

   if (el.type === 'checkbox') {
      upsertNoteLine(prefix, el.checked ? el.dataset.line : null, anchors);
      return;
   }

   if (!el.checked) return;

   if (el.dataset.noteGroup) {
      var groupBtns = document.querySelectorAll('input[data-note-group="' + el.dataset.noteGroup + '"]')
      groupBtns.forEach(function (r) {
         if (r.name !== el.name) {
            r.checked = false;
         }
      })
      groupPrefixes(el.dataset.noteGroup).forEach(function (p) {
         if (p !== prefix) upsertNoteLine(p, null, anchors);
      });
   }

   upsertNoteLine(prefix, el.dataset.line, anchors);
});

tsCaseBtn.addEventListener('change', function () {
   if (!tsCaseBtn.checked) return;
   if (!genNote.value.split('\n').some(isLightLevelLine)) {
      upsertNoteLine(LL_PREFIX, '', [isReasonLine, isStatusLine]);
   }
});

document.querySelectorAll('.btnPasteLght').forEach(function (btn) {
   btn.addEventListener('click', function () {
      var subBtnGroup = btn.closest('.lghtGroup');
      var oltField = subBtnGroup.querySelector('[data-ll-role="olt"]');
      var ontField = subBtnGroup.querySelector('[data-ll-role="ont"]');
      navigator.clipboard.readText()
         .then(function (text) {
            var levels = parseLightLevels(text);
            if (levels.olt != null) oltField.value = levels.olt + ' dBm';
            if (levels.ont != null) ontField.value = levels.ont + ' dBm';
            setFieldStatus(oltField, levels.olt != null);
            setFieldStatus(ontField, levels.ont != null);
            if (levels.olt == null && levels.ont == null) {
               showPasteToast('Paste failed');
            } else {
               upsertNoteLine(LL_PREFIX, formatLightLevels(levels), [isReasonLine, isStatusLine]);
            }
         })
         .catch(function (error) {
            console.error('Could not read clipboard:', error);
            setFieldStatus(oltField, false);
            setFieldStatus(ontField, false);
            showPasteToast('Paste failed');
         });
   })
})

// Copy Button logic

copyOutNote.addEventListener('click', function () {
   if (outArea.value !== '') {
      copyOutNote.disabled = true;

      var originalHTML = copyOutNote.innerHTML;

      navigator.clipboard.writeText(outArea.value)
         .then(function () {
            copyOutNote.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
            copyOutNote.classList.remove('btn-outline-secondary');
            copyOutNote.classList.add('btn-success');

            setTimeout(function () {
               copyOutNote.innerHTML = originalHTML;
               copyOutNote.classList.remove('btn-success');
               copyOutNote.classList.add('btn-outline-secondary');
               copyOutNote.disabled = false;
            }, 2000);
         })
         .catch(function (error) {

            console.error('Failed to copy:', error);

            copyOutNote.innerHTML = '<i class="bi bi-x-lg"></i> Failed';
            copyOutNote.classList.remove('btn-outline-secondary');
            copyOutNote.classList.add('btn-danger');

            setTimeout(function () {
               copyOutNote.innerHTML = originalHTML;
               copyOutNote.classList.remove('btn-danger');
               copyOutNote.classList.add('btn-outline-secondary');
               copyOutNote.disabled = false;
            }, 2000);
         });
   }
});

// ============================================================
// Init
// ============================================================

const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
const popoverList = [...popoverTriggerList].map(buildPopover)
