package com.creditwise.dto;

import com.creditwise.entity.LoanProduct;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Loan Product Response DTO
 * =========================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanProductResponse {
    
    private Long id;
    private String productId;
    private String productName;
    private String lenderName;
    private String loanType;
    private String grade;
    private String description;
    private Integer minCreditScore;
    private Integer maxCreditScore;
    private Double minApr;
    private Double maxApr;
    private Double minAmount;
    private Double maxAmount;
    private String termsMonths;
    private Double originationFeePct;
    
    public static LoanProductResponse fromEntity(LoanProduct product) {
        return LoanProductResponse.builder()
                .id(product.getId())
                .productId(product.getProductId())
                .productName(product.getProductName())
                .lenderName(product.getLenderName())
                .loanType(product.getLoanType())
                .grade(product.getGrade())
                .description(product.getDescription())
                .minCreditScore(product.getMinCreditScore())
                .maxCreditScore(product.getMaxCreditScore())
                .minApr(product.getMinApr())
                .maxApr(product.getMaxApr())
                .minAmount(product.getMinAmount())
                .maxAmount(product.getMaxAmount())
                .termsMonths(product.getTermsMonths())
                .originationFeePct(product.getOriginationFeePct())
                .build();
    }
}

