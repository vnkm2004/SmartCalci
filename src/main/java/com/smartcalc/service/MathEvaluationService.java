package com.smartcalc.service;

import com.smartcalc.model.CalculationResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class MathEvaluationService {

    private static final MathContext MC = new MathContext(15, RoundingMode.HALF_UP);

    public CalculationResponse evaluate(String rawExpression, String angleUnit, int precision) {
        if (rawExpression == null || rawExpression.trim().isEmpty()) {
            return CalculationResponse.error("", "Expression is empty");
        }

        String sanitized = sanitizeExpression(rawExpression);
        List<String> steps = new ArrayList<>();
        steps.add("Original Expression: " + rawExpression.trim());
        if (!sanitized.equals(rawExpression.trim())) {
            steps.add("Normalized Expression: " + sanitized);
        }

        try {
            boolean isDeg = !"rad".equalsIgnoreCase(angleUnit);
            Parser parser = new Parser(sanitized, isDeg);
            double result = parser.parse();

            if (Double.isNaN(result)) {
                return CalculationResponse.error(rawExpression, "Invalid calculation result (NaN)");
            }
            if (Double.isInfinite(result)) {
                return CalculationResponse.error(rawExpression, "Division by zero or overflow (Infinity)");
            }

            String formattedResult = formatResult(result, precision);
            steps.add("Evaluated Result: " + formattedResult);

            return CalculationResponse.ok(rawExpression, formattedResult, result, steps);
        } catch (Exception ex) {
            return CalculationResponse.error(rawExpression, "Error: " + ex.getMessage());
        }
    }

    public String sanitizeExpression(String expr) {
        if (expr == null) return "";
        String s = expr.trim();
        // Replace unicode symbols
        s = s.replace("×", "*")
             .replace("✕", "*")
             .replace("·", "*")
             .replace("÷", "/")
             .replace("−", "-")
             .replace("–", "-")
             .replace("π", "pi")
             .replace("PI", "pi")
             .replace("E", "e")
             .replace("√", "sqrt")
             .replace("[", "(")
             .replace("]", ")")
             .replace("{", "(")
             .replace("}", ")")
             .replace("⁰", "^0")
             .replace("¹", "^1")
             .replace("²", "^2")
             .replace("³", "^3")
             .replace("⁴", "^4")
             .replace("⁵", "^5")
             .replace("⁶", "^6")
             .replace("⁷", "^7")
             .replace("⁸", "^8")
             .replace("⁹", "^9");

        s = s.replaceAll("(?i)%\\s*of\\b", "*0.01*");

        // Normalize factorial operator e.g. "5!" -> "fact(5)"
        s = normalizeFactorials(s);

        // Normalize percentages e.g. "50%" -> "(50/100)"
        s = normalizePercentages(s);

        // Insert implicit multiplication: number followed by ( or function or pi/e
        // e.g., 2(3) -> 2*(3), 2pi -> 2*pi, 3sqrt(4) -> 3*sqrt(4)
        s = s.replaceAll("(\\d)(\\()", "$1*$2");
        s = s.replaceAll("(\\))(\\()", "$1*$2");
        s = s.replaceAll("(\\))(\\d)", "$1*$2");
        s = s.replaceAll("(\\d)(pi|e|sqrt|cbrt|sin|cos|tan|asin|acos|atan|log|ln|abs|fact)", "$1*$2");
        s = s.replaceAll("(\\))(pi|e|sqrt|cbrt|sin|cos|tan|asin|acos|atan|log|ln|abs|fact)", "$1*$2");

        // Strip trailing dangling operators
        s = s.replaceAll("[+\\-*/%^]+$", "");

        // Auto-close missing parentheses at the end:
        int openParen = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '(') openParen++;
            else if (c == ')') {
                if (openParen > 0) openParen--;
            }
        }
        while (openParen > 0) {
            s += ")";
            openParen--;
        }

        return s;
    }

    private String normalizePercentages(String expr) {
        // Replace number% e.g. 25% with (25/100)
        Matcher m = Pattern.compile("(\\d+(\\.\\d+)?)\\s*%").matcher(expr);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            m.appendReplacement(sb, "($1/100)");
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private String normalizeFactorials(String expr) {
        Matcher m = Pattern.compile("(\\d+(\\.\\d+)?|\\([^()]+\\))!").matcher(expr);
        while (m.find()) {
            expr = expr.replace(m.group(0), "fact(" + m.group(1) + ")");
            m = Pattern.compile("(\\d+(\\.\\d+)?|\\([^()]+\\))!").matcher(expr);
        }
        return expr;
    }

    public String formatResult(double val, int precision) {
        if (Math.abs(val - Math.round(val)) < 1e-12) {
            return String.valueOf(Math.round(val));
        }
        try {
            BigDecimal bd = BigDecimal.valueOf(val);
            bd = bd.setScale(Math.min(precision, 10), RoundingMode.HALF_UP).stripTrailingZeros();
            return bd.toPlainString();
        } catch (Exception e) {
            return String.format(Locale.US, "%." + Math.min(precision, 10) + "f", val)
                    .replaceAll("0+$", "")
                    .replaceAll("\\.$", "");
        }
    }

    // Recursive Descent Parser for Mathematical Expressions
    private static class Parser {
        private final String input;
        private final boolean degrees;
        private int pos = -1;
        private int ch;

        public Parser(String input, boolean degrees) {
            this.input = input;
            this.degrees = degrees;
        }

        private void nextChar() {
            ch = (++pos < input.length()) ? input.charAt(pos) : -1;
        }

        private boolean eat(int charToEat) {
            while (ch == ' ' || ch == '\t') nextChar();
            if (ch == charToEat) {
                nextChar();
                return true;
            }
            return false;
        }

        public double parse() {
            nextChar();
            double x = parseExpression();
            while (ch == ' ' || ch == '\t') nextChar();
            if (pos < input.length()) {
                throw new RuntimeException("Unexpected character: " + (char) ch);
            }
            return x;
        }

        // Expression = Term (+ | - Term)*
        private double parseExpression() {
            double x = parseTerm();
            for (;;) {
                if (eat('+')) x += parseTerm();
                else if (eat('-')) x -= parseTerm();
                else return x;
            }
        }

        // Term = Factor (* | / | % Factor)*
        private double parseTerm() {
            double x = parseFactor();
            for (;;) {
                if (eat('*')) x *= parseFactor();
                else if (eat('/')) {
                    double divisor = parseFactor();
                    if (divisor == 0.0) throw new ArithmeticException("Division by zero");
                    x /= divisor;
                } else if (eat('%')) {
                    double mod = parseFactor();
                    if (mod == 0.0) throw new ArithmeticException("Modulo by zero");
                    x %= mod;
                } else return x;
            }
        }

        // Factor = (+ | -)? (Number | (Expression) | Function | Constant) (^ Factor)?
        private double parseFactor() {
            if (eat('+')) return +parseFactor();
            if (eat('-')) return -parseFactor();

            double x;
            int startPos = this.pos;

            if (eat('(')) { // Parentheses
                x = parseExpression();
                if (!eat(')')) throw new RuntimeException("Missing closing parenthesis ')'");
            } else if ((ch >= '0' && ch <= '9') || ch == '.') { // Numbers
                while ((ch >= '0' && ch <= '9') || ch == '.') nextChar();
                x = Double.parseDouble(input.substring(startPos, this.pos));
            } else if (ch >= 'a' && ch <= 'z') { // Functions and Constants
                while (ch >= 'a' && ch <= 'z') nextChar();
                String func = input.substring(startPos, this.pos).toLowerCase();

                if ("pi".equals(func)) {
                    x = Math.PI;
                } else if ("e".equals(func)) {
                    x = Math.E;
                } else {
                    if (!eat('(')) throw new RuntimeException("Expected '(' after function " + func);
                    double arg = parseExpression();
                    if (!eat(')')) throw new RuntimeException("Missing ')' after argument to " + func);

                    switch (func) {
                        case "sqrt":
                            if (arg < 0) throw new RuntimeException("Square root of negative number");
                            x = Math.sqrt(arg);
                            break;
                        case "cbrt":
                            x = Math.cbrt(arg);
                            break;
                        case "sin":
                            x = Math.sin(degrees ? Math.toRadians(arg) : arg);
                            break;
                        case "cos":
                            x = Math.cos(degrees ? Math.toRadians(arg) : arg);
                            break;
                        case "tan":
                            if (degrees && (Math.abs(arg % 180) == 90)) {
                                throw new RuntimeException("Tangent undefined at " + arg + " degrees");
                            }
                            x = Math.tan(degrees ? Math.toRadians(arg) : arg);
                            break;
                        case "asin":
                            if (arg < -1 || arg > 1) throw new RuntimeException("asin argument out of range [-1, 1]");
                            double asinVal = Math.asin(arg);
                            x = degrees ? Math.toDegrees(asinVal) : asinVal;
                            break;
                        case "acos":
                            if (arg < -1 || arg > 1) throw new RuntimeException("acos argument out of range [-1, 1]");
                            double acosVal = Math.acos(arg);
                            x = degrees ? Math.toDegrees(acosVal) : acosVal;
                            break;
                        case "atan":
                            double atanVal = Math.atan(arg);
                            x = degrees ? Math.toDegrees(atanVal) : atanVal;
                            break;
                        case "log":
                            if (arg <= 0) throw new RuntimeException("Logarithm of non-positive number");
                            x = Math.log10(arg);
                            break;
                        case "ln":
                            if (arg <= 0) throw new RuntimeException("Natural log of non-positive number");
                            x = Math.log(arg);
                            break;
                        case "abs":
                            x = Math.abs(arg);
                            break;
                        case "exp":
                            x = Math.exp(arg);
                            break;
                        case "fact":
                            x = calculateFactorial(arg);
                            break;
                        default:
                            throw new RuntimeException("Unknown function: " + func);
                    }
                }
            } else {
                throw new RuntimeException("Unexpected character: " + (ch == -1 ? "EOF" : (char) ch));
            }

            // Exponentiation ^
            if (eat('^')) x = Math.pow(x, parseFactor());

            return x;
        }

        private double calculateFactorial(double n) {
            if (n < 0 || Math.floor(n) != n) {
                throw new RuntimeException("Factorial only defined for non-negative integers");
            }
            if (n > 170) {
                throw new RuntimeException("Factorial overflow for n > 170");
            }
            double result = 1.0;
            for (int i = 2; i <= (int) n; i++) {
                result *= i;
            }
            return result;
        }
    }
}
