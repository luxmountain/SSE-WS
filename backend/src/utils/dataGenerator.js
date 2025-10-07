const EventEmitter = require('events');

class DataGenerator extends EventEmitter {
  constructor() {
    super();
    this.simulations = new Map();
    this.currentData = null;
    this.scenarios = {
      'stock-prices': this.generateStockData.bind(this),
      'social-feed': this.generateSocialData.bind(this),
      'system-metrics': this.generateSystemData.bind(this),
      'chat-messages': this.generateChatData.bind(this),
      'iot-sensors': this.generateIoTData.bind(this),
      'high-frequency': this.generateHighFrequencyData.bind(this)
    };
  }

  startSimulation(type, scenario, duration = 30000) {
    if (!this.scenarios[scenario]) {
      throw new Error(`Unknown scenario: ${scenario}`);
    }

    const simulationId = `${type}-${scenario}-${Date.now()}`;
    
    const simulation = {
      id: simulationId,
      type,
      scenario,
      startTime: Date.now(),
      duration,
      interval: null,
      messageCount: 0
    };

    // Set different intervals for different scenarios
    const intervalMap = {
      'stock-prices': 1000,      // Every 1 second
      'social-feed': 2000,       // Every 2 seconds
      'system-metrics': 5000,    // Every 5 seconds
      'chat-messages': 500,      // Every 500ms
      'iot-sensors': 3000,       // Every 3 seconds
      'high-frequency': 100      // Every 100ms
    };

    const intervalDuration = intervalMap[scenario] || 1000;

    simulation.interval = setInterval(() => {
      const data = this.scenarios[scenario](simulation);
      this.currentData = data;
      simulation.messageCount++;
      
      // Emit data to both SSE and WebSocket
      this.emit('data', data);
      
      // Emit performance metrics periodically
      // Save bandwidth & relieve CPU -> balance real-time & performance
      if (simulation.messageCount % 10 === 0) {
        this.emit('metrics', {
          scenario,
          type,
          messageCount: simulation.messageCount,
          uptime: Date.now() - simulation.startTime,
          messagesPerSecond: simulation.messageCount / ((Date.now() - simulation.startTime) / 1000)
        });
      }
    }, intervalDuration);

    this.simulations.set(simulationId, simulation);

    // Auto-stop simulation after duration
    setTimeout(() => {
      this.stopSimulation(simulationId);
    }, duration);

    console.log(`📊 Started ${scenario} simulation (${type}) for ${duration}ms`);
    return simulationId;
  }

  stopSimulation(simulationId) {
    const simulation = this.simulations.get(simulationId);
    if (simulation && simulation.interval) {
      clearInterval(simulation.interval);
      this.simulations.delete(simulationId);
      console.log(`🛑 Stopped simulation: ${simulationId}`);
      return true;
    }
    return false;
  }

  stopAllSimulations() {
    for (const [id, simulation] of this.simulations) {
      if (simulation.interval) {
        clearInterval(simulation.interval);
      }
    }
    this.simulations.clear();
    console.log('🛑 All simulations stopped');
  }

  getCurrentData() {
    return this.currentData;
  }

  // Data generation methods for different scenarios

  generateStockData(simulation) {
    const stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA'];
    const basePrice = 150;
    
    return {
      scenario: 'stock-prices',
      timestamp: Date.now(),
      data: stocks.map(symbol => ({
        symbol,
        price: (basePrice + Math.random() * 100).toFixed(2),
        change: (Math.random() * 10 - 5).toFixed(2),
        changePercent: ((Math.random() * 10 - 5)).toFixed(2),
        volume: Math.floor(Math.random() * 1000000),
        marketCap: (Math.random() * 1000000000000).toFixed(0)
      })),
      messageId: simulation.messageCount + 1,
      simulationId: simulation.id
    };
  }

  generateSocialData(simulation) {
    const users = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const actions = ['posted', 'liked', 'shared', 'commented'];
    const topics = ['#tech', '#crypto', '#ai', '#web3', '#startup'];
    
    return {
      scenario: 'social-feed',
      timestamp: Date.now(),
      data: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => ({
        user: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        topic: topics[Math.floor(Math.random() * topics.length)],
        likes: Math.floor(Math.random() * 1000),
        timestamp: Date.now() - Math.random() * 3600000
      })),
      messageId: simulation.messageCount + 1,
      simulationId: simulation.id
    };
  }

  generateSystemData(simulation) {
    return {
      scenario: 'system-metrics',
      timestamp: Date.now(),
      data: {
        cpu: (Math.random() * 100).toFixed(1),
        memory: (Math.random() * 100).toFixed(1),
        disk: (Math.random() * 100).toFixed(1),
        network: {
          in: (Math.random() * 1000).toFixed(0),
          out: (Math.random() * 1000).toFixed(0)
        },
        processes: Math.floor(Math.random() * 500) + 50,
        uptime: Date.now() - simulation.startTime,
        loadAverage: [
          (Math.random() * 2).toFixed(2),
          (Math.random() * 2).toFixed(2),
          (Math.random() * 2).toFixed(2)
        ]
      },
      messageId: simulation.messageCount + 1,
      simulationId: simulation.id
    };
  }

  generateChatData(simulation) {
    const users = ['Alice', 'Bob', 'Charlie', 'Diana'];
    const messages = [
      'Hello everyone!', 'How are you doing?', 'Great weather today!',
      'Anyone working on interesting projects?', 'Check out this new framework',
      'Performance optimization is crucial', 'Real-time features are amazing'
    ];

    return {
      scenario: 'chat-messages',
      timestamp: Date.now(),
      data: {
        user: users[Math.floor(Math.random() * users.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        room: 'general',
        id: `msg-${Date.now()}-${Math.random()}`,
        reactions: Math.floor(Math.random() * 10)
      },
      messageId: simulation.messageCount + 1,
      simulationId: simulation.id
    };
  }

  generateIoTData(simulation) {
    const sensors = ['temperature', 'humidity', 'pressure', 'light', 'motion'];
    
    return {
      scenario: 'iot-sensors',
      timestamp: Date.now(),
      data: sensors.map(sensor => ({
        sensor,
        value: (Math.random() * 100).toFixed(2),
        unit: this.getSensorUnit(sensor),
        location: `Room-${Math.floor(Math.random() * 5) + 1}`,
        battery: Math.floor(Math.random() * 100),
        status: Math.random() > 0.1 ? 'online' : 'offline'
      })),
      messageId: simulation.messageCount + 1,
      simulationId: simulation.id
    };
  }

  generateHighFrequencyData(simulation) {
    return {
      scenario: 'high-frequency',
      timestamp: Date.now(),
      data: {
        value: Math.random(),
        sequence: simulation.messageCount + 1,
        batch: Math.floor((simulation.messageCount + 1) / 100),
        frequency: 10, // 10 Hz
        signal: Math.sin((Date.now() / 1000) * 2 * Math.PI * 0.1) // 0.1 Hz sine wave
      },
      messageId: simulation.messageCount + 1,
      simulationId: simulation.id
    };
  }

  getSensorUnit(sensor) {
    const units = {
      temperature: '°C',
      humidity: '%',
      pressure: 'hPa',
      light: 'lux',
      motion: 'bool'
    };
    return units[sensor] || 'unit';
  }

  getActiveSimulations() {
    return Array.from(this.simulations.values()).map(sim => ({
      id: sim.id,
      type: sim.type,
      scenario: sim.scenario,
      messageCount: sim.messageCount,
      uptime: Date.now() - sim.startTime,
      duration: sim.duration
    }));
  }
}

module.exports = { DataGenerator };