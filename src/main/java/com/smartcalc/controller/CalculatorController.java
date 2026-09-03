package com.smartcalc.controller;

import com.smartcalc.model.CalculationRequest;
import com.smartcalc.model.CalculationResponse;
import com.smartcalc.model.HistoryItem;
import com.smartcalc.service.HistoryService;
import com.smartcalc.service.MathEvaluationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class CalculatorController {

    private final MathEvaluationService mathEvaluationService;
    private final HistoryService historyService;

    public CalculatorController(MathEvaluationService mathEvaluationService, HistoryService historyService) {
        this.mathEvaluationService = mathEvaluationService;
        this.historyService = historyService;
    }

    @PostMapping("/calculate")
    public ResponseEntity<CalculationResponse> calculate(@RequestBody CalculationRequest request) {
        CalculationResponse response = mathEvaluationService.evaluate(
                request.getExpression(),
                request.getAngleUnit(),
                request.getPrecision() != null ? request.getPrecision() : 10
        );

        if (response.isSuccess()) {
            HistoryItem item = new HistoryItem(
                    response.getExpression(),
                    response.getFormattedResult(),
                    "KEYPAD",
                    request.getExpression(),
                    "Math",
                    response.getSteps()
            );
            historyService.add(item);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<HistoryItem>> getHistory() {
        return ResponseEntity.ok(historyService.getAll());
    }

    @DeleteMapping("/history")
    public ResponseEntity<Void> clearHistory() {
        historyService.clear();
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<Void> deleteHistoryItem(@PathVariable String id) {
        boolean removed = historyService.delete(id);
        if (removed) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
