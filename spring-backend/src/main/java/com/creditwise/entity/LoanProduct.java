package com.creditwise.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Loan Product Entity
 * ===================
 * Represents loan products from LendingClub and other lenders.
 * Contains real APR rates based on credit score grades.
 */
@Entity
@Table(name = "loan_products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", unique = true, nullable = false)
    private String productId;

    // =========================================================================
    // Product Information
    // =========================================================================
    
    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "lender_name", nullable = false)
    private String lenderName;

    @Column(name = "loan_type", nullable = false)
    private String loanType;  // personal, debt_consolidation, home, car, education

    @Column(nullable = false)
    private String grade;  // A, B, C, D, E

    @Column(length = 500)
    private String description;

    // =========================================================================
    // Credit Requirements
    // =========================================================================
    
    @Column(name = "min_credit_score", nullable = false)
    private Integer minCreditScore;

    @Column(name = "max_credit_score", nullable = false)
    private Integer maxCreditScore;

    // =========================================================================
    // Loan Terms
    // =========================================================================
    
    @Column(name = "min_apr", nullable = false)
    private Double minApr;

    @Column(name = "max_apr", nullable = false)
    private Double maxApr;

    @Column(name = "min_amount", nullable = false)
    private Double minAmount;

    @Column(name = "max_amount", nullable = false)
    private Double maxAmount;

    @Column(name = "terms_months", nullable = false)
    private String termsMonths;  // Comma-separated: "36,48,60"

    @Column(name = "origination_fee_pct")
    @Builder.Default
    private Double originationFeePct = 0.0;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}

