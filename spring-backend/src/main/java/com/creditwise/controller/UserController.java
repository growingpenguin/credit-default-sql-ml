package com.creditwise.controller;

import com.creditwise.dto.CreditScoreResponse;
import com.creditwise.dto.FinancialProfileRequest;
import com.creditwise.dto.LoanPreferencesRequest;
import com.creditwise.dto.UserResponse;
import com.creditwise.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * User Controller
 * ===============
 * Handles user profile management and credit score calculation.
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile and credit score")
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    @Operation(summary = "Get current user's profile")
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        UserResponse response = userService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile/financial")
    @Operation(summary = "Update financial profile")
    public ResponseEntity<UserResponse> updateFinancialProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FinancialProfileRequest request) {
        UserResponse response = userService.updateFinancialProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile/loan-preferences")
    @Operation(summary = "Update loan preferences")
    public ResponseEntity<UserResponse> updateLoanPreferences(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody LoanPreferencesRequest request) {
        UserResponse response = userService.updateLoanPreferences(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/calculate-score")
    @Operation(summary = "Calculate credit score based on financial profile")
    public ResponseEntity<CreditScoreResponse> calculateCreditScore(
            @AuthenticationPrincipal UserDetails userDetails) {
        CreditScoreResponse response = userService.calculateCreditScore(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/credit-score")
    @Operation(summary = "Get current credit score")
    public ResponseEntity<CreditScoreResponse> getCreditScore(
            @AuthenticationPrincipal UserDetails userDetails) {
        CreditScoreResponse response = userService.getCreditScore(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}

