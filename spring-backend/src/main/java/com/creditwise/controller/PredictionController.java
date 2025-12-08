package com.creditwise.controller;

import com.creditwise.dto.MLPredictionRequest;
import com.creditwise.dto.MLPredictionResponse;
import com.creditwise.entity.User;
import com.creditwise.repository.UserRepository;
import com.creditwise.service.MLPredictionService;
import com.creditwise.service.MLPredictionService.MLModel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for ML-based credit default predictions.
 * 
 * Provides endpoints to:
 * - Get credit risk predictions using trained ML models
 * - Check ML service health
 * - List available models
 * 
 * This controller integrates Spring Boot with the FastAPI ML service
 * that hosts PyTorch models (TFT, LSTM, SAINT, FT-Transformer).
 */
@RestController
@RequestMapping("/predictions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "ML Predictions", description = "Credit default prediction using ML models")
public class PredictionController {
    
    private final MLPredictionService mlPredictionService;
    private final UserRepository userRepository;
    
    /**
     * Get credit default prediction for current user.
     * Uses the user's financial profile to predict default probability.
     */
    @GetMapping("/my-risk")
    @Operation(
        summary = "Get my credit risk prediction",
        description = "Predict credit default probability using your financial profile",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<MLPredictionResponse> getMyRiskPrediction(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ML model to use (tft, lstm, saint, ft_transformer)")
            @RequestParam(defaultValue = "tft") String model
    ) {
        log.info("Getting risk prediction for user: {}", userDetails.getUsername());
        
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        MLModel mlModel = parseModel(model);
        MLPredictionResponse prediction = mlPredictionService.predictForUser(user, mlModel);
        
        // Update user's default probability
        user.setDefaultProbability(prediction.getDefaultProbability());
        userRepository.save(user);
        
        return ResponseEntity.ok(prediction);
    }
    
    /**
     * Get credit default prediction with custom features.
     * For testing or advanced users who want to specify exact feature values.
     */
    @PostMapping("/predict")
    @Operation(
        summary = "Get prediction with custom features",
        description = "Submit custom financial features for credit risk prediction"
    )
    public ResponseEntity<MLPredictionResponse> predict(
            @RequestBody MLPredictionRequest request,
            @Parameter(description = "ML model to use (tft, lstm, saint, ft_transformer, ensemble)")
            @RequestParam(defaultValue = "tft") String model
    ) {
        log.info("Processing custom prediction request with model: {}", model);
        
        MLModel mlModel = parseModel(model);
        MLPredictionResponse prediction = mlPredictionService.predict(request, mlModel);
        
        return ResponseEntity.ok(prediction);
    }
    
    /**
     * Get sample prediction to test the ML integration.
     * Uses predefined sample data.
     */
    @GetMapping("/sample")
    @Operation(
        summary = "Get sample prediction",
        description = "Test the ML prediction with sample data"
    )
    public ResponseEntity<Map<String, Object>> getSamplePrediction(
            @Parameter(description = "ML model to use")
            @RequestParam(defaultValue = "tft") String model
    ) {
        log.info("Processing sample prediction request");
        
        MLPredictionRequest sampleRequest = MLPredictionRequest.createSample();
        MLModel mlModel = parseModel(model);
        MLPredictionResponse prediction = mlPredictionService.predict(sampleRequest, mlModel);
        
        Map<String, Object> response = new HashMap<>();
        response.put("request", sampleRequest);
        response.put("prediction", prediction);
        response.put("note", "This is a sample prediction using default values");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Compare predictions across all available models.
     */
    @PostMapping("/compare")
    @Operation(
        summary = "Compare predictions across models",
        description = "Get predictions from all available ML models for comparison"
    )
    public ResponseEntity<Map<String, MLPredictionResponse>> comparePredictions(
            @RequestBody MLPredictionRequest request
    ) {
        log.info("Processing comparison request across all models");
        
        Map<String, MLPredictionResponse> results = new HashMap<>();
        
        for (MLModel model : MLModel.values()) {
            if (model != MLModel.ENSEMBLE) {
                try {
                    results.put(model.getCode(), mlPredictionService.predict(request, model));
                } catch (Exception e) {
                    log.warn("Model {} failed: {}", model.getCode(), e.getMessage());
                }
            }
        }
        
        return ResponseEntity.ok(results);
    }
    
    /**
     * Check ML service health status.
     */
    @GetMapping("/health")
    @Operation(
        summary = "Check ML service health",
        description = "Verify connectivity to the FastAPI ML service"
    )
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> health = new HashMap<>();
        
        boolean isAvailable = mlPredictionService.isServiceAvailable();
        health.put("ml_service_available", isAvailable);
        health.put("status", isAvailable ? "healthy" : "degraded");
        health.put("message", isAvailable 
                ? "ML service is available for predictions"
                : "ML service unavailable - fallback predictions will be used");
        
        return ResponseEntity.ok(health);
    }
    
    /**
     * Get list of available ML models.
     */
    @GetMapping("/models")
    @Operation(
        summary = "List available ML models",
        description = "Get information about available ML models for prediction"
    )
    public ResponseEntity<Map<String, Object>> getAvailableModels() {
        Map<String, Object> response = new HashMap<>();
        
        // Local model info
        Map<String, String> localModels = new HashMap<>();
        for (MLModel model : MLModel.values()) {
            localModels.put(model.getCode(), model.getName());
        }
        response.put("available_models", localModels);
        response.put("default_model", "tft");
        response.put("best_model", "tft");
        response.put("best_model_auc", 0.7745);
        
        // Try to get live info from ML service
        try {
            Map<String, Object> liveInfo = mlPredictionService.getAvailableModels();
            response.put("ml_service_info", liveInfo);
        } catch (Exception e) {
            response.put("ml_service_info", "Unable to fetch live model info");
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get model performance metrics.
     */
    @GetMapping("/models/performance")
    @Operation(
        summary = "Get model performance metrics",
        description = "View AUC-ROC scores and other metrics for each model"
    )
    public ResponseEntity<Map<String, Object>> getModelPerformance() {
        Map<String, Object> performance = new HashMap<>();
        
        // Based on actual training results
        Map<String, Double> aucScores = new HashMap<>();
        aucScores.put("tft", 0.7745);
        aucScores.put("lstm", 0.7740);
        aucScores.put("xgboost", 0.7665);
        aucScores.put("lightgbm", 0.7664);
        aucScores.put("random_forest", 0.7663);
        aucScores.put("ft_transformer", 0.7647);
        aucScores.put("saint", 0.7632);
        aucScores.put("logistic_regression", 0.7494);
        
        performance.put("auc_roc_scores", aucScores);
        performance.put("best_model", "tft");
        performance.put("metric", "AUC-ROC");
        performance.put("dataset", "UCI Credit Card Default");
        performance.put("test_size", "20%");
        
        return ResponseEntity.ok(performance);
    }
    
    // =========================================================================
    // Helper Methods
    // =========================================================================
    
    private MLModel parseModel(String modelStr) {
        try {
            return MLModel.valueOf(modelStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            // Try matching by code
            for (MLModel model : MLModel.values()) {
                if (model.getCode().equalsIgnoreCase(modelStr)) {
                    return model;
                }
            }
            log.warn("Unknown model '{}', using default TFT", modelStr);
            return MLModel.TFT;
        }
    }
}

