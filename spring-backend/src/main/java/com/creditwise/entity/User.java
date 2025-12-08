package com.creditwise.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * User Entity
 * ===========
 * Represents a customer in the CreditWise platform.
 * Stores authentication credentials, personal info, and financial profile.
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================================================================
    // Authentication Fields
    // =========================================================================
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Column(unique = true, nullable = false)
    private String email;

    @NotBlank(message = "Password is required")
    @Column(name = "hashed_password", nullable = false)
    private String password;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    // =========================================================================
    // Personal Information
    // =========================================================================
    
    @Column(name = "full_name")
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDateTime dateOfBirth;

    @Column(name = "employment_status")
    private String employmentStatus;

    // =========================================================================
    // Financial Profile (for ML model input)
    // =========================================================================
    
    @Column(name = "annual_income")
    private Double annualIncome;

    @Column(name = "monthly_expenses")
    private Double monthlyExpenses;

    @Column(name = "credit_limit")
    private Double creditLimit;

    @Column(name = "credit_accounts")
    private Integer creditAccounts;

    @Column(name = "payment_frequency")
    private String paymentFrequency;  // always, usually, sometimes, rarely

    @Column(name = "longest_delay")
    private String longestDelay;  // none, 1-month, 2-months

    @Column(name = "credit_utilization")
    private Double creditUtilization;

    // =========================================================================
    // Credit Score (computed by ML model)
    // =========================================================================
    
    @Column(name = "credit_score")
    private Integer creditScore;

    @Column(name = "default_probability")
    private Double defaultProbability;

    @Column(name = "last_score_update")
    private LocalDateTime lastScoreUpdate;

    // =========================================================================
    // Loan Preferences
    // =========================================================================
    
    @Column(name = "desired_loan_amount")
    private Double desiredLoanAmount;

    @Column(name = "loan_purpose")
    private String loanPurpose;

    @Column(name = "repayment_period")
    private Integer repaymentPeriod;

    // =========================================================================
    // Timestamps
    // =========================================================================
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

