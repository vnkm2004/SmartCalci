package com.smartcalc.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcalc.model.AiSolveResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
public class GeminiAiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiService.class);

    private final ObjectMapper objectMapper;
    private final LocalNlpMathService localNlpMathService;
    private final MathEvaluationService mathEvaluationService;
    private final HttpClient httpClient;

    @Value("${gemini.api.key:}")
    private String defaultApiKey;

    @Value("${gemini.api.model:gemini-2.5-flash}")
    private String apiModel;

    private String userConfiguredApiKey = "";
    private final List<String> cachedDiscoveredModels = new ArrayList<>();
    private long lastDiscoveryTime = 0;

    private static final List<String> STABLE_MODELS = List.of(
            "gemini-2.0-flash",
            "gemini-2.5-flash",
            "gemini-1.5-flash",
            "gemini-2.5-pro",
            "gemini-1.5-pro"
    );

    public GeminiAiService(ObjectMapper objectMapper,
                            LocalNlpMathService localNlpMathService,
                            MathEvaluationService mathEvaluationService) {
        this.objectMapper = objectMapper;
        this.localNlpMathService = localNlpMathService;
        this.mathEvaluationService = mathEvaluationService;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public void setCustomApiKey(String key) {
        this.userConfiguredApiKey = key != null ? key.trim() : "";
        this.cachedDiscoveredModels.clear();
        this.lastDiscoveryTime = 0;
    }

    public String getEffectiveApiKey(String overrideKey) {
        if (overrideKey != null && !overrideKey.trim().isEmpty()) {
            return overrideKey.trim();
        }
        if (userConfiguredApiKey != null && !userConfiguredApiKey.isEmpty()) {
            return userConfiguredApiKey;
        }
        return defaultApiKey != null ? defaultApiKey.trim() : "";
    }

    public boolean hasValidKey(String overrideKey) {
        String key = getEffectiveApiKey(overrideKey);
        return key != null && !key.isEmpty();
    }

    public AiSolveResponse processTextQuery(String query, String requestApiKey) {
        String key = getEffectiveApiKey(requestApiKey);
        if (key.isEmpty()) {
            log.info("No Gemini API key available. Solving with local NLP engine for: {}", query);
            return localNlpMathService.solve(query);
        }

        try {
            return tryModelsWithFallback(query, null, null, key);
        } catch (Exception e) {
            log.warn("Gemini API text call failed ({}), falling back to local NLP.", e.getMessage());
            AiSolveResponse fallback = localNlpMathService.solve(query);
            fallback.setProvider("local-nlp (instant fallback)");
            return fallback;
        }
    }

    public AiSolveResponse processAudio(String audioBase64, String mimeType, String optionalTranscript, String requestApiKey) {
        String key = getEffectiveApiKey(requestApiKey);
        String cleanMime = (mimeType != null && !mimeType.trim().isEmpty()) ? mimeType.split(";")[0].trim() : "audio/webm";

        // 1. If transcript is present from speech recognition, solve instantly
        if (optionalTranscript != null && !optionalTranscript.trim().isEmpty()) {
            try {
                if (!key.isEmpty()) {
                    AiSolveResponse textResp = tryModelsWithFallback(optionalTranscript, null, null, key);
                    if (textResp != null && textResp.isSuccess()) {
                        return textResp;
                    }
                }
            } catch (Exception ex) {
                log.warn("Gemini text call on transcript had issue: {}", ex.getMessage());
            }

            // High precision offline solver fallback
            AiSolveResponse localResp = localNlpMathService.solve(optionalTranscript);
            if (localResp != null && localResp.isSuccess()) {
                return localResp;
            }
        }

        // 2. Multimodal direct audio processing with Gemini
        if (!key.isEmpty() && audioBase64 != null && !audioBase64.trim().isEmpty()) {
            try {
                return tryModelsWithFallback(optionalTranscript, audioBase64, cleanMime, key);
            } catch (Exception e) {
                log.warn("Multimodal audio failed: {}", e.getMessage());
            }
        }

        // 3. Fallback on transcript if available
        if (optionalTranscript != null && !optionalTranscript.trim().isEmpty()) {
            return localNlpMathService.solve(optionalTranscript);
        }

        // 4. Return helpful guidance response
        AiSolveResponse fallbackPrompt = new AiSolveResponse();
        fallbackPrompt.setSuccess(false);
        fallbackPrompt.setError("Please speak your math question into the microphone or type it in the solve box.");
        fallbackPrompt.setSpokenResponse("Please speak your math problem into the microphone.");
        return fallbackPrompt;
    }

    private synchronized void discoverAvailableModels(String apiKey) {
        if (System.currentTimeMillis() - lastDiscoveryTime < 300000 && !cachedDiscoveredModels.isEmpty()) {
            return;
        }
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey;
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .timeout(Duration.ofSeconds(6))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode modelsNode = root.path("models");
                if (modelsNode.isArray()) {
                    cachedDiscoveredModels.clear();
                    for (JsonNode m : modelsNode) {
                        String name = m.path("name").asText("");
                        if (name.startsWith("models/")) {
                            name = name.substring("models/".length());
                        }
                        JsonNode supportedMethods = m.path("supportedGenerationMethods");
                        boolean supportsGenerate = false;
                        if (supportedMethods.isArray()) {
                            for (JsonNode method : supportedMethods) {
                                if ("generateContent".equals(method.asText())) {
                                    supportsGenerate = true;
                                    break;
                                }
                            }
                        }
                        if (supportsGenerate && name.contains("flash") && !name.contains("pro")) {
                            cachedDiscoveredModels.add(name);
                        }
                    }
                    lastDiscoveryTime = System.currentTimeMillis();
                    log.info("Discovered available flash models from Google AI Studio: {}", cachedDiscoveredModels);
                }
            }
        } catch (Exception e) {
            log.warn("Could not query model list from Google: {}", e.getMessage());
        }
    }

    private AiSolveResponse tryModelsWithFallback(String textPrompt, String audioBase64, String mimeType, String apiKey) throws Exception {
        List<String> modelsToTry = new ArrayList<>();

        // 1. Prioritize active multimodal models FIRST
        if (apiModel != null && !apiModel.trim().isEmpty()) {
            String cleanDefault = apiModel.startsWith("models/") ? apiModel.substring("models/".length()) : apiModel;
            modelsToTry.add(cleanDefault);
        }
        for (String m : STABLE_MODELS) {
            if (!modelsToTry.contains(m)) {
                modelsToTry.add(m);
            }
        }

        // 2. Discover auxiliary models only if needed
        discoverAvailableModels(apiKey);
        for (String m : cachedDiscoveredModels) {
            String clean = m.startsWith("models/") ? m.substring("models/".length()) : m;
            if (!modelsToTry.contains(clean) && clean.toLowerCase().contains("gemini")) {
                modelsToTry.add(clean);
            }
        }

        Exception lastException = null;
        for (String cleanModel : modelsToTry) {
            try {
                return executeGeminiRequest(cleanModel, textPrompt, audioBase64, mimeType, apiKey);
            } catch (Exception ex) {
                log.warn("Model '{}' attempt failed: {}. Trying next...", cleanModel, ex.getMessage());
                lastException = ex;
            }
        }

        throw (lastException != null) ? lastException : new RuntimeException("All Gemini models exhausted");
    }

    private AiSolveResponse executeGeminiRequest(String targetModel, String textPrompt, String audioBase64, String mimeType, String apiKey) throws Exception {
        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                targetModel, apiKey);

        String systemPrompt = """
                You are a Smart Multilingual Mathematical AI Assistant for a Smart Calculator.
                Your task is to analyze user queries (which may be in English, Hindi, Spanish, French, German, Japanese, Chinese, Russian, Arabic, etc., or direct audio).
                1. Identify the spoken/written language.
                2. If the query is in another language, translate the math question to clear English.
                3. Decode the exact mathematical expression to solve.
                4. Compute the precise step-by-step mathematical solution and final numerical answer.
                5. Provide a short, robotic spoken answer phrase in the original language (or English if unknown) rounding decimals to at most 3 or 4 decimal places for speech.
                
                You MUST return ONLY valid JSON strictly adhering to this format (no markdown formatting, no backticks, no other text):
                {
                  "detectedLanguage": "Language Name",
                  "translatedQuery": "Translated English Question or normalized query",
                  "mathExpression": "Pure mathematical expression like sqrt(10) or (50 - 20) * 5",
                  "result": "Numeric result as string e.g. 3.1622776602",
                  "steps": [
                    "Step 1 explanation",
                    "Step 2 explanation",
                    "Final result explanation"
                  ],
                  "spokenResponse": "The result is 3.1623"
                }
                """;

        Map<String, Object> requestBody = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> content = new HashMap<>();
        List<Map<String, Object>> parts = new ArrayList<>();

        // Add instructions text part
        Map<String, Object> textPart = new HashMap<>();
        String promptContent = (textPrompt != null && !textPrompt.trim().isEmpty())
                ? "Solve this math problem: " + textPrompt
                : "Listen to the audio math problem, decode it, and solve it.";
        textPart.put("text", systemPrompt + "\n\nUser Input: " + promptContent);
        parts.add(textPart);

        // Add audio part if base64 provided
        if (audioBase64 != null && !audioBase64.trim().isEmpty()) {
            Map<String, Object> inlineData = new HashMap<>();
            inlineData.put("mimeType", mimeType != null ? mimeType : "audio/webm");
            inlineData.put("data", audioBase64);
            Map<String, Object> audioPart = new HashMap<>();
            audioPart.put("inlineData", inlineData);
            parts.add(audioPart);
        }

        content.put("parts", parts);
        contents.add(content);
        requestBody.put("contents", contents);

        // Generation config for JSON
        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("responseMimeType", "application/json");
        genConfig.put("temperature", 0.1);
        requestBody.put("generationConfig", genConfig);

        String jsonPayload = objectMapper.writeValueAsString(requestBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(Duration.ofSeconds(15))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Gemini API returned status " + response.statusCode() + ": " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode candidates = root.path("candidates");
        if (candidates.isEmpty()) {
            throw new RuntimeException("Gemini API returned no candidates");
        }

        String rawResponseText = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
        rawResponseText = rawResponseText.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

        JsonNode parsedJson = objectMapper.readTree(rawResponseText);

        AiSolveResponse res = new AiSolveResponse();
        res.setSuccess(true);
        res.setOriginalQuery(textPrompt != null ? textPrompt : "Voice Audio");
        res.setDetectedLanguage(parsedJson.path("detectedLanguage").asText("Auto-detected"));
        res.setTranslatedQuery(parsedJson.path("translatedQuery").asText(""));
        res.setMathExpression(parsedJson.path("mathExpression").asText(""));
        res.setResult(parsedJson.path("result").asText(""));

        try {
            res.setNumericResult(Double.parseDouble(res.getResult()));
        } catch (Exception ignored) {}

        List<String> stepList = new ArrayList<>();
        if (parsedJson.has("steps") && parsedJson.path("steps").isArray()) {
            for (JsonNode stepNode : parsedJson.path("steps")) {
                stepList.add(stepNode.asText());
            }
        }
        res.setSteps(stepList);
        res.setSpokenResponse(parsedJson.path("spokenResponse").asText("Result is " + res.getResult()));
        res.setProvider("gemini (" + targetModel + ")");

        return res;
    }
}
