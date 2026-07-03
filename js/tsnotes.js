const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
const popoverList = [...popoverTriggerList].map(buildPopover)
var t2TypeBtns = document.querySelectorAll("input[type=radio][name=btnT2Type]")
var btnRes = document.querySelector("button[type=button][name=btnRes]")
var t2TypeGroup = document.getElementById('t2TypeGroup')
var t2SubtypeGroup = document.getElementById('t2SubtypeGroup')
var caseNumField = document.getElementById('caseNum')
var checkboxes = document.querySelectorAll("input[type=checkbox][name=normSteps]")
var stepsTextArea = document.getElementById('tsSteps')
var butClear = document.getElementById('clrCheck');
var copyOutNote = document.getElementById('copyNote');
var genNote = document.getElementById('generatedNote');
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

//Funtion for Case # field live update

function stripCaseLine(lines) {
   var idx = lines.findIndex(function (line) { return line.startsWith('Case #:') })
   if (idx === -1) return lines
   var start = (idx > 0 && lines[idx - 1] === '') ? idx - 1 : idx
   return lines.slice(0, start).concat(lines.slice(idx + 1))
}

//t2Type Button change logic

t2TypeGroup.addEventListener('change', function (e) {
   if (e.target.name !== 'btnT2Type') return

   var lines = genNote.value.split('\n');
   var previousLines = [...t2TypeBtns].map(function (btn) { return btn.dataset.line })
   var filtered = stripCaseLine(lines).filter(function (line) {
      return !previousLines.includes(line) && line !== 'Resolved' && line !== 'Follow-up Needed'
   })

   if (e.target.id === 'npsCase') {
      var statusLine = btnRes.classList.contains('active') ? 'Follow-up Needed' : 'Resolved'
      filtered.splice(0, 0, '', 'Case #: ' + caseNumField.value, statusLine)
   }

   genNote.value = e.target.dataset.line + '\n' + filtered.join('\n')
});

//case# field live update

caseNumField.addEventListener('input', function () {
   var dataLine = document.getElementById('npsCase').dataset.line
   var lines = genNote.value.split('\n')
   var previousLines = [...t2TypeBtns].map(function (btn) { return btn.dataset.line })
   var filtered = stripCaseLine(lines).filter(function (line) {
      return !previousLines.includes(line)
   })
   filtered.splice(0, 0, '', 'Case #: ' + caseNumField.value)
   genNote.value = dataLine + '\n' + filtered.join('\n')
})

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


// --- "Sticky" note lines: Reason (tech subtype) + Modem light levels ---
// Both sit just under the status line (Resolved / Follow-up Needed). They're
// rebuild-safe because the t2Type/caseNum handlers above keep any line they
// don't recognise, so we don't have to re-add them on every rebuild — we just
// upsert them here when their source changes.

var techSubtypeBtns = document.querySelectorAll('input[name="techSubtype"]');
var REASON_PREFIX = 'Reason: ';
var LL_PREFIX = 'Light Levels (OLT/ONT): ';

function isStatusLine(line) { return line === 'Resolved' || line === 'Follow-up Needed'; }
function isReasonLine(line) { return line.indexOf(REASON_PREFIX) === 0; }
function isLightLevelLine(line) { return line.indexOf(LL_PREFIX) === 0; }

// Insert / replace / remove a single line identified by its prefix. A new line
// is dropped right after the first anchor predicate that matches (anchors are
// tried in order); if it already exists it's replaced in place. A null value
// removes the line; an empty string ('') leaves just the prefix as a
// fill-me-in placeholder. Falls back to under the T2 type line if no anchor hits.
function upsertNoteLine(prefix, value, anchors) {
   var lines = genNote.value.split('\n');
   var existing = lines.findIndex(function (line) { return line.indexOf(prefix) === 0; });

   if (value == null) {
      if (existing !== -1) { lines.splice(existing, 1); genNote.value = lines.join('\n'); }
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
      lines.splice(at + 1, 0, prefix + value);
   }
   genNote.value = lines.join('\n');
}

