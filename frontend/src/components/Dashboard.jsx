import { useState, useEffect } from 'react';
import { useSSE } from '../hooks/useSSE';
import { useWebSocket } from '../hooks/useWebSocket';
import ConnectionStatus from './ConnectionStatus';
import PerformanceMetrics from './PerformanceMetrics';
import DataVisualization from './DataVisualization';
import SimulationControls from './SimulationControls';
import ComparisonChart from './ComparisonChart';
// Removed icon imports to avoid Yarn PnP issues

const Dashboard = () => {
  const [selectedScenario, setSelectedScenario] = useState('stock-prices');
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(30);

  // SSE Connection
  const {
    data: sseData,
    isConnected: sseConnected,
    connectionStatus: sseStatus,
    metrics: sseMetrics,
    connect: connectSSE,
    disconnect: disconnectSSE,
    error: sseError
  } = useSSE();

  // WebSocket Connection
  const {
    data: wsData,
    isConnected: wsConnected,
    connectionStatus: wsStatus,
    metrics: wsMetrics,
    connect: connectWS,
    disconnect: disconnectWS,
    error: wsError
  } = useWebSocket();

  // Auto-connect on mount
  useEffect(() => {
    connectSSE();
    connectWS();
    
    return () => {
      disconnectSSE();
      disconnectWS();
    };
  }, [connectSSE, connectWS, disconnectSSE, disconnectWS]);

  const handleStartSimulation = async () => {
    if (isRunning) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/simulate/both', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario: selectedScenario,
          duration: duration
        }),
      });

      if (response.ok) {
        setIsRunning(true);
        setTimeout(() => setIsRunning(false), duration * 1000);
      }
    } catch (error) {
      console.error('Failed to start simulation:', error);
    }
  };

  const handleStopSimulation = async () => {
    try {
      await fetch('http://localhost:3001/api/stop-simulation', {
        method: 'POST',
      });
      setIsRunning(false);
    } catch (error) {
      console.error('Failed to stop simulation:', error);
    }
  };

  const scenarios = [
    { value: 'stock-prices', label: 'Stock Prices', icon: '📈' },
    { value: 'social-feed', label: 'Social Feed', icon: '📱' },
    { value: 'system-metrics', label: 'System Metrics', icon: '🖥️' },
    { value: 'chat-messages', label: 'Chat Messages', icon: '💬' },
    { value: 'iot-sensors', label: 'IoT Sensors', icon: '🌡️' },
    { value: 'high-frequency', label: 'High Frequency', icon: '⚡' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">SSE Messages</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {sseMetrics?.totalMessages || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">WS Messages</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {wsMetrics?.totalMessages || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">SSE Latency</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {sseMetrics?.averageLatency || 0}ms
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">WS Latency</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {wsMetrics?.averageLatency || 0}ms
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ConnectionStatus
          type="SSE"
          isConnected={sseConnected}
          status={sseStatus}
          error={sseError}
          onConnect={connectSSE}
          onDisconnect={disconnectSSE}
        />
        <ConnectionStatus
          type="WebSocket"
          isConnected={wsConnected}
          status={wsStatus}
          error={wsError}
          onConnect={connectWS}
          onDisconnect={disconnectWS}
        />
      </div>

      {/* Simulation Controls */}
      <SimulationControls
        scenarios={scenarios}
        selectedScenario={selectedScenario}
        onScenarioChange={setSelectedScenario}
        duration={duration}
        onDurationChange={setDuration}
        isRunning={isRunning}
        onStart={handleStartSimulation}
        onStop={handleStopSimulation}
      />

      {/* Performance Comparison Chart */}
      <div className="mb-8">
        <ComparisonChart sseMetrics={sseMetrics} wsMetrics={wsMetrics} />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <PerformanceMetrics
          title="SSE Performance"
          metrics={sseMetrics}
          color="blue"
        />
        <PerformanceMetrics
          title="WebSocket Performance"
          metrics={wsMetrics}
          color="green"
        />
      </div>

      {/* Data Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataVisualization
          title="SSE Data Stream"
          data={sseData}
          scenario={selectedScenario}
          color="blue"
        />
        <DataVisualization
          title="WebSocket Data Stream"
          data={wsData}
          scenario={selectedScenario}
          color="green"
        />
      </div>
    </div>
  );
};

export default Dashboard;