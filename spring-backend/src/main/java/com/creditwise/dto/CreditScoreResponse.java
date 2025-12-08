package com.creditwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Credit Score Response DTO
 * =========================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditScoreResponse {
    
    private Integer creditScore;
    private String scoreLabel;  // Poor, Fair, Good, Very Good, Excellent
    private Double defaultProbability;
    private String riskLevel;   // Low, Medium, High
    
    /**
     * Get score label based on credit score.
     */
    public static String getScoreLabel(int score) {
        if (score < 580) return "Poor";
        if (score < 670) return "Fair";
        if (score < 740) return "Good";
        if (score < 800) return "Very Good";
        return "Excellent";
    }
    
    /**
     * Get risk level based on default probability.
     */
    public static String getRiskLevel(double defaultProbability) {
        if (defaultProbability < 0.15) return "Low";
        if (defaultProbability < 0.35) return "Medium";
        return "High";
    }
}

