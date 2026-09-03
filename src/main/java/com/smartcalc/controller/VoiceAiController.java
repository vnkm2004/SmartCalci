package com.smartcalc.controller;

import com.smartcalc.model.AiSolveResponse;
import com.smartcalc.model.HistoryItem;
import com.smartcalc.model.VoiceProcessRequest;
import com.smartcalc.service.GeminiAiService;
import com.smartcalc.service.HistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class VoiceAiController {

    private final GeminiAiService geminiAiService;
    private final HistoryService historyService;

    public VoiceAiController(GeminiAiService geminiAiService, HistoryService historyService) {
        this.geminiAiService = geminiAiService;
        this.historyService = historyService;
    }

    @PostMapping("/ai/solve")
    public ResponseEntity<AiSolveResponse> solveMathProblem(@RequestBody VoiceProcessRequest request) {
        String query = request.getTranscript();
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(AiSolveResponse.error("", "Transcript/query text cannot be empty"));
        }

        AiSolveResponse response = geminiAiService.processTextQuery(query, request.getApiKey());

        if (response.isSuccess()) {
            HistoryItem item = new HistoryItem(
                    response.getMathExpression() != null ? response.getMathExpression() : query,
                    response.getResult(),
                    "AI_TEXT",
                    query,
                    response.getDetectedLanguage(),
                    response.getSteps()
            );
            historyService.add(item);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/voice/process")
    public ResponseEntity<AiSolveResponse> processVoiceAudio(@RequestBody VoiceProcessRequest request) {
        AiSolveResponse response = geminiAiService.processAudio(
                request.getAudioBase64(),
                request.getMimeType(),
                request.getTranscript(),
                request.getApiKey()
        );

        if (response.isSuccess()) {
            HistoryItem item = new HistoryItem(
                    response.getMathExpression() != null ? response.getMathExpression() : request.getTranscript(),
                    response.getResult(),
                    "VOICE",
                    request.getTranscript() != null ? request.getTranscript() : "Audio Recording",
                    response.getDetectedLanguage(),
                    response.getSteps()
            );
            historyService.add(item);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/voice/upload")
    public ResponseEntity<AiSolveResponse> uploadVoiceFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "transcript", required = false) String transcript,
            @RequestParam(value = "apiKey", required = false) String apiKey
    ) {
        try {
            byte[] bytes = file.getBytes();
            String base64 = Base64.getEncoder().encodeToString(bytes);
            String mimeType = file.getContentType() != null ? file.getContentType() : "audio/webm";

            AiSolveResponse response = geminiAiService.processAudio(base64, mimeType, transcript, apiKey);

            if (response.isSuccess()) {
                HistoryItem item = new HistoryItem(
                        response.getMathExpression() != null ? response.getMathExpression() : transcript,
                        response.getResult(),
                        "VOICE",
                        transcript != null ? transcript : file.getOriginalFilename(),
                        response.getDetectedLanguage(),
                        response.getSteps()
                );
                historyService.add(item);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(AiSolveResponse.error("Audio Upload", "File upload failed: " + e.getMessage()));
        }
    }
}
