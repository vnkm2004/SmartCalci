package com.smartcalc.service;

import com.smartcalc.model.AiSolveResponse;
import com.smartcalc.model.CalculationResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class LocalNlpMathService {

    private final MathEvaluationService mathEvaluationService;

    public LocalNlpMathService(MathEvaluationService mathEvaluationService) {
        this.mathEvaluationService = mathEvaluationService;
    }

    public AiSolveResponse solve(String rawInput) {
        AiSolveResponse response = new AiSolveResponse();
        if (rawInput == null || rawInput.trim().isEmpty()) {
            response.setSuccess(false);
            response.setError("Input mathematical prompt is empty");
            response.setSpokenResponse("Please provide a mathematical problem to solve.");
            return response;
        }

        String raw = rawInput.trim();
        response.setOriginalQuery(raw);

        String detectedLang = detectLanguage(raw);
        response.setDetectedLanguage(detectedLang);

        String normalized = normalizeMultilingualPhrases(raw, detectedLang);
        response.setTranslatedQuery(normalized);

        String mathExpr = extractMathematicalExpression(normalized);
        response.setMathExpression(mathExpr);

        CalculationResponse calc = mathEvaluationService.evaluate(mathExpr, "deg", 10);
        if (calc.isSuccess()) {
            response.setSuccess(true);
            response.setResult(calc.getFormattedResult());
            response.setNumericResult(calc.getNumericResult());

            List<String> steps = new ArrayList<>();
            steps.add(String.format("Recognized Query (%s): %s", detectedLang, raw));
            if (!normalized.equalsIgnoreCase(raw)) {
                steps.add("Normalized Expression: " + normalized);
            }
            steps.add("Extracted Math Formula (BODMAS): " + mathExpr);
            steps.addAll(calc.getSteps());
            steps.add(String.format("Final Calculated Answer = %s", calc.getFormattedResult()));
            response.setSteps(steps);

            response.setSpokenResponse(generateSpokenResponse(calc.getFormattedResult(), detectedLang));
        } else {
            response.setSuccess(false);
            response.setError("Could not parse a mathematical expression from: " + raw);
            response.setSpokenResponse("I could not resolve the mathematical expression from your voice input.");
        }

        return response;
    }

    public String detectLanguage(String text) {
        if (text == null) return "English";
        for (char c : text.toCharArray()) {
            if (c >= 0x0900 && c <= 0x097F) return "Hindi";
        }
        String lower = text.toLowerCase(Locale.ROOT);
        if (lower.contains("más") || lower.contains("dividido") || lower.contains("por ciento") || lower.contains("calcula") || lower.contains("cuatro") || lower.contains("veinte") || lower.contains("treinta") || lower.contains("cincuenta")) {
            return "Spanish";
        }
        if (lower.contains("fois") || lower.contains("divisé") || lower.contains("pour cent") || lower.contains("calculer") || lower.contains("racine") || lower.contains("cinquante")) {
            return "French";
        }
        if (lower.contains("geteilt") || lower.contains("prozent") || lower.contains("berechne") || lower.contains("wurzel") || lower.contains("fünfzig")) {
            return "German";
        }
        return "English";
    }

    private String normalizeMultilingualPhrases(String text, String lang) {
        String s = " " + text.toLowerCase(Locale.ROOT) + " ";

        // Replace unicode symbols and bracket types FIRST before any regex stripping
        s = s.replace("÷", " / ")
             .replace("×", " * ")
             .replace("✕", " * ")
             .replace("·", " * ")
             .replace("−", " - ")
             .replace("–", " - ")
             .replace("—", " - ")
             .replace("π", " pi ")
             .replace("√", " sqrt ")
             .replace("[", " ( ")
             .replace("]", " ) ")
             .replace("{", " ( ")
             .replace("}", " ) ")
             .replace("⁰", " ^ 0 ")
             .replace("¹", " ^ 1 ")
             .replace("²", " ^ 2 ")
             .replace("³", " ^ 3 ")
             .replace("⁴", " ^ 4 ")
             .replace("⁵", " ^ 5 ")
             .replace("⁶", " ^ 6 ")
             .replace("⁷", " ^ 7 ")
             .replace("⁸", " ^ 8 ")
             .replace("⁹", " ^ 9 ");

        // Percentage of phrases
        s = s.replaceAll("(?i)%\\s*of\\b", " * 0.01 * ");

        // Clean punctuation (except operators and dots)
        s = s.replaceAll("[?,;!]", " ");

        // English Number Words
        s = s.replaceAll("(?i)\\bzero\\b", " 0 ")
             .replaceAll("(?i)\\bone\\b", " 1 ")
             .replaceAll("(?i)\\btwo\\b", " 2 ")
             .replaceAll("(?i)\\bthree\\b", " 3 ")
             .replaceAll("(?i)\\bfour\\b", " 4 ")
             .replaceAll("(?i)\\bfive\\b", " 5 ")
             .replaceAll("(?i)\\bsix\\b", " 6 ")
             .replaceAll("(?i)\\bseven\\b", " 7 ")
             .replaceAll("(?i)\\beight\\b", " 8 ")
             .replaceAll("(?i)\\bnine\\b", " 9 ")
             .replaceAll("(?i)\\bten\\b", " 10 ")
             .replaceAll("(?i)\\beleven\\b", " 11 ")
             .replaceAll("(?i)\\btwelve\\b", " 12 ")
             .replaceAll("(?i)\\bthirteen\\b", " 13 ")
             .replaceAll("(?i)\\bfourteen\\b", " 14 ")
             .replaceAll("(?i)\\bfifteen\\b", " 15 ")
             .replaceAll("(?i)\\bsixteen\\b", " 16 ")
             .replaceAll("(?i)\\bseventeen\\b", " 17 ")
             .replaceAll("(?i)\\beighteen\\b", " 18 ")
             .replaceAll("(?i)\\bnineteen\\b", " 19 ")
             .replaceAll("(?i)\\btwenty\\b", " 20 ")
             .replaceAll("(?i)\\bthirty\\b", " 30 ")
             .replaceAll("(?i)\\bforty\\b", " 40 ")
             .replaceAll("(?i)\\bfifty\\b", " 50 ")
             .replaceAll("(?i)\\bsixty\\b", " 60 ")
             .replaceAll("(?i)\\bseventy\\b", " 70 ")
             .replaceAll("(?i)\\beighty\\b", " 80 ")
             .replaceAll("(?i)\\bninety\\b", " 90 ")
             .replaceAll("(?i)\\bhundred\\b", " 100 ")
             .replaceAll("(?i)\\bthousand\\b", " 1000 ")
             .replaceAll("(?i)\\bmillion\\b", " 1000000 ");

        // Spanish Number Words
        s = s.replaceAll("(?i)\\bcero\\b", " 0 ")
             .replaceAll("(?i)\\buno\\b|\\buna\\b", " 1 ")
             .replaceAll("(?i)\\bdos\\b", " 2 ")
             .replaceAll("(?i)\\btres\\b", " 3 ")
             .replaceAll("(?i)\\bcuatro\\b", " 4 ")
             .replaceAll("(?i)\\bcinco\\b", " 5 ")
             .replaceAll("(?i)\\bseis\\b", " 6 ")
             .replaceAll("(?i)\\bsiete\\b", " 7 ")
             .replaceAll("(?i)\\bocho\\b", " 8 ")
             .replaceAll("(?i)\\bnueve\\b", " 9 ")
             .replaceAll("(?i)\\bdiez\\b", " 10 ")
             .replaceAll("(?i)\\bveinte\\b", " 20 ")
             .replaceAll("(?i)\\btreinta\\b", " 30 ")
             .replaceAll("(?i)\\bcuarenta\\b", " 40 ")
             .replaceAll("(?i)\\bcincuenta\\b", " 50 ")
             .replaceAll("(?i)\\bsesenta\\b", " 60 ")
             .replaceAll("(?i)\\bsetenta\\b", " 70 ")
             .replaceAll("(?i)\\bochenta\\b", " 80 ")
             .replaceAll("(?i)\\bnoventa\\b", " 90 ")
             .replaceAll("(?i)\\bcien\\b|\\bciento\\b", " 100 ")
             .replaceAll("(?i)\\bmil\\b", " 1000 ");

        // Hindi Devanagari numerals
        s = s.replace('\u0966', '0').replace('\u0967', '1').replace('\u0968', '2').replace('\u0969', '3').replace('\u096a', '4')
             .replace('\u096b', '5').replace('\u096c', '6').replace('\u096d', '7').replace('\u096e', '8').replace('\u096f', '9');

        // Hindi verbal numbers with unicode-aware matching
        s = s.replaceAll("(?U)\\b\u090f\u0915\\b", " 1 ")
             .replaceAll("(?U)\\b\u0926\u094b\\b", " 2 ")
             .replaceAll("(?U)\\b\u0924\u0940\u0928\\b", " 3 ")
             .replaceAll("(?U)\\b\u091a\u093e\u0930\\b", " 4 ")
             .replaceAll("(?U)\\b\u092a\u093e\u0902\u091a\\b|(?U)\\b\u092a\u093e\u0901\u091a\\b", " 5 ")
             .replaceAll("(?U)\\b\u091b\u0939\\b|(?U)\\b\u091b\u0903\\b", " 6 ")
             .replaceAll("(?U)\\b\u0938\u093e\u0924\\b", " 7 ")
             .replaceAll("(?U)\\b\u0906\u0920\\b", " 8 ")
             .replaceAll("(?U)\\b\u0928\u094c\\b", " 9 ")
             .replaceAll("(?U)\\b\u0926\u0938\\b", " 10 ")
             .replaceAll("(?U)\\b\u092c\u0940\u0938\\b", " 20 ")
             .replaceAll("(?U)\\b\u0924\u0940\u0938\\b", " 30 ")
             .replaceAll("(?U)\\b\u091a\u093e\u0932\u0940\u0938\\b", " 40 ")
             .replaceAll("(?U)\\b\u092a\u091a\u093e\u0938\\b", " 50 ")
             .replaceAll("(?U)\\b\u0938\u093e\u0920\\b", " 60 ")
             .replaceAll("(?U)\\b\u0938\u0924\u094d\u0924\u0930\\b", " 70 ")
             .replaceAll("(?U)\\b\u0905\u0938\u094d\u0938\u0940\\b", " 80 ")
             .replaceAll("(?U)\\b\u0928\u092c\u094d\u092c\u0947\\b", " 90 ")
             .replaceAll("(?U)\\b\u0938\u094c\\b", " 100 ")
             .replaceAll("(?U)\\b\u0939\u091c\u093c\u093e\u0930\\b|(?U)\\b\u0939\u091c\u093e\u0930\\b", " 1000 ")
             .replaceAll("(?U)\\b\u0932\u093e\u0916\\b", " 100000 ");

        // Hindi operations
        s = s.replaceAll("(?U)\u092e\u0947\u0902\\s+\u0938\u0947|(?U)\u0938\u0947", " - ")
             .replaceAll("(?U)\u091c\u092e\u093e|(?U)\u092a\u094d\u0932\u0938|(?U)\u0914\u0930", " + ")
             .replaceAll("(?U)\u0917\u0941\u0923\u093e|(?U)\u0917\u0941\u0928\u093e|(?U)\u0907\u0928\u094d\u091f\u0942", " * ")
             .replaceAll("(?U)\u0935\u093f\u092d\u093e\u091c\u093f\u0924|(?U)\u092d\u093e\u0917|(?U)\u092d\u093e\u0917\u093e", " / ")
             .replaceAll("(?U)\u092a\u094d\u0930\u0924\u093f\u0938\u093c\u0924|(?U)\u092b\u0940\u0938\u0926\u0940", " % ")
             .replaceAll("(?U)\u0935\u0930\u094d\u0917\u092e\u0942\u0932|(?U)\u0930\u0942\u091f", " sqrt ")
             .replaceAll("(?U)\u0918\u091f\u093e\u0915\u0930|(?U)\u0918\u091f\u093e\u0913|(?U)\u0918\u091f\u093e|(?U)\u091c\u094b\u0921\u093c\u0915\u0930|(?U)\u091c\u094b\u0921\u093c\u094b|(?U)\u091c\u094b\u0921\u093c|(?U)\u0917\u0941\u0923\u093e\u0915\u0930|(?U)\u092d\u093e\u0917\u0915\u0930", " ");

        // English verbal words
        s = s.replaceAll("(?i)\\bplus\\b|\\band\\b|\\badd\\b|\\bsum\\s+of\\b", " + ")
             .replaceAll("(?i)\\bminus\\b|\\bsubtract\\b|\\btake\\s+away\\b|\\bless\\b", " - ")
             .replaceAll("(?i)\\bmultiplied\\s+by\\b|\\btimes\\b|\\bmultiply\\b|\\binto\\b", " * ")
             .replaceAll("(?i)\\bdivided\\s+by\\b|\\bdivided\\s+into\\b|\\bdivide\\b|\\bover\\b", " / ")
             .replaceAll("(?i)\\bpercent\\s+of\\b|\\bpercentage\\s+of\\b", " * 0.01 * ")
             .replaceAll("(?i)\\bpercent\\b|\\bpct\\b", " % ")
             .replaceAll("(?i)\\bsquare\\s+root\\s+of\\b|\\bsqrt\\s+of\\b|\\bsquare\\s+root\\b", " sqrt ")
             .replaceAll("(?i)\\bcube\\s+root\\s+of\\b|\\bcube\\s+root\\b", " cbrt ")
             .replaceAll("(?i)\\bto\\s+the\\s+power\\s+of\\b|\\braised\\s+to\\b|\\bpower\\s+of\\b|\\bpower\\b", " ^ ")
             .replaceAll("(?i)\\bfactorial\\s+of\\b|\\bfactorial\\b", " fact ")
             .replaceAll("(?i)\\bcalculate\\b|\\bwhat\\s+is\\b|\\bevaluate\\b|\\bsolve\\b|\\bplease\\b|\\bequals?\\b", " ");

        // Spanish operations
        s = s.replaceAll("(?i)\\bdividido\\s+por\\b|\\bdividido\\s+entre\\b|\\bdividido\\b", " / ")
             .replaceAll("(?i)\\bmás\\b|\\bmas\\b", " + ")
             .replaceAll("(?i)\\bmenos\\b", " - ")
             .replaceAll("(?i)\\bmultiplicado\\s+por\\b|\\bpor\\b", " * ")
             .replaceAll("(?i)\\bpor\\s+ciento\\b", " % ")
             .replaceAll("(?i)\\braíz\\s+cuadrada\\s+de\\b|\\braiz\\s+cuadrada\\b", " sqrt ");

        // French operations
        s = s.replaceAll("(?i)\\bfois\\b|\\bmultiplié\\s+par\\b", " * ")
             .replaceAll("(?i)\\bdivisé\\s+par\\b", " / ")
             .replaceAll("(?i)\\bpour\\s+cent\\b", " % ")
             .replaceAll("(?i)\\bracine\\s+carrée\\s+de\\b|\\bracine\\s+carree\\b", " sqrt ");

        // German operations
        s = s.replaceAll("(?i)\\bgeteilt\\s+durch\\b", " / ")
             .replaceAll("(?i)\\bmal\\b", " * ")
             .replaceAll("(?i)\\bprozent\\b", " % ")
             .replaceAll("(?i)\\bwurzel\\s+aus\\b|\\bquadratwurzel\\b", " sqrt ");

        return s.trim();
    }

    private String extractMathematicalExpression(String input) {
        // Pre-convert unicode math symbols, superscripts and bracket variants
        String s = input.replace("÷", "/")
                        .replace("×", "*")
                        .replace("✕", "*")
                        .replace("·", "*")
                        .replace("−", "-")
                        .replace("–", "-")
                        .replace("—", "-")
                        .replace("π", "pi")
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

        String cleaned = s.replaceAll("[^0-9+\\-*/%^().sqrtcbrtcossintanloglnabsfactpiefE ]", " ");
        cleaned = cleaned.trim().replaceAll("\\s+", " ");

        // Wrap function arguments if missing parens e.g. "sqrt 144" -> "sqrt(144)"
        cleaned = cleaned.replaceAll("sqrt\\s*([0-9.]+)", "sqrt($1)");
        cleaned = cleaned.replaceAll("cbrt\\s*([0-9.]+)", "cbrt($1)");
        cleaned = cleaned.replaceAll("fact\\s*([0-9.]+)", "fact($1)");
        cleaned = cleaned.replaceAll("sin\\s*([0-9.]+)", "sin($1)");
        cleaned = cleaned.replaceAll("cos\\s*([0-9.]+)", "cos($1)");
        cleaned = cleaned.replaceAll("tan\\s*([0-9.]+)", "tan($1)");
        cleaned = cleaned.replaceAll("log\\s*([0-9.]+)", "log($1)");
        cleaned = cleaned.replaceAll("ln\\s*([0-9.]+)", "ln($1)");

        // Remove extra spaces around operators
        cleaned = cleaned.replaceAll("\\s*([+\\-*/%^()])\\s*", "$1");

        // Clean any trailing or leading invalid dangling operators
        cleaned = cleaned.replaceAll("[+\\-*/%^]+$", "");
        cleaned = cleaned.replaceAll("^[+*/%^]+", "");

        // Auto-close missing parentheses
        int openParen = 0;
        for (int i = 0; i < cleaned.length(); i++) {
            char c = cleaned.charAt(i);
            if (c == '(') openParen++;
            else if (c == ')') {
                if (openParen > 0) openParen--;
            }
        }
        while (openParen > 0) {
            cleaned += ")";
            openParen--;
        }

        return cleaned;
    }

    private String formatForSpeech(String result) {
        if (result == null) return "";
        try {
            double val = Double.parseDouble(result);
            if (Math.abs(val - Math.round(val)) < 1e-12) {
                return String.valueOf(Math.round(val));
            }
            BigDecimal bd = BigDecimal.valueOf(val)
                    .setScale(4, RoundingMode.HALF_UP)
                    .stripTrailingZeros();
            return bd.toPlainString();
        } catch (Exception e) {
            return result;
        }
    }

    private String generateSpokenResponse(String result, String lang) {
        String spokenVal = formatForSpeech(result);
        if ("Hindi".equalsIgnoreCase(lang)) {
            return "\u0909\u0924\u094d\u0924\u0930 \u0939\u0948 " + spokenVal;
        } else if ("Spanish".equalsIgnoreCase(lang)) {
            return "El resultado es " + spokenVal;
        } else if ("French".equalsIgnoreCase(lang)) {
            return "Le résultat est " + spokenVal;
        } else if ("German".equalsIgnoreCase(lang)) {
            return "Das Ergebnis ist " + spokenVal;
        }
        return "The result is " + spokenVal;
    }
}
