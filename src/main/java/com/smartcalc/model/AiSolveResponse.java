package com.smartcalc.model;

import java.util.List;

public class AiSolveResponse {
    private boolean success;
    private String originalQuery;
    private String detectedLanguage;
    private String translatedQuery;
    private String mathExpression;
    private String result;
    private Double numericResult;
    private List<String> steps;
    private String spokenResponse;
    private String error;
    private String provider; // "gemini", "local-nlp", etc.

    public AiSolveResponse() {}

    public static AiSolveResponse error(String query, String errorMessage) {
        AiSolveResponse response = new AiSolveResponse();
        response.setSuccess(false);
        response.setOriginalQuery(query);
        response.setError(errorMessage);
        response.setSpokenResponse("Sorry, I could not understand or solve this mathematical problem.");
        return response;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getOriginalQuery() {
        return originalQuery;
    }

    public void setOriginalQuery(String originalQuery) {
        this.originalQuery = originalQuery;
    }

    public String getDetectedLanguage() {
        return detectedLanguage;
    }

    public void setDetectedLanguage(String detectedLanguage) {
        this.detectedLanguage = detectedLanguage;
    }

    public String getTranslatedQuery() {
        return translatedQuery;
    }

    public void setTranslatedQuery(String translatedQuery) {
        this.translatedQuery = translatedQuery;
    }

    public String getMathExpression() {
        return mathExpression;
    }

    public void setMathExpression(String mathExpression) {
        this.mathExpression = mathExpression;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public Double getNumericResult() {
        return numericResult;
    }

    public void setNumericResult(Double numericResult) {
        this.numericResult = numericResult;
    }

    public List<String> getSteps() {
        return steps;
    }

    public void setSteps(List<String> steps) {
        this.steps = steps;
    }

    public String getSpokenResponse() {
        return spokenResponse;
    }

    public void setSpokenResponse(String spokenResponse) {
        this.spokenResponse = spokenResponse;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }
}
