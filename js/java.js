const display = document.getElementById('display') || document.calc.txt;
const calculator = document.getElementById('calculator');
const modeMenu = document.getElementById('mode-menu');
const modeToggle = document.querySelector('.menu-toggle');
const calculatorTitle = document.getElementById('calculator-title');
const buttonActions = {
    'append-percentage': appendPercentage,
    'calculate-reciprocal': calculateReciprocal,
    'calculate-square': calculateSquare,
    'calculate-square-root': calculateSquareRoot,
    'calculate-result': calculateResult,
    'clear-display': clearDisplay,
    'delete-last': deleteLast,
    'memory-clear': memoryClear,
    'memory-recall': memoryRecall,
    'memory-add': memoryAdd,
    'memory-subtract': memorySubtract,
    'memory-store': memoryStore,
    'toggle-mode-menu': toggleModeMenu,
    'toggle-angle-mode': toggleAngleMode,
    'toggle-exponent-format': toggleExponentFormat,
    'toggle-second-function': toggleSecondFunction,
    'toggle-hyperbolic': toggleHyperbolic,
    'toggle-sign': toggleSign
};

calculator.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) {
        return;
    }

    const button = event.target.closest('button[data-action]');
    if (!button || !calculator.contains(button) || button.disabled) {
        return;
    }

    const { action, value, mode, menu, function: functionName } = button.dataset;

    if (action === 'append-value' && value !== undefined) {
        appendValue(value);
    } else if (action === 'append-constant' && value !== undefined) {
        appendConstant(value);
    } else if (action === 'set-calculator-mode' && mode !== undefined) {
        setCalculatorMode(mode);
    } else if (action === 'toggle-function-menu' && menu !== undefined) {
        toggleFunctionMenu(menu);
    } else if (action === 'scientific-function' && functionName !== undefined) {
        applyScientificFunction(functionName);
        closeFunctionMenus();
    } else {
        const handler = buttonActions[action];
        if (handler) {
            handler();
        }
    }
});

let memoryValue = 0;
let angleMode = 'deg';
let secondFunction = false;
let hyperbolicMode = false;
let exponentFormat = false;

function evaluateExpression(expression) {
    const normalized = expression
        .replace(/(-?\d+(?:\.\d+)?)°\s*(\d+(?:\.\d+)?)′\s*(\d+(?:\.\d+)?)″/g, (_, degrees, minutes, seconds) => {
            const sign = degrees.startsWith('-') ? -1 : 1;
            const value = Math.abs(Number(degrees)) + Number(minutes) / 60 + Number(seconds) / 3600;
            return String(sign * value);
        })
        .replace(/π/g, 'Math.PI')
        .replace(/(^|[^\w.])e(?=$|[^\w])/g, '$1Math.E')
        .replace(/\^/g, '**');
    return eval(normalized);
}

function showResult(value) {
    display.value = exponentFormat && Number.isFinite(value)
        ? value.toExponential()
        : value;
}

function appendValue(value) {
    display.value += value;
}

function appendConstant(value) {
    if (/[0-9)πe]$/.test(display.value)) {
        display.value += '*';
    }
    display.value += value;
}

function clearDisplay() {
    display.value = '';
}

function deleteLast() {
    display.value = display.value.slice(0, -1);
}

function calculateResult() {
    try {
        showResult(evaluateExpression(display.value));
    } catch (error) {
        display.value = 'Error';
    }
}

function appendPercentage() {
    try {
        if (display.value) {
            showResult(evaluateExpression(display.value) / 100);
        }
    } catch (error) {
        display.value = 'Error';
    }
}

function toggleSign() {
    try {
        if (display.value) {
            showResult(evaluateExpression(display.value) * -1);
        }
    } catch (error) {
        display.value = 'Error';
    }
}

function calculateReciprocal() {
    try {
        if (display.value) {
            showResult(1 / evaluateExpression(display.value));
        }
    } catch (error) {
        display.value = 'Error';
    }
}

function calculateSquare() {
    try {
        if (display.value) {
            showResult(Math.pow(evaluateExpression(display.value), 2));
        }
    } catch (error) {
        display.value = 'Error';
    }
}

function calculateSquareRoot() {
    try {
        if (display.value) {
            showResult(Math.sqrt(evaluateExpression(display.value)));
        }
    } catch (error) {
        display.value = 'Error';
    }
}

function memoryStore() {
    try {
        if (display.value) {
            memoryValue = evaluateExpression(display.value);
        }
    } catch (error) {
        display.value = 'Error';
    }
}

function memoryRecall() {
    display.value += memoryValue;
}

function memoryClear() {
    memoryValue = 0;
}

function memoryAdd() {
    try {
        if (display.value) {
            memoryValue += evaluateExpression(display.value);
        }
    } catch (error) {
        display.value = 'Error';
    }
}

function memorySubtract() {
    try {
        if (display.value) {
            memoryValue -= evaluateExpression(display.value);
        }
    } catch (error) {
        display.value = 'Error';
    }
}

