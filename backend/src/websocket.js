const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class WebSocketConnection {
  constructor(ws, performanceMonitor) {
    this.id = uuidv4();
    this.ws = ws;
    this.performanceMonitor = performanceMonitor;
    this.connected = true;
    this.startTime = Date.now();
    this.messagesSent = 0;
    this.messagesReceived = 0;
    this.lastPingTime = Date.now();
    this.lastPongTime = Date.now();
    this.messageQueue = [];
    this.rateLimiter = {
      tokens: 100,
      lastRefill: Date.now(),
      maxTokens: 100,
      refillRate: 10 // tokens per second
    };
    this.connectionQuality = {
      successfulMessages: 0,
      failedMessages: 0,
      avgResponseTime: 0,
      reconnectAttempts: 0
    };
    
    this.setupConnection();
    this.startHeartbeat();
    this.startRateLimiterRefill();
  }

  setupConnection() {
    // Send initial connection message
    this.sendMessage('connected', {
      connectionId: this.id,
      timestamp: Date.now(),
      type: 'websocket'
    });

    // Handle incoming messages
    this.ws.on('message', (data) => {
      try {
        this.messagesReceived++;
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error(`Error parsing WebSocket message from ${this.id}:`, error);
      }
    });

    // Handle connection close
    this.ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket connection ${this.id} closed: ${code} ${reason}`);
      this.connected = false;
      this.cleanup();
    });

    // Handle errors
    this.ws.on('error', (error) => {
      console.error(`WebSocket error for ${this.id}:`, error);
      this.connected = false;
      this.cleanup();
    });

    // Handle pong responses
    this.ws.on('pong', () => {
      this.lastPongTime = Date.now();
    });
  }

  handleMessage(message) {
    const { type, data, timestamp } = message;
    
    switch (type) {
      case 'ping':
        this.sendMessage('pong', { timestamp: Date.now() });
        break;
        
      case 'pong':
        this.lastPongTime = Date.now();
        break;
        
      case 'request_data':
        // Client requesting specific data
        this.sendMessage('data_response', data);
        break;
        
      case 'performance_test':
        // Echo message for latency testing
        this.sendMessage('performance_response', {
          ...data,
          serverTimestamp: Date.now()
        });
        break;
        
      default:
        console.log(`Unknown message type from ${this.id}:`, type);
    }

    // Track performance
    this.performanceMonitor.recordWebSocketMessage(this.id, message, 'received');
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (!this.connected) return;
      
      try {
        this.ws.ping();
        this.sendMessage('ping', {
          timestamp: Date.now(),
          connectionId: this.id
        });
        this.lastPingTime = Date.now();
      } catch (error) {
        console.error(`Heartbeat error for ${this.id}:`, error);
        this.connected = false;
        this.cleanup();
      }
    }, 30000); // Ping every 30 seconds
  }

  sendMessage(type, data) {
    if (!this.connected || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    // Check rate limit
    if (!this.checkRateLimit()) {
      console.warn(`Rate limit exceeded for WebSocket connection ${this.id}`);
      return false;
    }

    try {
      const startTime = Date.now();
      const message = {
        type,
        data,
        messageId: this.messagesSent + 1,
        timestamp: startTime,
        connectionId: this.id
      };

      this.ws.send(JSON.stringify(message));
      this.messagesSent++;
      
      // Update connection quality
      this.connectionQuality.successfulMessages++;
      const responseTime = Date.now() - startTime;
      this.connectionQuality.avgResponseTime = 
        (this.connectionQuality.avgResponseTime + responseTime) / 2;
      
      // Track performance
      this.performanceMonitor.recordWebSocketMessage(this.id, message, 'sent');
      
      return true;
    } catch (error) {
      console.error(`Error sending WebSocket message to ${this.id}:`, error);
      this.connectionQuality.failedMessages++;
      this.connected = false;
      this.cleanup();
      return false;
    }
  }

  sendData(data) {
    return this.sendMessage('data', data);
  }

  sendMetrics(metrics) {
    return this.sendMessage('metrics', metrics);
  }

  cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.rateLimiterInterval) {
      clearInterval(this.rateLimiterInterval);
    }
    this.performanceMonitor.removeWebSocketConnection(this.id);
    console.log(`🔌 WebSocket connection ${this.id} cleaned up`);
  }

  checkRateLimit() {
    const now = Date.now();
    const timePassed = (now - this.rateLimiter.lastRefill) / 1000;
    
    // Refill tokens based on time passed
    this.rateLimiter.tokens = Math.min(
      this.rateLimiter.maxTokens,
      this.rateLimiter.tokens + (timePassed * this.rateLimiter.refillRate)
    );
    this.rateLimiter.lastRefill = now;
    
    if (this.rateLimiter.tokens >= 1) {
      this.rateLimiter.tokens--;
      return true;
    }
    
    return false;
  }

  startRateLimiterRefill() {
    this.rateLimiterInterval = setInterval(() => {
      const now = Date.now();
      const timePassed = (now - this.rateLimiter.lastRefill) / 1000;
      
      this.rateLimiter.tokens = Math.min(
        this.rateLimiter.maxTokens,
        this.rateLimiter.tokens + (timePassed * this.rateLimiter.refillRate)
      );
      this.rateLimiter.lastRefill = now;
    }, 1000);
  }

  getConnectionQuality() {
    const total = this.connectionQuality.successfulMessages + this.connectionQuality.failedMessages;
    return {
      successRate: total > 0 ? (this.connectionQuality.successfulMessages / total) * 100 : 100,
      avgResponseTime: this.connectionQuality.avgResponseTime,
      totalMessages: total,
      reconnectAttempts: this.connectionQuality.reconnectAttempts
    };
  }

  getStats() {
    const now = Date.now();
    return {
      id: this.id,
      connected: this.connected,
      uptime: now - this.startTime,
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      lastPing: this.lastPingTime,
      lastPong: this.lastPongTime,
      latency: Math.max(0, this.lastPongTime - this.lastPingTime),
      readyState: this.ws.readyState,
      quality: this.getConnectionQuality(),
      rateLimitTokens: Math.floor(this.rateLimiter.tokens)
    };
  }
}

class WebSocketManager {
  constructor(performanceMonitor) {
    this.connections = new Map();
    this.performanceMonitor = performanceMonitor;
  }

  addConnection(ws) {
    const connection = new WebSocketConnection(ws, this.performanceMonitor);
    this.connections.set(connection.id, connection);
    
    console.log(`🔌 New WebSocket connection: ${connection.id} (Total: ${this.connections.size})`);
    this.performanceMonitor.addWebSocketConnection(connection.id);
    
    return connection;
  }

  removeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.cleanup();
      this.connections.delete(connectionId);
    }
  }

  broadcast(type, data) {
    let successCount = 0;
    const totalConnections = this.connections.size;

    for (const [id, connection] of this.connections) {
      if (connection.connected && connection.ws.readyState === WebSocket.OPEN) {
        const success = connection.sendMessage(type, data);
        if (success) successCount++;
      } else {
        this.connections.delete(id);
      }
    }

    return {
      totalConnections,
      successCount,
      failedCount: totalConnections - successCount
    };
  }

  broadcastData(data) {
    return this.broadcast('data', data);
  }

  getConnectionStats() {
    const stats = [];
    for (const [id, connection] of this.connections) {
      if (connection.connected) {
        stats.push(connection.getStats());
      } else {
        this.connections.delete(id);
      }
    }
    return stats;
  }

  getConnectionCount() {
    // Clean up disconnected connections
    for (const [id, connection] of this.connections) {
      if (!connection.connected || connection.ws.readyState !== WebSocket.OPEN) {
        this.connections.delete(id);
      }
    }
    return this.connections.size;
  }
}

// Setup WebSocket server
function setupWebSocket(server, dataGenerator, performanceMonitor) {
  const wsManager = new WebSocketManager(performanceMonitor);
  
  const wss = new WebSocket.Server({ 
    server,
    path: '/websocket',
    clientTracking: true
  });

  wss.on('connection', (ws, request) => {
    const connection = wsManager.addConnection(ws);
    
    // Send initial data if available
    const currentData = dataGenerator.getCurrentData();
    if (currentData) {
      connection.sendData(currentData);
    }
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  // Subscribe to data generator events
  dataGenerator.on('data', (data) => {
    wsManager.broadcastData(data);
  });

  dataGenerator.on('metrics', (metrics) => {
    wsManager.broadcast('metrics', metrics);
  });

  console.log('🔌 WebSocket server setup complete');
  
  return wsManager;
}

module.exports = {
  WebSocketConnection,
  WebSocketManager,
  setupWebSocket
};