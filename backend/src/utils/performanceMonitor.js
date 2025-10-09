class PerformanceMonitor {
  constructor() {
    this.sseConnections = new Map();
    this.wsConnections = new Map();
    this.sseMetrics = {
      totalMessages: 0,
      totalBytes: 0,
      connectionsCreated: 0,
      connectionsActive: 0,
      errors: 0,
      latencyHistory: []
    };
    this.wsMetrics = {
      totalMessages: 0,
      totalBytes: 0,
      connectionsCreated: 0,
      connectionsActive: 0,
      errors: 0,
      latencyHistory: []
    };
    this.startTime = Date.now();
  }

  // SSE Connection Management
  addSSEConnection(connectionId) {
    this.sseConnections.set(connectionId, {
      id: connectionId,
      startTime: Date.now(),
      messagesSent: 0,
      bytesSent: 0,
      lastMessageTime: Date.now(),
      errors: 0
    });
    this.sseMetrics.connectionsCreated++;
    this.sseMetrics.connectionsActive++;
  }

  removeSSEConnection(connectionId) {
    if (this.sseConnections.has(connectionId)) {
      this.sseConnections.delete(connectionId);
      this.sseMetrics.connectionsActive = Math.max(0, this.sseMetrics.connectionsActive - 1);
    }
  }

  recordSSEMessage(connectionId, message) {
    const connection = this.sseConnections.get(connectionId);
    if (connection) {
      const messageSize = JSON.stringify(message).length;
      
      // Only count actual data messages, not system messages
      const isDataMessage = message.type === 'data' || (!message.type && message.data);
      
      connection.messagesSent++;
      connection.bytesSent += messageSize;
      connection.lastMessageTime = Date.now();
      
      // Only count data messages in performance metrics
      if (isDataMessage) {
        this.sseMetrics.totalMessages++;
        this.sseMetrics.totalBytes += messageSize;
        
        // Calculate latency if timestamp is available
        if (message.timestamp) {
          const latency = Date.now() - message.timestamp;
          this.sseMetrics.latencyHistory.push(latency);
          // Keep only last 100 latency measurements
          if (this.sseMetrics.latencyHistory.length > 100) {
            this.sseMetrics.latencyHistory.shift();
          }
        }
      }
    }
  }

  // WebSocket Connection Management
  addWebSocketConnection(connectionId) {
    this.wsConnections.set(connectionId, {
      id: connectionId,
      startTime: Date.now(),
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      lastMessageTime: Date.now(),
      errors: 0
    });
    this.wsMetrics.connectionsCreated++;
    this.wsMetrics.connectionsActive++;
  }

  removeWebSocketConnection(connectionId) {
    if (this.wsConnections.has(connectionId)) {
      this.wsConnections.delete(connectionId);
      this.wsMetrics.connectionsActive = Math.max(0, this.wsMetrics.connectionsActive - 1);
    }
  }

  recordWebSocketMessage(connectionId, message, direction = 'sent') {
    const connection = this.wsConnections.get(connectionId);
    if (connection) {
      const messageSize = JSON.stringify(message).length;
      
      // Only count actual data messages, not system messages (ping, pong, connected, etc.)
      const isDataMessage = message.type === 'data' || (!message.type && message.data);
      
      if (direction === 'sent') {
        connection.messagesSent++;
        connection.bytesSent += messageSize;
        
        // Only count data messages in performance metrics
        if (isDataMessage) {
          this.wsMetrics.totalMessages++;
          this.wsMetrics.totalBytes += messageSize;
          
          // Calculate latency if timestamp is available
          if (message.timestamp) {
            const latency = Date.now() - message.timestamp;
            this.wsMetrics.latencyHistory.push(latency);
            // Keep only last 100 latency measurements
            if (this.wsMetrics.latencyHistory.length > 100) {
              this.wsMetrics.latencyHistory.shift();
            }
          }
        }
      } else {
        connection.messagesReceived++;
        connection.bytesReceived += messageSize;
      }
      
      connection.lastMessageTime = Date.now();
    }
  }

  // Performance Statistics
  getSSEStats() {
    const connections = Array.from(this.sseConnections.values());
    const now = Date.now();
    
    const avgLatency = this.sseMetrics.latencyHistory.length > 0 
      ? this.sseMetrics.latencyHistory.reduce((a, b) => a + b, 0) / this.sseMetrics.latencyHistory.length 
      : 0;

    const maxLatency = this.sseMetrics.latencyHistory.length > 0 
      ? Math.max(...this.sseMetrics.latencyHistory) 
      : 0;

    const minLatency = this.sseMetrics.latencyHistory.length > 0 
      ? Math.min(...this.sseMetrics.latencyHistory) 
      : 0;

    // Calculate connection overhead and network usage
    const totalConnectionMessages = connections.reduce((sum, conn) => sum + conn.messagesSent, 0);
    const dataMessages = this.sseMetrics.totalMessages;
    const connectionOverhead = totalConnectionMessages > 0 ? 
      Math.round(((totalConnectionMessages - dataMessages) / totalConnectionMessages) * 100) : 0;
    
    const totalBandwidth = connections.reduce((sum, conn) => sum + conn.bytesSent, 0);
    const dataBandwidth = this.sseMetrics.totalBytes;
    const networkUsage = totalBandwidth > 0 ? 
      Math.round((dataBandwidth / totalBandwidth) * 100) : 0;

    return {
      type: 'sse',
      connections: {
        active: this.sseMetrics.connectionsActive,
        total: this.sseMetrics.connectionsCreated,
        details: connections.map(conn => ({
          id: conn.id,
          uptime: now - conn.startTime,
          messagesSent: conn.messagesSent,
          bytesSent: conn.bytesSent,
          lastActivity: now - conn.lastMessageTime,
          errors: conn.errors
        }))
      },
      performance: {
        totalMessages: this.sseMetrics.totalMessages,
        totalBytes: this.sseMetrics.totalBytes,
        averageLatency: Math.round(avgLatency),
        maxLatency: Math.round(maxLatency),
        minLatency: Math.round(minLatency),
        messagesPerSecond: this.calculateMessagesPerSecond('sse'),
        bytesPerSecond: this.calculateBytesPerSecond('sse'),
        connectionOverhead: connectionOverhead,
        networkUsage: networkUsage
      },
      uptime: now - this.startTime,
      errors: this.sseMetrics.errors
    };
  }

  getWebSocketStats() {
    const connections = Array.from(this.wsConnections.values());
    const now = Date.now();
    
    const avgLatency = this.wsMetrics.latencyHistory.length > 0 
      ? this.wsMetrics.latencyHistory.reduce((a, b) => a + b, 0) / this.wsMetrics.latencyHistory.length 
      : 0;

    const maxLatency = this.wsMetrics.latencyHistory.length > 0 
      ? Math.max(...this.wsMetrics.latencyHistory) 
      : 0;

    const minLatency = this.wsMetrics.latencyHistory.length > 0 
      ? Math.min(...this.wsMetrics.latencyHistory) 
      : 0;

    // Calculate connection overhead and network usage
    const totalConnectionMessages = connections.reduce((sum, conn) => sum + conn.messagesSent + conn.messagesReceived, 0);
    const dataMessages = this.wsMetrics.totalMessages;
    const connectionOverhead = totalConnectionMessages > 0 ? 
      Math.round(((totalConnectionMessages - dataMessages) / totalConnectionMessages) * 100) : 0;
    
    const totalBandwidth = connections.reduce((sum, conn) => sum + conn.bytesSent + conn.bytesReceived, 0);
    const dataBandwidth = this.wsMetrics.totalBytes;
    const networkUsage = totalBandwidth > 0 ? 
      Math.round((dataBandwidth / totalBandwidth) * 100) : 0;

    return {
      type: 'websocket',
      connections: {
        active: this.wsMetrics.connectionsActive,
        total: this.wsMetrics.connectionsCreated,
        details: connections.map(conn => ({
          id: conn.id,
          uptime: now - conn.startTime,
          messagesSent: conn.messagesSent,
          messagesReceived: conn.messagesReceived,
          bytesSent: conn.bytesSent,
          bytesReceived: conn.bytesReceived,
          lastActivity: now - conn.lastMessageTime,
          errors: conn.errors
        }))
      },
      performance: {
        totalMessages: this.wsMetrics.totalMessages,
        totalBytes: this.wsMetrics.totalBytes,
        averageLatency: Math.round(avgLatency),
        maxLatency: Math.round(maxLatency),
        minLatency: Math.round(minLatency),
        messagesPerSecond: this.calculateMessagesPerSecond('ws'),
        bytesPerSecond: this.calculateBytesPerSecond('ws'),
        connectionOverhead: connectionOverhead,
        networkUsage: networkUsage
      },
      uptime: now - this.startTime,
      errors: this.wsMetrics.errors
    };
  }

  getStats() {
    return {
      sse: this.getSSEStats(),
      websocket: this.getWebSocketStats(),
      comparison: this.getComparisonStats(),
      system: this.getSystemStats()
    };
  }

  getComparisonStats() {
    const sseStats = this.getSSEStats();
    const wsStats = this.getWebSocketStats();

    return {
      latencyComparison: {
        sse: sseStats.performance.averageLatency,
        websocket: wsStats.performance.averageLatency,
        winner: sseStats.performance.averageLatency < wsStats.performance.averageLatency ? 'sse' : 'websocket'
      },
      throughputComparison: {
        sse: sseStats.performance.messagesPerSecond,
        websocket: wsStats.performance.messagesPerSecond,
        winner: sseStats.performance.messagesPerSecond > wsStats.performance.messagesPerSecond ? 'sse' : 'websocket'
      },
      resourceUsage: {
        sse: {
          connections: sseStats.connections.active,
          memoryEstimate: sseStats.connections.active * 1024 // Rough estimate in bytes
        },
        websocket: {
          connections: wsStats.connections.active,
          memoryEstimate: wsStats.connections.active * 2048 // Rough estimate in bytes
        }
      }
    };
  }

  getSystemStats() {
    const memoryUsage = process.memoryUsage();
    return {
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
      },
      uptime: Math.round(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform
    };
  }

  calculateMessagesPerSecond(type) {
    const uptime = (Date.now() - this.startTime) / 1000;
    const totalMessages = type === 'sse' ? this.sseMetrics.totalMessages : this.wsMetrics.totalMessages;
    return uptime > 0 ? Math.round(totalMessages / uptime) : 0;
  }

  calculateBytesPerSecond(type) {
    const uptime = (Date.now() - this.startTime) / 1000;
    const totalBytes = type === 'sse' ? this.sseMetrics.totalBytes : this.wsMetrics.totalBytes;
    return uptime > 0 ? Math.round(totalBytes / uptime) : 0;
  }

  recordError(type, error) {
    if (type === 'sse') {
      this.sseMetrics.errors++;
    } else if (type === 'websocket') {
      this.wsMetrics.errors++;
    }
    console.error(`${type.toUpperCase()} Error:`, error);
  }

  reset() {
    this.sseConnections.clear();
    this.wsConnections.clear();
    this.sseMetrics = {
      totalMessages: 0,
      totalBytes: 0,
      connectionsCreated: 0,
      connectionsActive: 0,
      errors: 0,
      latencyHistory: []
    };
    this.wsMetrics = {
      totalMessages: 0,
      totalBytes: 0,
      connectionsCreated: 0,
      connectionsActive: 0,
      errors: 0,
      latencyHistory: []
    };
    this.startTime = Date.now();
  }

  resetSimulationData() {
    // Reset only performance metrics, keep connections alive
    this.sseMetrics.totalMessages = 0;
    this.sseMetrics.totalBytes = 0;
    this.sseMetrics.errors = 0;
    this.sseMetrics.latencyHistory = [];
    
    this.wsMetrics.totalMessages = 0;
    this.wsMetrics.totalBytes = 0;
    this.wsMetrics.errors = 0;
    this.wsMetrics.latencyHistory = [];
    
    // Reset per-connection counters but keep connections
    for (const connection of this.sseConnections.values()) {
      connection.messagesSent = 0;
      connection.bytesSent = 0;
      connection.errors = 0;
    }
    
    for (const connection of this.wsConnections.values()) {
      connection.messagesSent = 0;
      connection.messagesReceived = 0;
      connection.bytesSent = 0;
      connection.bytesReceived = 0;
      connection.errors = 0;
    }
    
    this.startTime = Date.now();
    console.log('📊 Performance metrics reset for new simulation');
  }
}

module.exports = { PerformanceMonitor };