package com.smartcalc.model;

import java.util.List;

public class CalculationResponse {
    private boolean success;
    private String expression;
    private String formattedResult;
    private Double numericResult;
    private String error;
    private List<String> steps;

    public CalculationResponse() {}

    public static CalculationResponse ok(String expression, String formattedResult, Double numericResult, List<String> steps) {
        CalculationResponse response = new CalculationResponse();
        response.setSuccess(true);
        response.setExpression(expression);
        response.setFormattedResult(formattedResult);
        response.setNumericResult(numericResult);
        response.setSteps(steps);
        return response;
    }

    public static CalculationResponse error(String expression, String error) {
        CalculationResponse response = new CalculationResponse();
        response.setSuccess(false);
        response.setExpression(expression);
        response.setError(error);
        return response;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getExpression() {
        return expression;
    }

    public void setExpression(String expression) {
        this.expression = expression;
    }

    public String getFormattedResult() {
        return formattedResult;
    }

    public void setFormattedResult(String formattedResult) {
        this.formattedResult = formattedResult;
    }

    public Double getNumericResult() {
        return numericResult;
    }

    public void setNumericResult(Double numericResult) {
        this.numericResult = numericResult;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public List<String> getSteps() {
        return steps;
    }

    public void setSteps(List<String> steps) {
        this.steps = steps;
    }
}
