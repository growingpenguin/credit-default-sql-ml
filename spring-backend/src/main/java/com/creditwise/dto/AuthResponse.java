package com.creditwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Authentication Response DTO
 * ===========================
 * Returns JWT token and user information after successful login/registration.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    
    private String accessToken;
    
    @Builder.Default
    private String tokenType = "Bearer";
    
    private UserResponse user;
}

