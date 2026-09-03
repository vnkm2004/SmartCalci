package com.smartcalc;

import com.smartcalc.model.CalculationResponse;
import com.smartcalc.service.MathEvaluationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class MathEvaluationServiceTest {

    private MathEvaluationService service;

    @BeforeEach
    void setUp() {
        service = new MathEvaluationService();
    }

    @Test
    void testBasicArithmetic() {
        CalculationResponse r1 = service.evaluate("2 + 3 * 4", "deg", 10);
        assertTrue(r1.isSuccess());
        assertEquals("14", r1.getFormattedResult());

        CalculationResponse r2 = service.evaluate("(10 - 2) / 4", "deg", 10);
        assertTrue(r2.isSuccess());
        assertEquals("2", r2.getFormattedResult());
    }

    @Test
    void testPercentagesAndPowers() {
        CalculationResponse r1 = service.evaluate("200 * 15%", "deg", 10);
        assertTrue(r1.isSuccess());
        assertEquals("30", r1.getFormattedResult());

        CalculationResponse r2 = service.evaluate("2^8", "deg", 10);
        assertTrue(r2.isSuccess());
        assertEquals("256", r2.getFormattedResult());
    }

    @Test
    void testScientificFunctions() {
        CalculationResponse r1 = service.evaluate("sqrt(144)", "deg", 10);
        assertTrue(r1.isSuccess());
        assertEquals("12", r1.getFormattedResult());

        CalculationResponse r2 = service.evaluate("sin(90)", "deg", 10);
        assertTrue(r2.isSuccess());
        assertEquals("1", r2.getFormattedResult());

        CalculationResponse r3 = service.evaluate("fact(5)", "deg", 10);
        assertTrue(r3.isSuccess());
        assertEquals("120", r3.getFormattedResult());
    }

    @Test
    void testDivisionByZero() {
        CalculationResponse r = service.evaluate("10 / 0", "deg", 10);
        assertFalse(r.isSuccess());
    }
}
