import { useState, useEffect } from "react";
import { useSSE } from "../hooks/useSSE";
import { useWebSocket } from "../hooks/useWebSocket";
import ConnectionStatus from "./ConnectionStatus";
import PerformanceMetrics from "./PerformanceMetrics";
import DataVisualization from "./DataVisualization";
import SimulationControls from "./SimulationControls";
import {
  TrendingUp,
  MessageSquare,
  Monitor,
  Thermometer,
  Zap,
  Smartphone,
} from "lucide-react";

const Dashboard = () => {
  const [selectedScenario, setSelectedScenario] = useState("stock-prices");
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(30);
  const [simulationKey, setSimulationKey] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // SSE Connection
  const {
    data: sseData,
    isConnected: sseConnected,
    connectionStatus: sseStatus,
    metrics: sseMetrics,
    connect: connectSSE,
    disconnect: disconnectSSE,
    clearData: clearSSEData,
    resetMetrics: resetSSEMetrics,
    error: sseError,
  } = useSSE('http://localhost:3001/events', isRunning);

  // WebSocket Connection
  const {
    data: wsData,
    isConnected: wsConnected,
    connectionStatus: wsStatus,
    metrics: wsMetrics,
    connect: connectWS,
    disconnect: disconnectWS,
    clearData: clearWSData,
    resetMetrics: resetWSMetrics,
    error: wsError,
  } = useWebSocket('ws://localhost:3001/websocket', isRunning);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      disconnectSSE();
      disconnectWS();
    };
  }, [disconnectSSE, disconnectWS]);

  // Countdown timer effect
  useEffect(() => {
    let interval = null;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeRemaining]);

  const handleStartSimulation = async () => {
    if (isRunning) return;

    // Clear old data and reset metrics before starting new simulation
    clearSSEData();
    clearWSData();
    resetSSEMetrics();
    resetWSMetrics();
    setSimulationKey((prev) => prev + 1);

    // Connect to both SSE and WebSocket before starting simulation
    connectSSE();
    connectWS();

    try {
      const response = await fetch("http://localhost:3001/api/simulate/both", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenario: selectedScenario,
          duration: duration,
        }),
      });

      if (response.ok) {
        setIsRunning(true);
        setTimeRemaining(duration);
        setTimeout(() => {
          setIsRunning(false);
          setTimeRemaining(0);
          // Disconnect after simulation ends but keep data
          disconnectSSE();
          disconnectWS();
        }, duration * 1000);
      }
    } catch (error) {
      console.error("Failed to start simulation:", error);
    }
  };

  const handleStopSimulation = async () => {
    try {
      await fetch("http://localhost:3001/api/stop-simulation", {
        method: "POST",
      });
      setIsRunning(false);
      setTimeRemaining(0);
      // Disconnect but keep the data and metrics
      disconnectSSE();
      disconnectWS();
    } catch (error) {
      console.error("Failed to stop simulation:", error);
    }
  };

  const scenarios = [
    { value: "stock-prices", label: "Stock Prices", icon: TrendingUp },
    { value: "social-feed", label: "Social Feed", icon: Smartphone },
    { value: "system-metrics", label: "System Metrics", icon: Monitor },
    { value: "chat-messages", label: "Chat Messages", icon: MessageSquare },
    { value: "iot-sensors", label: "IoT Sensors", icon: Thermometer },
    { value: "high-frequency", label: "High Frequency", icon: Zap },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        timeRemaining={timeRemaining}
        onStart={handleStartSimulation}
        onStop={handleStopSimulation}
      />

      {/* Data Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DataVisualization
          key={`sse-${simulationKey}`}
          title="SSE Data Stream"
          data={sseData}
          scenario={selectedScenario}
          color="blue"
        />
        <DataVisualization
          key={`ws-${simulationKey}`}
          title="WebSocket Data Stream"
          data={wsData}
          scenario={selectedScenario}
          color="green"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    </div>
  );
};

export default Dashboard;
