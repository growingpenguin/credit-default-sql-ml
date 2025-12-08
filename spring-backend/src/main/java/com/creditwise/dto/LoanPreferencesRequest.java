package com.creditwise.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;

/**
 * Loan Preferences Update Request DTO
 * ====================================
 */
@Data
public class LoanPreferencesRequest {
    
    @Min(value = 1000, message = "Minimum loan amount is $1,000")
    @Max(value = 100000, message = "Maximum loan amount is $100,000")
    private Double desiredLoanAmount;
    
    private String loanPurpose;
    
    @Min(value = 6, message = "Minimum repayment period is 6 months")
    @Max(value = 84, message = "Maximum repayment period is 84 months")
    private Integer repaymentPeriod;
}

