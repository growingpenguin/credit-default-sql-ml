package com.creditwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Response DTO for ML credit default prediction.
 * 
 * Contains prediction results from the ML models including:
 * - Default probability (0-1)
 * - Risk classification (Low/Medium/High)
 * - Model used for prediction
 * - Confidence scores
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MLPredictionResponse {
    
    /**
     * Probability of credit default (0.0 - 1.0)
     * Higher value = higher risk of default
     */
    @JsonProperty("default_probability")
    private Double defaultProbability;
    
    /**
     * Binary prediction: 0 = no default, 1 = default
     */
    @JsonProperty("prediction")
    private Integer prediction;
    
    /**
     * Risk level classification
     */
    @JsonProperty("risk_level")
    private String riskLevel;
    
    /**
     * Risk category description
     */
    @JsonProperty("risk_category")
    private String riskCategory;
    
    /**
     * ML model used for prediction
     */
    @JsonProperty("model_used")
    private String modelUsed;
    
    /**
     * Model confidence score (0.0 - 1.0)
     */
    @JsonProperty("confidence")
    private Double confidence;
    
    /**
     * Recommended credit score based on prediction
     */
    @JsonProperty("recommended_credit_score")
    private Integer recommendedCreditScore;
    
    /**
     * Feature importance for explainability
     */
    @JsonProperty("feature_importance")
    private Map<String, Double> featureImportance;
    
    /**
     * Timestamp of prediction
     */
    @JsonProperty("timestamp")
    private LocalDateTime timestamp;
    
    /**
     * Additional recommendation based on risk level
     */
    @JsonProperty("recommendation")
    private String recommendation;
    
    /**
     * Calculate risk level from default probability
     */
    public static String calculateRiskLevel(Double probability) {
        if (probability == null) return "Unknown";
        if (probability < 0.2) return "Very Low";
        if (probability < 0.4) return "Low";
        if (probability < 0.6) return "Medium";
        if (probability < 0.8) return "High";
        return "Very High";
    }
    
    /**
     * Calculate recommended credit score from default probability
     * Maps probability to 300-850 credit score range
     */
    public static Integer calculateCreditScore(Double probability) {
        if (probability == null) return 650;
        // Inverse relationship: low probability = high score
        double score = 850 - (probability * 550);
        return Math.max(300, Math.min(850, (int) Math.round(score)));
    }
    
    /**
     * Generate recommendation based on risk level
     */
    public static String generateRecommendation(String riskLevel) {
        return switch (riskLevel) {
            case "Very Low" -> "Excellent credit profile. Eligible for premium loan products with lowest APR rates.";
            case "Low" -> "Good credit profile. Eligible for most loan products with competitive rates.";
            case "Medium" -> "Average credit profile. Consider debt consolidation to improve score.";
            case "High" -> "Elevated risk detected. Recommend reducing credit utilization before applying.";
            case "Very High" -> "High risk profile. Consider credit counseling and debt management programs.";
            default -> "Unable to generate recommendation. Please provide complete financial information.";
        };
    }
}

