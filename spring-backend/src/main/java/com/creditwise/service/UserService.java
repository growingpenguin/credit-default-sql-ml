package com.creditwise.service;

import com.creditwise.dto.CreditScoreResponse;
import com.creditwise.dto.FinancialProfileRequest;
import com.creditwise.dto.LoanPreferencesRequest;
import com.creditwise.dto.UserResponse;
import com.creditwise.entity.User;
import com.creditwise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * User Service
 * ============
 * Handles user profile management and credit score calculation.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Get user profile by email.
     */
    public UserResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return UserResponse.fromEntity(user);
    }

    /**
     * Update user's financial profile.
     */
    @Transactional
    public UserResponse updateFinancialProfile(String email, FinancialProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update fields if provided
        if (request.getAnnualIncome() != null) {
            user.setAnnualIncome(request.getAnnualIncome());
        }
        if (request.getMonthlyExpenses() != null) {
            user.setMonthlyExpenses(request.getMonthlyExpenses());
        }
        if (request.getCreditLimit() != null) {
            user.setCreditLimit(request.getCreditLimit());
        }
        if (request.getCreditAccounts() != null) {
            user.setCreditAccounts(request.getCreditAccounts());
        }
        if (request.getPaymentFrequency() != null) {
            user.setPaymentFrequency(request.getPaymentFrequency());
        }
        if (request.getLongestDelay() != null) {
            user.setLongestDelay(request.getLongestDelay());
        }
        if (request.getCreditUtilization() != null) {
            user.setCreditUtilization(request.getCreditUtilization());
        }

        user = userRepository.save(user);
        return UserResponse.fromEntity(user);
    }

    /**
     * Update user's loan preferences.
     */
    @Transactional
    public UserResponse updateLoanPreferences(String email, LoanPreferencesRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getDesiredLoanAmount() != null) {
            user.setDesiredLoanAmount(request.getDesiredLoanAmount());
        }
        if (request.getLoanPurpose() != null) {
            user.setLoanPurpose(request.getLoanPurpose());
        }
        if (request.getRepaymentPeriod() != null) {
            user.setRepaymentPeriod(request.getRepaymentPeriod());
        }

        user = userRepository.save(user);
        return UserResponse.fromEntity(user);
    }

    /**
     * Calculate and update user's credit score.
     * This uses a simplified scoring model. In production, you would
     * call the Python ML service for predictions.
     */
    @Transactional
    public CreditScoreResponse calculateCreditScore(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getPaymentFrequency() == null) {
            throw new RuntimeException("Please complete your financial profile first");
        }

        // Calculate credit score (simplified model)
        int score = calculateScore(user);
        double defaultProbability = calculateDefaultProbability(score);

        // Update user
        user.setCreditScore(score);
        user.setDefaultProbability(defaultProbability);
        user.setLastScoreUpdate(LocalDateTime.now());
        userRepository.save(user);

        return CreditScoreResponse.builder()
                .creditScore(score)
                .scoreLabel(CreditScoreResponse.getScoreLabel(score))
                .defaultProbability(defaultProbability)
                .riskLevel(CreditScoreResponse.getRiskLevel(defaultProbability))
                .build();
    }

    /**
     * Get current credit score.
     */
    public CreditScoreResponse getCreditScore(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getCreditScore() == null) {
            throw new RuntimeException("Credit score not yet calculated");
        }

        return CreditScoreResponse.builder()
                .creditScore(user.getCreditScore())
                .scoreLabel(CreditScoreResponse.getScoreLabel(user.getCreditScore()))
                .defaultProbability(user.getDefaultProbability())
                .riskLevel(CreditScoreResponse.getRiskLevel(user.getDefaultProbability()))
                .build();
    }

    /**
     * Calculate credit score based on user's financial profile.
     */
    private int calculateScore(User user) {
        int score = 600; // Base score

        // Income factor (max +80 points)
        if (user.getAnnualIncome() != null) {
            if (user.getAnnualIncome() >= 100000) score += 80;
            else if (user.getAnnualIncome() >= 75000) score += 60;
            else if (user.getAnnualIncome() >= 50000) score += 40;
            else if (user.getAnnualIncome() >= 30000) score += 20;
        }

        // Payment history factor (max +100 points)
        if (user.getPaymentFrequency() != null) {
            switch (user.getPaymentFrequency()) {
                case "always" -> score += 100;
                case "usually" -> score += 60;
                case "sometimes" -> score += 20;
                case "rarely" -> score -= 20;
            }
        }

        // Credit utilization factor (max +60 points)
        if (user.getCreditUtilization() != null) {
            if (user.getCreditUtilization() < 10) score += 60;
            else if (user.getCreditUtilization() < 30) score += 50;
            else if (user.getCreditUtilization() < 50) score += 30;
            else if (user.getCreditUtilization() < 70) score += 10;
            else score -= 20;
        }

        // Payment delay penalty
        if (user.getLongestDelay() != null) {
            switch (user.getLongestDelay()) {
                case "none" -> score += 40;
                case "1-month" -> score -= 20;
                case "2-months" -> score -= 60;
            }
        }

        // Account diversity bonus
        if (user.getCreditAccounts() != null) {
            if (user.getCreditAccounts() >= 3 && user.getCreditAccounts() <= 5) {
                score += 20;
            } else if (user.getCreditAccounts() >= 2) {
                score += 10;
            }
        }

        // Clamp score to valid range
        return Math.max(300, Math.min(850, score));
    }

    /**
     * Calculate default probability (inverse relationship with score).
     */
    private double calculateDefaultProbability(int score) {
        double prob = 1.0 - (double)(score - 300) / 700;
        return Math.round(Math.max(0.05, Math.min(0.80, prob)) * 10000) / 10000.0;
    }
}

