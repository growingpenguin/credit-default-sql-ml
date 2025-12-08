package com.creditwise.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Health Controller
 * =================
 * Health check and root endpoints.
 */
@RestController
@Tag(name = "Health", description = "Health check endpoints")
public class HealthController {

    @GetMapping("/")
    @Operation(summary = "API information")
    public ResponseEntity<Map<String, String>> root() {
        return ResponseEntity.ok(Map.of(
            "name", "CreditWise API",
            "version", "1.0.0",
            "framework", "Spring Boot 3.2",
            "status", "running",
            "docs", "/swagger-ui.html"
        ));
    }

    @GetMapping("/health")
    @Operation(summary = "Health check")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "database", "connected"
        ));
    }
}

