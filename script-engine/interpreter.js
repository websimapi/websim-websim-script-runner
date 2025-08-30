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

const OPERATORS = {
    _and_: (a, b) => {
        const valA = (typeof a === 'object' && a !== null) ? a.text : a;
        const valB = (typeof b === 'object' && b !== null) ? b.text : b;
        if (valA && valB) return `${valA} | ${valB}`; // Use a separator for clarity
        return valA || valB || '';
    },
    _or_: (a, b) => a || b,
    _xor_: (a, b) => (a && !b) ? a : ((!a && b) ? b : ''),
    _xand_: (a, b) => (a && b) ? OPERATORS._and_(a, b) : '',
};
const UNARY_OPERATORS = {
    not_: (a) => !a,
};

const OPERATOR_KEYS = Object.keys(OPERATORS);
const UNARY_OPERATOR_KEYS = Object.keys(UNARY_OPERATORS);

async function evaluateExpression(expression) {
    // Handle unary prefix operators first
    for (const opKey of UNARY_OPERATOR_KEYS) {
        if (expression.startsWith(opKey)) {
            const operandKey = expression.substring(opKey.length);
            const dataKey = RENDER_KEYWORDS[operandKey];
            if (dataKey) {
                const value = await getData(dataKey);
                return UNARY_OPERATORS[opKey](value); // will return true/false
            }
        }
    }

    // Split by binary operators, keeping operators in the result array for parsing
    const opRegex = new RegExp(`(${OPERATOR_KEYS.join('|')})`);
    const parts = expression.split(opRegex).filter(p => p);
    
    if (parts.length === 1) {
        const dataKey = RENDER_KEYWORDS[parts[0]];
        return dataKey ? await getData(dataKey) : null;
    }

    let result = null;
    // The first part must be a data source
    const firstDataKey = RENDER_KEYWORDS[parts[0]];
    if (firstDataKey) {
        result = await getData(firstDataKey);
    } else {
        return null; // Invalid start of expression
    }

    for (let i = 1; i < parts.length; i += 2) {
        const operator = parts[i];
        const nextOperandKey = parts[i + 1];
        if (!OPERATOR_KEYS.includes(operator) || !nextOperandKey) {
            console.warn(`Invalid expression part: ${operator}${nextOperandKey || ''}`);
            return result; // return what we have so far
        }
        
        const dataKey = RENDER_KEYWORDS[nextOperandKey.trim()];
        if(dataKey) {
            const nextValue = await getData(dataKey);
            result = OPERATORS[operator](result, nextValue);
        }
    }

    return result;
}

async function parseAndExecuteCommand(command, outputElement) {
    if (!command || command.trim() === '') return;

    const cmd = command.toLowerCase().trim();

    // Handle simple commands that don't need data
    if (SIMPLE_COMMANDS[cmd]) {
        const tagName = SIMPLE_COMMANDS[cmd];
        const element = document.createElement(tagName);
        outputElement.appendChild(element);
        return;
    }

    const parts = cmd.split('_as_');
    const expression = parts[0];
    const tagKey = parts.length > 1 ? parts[1] : null;

    try {
        const content = await evaluateExpression(expression);

        if (content === null || content === '') {
            if (expression) console.warn(`Expression "${expression}" yielded no content.`);
            return;
        }

        // Render as element if tag is specified
        if (tagKey) {
            const tagName = TAG_KEYWORDS[tagKey];
            if (!tagName) {
                console.warn(`Unknown element type: ${tagKey}`);
                return;
            }

            const element = document.createElement(tagName);
            
            if (tagName === 'img') {
                element.src = content;
                element.alt = expression.replace(/_/g, ' '); // Basic alt text
            } else if (tagName === 'a' && typeof content === 'object') {
                element.href = content.href;
                element.textContent = content.text;
                element.target = '_blank'; // Open links in new tab
            } else {
                 element.textContent = (typeof content === 'object' && content !== null) ? JSON.stringify(content, null, 2) : String(content);
            }
            outputElement.appendChild(element);

        } else { // Render as plain text
             let textContent;
            if (typeof content === 'object') {
                textContent = content.text || JSON.stringify(content, null, 2);
            } else {
                textContent = String(content);
            }
            const span = document.createElement('span');
            span.textContent = textContent;
            span.style.marginRight = '0.5em'; // Add space between plain text items
            outputElement.appendChild(span);
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