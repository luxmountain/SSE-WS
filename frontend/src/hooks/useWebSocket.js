import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (url = 'ws://localhost:3001/websocket') => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [connectionId, setConnectionId] = useState(null);
  
  const websocketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000);
  const pingIntervalRef = useRef(null);

  const connect = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      const websocket = new WebSocket(url);

      websocket.onopen = () => {
        console.log('WebSocket connection opened');
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        reconnectAttempts.current = 0;
        reconnectDelay.current = 1000;

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({
              type: 'ping',
              timestamp: Date.now()
            }));
          }
        }, 30000);
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              setConnectionId(message.data.connectionId);
              console.log('WebSocket connected with ID:', message.data.connectionId);
              break;
              
            case 'data':
              setData(message.data);
              break;
              
            case 'metrics':
              setMetrics(message.data);
              break;
              
            case 'pong':
              // Handle pong response
              console.log('WebSocket pong received');
              break;
              
            case 'ping':
              // Respond to server ping
              websocket.send(JSON.stringify({
                type: 'pong',
                timestamp: Date.now()
              }));
              break;
              
            default:
              console.log('Unknown WebSocket message type:', message.type);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      websocket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Only attempt reconnection if not manually closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          setConnectionStatus('reconnecting');
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
            connect();
          }, reconnectDelay.current);
        } else if (event.code === 1000) {
          setConnectionStatus('disconnected');
        } else {
          setConnectionStatus('failed');
          setError(`Failed to reconnect after ${maxReconnectAttempts} attempts`);
        }
      };

      websocket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setConnectionStatus('error');
      };

      websocketRef.current = websocket;
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
      setConnectionStatus('error');
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    if (websocketRef.current) {
      websocketRef.current.close(1000, 'User initiated disconnect');
      websocketRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    setError(null);
    reconnectAttempts.current = 0;
  }, []);

  const sendMessage = useCallback((type, data) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type,
        data,
        timestamp: Date.now()
      }));
      return true;
    }
    return false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Fetch performance metrics periodically
  useEffect(() => {
    if (!isConnected) return;

    const fetchMetrics = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/stats');
        if (response.ok) {
          const stats = await response.json();
          setMetrics(stats.websocket?.performance);
        }
      } catch (err) {
        console.error('Error fetching WebSocket metrics:', err);
      }
    };

    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    data,
    isConnected,
    connectionStatus,
    metrics,
    error,
    connectionId,
    connect,
    disconnect,
    sendMessage
  };
};