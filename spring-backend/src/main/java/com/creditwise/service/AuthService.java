package com.creditwise.service;

import com.creditwise.dto.AuthRequest;
import com.creditwise.dto.AuthResponse;
import com.creditwise.dto.UserResponse;
import com.creditwise.entity.User;
import com.creditwise.repository.UserRepository;
import com.creditwise.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Authentication Service
 * ======================
 * Handles user registration, login, and JWT token generation.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    /**
     * Register a new user.
     */
    @Transactional
    public AuthResponse register(AuthRequest.Register request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Create new user
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .isActive(true)
                .isVerified(false)
                .build();

        user = userRepository.save(user);

        // Generate JWT token
        String token = tokenProvider.generateToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(token)
                .user(UserResponse.fromEntity(user))
                .build();
    }

    /**
     * Authenticate user and return JWT token.
     */
    public AuthResponse login(AuthRequest.Login request) {
        // Authenticate user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // Get user from database
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        // Generate JWT token
        String token = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .accessToken(token)
                .user(UserResponse.fromEntity(user))
                .build();
    }

    /**
     * Get current user from email.
     */
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return UserResponse.fromEntity(user);
    }
}

