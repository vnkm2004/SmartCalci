package com.smartcalc.controller;

import com.smartcalc.service.GeminiAiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
@CrossOrigin(origins = "*")
public class ConfigController {

    private final GeminiAiService geminiAiService;

    public ConfigController(GeminiAiService geminiAiService) {
        this.geminiAiService = geminiAiService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("appName", "Smart AI Voice Calculator");
        status.put("version", "1.0.0");
        status.put("status", "ONLINE");
        status.put("geminiConfigured", geminiAiService.hasValidKey(null));
        status.put("audioDecoding", true);
        status.put("localNlpFallback", true);
        return ResponseEntity.ok(status);
    }

    @PostMapping("/key")
    public ResponseEntity<Map<String, Object>> saveApiKey(@RequestBody Map<String, String> payload) {
        String key = payload.get("apiKey");
        geminiAiService.setCustomApiKey(key);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("geminiConfigured", geminiAiService.hasValidKey(null));
        res.put("message", "API key updated successfully for current session.");
        return ResponseEntity.ok(res);
    }
}
