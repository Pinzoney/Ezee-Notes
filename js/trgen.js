const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))
var dispBtns = document.querySelectorAll("button[name=dispBtn]")
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
var btnUsbl = document.getElementById("bswtUsable")

var prefillData = {
    'hdONT': {
        cxStatement: "Hard Down ONT, lights are on but internet is not working",
        troubleshootingSteps: " -Power cycled ONT\n -No damage to patch fiber cable\n -No damage to drop bury",
    },
    'cutFiber': {
        cxStatement: "Cx reports that their fiber drop was cut and needs it replaced",
        troubleshootingSteps: " -No damage to patch fiber cable\n -Cx visually confirmed their fiber cable was damaged\n -Creating task to have contractor fix their drop",
    },
    'dmgPatch': {
        cxStatement: "Cx reports that they have no internet and modem is on with lights",
        troubleshootingSteps: " -Power cycled ONT, no fix\n -Cx confirmed their patch fiber cable is damaged/cut\n -Need FST visit to change their patch fiber cable",
    },
    'lowLight': {
        cxStatement: "Cx reports intermittent drops, issues with buffering, issues with latency or long loading times for apps/websites",
        troubleshootingSteps: " -Power cycled ONT and router, no fix\n -ONT has low light levels which cause the modem to ocassionally drop\n -TR to check light levels in the area",
    },
    'swapRouters': {
        cxStatement: "Cx is running into issues with their Wi-fi randomly crashing/not working, {Cx has PB70s/Cx has EVOs}",
        troubleshootingSteps: " -Power cycled ONT and router, no fix\n -No damage to patch fiber cable\n -Plume shows crashing due to {reason}\n -requesting FST to review their hardware and possible swap their routers out",
    },
    'repONT': {
        cxStatement: "Cx requests to reposition their modem to a different area",
        troubleshootingSteps: " -Cx requests to move their modem since they think they could get better signal/it's installed in a enclosed space and could be having heating issues\n -Requesting FST to assist in modem their modem to a different area is possible",
    },
    'rouFlap': {
        cxStatement: "Cx reports intermittent wifi issues, wifi sometimes goes fully out, or is very slow, they report outages of about a minute and happens very often throughout the day",
        troubleshootingSteps: " -Rebooted modem and router\n -disabled IPv6\n -router has alerts in the logs that they turned off, but not marked as an outage\n -As a provisional workaround, please swap the cx's modem for a 5222XG so we are able to put the modem in ROUTED mode and the router in BRIDGE mode\n -If cx has their own routers, please assist them in switching their routers to bridge mode/Access Point mode if at all possible"
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

dispBtns.forEach(function(button) {
    button.addEventListener('click', function() {
        nDisp.value = this.value;
    })
});

btnUsbl.addEventListener('click', function () {
    if(btnUsbl.classList.contains('active')) {
        var lines = genNote.value.split('\n');
        var filtered = lines.filter(function (line) {
            return line !== 'Unusable'
        });
        genNote.value = 'Usable\n' + filtered.join('\n')
    } else {
        var lines = genNote.value.split('\n');
        var filtered = lines.filter(function (line) {
            return line !== 'Usable'
        });
        genNote.value = 'Unusable\n' + filtered.join('\n')
    }
})

btnPaste.addEventListener('click', function () {
    const ontStatsText = document.getElementById("ontStats");
        navigator.clipboard.readText()
            .then((clipText) => (ontStatsText.value = clipText));
});

btnGen.addEventListener('click', function () {
    var str;
    var use = 'Unusable';
    if(btnUsbl.classList.contains('active')) {
        use = 'Usable'
    }
        var selValue = trReason.value
    var selTrData = prefillData[selValue];
    if(!selTrData) {
        console.log('No data found for option: ' + selValue);
        return
    }

    str =
        `${use}
        
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
    if(btnUsbl.classList.contains('active')) {
        btnUsbl.classList.toggle('active')
    }
    trReason.value = ''
    cxState.value = ''
    tsSteps.value = ''
    nDisp.value = ''
    ontStats.value = ''
    genNote.value = `Unusable
        
Cx Statement:
            
Troubleshooting Steps: 
            
# of Dispatches: 

ONT Stats: `
});