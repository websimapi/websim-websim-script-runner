import { runScript } from 'interpreter';
import { isDataSource } from 'data-provider';

document.addEventListener('DOMContentLoaded', () => {
    const outputElement = document.getElementById('output');
    const scriptInput = document.getElementById('script-input');
    const runButton = document.getElementById('run-button');
    const toolboxButtons = document.querySelectorAll('.toolbox-btn');

    if (!outputElement || !scriptInput || !runButton) {
        console.error('Required UI elements not found.');
        return;
    }

    function executeScriptFromInput() {
        const commands = scriptInput.value.split('\n').filter(line => line.trim() !== '');
        runScript(outputElement, commands);
    }

    // Function to insert text at the cursor's position
    function insertAtCursor(text) {
        const start = scriptInput.selectionStart;
        const end = scriptInput.selectionEnd;
        const currentText = scriptInput.value;
        const newText = currentText.substring(0, start) + text + currentText.substring(end);
        
        scriptInput.value = newText;
        scriptInput.focus();
        scriptInput.selectionStart = scriptInput.selectionEnd = start + text.length;
    }

    // Function to check if the token immediately before the cursor is a data source.
    function isPrecededByDataSource() {
        const textBeforeCursor = scriptInput.value.substring(0, scriptInput.selectionStart);
        
        // Match the last sequence of non-whitespace characters
        const lastTokenMatch = textBeforeCursor.match(/\S+$/);
        
        if (!lastTokenMatch) {
            return false; // No token found before cursor
        }
        
        const lastToken = lastTokenMatch[0];
        return isDataSource(lastToken);
    }

    runButton.addEventListener('click', executeScriptFromInput);

    toolboxButtons.forEach(button => {
        button.addEventListener('click', () => {
            const textToInsert = button.dataset.insert;
            if (textToInsert) {
                // Auto-insert "_and_" if clicking a data source after another data source
                if (isDataSource(textToInsert) && isPrecededByDataSource()) {
                    insertAtCursor(`_and_${textToInsert}`);
                } else {
                    insertAtCursor(textToInsert);
                }
            }
        });
    });
    
    // Also run script from URL on page load
    const urlParams = new URLSearchParams(window.location.search);
    const urlCommands = urlParams.getAll('render');
    if (urlCommands.length > 0) {
        scriptInput.value = urlCommands.join('\n');
        runScript(outputElement, urlCommands);
    }
});