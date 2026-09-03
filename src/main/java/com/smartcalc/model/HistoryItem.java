package com.smartcalc.model;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class HistoryItem {
    private String id;
    private String expression;
    private String result;
    private String queryType; // "KEYPAD", "VOICE", "AI_TEXT"
    private String originalPrompt;
    private String detectedLanguage;
    private List<String> steps;
    private Instant timestamp;

    public HistoryItem() {
        this.id = UUID.randomUUID().toString();
        this.timestamp = Instant.now();
    }

    public HistoryItem(String expression, String result, String queryType, String originalPrompt, String detectedLanguage, List<String> steps) {
        this.id = UUID.randomUUID().toString();
        this.expression = expression;
        this.result = result;
        this.queryType = queryType;
        this.originalPrompt = originalPrompt;
        this.detectedLanguage = detectedLanguage;
        this.steps = steps;
        this.timestamp = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getExpression() {
        return expression;
    }

    public void setExpression(String expression) {
        this.expression = expression;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public String getQueryType() {
        return queryType;
    }

    public void setQueryType(String queryType) {
        this.queryType = queryType;
    }

    public String getOriginalPrompt() {
        return originalPrompt;
    }

    public void setOriginalPrompt(String originalPrompt) {
        this.originalPrompt = originalPrompt;
    }

    public String getDetectedLanguage() {
        return detectedLanguage;
    }

    public void setDetectedLanguage(String detectedLanguage) {
        this.detectedLanguage = detectedLanguage;
    }

    public List<String> getSteps() {
        return steps;
    }

    public void setSteps(List<String> steps) {
        this.steps = steps;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
