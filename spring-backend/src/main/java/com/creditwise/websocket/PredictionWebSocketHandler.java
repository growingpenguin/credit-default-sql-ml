package com.creditwise.websocket;

import com.creditwise.dto.MLPredictionRequest;
import com.creditwise.dto.MLPredictionResponse;
import com.creditwise.service.MLPredictionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket Handler for Real-time ML Predictions
 * ===============================================
 * 
 * Handles WebSocket connections for streaming credit risk predictions.
 * Supports real-time updates as users modify their financial information.
 * 
 * Message Protocol:
 * ================
 * 
 * Client → Server (Request):
 * {
 *   "type": "predict",
 *   "model": "tft",  // optional, default: tft
 *   "features": {
 *     "LIMIT_BAL": 50000,
 *     "SEX": 1,
 *     "EDUCATION": 2,
 *     // ... other features
 *   }
 * }
 * 
 * Server → Client (Response):
 * {
 *   "type": "prediction",
 *   "data": {
 *     "default_probability": 0.22,
 *     "risk_level": "Low",
 *     "credit_score": 735,
 *     "recommendation": "..."
 *   },
 *   "timestamp": "2024-01-01T12:00:00"
 * }
 * 
 * Server → Client (Error):
 * {
 *   "type": "error",
 *   "message": "Error description"
 * }
 * 
 * Server → Client (Status):
 * {
 *   "type": "status",
 *   "connected": true,
 *   "ml_service": "available"
 * }
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PredictionWebSocketHandler extends TextWebSocketHandler {
    
    private final MLPredictionService mlPredictionService;
    private final ObjectMapper objectMapper;
    
    // Track active sessions
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    
    /**
     * Handle new WebSocket connection.
     */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String sessionId = session.getId();
        sessions.put(sessionId, session);
        log.info("WebSocket connection established: {}", sessionId);
        
        // Send connection confirmation
        sendStatus(session, true);
    }
    
    /**
     * Handle incoming WebSocket messages.
     */
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String sessionId = session.getId();
        log.debug("Received WebSocket message from {}: {}", sessionId, message.getPayload());
        
        try {
            // Parse incoming message
            Map<String, Object> request = objectMapper.readValue(message.getPayload(), Map.class);
            String type = (String) request.getOrDefault("type", "predict");
            
            switch (type) {
                case "predict" -> handlePrediction(session, request);
                case "ping" -> handlePing(session);
                case "status" -> sendStatus(session, session.isOpen());
                default -> sendError(session, "Unknown message type: " + type);
            }
            
        } catch (Exception e) {
            log.error("Error processing WebSocket message: {}", e.getMessage());
            sendError(session, "Invalid message format: " + e.getMessage());
        }
    }
    
    /**
     * Handle prediction request.
     */
    private void handlePrediction(WebSocketSession session, Map<String, Object> request) throws IOException {
        long startTime = System.currentTimeMillis();
        
        try {
            // Extract model preference
            String modelStr = (String) request.getOrDefault("model", "tft");
            MLPredictionService.MLModel model = parseModel(modelStr);
            
            // Extract features
            @SuppressWarnings("unchecked")
            Map<String, Object> featuresMap = (Map<String, Object>) request.get("features");
            
            if (featuresMap == null) {
                sendError(session, "Missing 'features' in request");
                return;
            }
            
            // Convert to MLPredictionRequest
            MLPredictionRequest predictionRequest = buildRequest(featuresMap);
            
            // Get prediction from ML service
            MLPredictionResponse prediction = mlPredictionService.predict(predictionRequest, model);
            
            // Send response
            Map<String, Object> response = Map.of(
                "type", "prediction",
                "data", Map.of(
                    "default_probability", prediction.getDefaultProbability(),
                    "prediction", prediction.getPrediction(),
                    "risk_level", prediction.getRiskLevel(),
                    "risk_category", prediction.getRiskCategory(),
                    "credit_score", prediction.getRecommendedCreditScore(),
                    "model_used", prediction.getModelUsed(),
                    "confidence", prediction.getConfidence(),
                    "recommendation", prediction.getRecommendation()
                ),
                "latency_ms", System.currentTimeMillis() - startTime,
                "timestamp", java.time.Instant.now().toString()
            );
            
            sendMessage(session, response);
            log.debug("Prediction sent in {}ms", System.currentTimeMillis() - startTime);
            
        } catch (Exception e) {
            log.error("Prediction error: {}", e.getMessage());
            sendError(session, "Prediction failed: " + e.getMessage());
        }
    }
    
    /**
     * Handle ping message (keep-alive).
     */
    private void handlePing(WebSocketSession session) throws IOException {
        Map<String, Object> pong = Map.of(
            "type", "pong",
            "timestamp", java.time.Instant.now().toString()
        );
        sendMessage(session, pong);
    }
    
    /**
     * Send connection status message.
     */
    private void sendStatus(WebSocketSession session, boolean connected) throws IOException {
        boolean mlAvailable = mlPredictionService.isServiceAvailable();
        
        Map<String, Object> status = Map.of(
            "type", "status",
            "connected", connected,
            "session_id", session.getId(),
            "ml_service", mlAvailable ? "available" : "unavailable",
            "models", new String[]{"tft", "lstm", "saint", "ft_transformer"},
            "timestamp", java.time.Instant.now().toString()
        );
        sendMessage(session, status);
    }
    
    /**
     * Send error message.
     */
    private void sendError(WebSocketSession session, String message) throws IOException {
        Map<String, Object> error = Map.of(
            "type", "error",
            "message", message,
            "timestamp", java.time.Instant.now().toString()
        );
        sendMessage(session, error);
    }
    
    /**
     * Send JSON message to client.
     */
    private void sendMessage(WebSocketSession session, Object message) throws IOException {
        if (session.isOpen()) {
            String json = objectMapper.writeValueAsString(message);
            session.sendMessage(new TextMessage(json));
        }
    }
    
    /**
     * Handle WebSocket error.
     */
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("WebSocket error for session {}: {}", session.getId(), exception.getMessage());
        sessions.remove(session.getId());
    }
    
    /**
     * Handle WebSocket connection close.
     */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String sessionId = session.getId();
        sessions.remove(sessionId);
        log.info("WebSocket connection closed: {} (status: {})", sessionId, status);
    }
    
    /**
     * Broadcast message to all connected clients.
     */
    public void broadcast(Object message) {
        sessions.values().forEach(session -> {
            try {
                sendMessage(session, message);
            } catch (IOException e) {
                log.error("Failed to broadcast to {}: {}", session.getId(), e.getMessage());
            }
        });
    }
    
    /**
     * Get count of active connections.
     */
    public int getActiveConnections() {
        return sessions.size();
    }
    
    // =========================================================================
    // Helper Methods
    // =========================================================================
    
    private MLPredictionService.MLModel parseModel(String modelStr) {
        try {
            return MLPredictionService.MLModel.valueOf(modelStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            for (MLPredictionService.MLModel model : MLPredictionService.MLModel.values()) {
                if (model.getCode().equalsIgnoreCase(modelStr)) {
                    return model;
                }
            }
            return MLPredictionService.MLModel.TFT;
        }
    }
    
    private MLPredictionRequest buildRequest(Map<String, Object> features) {
        return MLPredictionRequest.builder()
                .limitBal(getDouble(features, "LIMIT_BAL", 50000.0))
                .sex(getInt(features, "SEX", 1))
                .education(getInt(features, "EDUCATION", 2))
                .marriage(getInt(features, "MARRIAGE", 1))
                .age(getInt(features, "AGE", 35))
                .pay0(getInt(features, "PAY_0", 0))
                .pay2(getInt(features, "PAY_2", 0))
                .pay3(getInt(features, "PAY_3", 0))
                .pay4(getInt(features, "PAY_4", 0))
                .pay5(getInt(features, "PAY_5", 0))
                .pay6(getInt(features, "PAY_6", 0))
                .billAmt1(getDouble(features, "BILL_AMT1", 10000.0))
                .billAmt2(getDouble(features, "BILL_AMT2", 9500.0))
                .billAmt3(getDouble(features, "BILL_AMT3", 9000.0))
                .billAmt4(getDouble(features, "BILL_AMT4", 8500.0))
                .billAmt5(getDouble(features, "BILL_AMT5", 8000.0))
                .billAmt6(getDouble(features, "BILL_AMT6", 7500.0))
                .payAmt1(getDouble(features, "PAY_AMT1", 1000.0))
                .payAmt2(getDouble(features, "PAY_AMT2", 1000.0))
                .payAmt3(getDouble(features, "PAY_AMT3", 1000.0))
                .payAmt4(getDouble(features, "PAY_AMT4", 1000.0))
                .payAmt5(getDouble(features, "PAY_AMT5", 1000.0))
                .payAmt6(getDouble(features, "PAY_AMT6", 1000.0))
                .build();
    }
    
    private Double getDouble(Map<String, Object> map, String key, Double defaultValue) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return defaultValue;
    }
    
    private Integer getInt(Map<String, Object> map, String key, Integer defaultValue) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return defaultValue;
    }
}

