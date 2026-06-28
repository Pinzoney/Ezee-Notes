const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))
var t2TypeBtns = document.querySelectorAll("input[type=radio][name=btnT2Type]")
var t2TypeGroup = document.querySelector('[role="group"]')
var caseNumField = document.getElementById('caseNum')
var checkboxes = document.querySelectorAll("input[type=checkbox][name=normSteps]")
var stepsTextArea = document.getElementById('tsSteps')
var butClear = document.getElementById('clrCheck');
var copyOutNote = document.getElementById('copyNote');
var genNote = document.getElementById('generatedNote');

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
    var previousLines = [...t2TypeBtns].map(function (btn) {return btn.dataset.line })
    var filtered = stripCaseLine(lines).filter(function (line) {
        return !previousLines.includes(line)
    })

    if (e.target.id === 'npsCase') {
        filtered.splice(0, 0, '', 'Case #: ' + caseNumField.value)
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

butClear.addEventListener('click', function () {
    checkboxes.forEach(function (checkbox) {
        checkbox.checked = false
        var lines = stepsTextArea.value.split('\n');
        var filtered = lines.filter(function (line) {
            return line !== '- ' + checkbox.value;
        }, checkbox);
        stepsTextArea.value = filtered.join('\n');
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