import { runScript } from 'interpreter';

document.addEventListener('DOMContentLoaded', () => {
    const outputElement = document.getElementById('output');
    if (outputElement) {
        runScript(outputElement);
    } else {
        console.error('Output element not found.');
    }
});

