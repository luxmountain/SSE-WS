const { v4: uuidv4 } = require('uuid');

class SSEConnection {
  constructor(res, performanceMonitor) {
    this.id = uuidv4();
    this.res = res;
    this.performanceMonitor = performanceMonitor;
    this.connected = true;
    this.startTime = Date.now();
    this.messagesSent = 0;
    this.lastPingTime = Date.now();
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
      avgResponseTime: 0
    };
    
    this.setupConnection();
    this.startHeartbeat();
    this.startRateLimiterRefill();
  }

  setupConnection() {
    // Get the origin from request headers for dynamic CORS
    const origin = this.res.req.headers.origin || 'http://localhost:5173';
    
    this.res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Accept',
      'Access-Control-Expose-Headers': 'Content-Type, Cache-Control, Connection',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'Pragma': 'no-cache',
      'Expires': '0',
      'Vary': 'Origin'
    });

    // Send initial connection event
    this.sendEvent('connected', {
      connectionId: this.id,
      timestamp: Date.now(),
      type: 'sse'
    });

    // Handle client disconnect
    this.res.on('close', () => {
      this.connected = false;
      this.cleanup();
    });

    this.res.on('error', (error) => {
      console.error(`SSE connection error for ${this.id}:`, error);
      this.connected = false;
      this.cleanup();
    });
  }

  // Measurement latency and connection quality
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (!this.connected) return;
      
      this.sendEvent('ping', {
        timestamp: Date.now(),
        connectionId: this.id
      });
      
      this.lastPingTime = Date.now();
    }, 30000); // Ping every 30 seconds
  }

  sendEvent(eventType, data) {
    if (!this.connected) return false;

    // Check rate limit
    if (!this.checkRateLimit()) {
      console.warn(`Rate limit exceeded for SSE connection ${this.id}`);
      return false;
    }

    try {
      const startTime = Date.now();
      const eventData = {
        ...data,
        eventType,
        messageId: this.messagesSent + 1,
        timestamp: startTime,
        connectionId: this.id
      };

      // Format SSE message
      const message = `id: ${eventData.messageId}\nevent: ${eventType}\ndata: ${JSON.stringify(eventData)}\n\n`;
      
      this.res.write(message);
      this.messagesSent++;
      
      // Update connection quality
      this.connectionQuality.successfulMessages++;
      const responseTime = Date.now() - startTime;
      this.connectionQuality.avgResponseTime = 
        (this.connectionQuality.avgResponseTime + responseTime) / 2;
      
      // Track performance
      this.performanceMonitor.recordSSEMessage(this.id, eventData);
      
      return true;
    } catch (error) {
      console.error(`Error sending SSE event to ${this.id}:`, error);
      this.connectionQuality.failedMessages++;
      this.connected = false;
      this.cleanup();
      return false;
    }
  }

  sendData(data) {
    return this.sendEvent('data', data);
  }

  sendMetrics(metrics) {
    return this.sendEvent('metrics', metrics);
  }

  cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.rateLimiterInterval) {
      clearInterval(this.rateLimiterInterval);
    }
    this.performanceMonitor.removeSSEConnection(this.id);
    console.log(`🔌 SSE connection ${this.id} closed`);
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
      totalMessages: total
    };
  }

  getStats() {
    return {
      id: this.id,
      connected: this.connected,
      uptime: Date.now() - this.startTime,
      messagesSent: this.messagesSent,
      lastPing: this.lastPingTime,
      quality: this.getConnectionQuality(),
      rateLimitTokens: Math.floor(this.rateLimiter.tokens)
    };
  }
}

class SSEManager {
  constructor(performanceMonitor) {
    this.connections = new Map();
    this.performanceMonitor = performanceMonitor;
  }

  addConnection(res) {
    const connection = new SSEConnection(res, this.performanceMonitor);
    this.connections.set(connection.id, connection);
    
    console.log(`📡 New SSE connection: ${connection.id} (Total: ${this.connections.size})`);
    this.performanceMonitor.addSSEConnection(connection.id);
    
    return connection;
  }

  removeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.cleanup();
      this.connections.delete(connectionId);
    }
  }

  broadcast(eventType, data) {
    let successCount = 0;
    const totalConnections = this.connections.size;

    for (const [id, connection] of this.connections) {
      if (connection.connected) {
        const success = connection.sendEvent(eventType, data);
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
      if (!connection.connected) {
        this.connections.delete(id);
      }
    }
    return this.connections.size;
  }
}

// Setup SSE routes
function setupSSE(app, dataGenerator, performanceMonitor) {
  const sseManager = new SSEManager(performanceMonitor);

  // Handle preflight requests for SSE endpoint
  app.options('/events', (req, res) => {
    const origin = req.headers.origin || 'http://localhost:5173';
    res.set({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Accept',
      'Access-Control-Max-Age': '86400', // 24 hours
      'Vary': 'Origin'
    });
    res.status(204).end();
  });

  // Main SSE endpoint
  app.get('/events', (req, res) => {
    console.log(`📡 SSE connection request from origin: ${req.headers.origin}`);
    const connection = sseManager.addConnection(res);
    
    // Send initial data if available
    const currentData = dataGenerator.getCurrentData();
    if (currentData) {
      connection.sendData(currentData);
    }
  });

  // SSE-specific API endpoints
  app.get('/api/sse/connections', (req, res) => {
    res.json({
      count: sseManager.getConnectionCount(),
      connections: sseManager.getConnectionStats()
    });
  });

  app.post('/api/sse/broadcast', (req, res) => {
    const { eventType = 'message', data } = req.body;
    const result = sseManager.broadcast(eventType, data);
    res.json(result);
  });

  // Subscribe to data generator events
  dataGenerator.on('data', (data) => {
    sseManager.broadcastData(data);
  });

  dataGenerator.on('metrics', (metrics) => {
    sseManager.broadcast('metrics', metrics);
  });

  return sseManager;
}

module.exports = {
  SSEConnection,
  SSEManager,
  setupSSE
};