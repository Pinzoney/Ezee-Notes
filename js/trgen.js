const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))
var trReason = document.getElementById("trReaSel")
var cxState = document.getElementById("cxState")
var tsSteps = document.getElementById("tsSteps")
var nDisp = document.getElementById("numDisp")
var btnPaste = document.getElementById("btnPaste")
var ontStats = document.getElementById("ontStats")
var genNote = document.getElementById("generatedNote")
var btnCopy = document.getElementById("copyNote")
var btnClear = document.getElementById("clearAll")
var btnGen = document.getElementById("genBut")

btnGen.addEventListener('click', function () {
            var str;
            str =
                `Issue: ${trReason.value}

Cx Statement: ${cxState.value}
            
Troubleshooting Steps: \n${tsSteps.value}
            
# of Dispatches: ${nDisp.value}

ONT Stats: ${ontStats.value}`
            
            genNote.value = str;
        });