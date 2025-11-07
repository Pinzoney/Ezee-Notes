const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
        const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))
        var checkboxes = document.querySelectorAll("input[type=checkbox][name=normSteps]")
        var settCheck = document.querySelectorAll("input[type=checkbox][name=settCheck]")
        var swtsSettings = document.querySelectorAll('input[role="switch"]')
        var issBtns = document.querySelectorAll("button[name=issPre]")
        var stepsTextArea = document.getElementById('tsSteps')
        var button = document.getElementById('genBut');
        var butClear = document.getElementById('clrCheck');
        var butSett = document.getElementById('btnSwitch');
        var butSettPre = document.getElementById('settPre')
        var copyOutNote = document.getElementById('copyNote');
        var clearAll = document.getElementById('clearAll');
        var issue = document.getElementById('inputIssue');
        var steps = document.getElementById('tsSteps');
        var settings = document.getElementById('tsSettings');
        var outArea = document.getElementById('generatedNote');
        var settChkArea = document.getElementById('chkSetArea')

        issBtns.forEach(function (button) {
            button.addEventListener('click', function () {
                issue.value = this.value
            })
        });

        checkboxes.forEach(function (checkbox) {
            checkbox.addEventListener('change', function () {
                if (this.checked) {
                    if (stepsTextArea.value === '') {
                        stepsTextArea.value = '- ' + this.value;
                    } else {
                        stepsTextArea.value += '\n- ' + this.value;
                    }
                } else {
                    var lines = stepsTextArea.value.split('\n');
                    var filtered = lines.filter(function (line) {
                        return line !== '- ' + this.value;
                    }, this);
                    stepsTextArea.value = filtered.join('\n');
                }
            });
        });


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

        button.addEventListener('click', function () {
            var str;
            if (butSett.classList.contains('active')) {
                str =
                `Issue:  ${issue.value}
            
Troubleshooting Steps: \n${steps.value}
            
Settings Changed: \n ${settings.value}`
            } else {
                str = 
                `Issue:  ${issue.value}
            
Troubleshooting Steps: \n${steps.value}`
            }
            outArea.value = str;
        });

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

        clearAll.addEventListener('click', function () {
            issue.value = ''
            stepsTextArea.value = ''
            settings.value = ''
            outArea.value = ''
            checkboxes.forEach(function (checkbox) {
                checkbox.checked = false
            })
            if (butSett.classList.contains('active')) {
                butSett.classList.toggle('active');
            }
            settings.style.visibility = 'hidden';
            if (butSettPre.classList.contains('active')) {
                    butSettPre.classList.toggle('active');
            }
            butSettPre.style.visibility = 'hidden';
            settChkArea.style.visibility = 'hidden'
            settCheck.forEach(function (checkbox) {
                checkbox.checked = false;
            })
            swtsSettings.forEach(function (checkbox) {
                checkbox.checked = false;
                checkbox.disabled = true;
            })
        });

        butSett.addEventListener('click', function () {
            if (butSett.classList.contains('active')) {
                settings.style.visibility = 'visible'
                butSettPre.style.visibility = 'visible'
            } else {
                settings.style.visibility = 'hidden'
                butSettPre.style.visibility = 'hidden'
                settCheck.forEach(function (checkbox) {
                    checkbox.checked = false;
                });
                if (butSettPre.classList.contains('active')) {
                    settChkArea.style.visibility = 'hidden'
                    butSettPre.classList.toggle('active')
                }
                settings.value = ''
            }
        });

        butSettPre.addEventListener('click', function () {
            if (butSettPre.classList.contains('active')) {
                settChkArea.style.visibility = 'visible'
            } else {
                settChkArea.style.visibility = 'hidden'
            }
        });

        settCheck.forEach(function (checkbox) {
            checkbox.addEventListener('change', function () {
                var swtID = document.getElementById(checkbox.id + 'Swt')
                if (this.checked) {
                    swtID.disabled = false
                    if (settings.value === '') {
                        if (!swtID.checked) {
                            settings.value = '- ' + this.value + ': OFF'
                        } else {
                            settings.value = '- ' + this.value + ': ON'
                        }

                    } else {
                        if (!swtID.checked) {
                            settings.value += '\n' + '- ' + this.value + ': OFF'
                        } else {
                            settings.value += '\n' + '- ' + this.value + ': ON'
                        }
                    }
                } else {
                    swtID.disabled = true
                    var linesSet = settings.value.split('\n')
                    var linesFiltSet = linesSet.filter(function (line) {
                        return !line.includes(this.value);
                    }, this);
                    settings.value = linesFiltSet.join('\n')
                }
            })
        });

        swtsSettings.forEach(function (swtElem) {
            swtElem.addEventListener('change', function () {
                var switchID = this.id
                var chkID = switchID.slice(0, -3)
                var relCheckbox = document.getElementById(chkID);
                var settName = relCheckbox.value;
                var lines = settings.value.split('\n');
                var updatedLines = lines.map(function (line) {
                    if (line.includes(settName)) {
                        if (this.checked) {
                            return line.replace(': OFF', ': ON');
                        } else {
                            return line.replace(': ON', ': OFF');
                        }
                    } else {
                        return line;
                    }
                }, this);
                settings.value = updatedLines.join('\n')
            });
        })