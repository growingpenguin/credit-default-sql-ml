package com.creditwise.service;

import com.creditwise.dto.MLPredictionRequest;
import com.creditwise.dto.MLPredictionResponse;
import com.creditwise.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for integrating with the FastAPI ML prediction service.
 * 
 * This service acts as a bridge between the Spring Boot REST API and the
 * Python FastAPI service that hosts the trained ML models (TFT, LSTM, SAINT).
 * 
 * Architecture:
 * ┌─────────────────┐      HTTP       ┌─────────────────┐
 * │  Spring Boot    │ ─────────────►  │    FastAPI      │
 * │  (Port 8080)    │    /ml/predict  │  (Port 8000)    │
 * │                 │ ◄───────────── │                 │
 * │  MLPrediction   │   JSON Response │  PyTorch Models │
 * │  Service        │                 │  TFT/LSTM/SAINT │
 * └─────────────────┘                 └─────────────────┘
 */
@Service
@Slf4j
public class MLPredictionService {
    
    private final WebClient webClient;
    private final String mlServiceUrl;
    private final int timeout;
    
    /**
     * Available ML models for prediction
     */
    public enum MLModel {
        TFT("tft", "Temporal Fusion Transformer"),
        LSTM("lstm", "Long Short-Term Memory"),
        SAINT("saint", "Self-Attention and Intersample Attention Transformer"),
        FT_TRANSFORMER("ft_transformer", "Feature Tokenizer Transformer"),
        ENSEMBLE("ensemble", "Ensemble of all models");
        
        private final String code;
        private final String name;
        
        MLModel(String code, String name) {
            this.code = code;
            this.name = name;
        }
        
        public String getCode() { return code; }
        public String getName() { return name; }
    }
    
    public MLPredictionService(
            WebClient.Builder webClientBuilder,
            @Value("${ml.service.url:http://localhost:8000}") String mlServiceUrl,
            @Value("${ml.service.timeout:30000}") int timeout) {
        this.mlServiceUrl = mlServiceUrl;
        this.timeout = timeout;
        this.webClient = webClientBuilder
                .baseUrl(mlServiceUrl)
                .build();
        log.info("ML Prediction Service initialized. URL: {}", mlServiceUrl);
    }
    
