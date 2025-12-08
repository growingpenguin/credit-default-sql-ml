package com.creditwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Loan Recommendation Response DTO
 * =================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanRecommendationResponse {
    
    private Integer creditScore;
    private Integer totalProducts;
    private List<PersonalizedLoan> recommendations;
    
    /**
     * Personalized loan with calculated APR and approval probability
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonalizedLoan {
        private LoanProductResponse product;
        private Double estimatedApr;
        private Integer approvalProbability;
        private Double monthlyPayment;
        private Boolean isPreQualified;
        private Boolean isBestMatch;
    }
}