function toggleModeMenu() {
    const isExpanded = modeToggle.getAttribute('aria-expanded') === 'true';
    modeToggle.setAttribute('aria-expanded', String(!isExpanded));
    modeMenu.hidden = isExpanded;
}

function setCalculatorMode(mode) {
    const scientific = mode === 'scientific';
    calculator.classList.toggle('scientific', scientific);
    calculatorTitle.textContent = scientific ? 'Scientific' : 'Standard';
    modeMenu.hidden = true;
    modeToggle.setAttribute('aria-expanded', 'false');
    document.getElementById('trig-menu').hidden = true;
    document.getElementById('math-menu').hidden = true;
    clearDisplay();
}

function toggleFunctionMenu(menuId) {
    const menu = document.getElementById(menuId);
    const wasHidden = menu.hidden;
    document.querySelectorAll('.function-menu').forEach((item) => {
        item.hidden = true;
    });
    menu.hidden = !wasHidden;
}

function closeFunctionMenus() {
    document.querySelectorAll('.function-menu').forEach((menu) => {
        menu.hidden = true;
    });
}

function toggleAngleMode() {
    angleMode = angleMode === 'deg' ? 'rad' : 'deg';
    document.getElementById('angle-mode').textContent = angleMode.toUpperCase();
}

function toggleExponentFormat() {
    exponentFormat = !exponentFormat;
    if (display.value) {
        try {
            showResult(evaluateExpression(display.value));
        } catch (error) {
            display.value = 'Error';
        }
    }
}

function toggleSecondFunction() {
    secondFunction = !secondFunction;
    document.querySelectorAll('[data-action="toggle-second-function"]').forEach((button) => {
        button.setAttribute('aria-pressed', String(secondFunction));
    });
}

function toggleHyperbolic() {
    hyperbolicMode = !hyperbolicMode;
    document.querySelectorAll('[data-action="toggle-hyperbolic"]').forEach((button) => {
        button.setAttribute('aria-pressed', String(hyperbolicMode));
    });
}

function applyScientificFunction(name) {
    if (name === 'rand') {
        showResult(Math.random());
        return;
    }

    if (!display.value) {
        return;
    }

    try {
        const value = evaluateExpression(display.value);
        const trigFunctions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot'];
        const useInverse = secondFunction && trigFunctions.includes(name);
        let result;

        if (useInverse) {
            const inverseFunctions = hyperbolicMode
                ? { sin: 'asinh', cos: 'acosh', tan: 'atanh' }
                : { sin: 'asin', cos: 'acos', tan: 'atan' };
            if (['sec', 'csc', 'cot'].includes(name)) {
                const reciprocalInverse = { sec: 'cos', csc: 'sin', cot: 'tan' }[name];
                result = Math[inverseFunctions[reciprocalInverse]](1 / value);
            } else {
                result = Math[inverseFunctions[name]](value);
            }
            if (!hyperbolicMode && angleMode === 'deg') {
                result = result * 180 / Math.PI;
            }
        } else if (trigFunctions.includes(name)) {
            const angle = angleMode === 'deg' ? value * Math.PI / 180 : value;
            const functionName = hyperbolicMode ? `${name}h` : name;
            if (['sec', 'csc', 'cot'].includes(name)) {
                const reciprocalFunction = { sec: 'cos', csc: 'sin', cot: 'tan' }[name];
                result = 1 / Math[hyperbolicMode ? `${reciprocalFunction}h` : reciprocalFunction](hyperbolicMode ? value : angle);
            } else {
                result = Math[functionName](hyperbolicMode ? value : angle);
            }
        } else if (['sinh', 'cosh', 'tanh'].includes(name)) {
            result = Math[name](value);
        } else if (name === 'factorial') {
            if (!Number.isInteger(value) || value < 0) {
                throw new Error('Factorial requires a non-negative integer');
            }
            result = 1;
            for (let factor = 2; factor <= value; factor += 1) {
                result *= factor;
            }
        } else if (name === 'abs') {
            result = Math.abs(value);
        } else if (name === 'floor') {
            result = Math.floor(value);
        } else if (name === 'ceil') {
            result = Math.ceil(value);
        } else if (name === 'dms') {
            const sign = value < 0 ? '-' : '';
            const totalSeconds = Math.round(Math.abs(value) * 3600 * 100) / 100;
            const degrees = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds - degrees * 3600) / 60);
            const seconds = (totalSeconds - degrees * 3600 - minutes * 60).toFixed(2).replace(/\.?0+$/, '');
            display.value = `${sign}${degrees}° ${minutes}′ ${seconds}″`;
            secondFunction = false;
            return;
        } else if (name === 'deg') {
            result = value;
        } else if (name === 'exp') {
            result = Math.exp(value);
        } else if (name === 'pow10') {
            result = Math.pow(10, value);
        } else if (name === 'log') {
            result = Math.log10(value);
        } else if (name === 'ln') {
            result = Math.log(value);
        }

        showResult(result);
        secondFunction = false;
    } catch (error) {
        display.value = 'Error';
    }
}
