package com.creditwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Request DTO for ML credit default prediction.
 * 
 * Maps to the features expected by the trained ML models:
 * - TFT (Temporal Fusion Transformer)
 * - LSTM
 * - SAINT
 * - FT-Transformer
 * 
 * Features are based on the UCI Credit Card Default dataset.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MLPredictionRequest {
    
    /**
     * Credit limit amount in NT dollars
     */
    @JsonProperty("LIMIT_BAL")
    private Double limitBal;
    
    /**
     * Gender: 1 = male, 2 = female
     */
    @JsonProperty("SEX")
    private Integer sex;
    
    /**
     * Education level: 1 = graduate school, 2 = university, 3 = high school, 4 = others
     */
    @JsonProperty("EDUCATION")
    private Integer education;
    
    /**
     * Marital status: 1 = married, 2 = single, 3 = others
     */
    @JsonProperty("MARRIAGE")
    private Integer marriage;
    
    /**
     * Age in years
     */
    @JsonProperty("AGE")
    private Integer age;
    
    /**
     * Repayment status in September (-1 = pay duly, 1-9 = months delayed)
     */
    @JsonProperty("PAY_0")
    private Integer pay0;
    
    /**
     * Repayment status in August
     */
    @JsonProperty("PAY_2")
    private Integer pay2;
    
    /**
     * Repayment status in July
     */
    @JsonProperty("PAY_3")
    private Integer pay3;
    
    /**
     * Repayment status in June
     */
    @JsonProperty("PAY_4")
    private Integer pay4;
    
    /**
     * Repayment status in May
     */
    @JsonProperty("PAY_5")
    private Integer pay5;
    
    /**
     * Repayment status in April
     */
    @JsonProperty("PAY_6")
    private Integer pay6;
    
    /**
     * Bill statement amount in September
     */
    @JsonProperty("BILL_AMT1")
    private Double billAmt1;
    
    /**
     * Bill statement amount in August
     */
    @JsonProperty("BILL_AMT2")
    private Double billAmt2;
    
    /**
     * Bill statement amount in July
     */
    @JsonProperty("BILL_AMT3")
    private Double billAmt3;
    
    /**
     * Bill statement amount in June
     */
    @JsonProperty("BILL_AMT4")
    private Double billAmt4;
    
    /**
     * Bill statement amount in May
     */
    @JsonProperty("BILL_AMT5")
    private Double billAmt5;
    
    /**
     * Bill statement amount in April
     */
    @JsonProperty("BILL_AMT6")
    private Double billAmt6;
    
    /**
     * Previous payment amount in September
     */
    @JsonProperty("PAY_AMT1")
    private Double payAmt1;
    
    /**
     * Previous payment amount in August
     */
    @JsonProperty("PAY_AMT2")
    private Double payAmt2;
    
    /**
     * Previous payment amount in July
     */
    @JsonProperty("PAY_AMT3")
    private Double payAmt3;
    
    /**
     * Previous payment amount in June
     */
    @JsonProperty("PAY_AMT4")
    private Double payAmt4;
    
    /**
     * Previous payment amount in May
     */
    @JsonProperty("PAY_AMT5")
    private Double payAmt5;
    
    /**
     * Previous payment amount in April
     */
    @JsonProperty("PAY_AMT6")
    private Double payAmt6;
    
    /**
     * Create a sample prediction request with default values.
     */
    public static MLPredictionRequest createSample() {
        return MLPredictionRequest.builder()
                .limitBal(50000.0)
                .sex(1)
                .education(2)
                .marriage(1)
                .age(35)
                .pay0(0)
                .pay2(0)
                .pay3(0)
                .pay4(0)
                .pay5(0)
                .pay6(0)
                .billAmt1(10000.0)
                .billAmt2(9500.0)
                .billAmt3(9000.0)
                .billAmt4(8500.0)
                .billAmt5(8000.0)
                .billAmt6(7500.0)
                .payAmt1(1000.0)
                .payAmt2(1000.0)
                .payAmt3(1000.0)
                .payAmt4(1000.0)
                .payAmt5(1000.0)
                .payAmt6(1000.0)
                .build();
    }
}

