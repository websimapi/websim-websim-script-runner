import { getData } from 'data-provider';

// A map of keywords to data retrieval keys
const RENDER_KEYWORDS = {
    project_title: 'project_title',
    project_description: 'project_description',
    creator_username: 'creator_username',
    creator_avatar_url: 'creator_avatar_url',
    creator_profile: 'creator_profile',
};

// A map of keywords to valid HTML tags for rendering
const TAG_KEYWORDS = {
    heading_one: 'h1',
    heading_two: 'h2',
    paragraph: 'p',
    division: 'div',
    span: 'span',
    image: 'img',
    link: 'a',
};

const SIMPLE_COMMANDS = {
    horizontal_rule: 'hr',
};

async function parseAndExecuteCommand(command, outputElement) {
    if (!command || command.trim() === '') return;

    const cmd = command.toLowerCase().trim();

    if (SIMPLE_COMMANDS[cmd]) {
        const tagName = SIMPLE_COMMANDS[cmd];
        const element = document.createElement(tagName);
        outputElement.appendChild(element);
        return;
    }

    const parts = cmd.split('_as_');
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
        console.warn(`Unknown element type: ${tagKey}`);
        return;
    }

    try {
        const content = await getData(dataKey);
        if (content !== null) {
            const element = document.createElement(tagName);
            
            if (tagName === 'img') {
                element.src = content;
                element.alt = dataSourceKey.replace(/_/g, ' '); // Basic alt text
            } else if (tagName === 'a' && typeof content === 'object') {
                element.href = content.href;
                element.textContent = content.text;
                element.target = '_blank'; // Open links in new tab
            } else {
                element.textContent = content;
            }
            
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