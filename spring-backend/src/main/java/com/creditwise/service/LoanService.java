package com.creditwise.service;

import com.creditwise.dto.LoanProductResponse;
import com.creditwise.dto.LoanRecommendationResponse;
import com.creditwise.entity.LoanProduct;
import com.creditwise.entity.User;
import com.creditwise.repository.LoanProductRepository;
import com.creditwise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Loan Service
 * ============
 * Handles loan product queries and personalized recommendations.
 */
@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanProductRepository loanProductRepository;
    private final UserRepository userRepository;

    /**
     * Get all active loan products.
     */
    public List<LoanProductResponse> getAllProducts(String loanType) {
        List<LoanProduct> products;
        
        if (loanType != null && !loanType.isEmpty()) {
            products = loanProductRepository.findByLoanTypeAndIsActiveTrueOrderByMinAprAsc(loanType);
        } else {
            products = loanProductRepository.findByIsActiveTrueOrderByMinAprAsc();
        }
        
        return products.stream()
                .map(LoanProductResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get loan product by ID.
     */
    public LoanProductResponse getProduct(String productId) {
        LoanProduct product = loanProductRepository.findByProductId(productId)
                .orElseThrow(() -> new RuntimeException("Loan product not found"));
        return LoanProductResponse.fromEntity(product);
    }

    /**
     * Get personalized loan recommendations for a user.
     */
    public LoanRecommendationResponse getRecommendations(
            String email, 
            String loanType,
            Double loanAmount,
            Integer termMonths) {
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getCreditScore() == null) {
            throw new RuntimeException("Please calculate your credit score first");
        }

        int creditScore = user.getCreditScore();
        Double defaultProbability = user.getDefaultProbability();

        // Get eligible products
        List<LoanProduct> eligibleProducts = loanProductRepository.findEligibleProducts(creditScore);
        
        if (loanType != null && !loanType.isEmpty()) {
            eligibleProducts = eligibleProducts.stream()
                    .filter(p -> p.getLoanType().equals(loanType))
                    .collect(Collectors.toList());
        }

        if (eligibleProducts.isEmpty()) {
            throw new RuntimeException("No loan products available for your credit profile");
        }

        // Build personalized recommendations
        List<LoanRecommendationResponse.PersonalizedLoan> recommendations = new ArrayList<>();
        boolean bestMatchFound = false;

        for (LoanProduct product : eligibleProducts) {
            double estimatedApr = calculateEstimatedApr(product, creditScore);
            int approvalProbability = calculateApprovalProbability(creditScore, product, defaultProbability);
            
            Double monthlyPayment = null;
            if (loanAmount != null && termMonths != null) {
                monthlyPayment = calculateMonthlyPayment(loanAmount, estimatedApr, termMonths);
            }

            boolean isPreQualified = approvalProbability >= 80;
            boolean isBestMatch = !bestMatchFound && approvalProbability >= 85;
            if (isBestMatch) bestMatchFound = true;

            recommendations.add(LoanRecommendationResponse.PersonalizedLoan.builder()
                    .product(LoanProductResponse.fromEntity(product))
                    .estimatedApr(Math.round(estimatedApr * 100) / 100.0)
                    .approvalProbability(approvalProbability)
                    .monthlyPayment(monthlyPayment)
                    .isPreQualified(isPreQualified)
                    .isBestMatch(isBestMatch)
                    .build());
        }

        return LoanRecommendationResponse.builder()
                .creditScore(creditScore)
                .totalProducts(recommendations.size())
                .recommendations(recommendations)
                .build();
    }

    /**
     * Calculate estimated APR based on credit score within product's range.
     */
    private double calculateEstimatedApr(LoanProduct product, int creditScore) {
        int scoreRange = product.getMaxCreditScore() - product.getMinCreditScore();
        if (scoreRange == 0) {
            return (product.getMinApr() + product.getMaxApr()) / 2;
        }

        double aprRange = product.getMaxApr() - product.getMinApr();
        double scorePosition = (double)(creditScore - product.getMinCreditScore()) / scoreRange;
        scorePosition = Math.max(0, Math.min(1, scorePosition));

        // Higher score = lower APR
        return product.getMaxApr() - (scorePosition * aprRange);
    }

    /**
     * Calculate approval probability.
     */
    private int calculateApprovalProbability(int creditScore, LoanProduct product, Double defaultProbability) {
        int baseApproval;
        
        if (defaultProbability != null) {
            baseApproval = (int)((1 - defaultProbability) * 100);
        } else {
            int scoreMid = (product.getMinCreditScore() + product.getMaxCreditScore()) / 2;
            if (creditScore >= product.getMaxCreditScore()) {
                baseApproval = 95;
            } else if (creditScore >= scoreMid) {
                baseApproval = 85;
            } else if (creditScore >= product.getMinCreditScore()) {
                baseApproval = 70;
            } else {
                baseApproval = 50;
            }
        }

        // Grade adjustments
        int gradeBonus = switch (product.getGrade()) {
            case "A" -> 5;
            case "B" -> 3;
            case "C" -> 0;
            case "D" -> -5;
            case "E" -> -10;
            default -> 0;
        };

        return Math.max(10, Math.min(99, baseApproval + gradeBonus));
    }

    /**
     * Calculate monthly payment using amortization formula.
     */
    public double calculateMonthlyPayment(double principal, double apr, int termMonths) {
        if (apr == 0) {
            return Math.round(principal / termMonths * 100) / 100.0;
        }

        double monthlyRate = apr / 100 / 12;
        double payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) 
                       / (Math.pow(1 + monthlyRate, termMonths) - 1);
        return Math.round(payment * 100) / 100.0;
    }
}

