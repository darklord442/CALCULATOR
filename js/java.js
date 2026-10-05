
// Safely target the calculator's input display
const display = document.getElementById('display') || document.calc.txt;

// Memory variable storage
let memoryValue = 0;

// Standard action to add numbers and operators
function appendValue(value) {
    display.value += value;
}

// Clear the entire screen
function clearDisplay() {
    display.value = '';
}

// Delete the last character (Backspace)
function deleteLast() {
    display.value = display.value.slice(0, -1);
}

// Calculate the final result safely
function calculateResult() {
    try {
        display.value = eval(display.value);
    } catch (error) {
        display.value = 'Error';
    }
}

// Fixed percentage function
function appendPercentage() {
    try {
        if (display.value) {
            display.value = eval(display.value) / 100;
        }
    } catch (error) {
        display.value = 'Error';
    }
}

// Toggle positive / negative (+/-)
function toggleSign() {
    try {
        if (display.value) {
            display.value = eval(display.value) * -1;
        }
    } catch (error) {
        display.value = 'Error';
    }
}

// 1/x (Reciprocal)
function calculateReciprocal() {
    try {
        if (display.value) {
            display.value = 1 / eval(display.value);
        }
    } catch (error) {
        display.value = 'Error';
    }
}

// x² (Square)
function calculateSquare() {
    try {
        if (display.value) {
            display.value = Math.pow(eval(display.value), 2);
        }
    } catch (error) {
        display.value = 'Error';
    }
}

// ²√x (Square Root)
function calculateSquareRoot() {
    try {
        if (display.value) {
            display.value = Math.sqrt(eval(display.value));
        }
    } catch (error) {
        display.value = 'Error';
    }
}

// --- Memory Functions ---

// MS (Memory Store): Saves current screen value into memory
function memoryStore() {
    try {
        if (display.value) {
            memoryValue = eval(display.value);
        }
    } catch (error) {
        display.value = 'Error';
    }
}

// MR (Memory Recall): Displays the stored memory value
function memoryRecall() {
    display.value += memoryValue; // FIXED: Appends the value instead of overwriting the screen
}

// MC (Memory Clear): Resets stored memory to 0
function memoryClear() {
    memoryValue = 0;
}

// M+ (Memory Add): Adds current screen value to stored memory
function memoryAdd() {
    try {
        if (display.value) {
            memoryValue += eval(display.value);
        }
    } catch (error) {
        display.value = 'Error';
    }
}

// M- (Memory Subtract): Subtracts current screen value from stored memory
function memorySubtract() {
    try {
        if (display.value) {
            memoryValue -= eval(display.value);
        }
    } catch (error) {
        display.value = 'Error';
    }
}

