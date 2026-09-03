package com.smartcalc;

import com.smartcalc.model.AiSolveResponse;
import com.smartcalc.service.LocalNlpMathService;
import com.smartcalc.service.MathEvaluationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class LocalNlpMathServiceTest {

    private LocalNlpMathService nlpService;

    @BeforeEach
    void setUp() {
        MathEvaluationService mathService = new MathEvaluationService();
        nlpService = new LocalNlpMathService(mathService);
    }

    @Test
    void testEnglishSpokenMath() {
        AiSolveResponse res = nlpService.solve("What is twenty plus fifty minus ten?");
        assertTrue(res.isSuccess(), "Response should succeed: " + res.getError());
        assertEquals("60", res.getResult());
        assertEquals("English", res.getDetectedLanguage());
    }

    @Test
    void testHindiSpokenMath() {
        // \u092a\u091a\u093e\u0938 \u092e\u0947\u0902 \u0938\u0947 \u092c\u0940\u0938 \u0918\u091f\u093e\u0915\u0930 = पचास में से बीस घटाकर
        AiSolveResponse res = nlpService.solve("\u092a\u091a\u093e\u0938 \u092e\u0947\u0902 \u0938\u0947 \u092c\u0940\u0938 \u0918\u091f\u093e\u0915\u0930");
        assertTrue(res.isSuccess(), "Response should succeed: " + res.getError());
        assertEquals("30", res.getResult());
        assertEquals("Hindi", res.getDetectedLanguage());
    }

    @Test
    void testSpanishMath() {
        AiSolveResponse res = nlpService.solve("cien dividido por cuatro");
        assertTrue(res.isSuccess(), "Response should succeed: " + res.getError());
        assertEquals("25", res.getResult());
        assertEquals("Spanish", res.getDetectedLanguage());
    }

    @Test
    void testBodmasSymbols() {
        AiSolveResponse res = nlpService.solve("48 + 72 ÷ 8 × 3 - 15");
        assertTrue(res.isSuccess(), "Response should succeed: " + res.getError());
        assertEquals("60", res.getResult(), "BODMAS rule must produce 60 for 48 + 72 / 8 * 3 - 15");
    }

    @Test
    void testAutoCloseParens() {
        AiSolveResponse res = nlpService.solve("cos(0");
        assertTrue(res.isSuccess(), "Response should succeed: " + res.getError());
        assertEquals("1", res.getResult());
    }

    @Test
    void testNestedBracketsAndBODMAS() {
        AiSolveResponse res = nlpService.solve("[120 - {18 + 6 × 4}] ÷ 6 + 17");
        assertTrue(res.isSuccess(), "Response should succeed: " + res.getError());
        assertEquals("30", res.getResult(), "Nested brackets [120 - {18 + 6 * 4}] / 6 + 17 must evaluate to 30");
    }

    @Test
    void testPowerSuperscriptsAndPercentageOf() {
        AiSolveResponse res = nlpService.solve("{100 - [25% of 80]} ÷ 4 + 3² × 2");
        assertTrue(res.isSuccess(), "Response should succeed: " + res.getError());
        assertEquals("38", res.getResult(), "{100 - [25% of 80]} / 4 + 3^2 * 2 must evaluate to 38");
    }
}
