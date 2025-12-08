/**
 * WebSocket Hook for Real-time ML Predictions
 * ============================================
 * 
 * Custom React hook for connecting to Spring Boot WebSocket endpoint
 * and receiving real-time credit risk predictions.
 * 
 * Usage:
 * ```tsx
 * const {
 *   isConnected,
 *   prediction,
 *   error,
 *   predict,
 *   latency
 * } = useWebSocketPrediction();
 * 
 * // Send prediction request
 * predict({
 *   LIMIT_BAL: 50000,
 *   AGE: 35,
 *   // ... other features
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Types
export interface PredictionFeatures {
  LIMIT_BAL: number;
  SEX: number;
  EDUCATION: number;
  MARRIAGE: number;
  AGE: number;
  PAY_0: number;
  PAY_2: number;
  PAY_3: number;
  PAY_4: number;
  PAY_5: number;
  PAY_6: number;
  BILL_AMT1: number;
  BILL_AMT2: number;
  BILL_AMT3: number;
  BILL_AMT4: number;
  BILL_AMT5: number;
  BILL_AMT6: number;
  PAY_AMT1: number;
  PAY_AMT2: number;
  PAY_AMT3: number;
  PAY_AMT4: number;
  PAY_AMT5: number;
  PAY_AMT6: number;
}

export interface PredictionResult {
  default_probability: number;
  prediction: number;
  risk_level: string;
  risk_category: string;
  credit_score: number;
  model_used: string;
  confidence: number;
  recommendation: string;
}

export interface WebSocketMessage {
  type: 'prediction' | 'status' | 'error' | 'pong';
  data?: PredictionResult;
  message?: string;
  latency_ms?: number;
  timestamp?: string;
  connected?: boolean;
  ml_service?: string;
  session_id?: string;
  models?: string[];
}

// Default features for testing
export const DEFAULT_FEATURES: PredictionFeatures = {
  LIMIT_BAL: 50000,
  SEX: 1,
  EDUCATION: 2,
  MARRIAGE: 1,
  AGE: 35,
  PAY_0: 0,
  PAY_2: 0,
  PAY_3: 0,
  PAY_4: 0,
  PAY_5: 0,
  PAY_6: 0,
  BILL_AMT1: 10000,
  BILL_AMT2: 9500,
  BILL_AMT3: 9000,
  BILL_AMT4: 8500,
  BILL_AMT5: 8000,
  BILL_AMT6: 7500,
  PAY_AMT1: 1000,
  PAY_AMT2: 1000,
  PAY_AMT3: 1000,
  PAY_AMT4: 1000,
  PAY_AMT5: 1000,
  PAY_AMT6: 1000,
};

// Configuration
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/api/ws/predict';
const RECONNECT_INTERVAL = 3000; // 3 seconds
const PING_INTERVAL = 30000; // 30 seconds

export function useWebSocketPrediction() {
  const [isConnected, setIsConnected] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [mlServiceStatus, setMlServiceStatus] = useState<string>('unknown');
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    try {
      console.log('[WS] Connecting to:', WS_URL);
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('[WS] Connected');
        setIsConnected(true);
        setError(null);
        
        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, PING_INTERVAL);
      };
      
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[WS] Received:', message.type);
          
          switch (message.type) {
            case 'prediction':
              if (message.data) {
                setPrediction(message.data);
                setLatency(message.latency_ms || null);
              }
              break;
              
            case 'status':
              setMlServiceStatus(message.ml_service || 'unknown');
              console.log('[WS] ML Service:', message.ml_service);
              break;
              
            case 'error':
              setError(message.message || 'Unknown error');
              break;
              
            case 'pong':
              // Keep-alive response
              break;
          }
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };
      
      ws.onerror = (event) => {
        console.error('[WS] Error:', event);
        setError('WebSocket connection error');
      };
      
      ws.onclose = (event) => {
        console.log('[WS] Closed:', event.code, event.reason);
        setIsConnected(false);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        // Attempt reconnection
        if (!event.wasClean) {
          console.log('[WS] Reconnecting in', RECONNECT_INTERVAL, 'ms');
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_INTERVAL);
        }
      };
      
      wsRef.current = ws;
      
    } catch (e) {
      console.error('[WS] Connection error:', e);
      setError('Failed to connect to WebSocket');
    }
  }, []);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);
  
  // Send prediction request
  const predict = useCallback((features: Partial<PredictionFeatures>, model: string = 'tft') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket not connected');
      return;
    }
    
    const fullFeatures = { ...DEFAULT_FEATURES, ...features };
    
    const message = {
      type: 'predict',
      model,
      features: fullFeatures,
    };
    
    wsRef.current.send(JSON.stringify(message));
    setError(null);
  }, []);
  
  // Connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  return {
    isConnected,
    prediction,
    error,
    latency,
    mlServiceStatus,
    predict,
    connect,
    disconnect,
  };
}

export default useWebSocketPrediction;

