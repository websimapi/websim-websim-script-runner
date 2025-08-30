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
        
        // Add a space if the preceding character is not a space or newline and the inserted text doesn't start with one.
        const precedingChar = currentText.substring(start - 1, start);
        let textToInsert = text;
        if (start > 0 && !/\s/.test(precedingChar) && !/^_/.test(textToInsert)) {
            textToInsert = ' ' + textToInsert;
        }

        const newText = currentText.substring(0, start) + textToInsert + currentText.substring(end);
        
        scriptInput.value = newText;
        scriptInput.focus();
        scriptInput.selectionStart = scriptInput.selectionEnd = start + textToInsert.length;
    }

    // Function to check if the token immediately before the cursor is a data source.
    function isPrecededByDataSource() {
        const textBeforeCursor = scriptInput.value.substring(0, scriptInput.selectionStart).trim();
        
        // Split by operators to correctly identify the last token in an expression.
        const expressionParts = textBeforeCursor.split(/_and_|_or_|_xor_|_as_/);
        
        if (expressionParts.length === 0) {
            return false;
        }
        
        const lastToken = expressionParts[expressionParts.length - 1].trim();
        
        // If the last token is empty, it means the text ends with an operator or separator,
        // so we are not preceded by a data source.
        if (!lastToken) {
            return false;
        }

        // Check if this last token is a valid data source
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