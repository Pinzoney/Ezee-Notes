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

var prefillData = {
    'hdONT': {
        cxStatement: "Hard Down ONT, lights are on but internet is not working",
        troubleshootingSteps: " -Power cycled ONT\n -No damage to patch fiber cable\n -No damage to drop bury",
    },
    'cutFiber': {
        cxStatement: "",
        troubleshootingSteps: "",
    },
    'dmgPatch': {
        cxStatement: "",
        troubleshootingSteps: "",
    },
    'lowLight': {
        cxStatement: "",
        troubleshootingSteps: "",
    },
    'swapRouters': {
        cxStatement: "",
        troubleshootingSteps: "",
    },
};

trReason.addEventListener('change', function() {
    var selValue = trReason.value
    var selTrData = prefillData[selValue];
    if(!selTrData) {
        console.log('No data found for option: ' + selValue);
        return
    }
    cxState.value = selTrData.cxStatement;
    tsSteps.value = selTrData.troubleshootingSteps;
})

btnPaste.addEventListener('click', function () {
    const ontStatsText = document.getElementById("ontStats");
        var oriHTML = btnPaste.innerHTML
        navigator.clipboard.readText()
            .then((clipText) => (ontStatsText.value = clipText));
});

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

btnCopy.addEventListener('click', function () {
    if (genNote.value !== '') {
        btnCopy.disabled = true;

        var originalHTML = btnCopy.innerHTML;

        navigator.clipboard.writeText(genNote.value)
            .then(function () {
                btnCopy.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
                btnCopy.classList.remove('btn-outline-secondary');
                btnCopy.classList.add('btn-success');

                setTimeout(function () {
                    btnCopy.innerHTML = originalHTML;
                    btnCopy.classList.remove('btn-success');
                    btnCopy.classList.add('btn-outline-secondary');
                    btnCopy.disabled = false;
                }, 2000);
            })
            .catch(function (error) {

                console.error('Failed to copy:', error);

                btnCopy.innerHTML = '<i class="bi bi-x-lg"></i> Failed';
                btnCopy.classList.remove('btn-outline-secondary');
                btnCopy.classList.add('btn-danger');

                setTimeout(function () {
                    btnCopy.innerHTML = originalHTML;
                    btnCopy.classList.remove('btn-danger');
                    btnCopy.classList.add('btn-outline-secondary');
                    btnCopy.disabled = false;
                }, 2000);
            });
    }
});


btnClear.addEventListener('click', function () {
    trReason.value = ''
    cxState.value = ''
    tsSteps.value = ''
    nDisp.value = ''
    ontStats.value = ''
    genNote.value = ''
});