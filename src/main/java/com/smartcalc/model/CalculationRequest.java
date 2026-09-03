package com.smartcalc.model;

public class CalculationRequest {
    private String expression;
    private String angleUnit = "deg"; // "deg" or "rad"
    private Integer precision = 10;

    public CalculationRequest() {}

    public CalculationRequest(String expression, String angleUnit, Integer precision) {
        this.expression = expression;
        this.angleUnit = angleUnit != null ? angleUnit : "deg";
        this.precision = precision != null ? precision : 10;
    }

    public String getExpression() {
        return expression;
    }

    public void setExpression(String expression) {
        this.expression = expression;
    }

    public String getAngleUnit() {
        return angleUnit;
    }

    public void setAngleUnit(String angleUnit) {
        this.angleUnit = angleUnit;
    }

    public Integer getPrecision() {
        return precision;
    }

    public void setPrecision(Integer precision) {
        this.precision = precision;
    }
}
