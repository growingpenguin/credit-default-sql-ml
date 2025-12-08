package com.creditwise.dto;

import com.creditwise.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * User Response DTO
 * =================
 * User data returned to client (excludes password).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    
    private Long id;
    private String email;
    private String fullName;
    private Boolean isActive;
    private Boolean isVerified;
    
    // Financial Profile
    private Double annualIncome;
    private Double creditLimit;
    private Double creditUtilization;
    private Integer creditAccounts;
    private String paymentFrequency;
    private String longestDelay;
    
    // Credit Score
    private Integer creditScore;
    private Double defaultProbability;
    private LocalDateTime lastScoreUpdate;
    
    // Loan Preferences
    private Double desiredLoanAmount;
    private String loanPurpose;
    private Integer repaymentPeriod;
    
    private LocalDateTime createdAt;
    
    /**
     * Convert User entity to UserResponse DTO
     */
    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .annualIncome(user.getAnnualIncome())
                .creditLimit(user.getCreditLimit())
                .creditUtilization(user.getCreditUtilization())
                .creditAccounts(user.getCreditAccounts())
                .paymentFrequency(user.getPaymentFrequency())
                .longestDelay(user.getLongestDelay())
                .creditScore(user.getCreditScore())
                .defaultProbability(user.getDefaultProbability())
                .lastScoreUpdate(user.getLastScoreUpdate())
                .desiredLoanAmount(user.getDesiredLoanAmount())
                .loanPurpose(user.getLoanPurpose())
                .repaymentPeriod(user.getRepaymentPeriod())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

