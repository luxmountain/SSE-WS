import { useState, useEffect, useRef, useCallback } from 'react';

export const useSSE = (url = 'http://localhost:3001/events', shouldFetchMetrics = false) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [connectionId, setConnectionId] = useState(null);
  
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      const eventSource = new EventSource(url, {
        withCredentials: true
      });

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        reconnectAttempts.current = 0;
        reconnectDelay.current = 1000;
      };

      eventSource.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setData(parsedData);
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      // Handle custom events
      eventSource.addEventListener('connected', (event) => {
        const parsedData = JSON.parse(event.data);
        setConnectionId(parsedData.connectionId);
        console.log('SSE connected with ID:', parsedData.connectionId);
      });

      eventSource.addEventListener('data', (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setData(parsedData);
        } catch (err) {
          console.error('Error parsing SSE data event:', err);
        }
      });

      eventSource.addEventListener('metrics', (event) => {
        try {
          const parsedMetrics = JSON.parse(event.data);
          setMetrics(parsedMetrics);
        } catch (err) {
          console.error('Error parsing SSE metrics:', err);
        }
      });

      eventSource.addEventListener('ping', () => {
        // Handle ping for connection health
        console.log('SSE ping received');
      });

      eventSource.onerror = (event) => {
        console.error('SSE connection error:', event);
        setIsConnected(false);
        setConnectionStatus('error');
        setError('Connection error occurred');

        // Attempt reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          setConnectionStatus('reconnecting');
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
            connect();
          }, reconnectDelay.current);
        } else {
          setConnectionStatus('failed');
          setError(`Failed to reconnect after ${maxReconnectAttempts} attempts`);
        }
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error('Error creating SSE connection:', err);
      setError('Failed to create connection');
      setConnectionStatus('error');
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    setError(null);
    reconnectAttempts.current = 0;
  }, []);

  const clearData = useCallback(() => {
    setData(null);
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Fetch performance metrics periodically only if allowed
  useEffect(() => {
    if (!isConnected || !shouldFetchMetrics) return;

    const fetchMetrics = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/stats');
        if (response.ok) {
          const stats = await response.json();
          setMetrics(stats.sse?.performance);
        }
      } catch (err) {
        console.error('Error fetching SSE metrics:', err);
      }
    };

    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, [isConnected, shouldFetchMetrics]);

  return {
    data,
    isConnected,
    connectionStatus,
    metrics,
    error,
    connectionId,
    connect,
    disconnect,
    clearData,
    resetMetrics
  };
};