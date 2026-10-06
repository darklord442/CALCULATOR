const display = document.getElementById('display') || document.calc.txt;
const calculator = document.getElementById('calculator');
const modeMenu = document.getElementById('mode-menu');
const modeToggle = document.querySelector('.menu-toggle');
const calculatorTitle = document.getElementById('calculator-title');

let memoryValue = 0;
let angleMode = 'deg';
let secondFunction = false;
let exponentFormat = false;

function evaluateExpression(expression) {
    const normalized = expression
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
}

function toggleFunctionMenu(menuId) {
    const menu = document.getElementById(menuId);
    const wasHidden = menu.hidden;
    document.querySelectorAll('.function-menu').forEach((item) => {
        item.hidden = true;
    });
    menu.hidden = !wasHidden;
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
}

function applyScientificFunction(name) {
    if (!display.value) {
        return;
    }

    try {
        const value = evaluateExpression(display.value);
        const useInverse = secondFunction && ['sin', 'cos', 'tan'].includes(name);
        let result;

        if (useInverse) {
            const inverseName = `a${name}`;
            result = Math[inverseName](value);
            if (angleMode === 'deg') {
                result = result * 180 / Math.PI;
            }
        } else if (['sin', 'cos', 'tan'].includes(name)) {
            const angle = angleMode === 'deg' ? value * Math.PI / 180 : value;
            result = Math[name](angle);
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