// Picking a tech subtype sets/updates the "Reason:" line under the status line.
techSubtypeBtns.forEach(function (btn) {
   btn.addEventListener('change', function () {
      if (btn.checked) upsertNoteLine(REASON_PREFIX, btn.dataset.line, [isStatusLine]);
   });
});

// Picking "Tech Support" drops an EMPTY Light Levels placeholder into the note;
// a later paste finds it by prefix and fills in the values (same upsert path).
// Only added when one isn't already present, so returning to the subtype won't
// wipe values that were already pasted.
var tsCaseBtn = document.getElementById('tsCase');
tsCaseBtn.addEventListener('change', function () {
   if (!tsCaseBtn.checked) return;
   if (!genNote.value.split('\n').some(isLightLevelLine)) {
      upsertNoteLine(LL_PREFIX, '', [isReasonLine, isStatusLine]);
   }
});

// Combined-line format, e.g. "-26.000 / -19.208 dBm" (N/A when a value is missing).
function formatLightLevels(levels) {
   var olt = levels.olt != null ? levels.olt : 'N/A';
   var ont = levels.ont != null ? levels.ont : 'N/A';
   return olt + ' / ' + ont + ' dBm';
}

// Modem light-level paste: read the clipboard, detect which of the 3 tool
// formats it is, and drop the OLT/ONT Rx levels into their fields.

var btnPasteOntLght = document.getElementById('btnPasteOntLght');
var oltRxField = document.getElementById('oltRx');
var ontRxField = document.getElementById('ontRx');

function parseLightLevels(text) {
   // #2 SMX — "Rx Lvl dBm (OLT/ONT):-26.000/-19.208"
   var smx = text.match(/\(OLT\/ONT\):\s*(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/i);
   if (smx) return { olt: smx[1], ont: smx[2] };

   // #3 Provisioning/Field Tool — "OLT Rx Power: 0.0dBm" / "ONT Rx Power: 0.0dBm"
   var ftOlt = text.match(/OLT Rx Power:\s*(-?\d+(?:\.\d+)?)/i);
   var ftOnt = text.match(/ONT Rx Power:\s*(-?\d+(?:\.\d+)?)/i);
   if (ftOlt || ftOnt) return { olt: ftOlt && ftOlt[1], ont: ftOnt && ftOnt[1] };

   // #1 Altiplano — value sits on the line after each label; the "RX" in the
   // ONT pattern is what excludes the TX line we intentionally leave copied.
   var altOlt = text.match(/Measured at OLT\)\s*(-?\d+(?:\.\d+)?)/i);
   var altOnt = text.match(/RX signal level \(Measured at ONT\)\s*(-?\d+(?:\.\d+)?)/i);
   if (altOlt || altOnt) return { olt: altOlt && altOlt[1], ont: altOnt && altOnt[1] };

   return { olt: null, ont: null };
}

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
var pasteToast = document.getElementById('pasteToast');
var pasteToastTimer;

function showPasteToast(message) {
   if (!pasteToast) return;
   pasteToast.textContent = message;
   pasteToast.classList.add('show');
   clearTimeout(pasteToastTimer);
   pasteToastTimer = setTimeout(function () {
      pasteToast.classList.remove('show');
   }, 3000);
}

btnPasteOntLght.addEventListener('click', function () {
   navigator.clipboard.readText()
      .then(function (text) {
         var levels = parseLightLevels(text);
         if (levels.olt != null) oltRxField.value = levels.olt + ' dBm';
         if (levels.ont != null) ontRxField.value = levels.ont + ' dBm';
         setFieldStatus(oltRxField, levels.olt != null);
         setFieldStatus(ontRxField, levels.ont != null);
         if (levels.olt == null && levels.ont == null) {
            showPasteToast('Paste failed');
         } else {
            upsertNoteLine(LL_PREFIX, formatLightLevels(levels), [isReasonLine, isStatusLine]);
         }
      })
      .catch(function (error) {
         console.error('Could not read clipboard:', error);
         setFieldStatus(oltRxField, false);
         setFieldStatus(ontRxField, false);
         showPasteToast('Paste failed');
      });
});

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
