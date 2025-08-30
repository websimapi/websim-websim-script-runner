import { runScript, RENDER_KEYWORDS, TAG_KEYWORDS, SIMPLE_COMMANDS, OPERATOR_KEYWORDS, SEPARATOR_KEYWORDS } from 'interpreter';
import { isDataSource } from 'data-provider';

document.addEventListener('DOMContentLoaded', () => {
    const outputElement = document.getElementById('output');
    const scriptInput = document.getElementById('script-input');
    const runButton = document.getElementById('run-button');
    const toolboxButtons = document.querySelectorAll('.toolbox-btn');
    const highlighter = document.getElementById('highlighter');
    const highlighterCode = highlighter.querySelector('code');

    if (!outputElement || !scriptInput || !runButton || !highlighter) {
        console.error('Required UI elements not found.');
        return;
    }

    // --- Syntax Highlighting Logic ---
    const allKeywords = [
        ...Object.keys(RENDER_KEYWORDS),
        ...SEPARATOR_KEYWORDS,
        ...OPERATOR_KEYWORDS,
        ...Object.keys(TAG_KEYWORDS),
        ...Object.keys(SIMPLE_COMMANDS)
    ];

    const keywordToClassMap = {
        datasource: new Set(Object.keys(RENDER_KEYWORDS)),
        separator: new Set(SEPARATOR_KEYWORDS),
        operator: new Set(OPERATOR_KEYWORDS),
        element: new Set(Object.keys(TAG_KEYWORDS)),
        command: new Set(Object.keys(SIMPLE_COMMANDS)),
    };

    function getTokenType(token) {
        for (const type in keywordToClassMap) {
            if (keywordToClassMap[type].has(token)) {
                return `token-${type}`;
            }
        }
        return 'token-unknown';
    }

    const tokenizerRegex = new RegExp(`(${allKeywords.join('|')})`, 'g');

    function escapeHtml(text) {
        return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function updateHighlighter() {
        const text = scriptInput.value;
        const escapedText = escapeHtml(text);
        
        const highlightedHtml = escapedText.replace(tokenizerRegex, (match) => {
            const tokenClass = getTokenType(match);
            return `<span class="${tokenClass}">${match}</span>`;
        });
        
        // Add a newline to prevent editor collapsing on empty last line
        highlighterCode.innerHTML = highlightedHtml + '\n';
    }

    function syncScroll() {
        highlighter.scrollTop = scriptInput.scrollTop;
        highlighter.scrollLeft = scriptInput.scrollLeft;
    }
    // --- End Syntax Highlighting ---

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
        
        // Manually trigger input event for highlighter update
        scriptInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Function to check if the token immediately before the cursor is a data source.
    function isPrecededByDataSource() {
        const textBeforeCursor = scriptInput.value.substring(0, scriptInput.selectionStart).trim();
        
        // Split by operators to correctly identify the last token in an expression.
        const expressionParts = textBeforeCursor.split(/_and_|_or_|_xor_|_xand_|_as_/);
        
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

    scriptInput.addEventListener('input', updateHighlighter);
    scriptInput.addEventListener('scroll', syncScroll);

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
    
    // Initial highlight
    updateHighlighter();
});