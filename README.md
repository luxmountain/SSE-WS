# SSE vs WebSocket Performance Demo

A comprehensive comparison of Server-Sent Events (SSE) and WebSocket technologies for real-time communication.

## 🎯 Project Overview

This demo showcases the performance characteristics, connection management, and use cases of:
- **Server-Sent Events (SSE)**: Unidirectional server-to-client communication
- **WebSocket**: Bidirectional real-time communication

## 🏗️ Architecture

```
├── backend/          # Node.js Express server
│   ├── src/
│   │   ├── server.js     # Main server with SSE & WebSocket
│   │   ├── sse.js        # SSE implementation
│   │   ├── websocket.js  # WebSocket implementation
│   │   └── utils/        # Performance monitoring utilities
│   └── package.json
├── frontend/         # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/   # Dashboard components
│   │   ├── hooks/        # Custom hooks for connections
│   │   └── utils/        # Performance measurement
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Backend Setup**
```bash
cd backend
npm install
npm start
```

2. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

3. **Open Browser**
Navigate to `http://localhost:5173`

## 📊 Features

### Real-time Dashboard
- Side-by-side comparison of SSE and WebSocket
- Live performance metrics visualization
- Connection status monitoring
- Latency and throughput measurements

### Performance Monitoring
- Message delivery latency
- Connection overhead analysis
- Memory usage tracking
- Reconnection handling

### Fallback Mechanisms
- Automatic connection recovery
- Graceful degradation
- Error handling and retry logic

## 🔧 Technology Comparison

### Server-Sent Events (SSE)
✅ **Pros:**
- Simple implementation
- Built-in reconnection
- HTTP-based (firewall friendly)
- Lower resource usage
- Perfect for one-way data streams

❌ **Cons:**
- Unidirectional only
- Limited browser connections (6 per domain)
- Text-based format only

### WebSocket
✅ **Pros:**
- Bidirectional communication
- Binary data support
- No connection limits
- Lower latency for frequent messages
- Custom protocols

❌ **Cons:**
- More complex implementation
- Manual reconnection logic
- Proxy/firewall issues
- Higher resource usage

## 📈 Use Cases

### SSE is Better For:
- Live feeds (news, social media)
- Real-time notifications
- Stock prices / sports scores
- System monitoring dashboards
- Progress indicators

### WebSocket is Better For:
- Chat applications
- Collaborative editing
- Gaming
- Trading platforms
- Video conferencing

## 🛠️ Development

Run both servers concurrently:
```bash
npm run dev:all
```

## 📋 Demo Scenarios

1. **High Frequency Data** - Stock price simulation
2. **Burst Traffic** - Social media feed simulation  
3. **Connection Stability** - Network interruption testing
4. **Resource Usage** - Memory and CPU monitoring
5. **Scalability** - Multiple client simulation

## 🎨 Technologies Used

- **Backend**: Node.js, Express, ws library
- **Frontend**: React, Vite, Tailwind CSS, Chart.js
- **Real-time**: SSE (EventSource), WebSocket
- **Monitoring**: Performance API, Network timing