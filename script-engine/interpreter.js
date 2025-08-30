import { getData } from 'data-provider';

// A map of keywords to data retrieval keys
const RENDER_KEYWORDS = {
    PROJECT_TITLE: 'projectTitle',
    PROJECT_DESCRIPTION: 'projectDescription',
    CREATOR_USERNAME: 'creatorUsername',
};

// A map of keywords to valid HTML tags for rendering
const TAG_KEYWORDS = {
    H1: 'h1',
    H2: 'h2',
    P: 'p',
    DIV: 'div',
    SPAN: 'span',
};

async function parseAndExecuteCommand(command, outputElement) {
    if (!command || command.trim() === '') return;

    const parts = command.split('_AS_');
    if (parts.length !== 2) {
        console.warn(`Invalid command format: ${command}`);
        return;
    }

    const [dataSourceKey, tagKey] = parts;
    const dataKey = RENDER_KEYWORDS[dataSourceKey];
    const tagName = TAG_KEYWORDS[tagKey];

    if (!dataKey) {
        console.warn(`Unknown data source: ${dataSourceKey}`);
        return;
    }
    if (!tagName) {
        console.warn(`Unknown tag name: ${tagKey}`);
        return;
    }

    try {
        const content = await getData(dataKey);
        if (content !== null) {
            const element = document.createElement(tagName);
            element.textContent = content;
            outputElement.appendChild(element);
        } else {
             console.warn(`No content found for: ${dataKey}`);
        }
    } catch (error) {
        console.error(`Error executing command "${command}":`, error);
    }
}

export async function runScript(outputElement, commands) {
    outputElement.innerHTML = '';

    if (!commands || commands.length === 0) {
        return;
    }

    const commandPromises = commands.map(cmd => parseAndExecuteCommand(cmd, outputElement));
    await Promise.all(commandPromises);
}