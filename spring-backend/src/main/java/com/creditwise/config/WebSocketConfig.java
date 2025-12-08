package com.creditwise.config;

import com.creditwise.websocket.PredictionWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * WebSocket Configuration
 * =======================
 * Configures WebSocket endpoints for real-time ML predictions.
 * 
 * Architecture:
 * ┌────────────────┐    WebSocket    ┌─────────────────┐
 * │    React UI    │ ◄────────────►  │  Spring Boot    │
 * │  (Browser)     │  /ws/predict    │  (WebSocket)    │
 * │                │                 │                 │
 * │  Send: JSON    │ ────────────► │ PredictionHandler│
 * │  Recv: Pred    │ ◄──────────── │ → FastAPI ML    │
 * └────────────────┘                 └─────────────────┘
 * 
 * Endpoints:
 * - /ws/predict : Real-time credit risk predictions
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {
    
    private final PredictionWebSocketHandler predictionHandler;
    
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(predictionHandler, "/ws/predict")
                .setAllowedOrigins(
                    "http://localhost:3000",
                    "http://localhost:3001",
                    "http://localhost:5173",
                    "http://creditwise.local"
                );
    }
}