    /**
     * Get credit default prediction from ML service.
     * 
     * @param request The prediction request with user financial data
     * @param model The ML model to use (default: TFT)
     * @return MLPredictionResponse with prediction results
     */
    public MLPredictionResponse predict(MLPredictionRequest request, MLModel model) {
        log.info("Requesting ML prediction using model: {}", model.getName());
        
        try {
            // Call FastAPI ML service
            Map<String, Object> response = webClient.post()
                    .uri("/predictions/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(buildRequestBody(request, model))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofMillis(timeout))
                    .block();
            
            return parseResponse(response, model);
            
        } catch (WebClientResponseException e) {
            log.error("ML service error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return createFallbackPrediction(request, "ML service unavailable: " + e.getMessage());
            
        } catch (Exception e) {
            log.error("Error calling ML service: {}", e.getMessage());
            return createFallbackPrediction(request, "Prediction error: " + e.getMessage());
        }
    }
    
    /**
     * Get prediction using the best performing model (TFT).
     */
    public MLPredictionResponse predict(MLPredictionRequest request) {
        return predict(request, MLModel.TFT);
    }
    
    /**
     * Create prediction request from User entity.
     */
    public MLPredictionResponse predictForUser(User user, MLModel model) {
        MLPredictionRequest request = buildRequestFromUser(user);
        return predict(request, model);
    }
    
    /**
     * Check if ML service is available.
     */
    public boolean isServiceAvailable() {
        try {
            webClient.get()
                    .uri("/predictions/health")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();
            return true;
        } catch (Exception e) {
            log.warn("ML service health check failed: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Get list of available ML models from the service.
     */
    public Map<String, Object> getAvailableModels() {
        try {
            return webClient.get()
                    .uri("/predictions/models")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();
        } catch (Exception e) {
            log.error("Error fetching available models: {}", e.getMessage());
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("error", "Unable to fetch models");
            fallback.put("available", false);
            return fallback;
        }
    }
    
    // =========================================================================
    // Private Helper Methods
    // =========================================================================
    
    private Map<String, Object> buildRequestBody(MLPredictionRequest request, MLModel model) {
        Map<String, Object> body = new HashMap<>();
        body.put("model", model.getCode());
        body.put("features", request);
        return body;
    }
    
    private MLPredictionRequest buildRequestFromUser(User user) {
        // Map user profile to ML features
        // This is a simplified mapping - in production, you'd have more data
        return MLPredictionRequest.builder()
                .limitBal(user.getCreditLimit() != null ? user.getCreditLimit() : 50000.0)
                .sex(1) // Default, should come from user profile
                .education(2) // Default
                .marriage(1) // Default
                .age(calculateAge(user))
                .pay0(mapPaymentFrequency(user.getPaymentFrequency()))
                .pay2(mapPaymentFrequency(user.getPaymentFrequency()))
                .pay3(mapPaymentFrequency(user.getPaymentFrequency()))
                .pay4(mapPaymentFrequency(user.getPaymentFrequency()))
                .pay5(mapPaymentFrequency(user.getPaymentFrequency()))
                .pay6(mapPaymentFrequency(user.getPaymentFrequency()))
                .billAmt1(calculateBillAmount(user))
                .billAmt2(calculateBillAmount(user) * 0.95)
                .billAmt3(calculateBillAmount(user) * 0.90)
                .billAmt4(calculateBillAmount(user) * 0.85)
                .billAmt5(calculateBillAmount(user) * 0.80)
                .billAmt6(calculateBillAmount(user) * 0.75)
                .payAmt1(calculatePaymentAmount(user))
                .payAmt2(calculatePaymentAmount(user))
                .payAmt3(calculatePaymentAmount(user))
                .payAmt4(calculatePaymentAmount(user))
                .payAmt5(calculatePaymentAmount(user))
                .payAmt6(calculatePaymentAmount(user))
                .build();
    }
    
    private Integer calculateAge(User user) {
        if (user.getDateOfBirth() != null) {
            java.time.LocalDate birthDate = user.getDateOfBirth().toLocalDate();
            return java.time.Period.between(birthDate, java.time.LocalDate.now()).getYears();
        }
        return 35; // Default age
    }
    
    private Integer mapPaymentFrequency(String frequency) {
        if (frequency == null) return 0;
        return switch (frequency.toLowerCase()) {
            case "always" -> -1;  // Pay duly
            case "usually" -> 0;  // No delay
            case "sometimes" -> 1; // 1 month delay
            case "rarely" -> 2;   // 2 months delay
            default -> 0;
        };
    }
    
    private Double calculateBillAmount(User user) {
        if (user.getCreditLimit() != null && user.getCreditUtilization() != null) {
            return user.getCreditLimit() * (user.getCreditUtilization() / 100.0);
        }
        return 10000.0; // Default
    }
    
    private Double calculatePaymentAmount(User user) {
        if (user.getMonthlyExpenses() != null) {
            return user.getMonthlyExpenses() * 0.3; // Assume 30% of expenses as payment
        }
        return 1000.0; // Default
    }
    
    private MLPredictionResponse parseResponse(Map<String, Object> response, MLModel model) {
        Double probability = response.containsKey("default_probability") 
                ? ((Number) response.get("default_probability")).doubleValue()
                : 0.5;
        
        Integer prediction = response.containsKey("prediction")
                ? ((Number) response.get("prediction")).intValue()
                : (probability > 0.5 ? 1 : 0);
        
        String riskLevel = MLPredictionResponse.calculateRiskLevel(probability);
        Integer creditScore = MLPredictionResponse.calculateCreditScore(probability);
        
        return MLPredictionResponse.builder()
                .defaultProbability(probability)
                .prediction(prediction)
                .riskLevel(riskLevel)
                .riskCategory(riskLevel + " Risk")
                .modelUsed(model.getName())
                .confidence(response.containsKey("confidence") 
                        ? ((Number) response.get("confidence")).doubleValue()
                        : Math.abs(probability - 0.5) * 2)
                .recommendedCreditScore(creditScore)
                .timestamp(LocalDateTime.now())
                .recommendation(MLPredictionResponse.generateRecommendation(riskLevel))
                .build();
    }
    
    /**
     * Create a fallback prediction when ML service is unavailable.
     * Uses a simple rule-based approach.
     */
    private MLPredictionResponse createFallbackPrediction(MLPredictionRequest request, String reason) {
        log.warn("Using fallback prediction: {}", reason);
        
        // Simple rule-based fallback
        double probability = 0.3; // Default medium-low risk
        
        // Adjust based on payment history
        if (request.getPay0() != null && request.getPay0() > 0) {
            probability += 0.15 * request.getPay0();
        }
        
        // Adjust based on credit utilization (bill / limit)
        if (request.getBillAmt1() != null && request.getLimitBal() != null && request.getLimitBal() > 0) {
            double utilization = request.getBillAmt1() / request.getLimitBal();
            if (utilization > 0.8) probability += 0.2;
            else if (utilization > 0.5) probability += 0.1;
        }
        
        probability = Math.min(1.0, Math.max(0.0, probability));
        String riskLevel = MLPredictionResponse.calculateRiskLevel(probability);
        
        return MLPredictionResponse.builder()
                .defaultProbability(probability)
                .prediction(probability > 0.5 ? 1 : 0)
                .riskLevel(riskLevel)
                .riskCategory(riskLevel + " Risk (Estimated)")
                .modelUsed("Rule-Based Fallback")
                .confidence(0.6)
                .recommendedCreditScore(MLPredictionResponse.calculateCreditScore(probability))
                .timestamp(LocalDateTime.now())
                .recommendation(MLPredictionResponse.generateRecommendation(riskLevel) 
                        + " Note: " + reason)
                .build();
    }
}

