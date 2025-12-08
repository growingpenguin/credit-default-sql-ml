package com.creditwise;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * CreditWise API - Spring Boot Application
 * =========================================
 * Main entry point for the CreditWise Mini Bank Platform backend.
 * 
 * Features:
 * - JWT Authentication
 * - User Management
 * - Credit Score Calculation
 * - Loan Products (LendingClub data)
 * - RESTful API with Swagger documentation
 * 
 * @author CreditWise Team
 * @version 1.0.0
 */
@SpringBootApplication
public class CreditWiseApplication {

    public static void main(String[] args) {
        SpringApplication.run(CreditWiseApplication.class, args);
        System.out.println("\n" +
            "╔═══════════════════════════════════════════════════════════╗\n" +
            "║           🏦 CreditWise API Started Successfully!         ║\n" +
            "╠═══════════════════════════════════════════════════════════╣\n" +
            "║  API Base URL:    http://localhost:8080/api               ║\n" +
            "║  Swagger UI:      http://localhost:8080/api/swagger-ui    ║\n" +
            "║  API Docs:        http://localhost:8080/api/api-docs      ║\n" +
            "╚═══════════════════════════════════════════════════════════╝\n"
        );
    }
}

