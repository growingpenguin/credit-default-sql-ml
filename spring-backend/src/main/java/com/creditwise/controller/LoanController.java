package com.creditwise.controller;

import com.creditwise.dto.LoanProductResponse;
import com.creditwise.dto.LoanRecommendationResponse;
import com.creditwise.service.LoanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Loan Controller
 * ===============
 * Handles loan product queries and personalized recommendations.
 */
@RestController
@RequestMapping("/loans")
@RequiredArgsConstructor
@Tag(name = "Loans", description = "Loan products and recommendations")
public class LoanController {

    private final LoanService loanService;

    @GetMapping("/products")
    @Operation(summary = "Get all loan products")
    public ResponseEntity<List<LoanProductResponse>> getAllProducts(
            @RequestParam(required = false) String loanType) {
        List<LoanProductResponse> products = loanService.getAllProducts(loanType);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/products/{productId}")
    @Operation(summary = "Get loan product by ID")
    public ResponseEntity<LoanProductResponse> getProduct(@PathVariable String productId) {
        LoanProductResponse product = loanService.getProduct(productId);
        return ResponseEntity.ok(product);
    }

    @GetMapping("/recommendations")
    @Operation(summary = "Get personalized loan recommendations")
    public ResponseEntity<LoanRecommendationResponse> getRecommendations(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String loanType,
            @RequestParam(required = false) Double loanAmount,
            @RequestParam(defaultValue = "36") Integer termMonths) {
        LoanRecommendationResponse recommendations = loanService.getRecommendations(
                userDetails.getUsername(), loanType, loanAmount, termMonths);
        return ResponseEntity.ok(recommendations);
    }

    @GetMapping("/calculate-payment")
    @Operation(summary = "Calculate monthly payment")
    public ResponseEntity<Map<String, Object>> calculatePayment(
            @RequestParam Double amount,
            @RequestParam Double apr,
            @RequestParam(defaultValue = "36") Integer termMonths) {
        
        double monthlyPayment = loanService.calculateMonthlyPayment(amount, apr, termMonths);
        double totalPayment = monthlyPayment * termMonths;
        double totalInterest = totalPayment - amount;

        return ResponseEntity.ok(Map.of(
            "loanAmount", amount,
            "apr", apr,
            "termMonths", termMonths,
            "monthlyPayment", monthlyPayment,
            "totalPayment", Math.round(totalPayment * 100) / 100.0,
            "totalInterest", Math.round(totalInterest * 100) / 100.0
        ));
    }
}

