package com.creditwise.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * Financial Profile Update Request DTO
 * =====================================
 */
@Data
public class FinancialProfileRequest {
    
    @Min(value = 0, message = "Annual income must be positive")
    private Double annualIncome;
    
    @Min(value = 0, message = "Monthly expenses must be positive")
    private Double monthlyExpenses;
    
    @Min(value = 0, message = "Credit limit must be positive")
    private Double creditLimit;
    
    @Min(value = 0, message = "Credit accounts must be positive")
    @Max(value = 20, message = "Credit accounts cannot exceed 20")
    private Integer creditAccounts;
    
    @Pattern(regexp = "^(always|usually|sometimes|rarely)$", 
             message = "Payment frequency must be: always, usually, sometimes, or rarely")
    private String paymentFrequency;
    
    @Pattern(regexp = "^(none|1-month|2-months)$",
             message = "Longest delay must be: none, 1-month, or 2-months")
    private String longestDelay;
    
    @Min(value = 0, message = "Credit utilization must be between 0 and 100")
    @Max(value = 100, message = "Credit utilization must be between 0 and 100")
    private Double creditUtilization;
}

