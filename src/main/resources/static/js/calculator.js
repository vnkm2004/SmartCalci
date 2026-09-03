/**
 * Calculator Engine & State Manager
 */
class CalculatorEngine {
    constructor() {
        this.expression = '';
        this.result = '0';
        this.angleUnit = 'deg'; // 'deg' or 'rad'
        this.memory = 0;
        this.hasEvaluated = false;
        this.onStateChange = null;
    }

    setAngleUnit(unit) {
        this.angleUnit = unit;
        this.notify();
    }

    toggleAngleUnit() {
        this.angleUnit = this.angleUnit === 'deg' ? 'rad' : 'deg';
        this.notify();
        return this.angleUnit;
    }

    clear() {
        this.expression = '';
        this.result = '0';
        this.hasEvaluated = false;
        this.notify();
    }

    deleteLast() {
        if (this.hasEvaluated) {
            this.clear();
            return;
        }
        if (this.expression.length > 0) {
            // Check if deleting function like 'sin('
            const funcs = ['asin(', 'acos(', 'atan(', 'sqrt(', 'cbrt(', 'fact(', 'sin(', 'cos(', 'tan(', 'log(', 'ln('];
            let foundFunc = false;
            for (const f of funcs) {
                if (this.expression.endsWith(f)) {
                    this.expression = this.expression.slice(0, -f.length);
                    foundFunc = true;
                    break;
                }
            }
            if (!foundFunc) {
                this.expression = this.expression.slice(0, -1);
            }
        }
        this.notify();
    }

    append(token) {
        if (this.hasEvaluated) {
            // If starting with an operator after equals, continue with previous result
            if (['+', '-', '×', '÷', '*', '/', '^', '%'].includes(token)) {
                this.expression = this.result + token;
            } else {
                this.expression = token;
            }
            this.hasEvaluated = false;
        } else {
            this.expression += token;
        }
        this.notify();
    }

    appendFunction(funcName) {
        if (this.hasEvaluated) {
            this.expression = funcName + '(' + this.result + ')';
            this.hasEvaluated = false;
        } else {
            this.expression += funcName + '(';
        }
        this.notify();
    }

    setResult(val, expr = null) {
        this.result = String(val);
        if (expr !== null) this.expression = expr;
        this.hasEvaluated = true;
        this.notify();
    }

    // Memory operations
    memoryClear() {
        this.memory = 0;
        this.notify();
    }

    memoryRecall() {
        this.append(String(this.memory));
    }

    memoryAdd() {
        const num = parseFloat(this.result) || 0;
        this.memory += num;
        this.notify();
    }

    memorySubtract() {
        const num = parseFloat(this.result) || 0;
        this.memory -= num;
        this.notify();
    }

    memoryStore() {
        this.memory = parseFloat(this.result) || 0;
        this.notify();
    }

    getSanitizedExpression() {
        if (!this.expression) return '';
        let s = this.expression.trim();
        // Normalize square and curly brackets to parentheses
        s = s.replace(/\[|\{/g, '(').replace(/\]|\}/g, ')');
        // Normalize superscripts
        s = s.replace(/⁰/g, '^0')
             .replace(/¹/g, '^1')
             .replace(/²/g, '^2')
             .replace(/³/g, '^3')
             .replace(/⁴/g, '^4')
             .replace(/⁵/g, '^5')
             .replace(/⁶/g, '^6')
             .replace(/⁷/g, '^7')
             .replace(/⁸/g, '^8')
             .replace(/⁹/g, '^9');
        s = s.replace(/%\s*of\b/gi, '*0.01*');
        // Remove trailing dangling operators
        s = s.replace(/[+\-×÷*/%^]+$/, '');

        // Count unclosed parentheses and auto-close them
        let openParen = 0;
        for (let i = 0; i < s.length; i++) {
            if (s[i] === '(') openParen++;
            else if (s[i] === ')') {
                if (openParen > 0) openParen--;
            }
        }
        while (openParen > 0) {
            s += ')';
            openParen--;
        }
        return s;
    }

    notify() {
        if (this.onStateChange) {
            this.onStateChange({
                expression: this.expression,
                result: this.result,
                angleUnit: this.angleUnit,
                hasMemory: this.memory !== 0,
                hasEvaluated: this.hasEvaluated
            });
        }
    }
}

window.calcEngine = new CalculatorEngine();
