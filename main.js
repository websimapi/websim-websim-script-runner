import { runScript } from 'interpreter';

document.addEventListener('DOMContentLoaded', () => {
    const outputElement = document.getElementById('output');
    const scriptInput = document.getElementById('script-input');
    const runButton = document.getElementById('run-button');

    if (!outputElement || !scriptInput || !runButton) {
        console.error('Required UI elements not found.');
        return;
    }

    function executeScriptFromInput() {
        const commands = scriptInput.value.split('\n').filter(line => line.trim() !== '');
        runScript(outputElement, commands);
    }

    runButton.addEventListener('click', executeScriptFromInput);
    
    // Also run script from URL on page load
    const urlParams = new URLSearchParams(window.location.search);
    const urlCommands = urlParams.getAll('render');
    if (urlCommands.length > 0) {
        scriptInput.value = urlCommands.join('\n');
        runScript(outputElement, urlCommands);
    }
});

