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
  
  // Store metrics from last simulation
  const [lastSSEMetrics, setLastSSEMetrics] = useState(null);
  const [lastWSMetrics, setLastWSMetrics] = useState(null);
  const [hasSimulationRun, setHasSimulationRun] = useState(false);

  // SSE Connection
  const {
    data: sseData,
    isConnected: sseConnected,
    connectionStatus: sseStatus,
    metrics: sseMetrics,
    connect: connectSSE,
    disconnect: disconnectSSE,
    clearData: clearSSEData,
    error: sseError,
  } = useSSE();

  // WebSocket Connection
  const {
    data: wsData,
    isConnected: wsConnected,
    connectionStatus: wsStatus,
    metrics: wsMetrics,
    connect: connectWS,
    disconnect: disconnectWS,
    clearData: clearWSData,
    error: wsError,
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

  // Capture metrics when simulation ends
  useEffect(() => {
    if (!isRunning && hasSimulationRun && (sseMetrics || wsMetrics)) {
      // Store metrics from completed simulation
      if (sseMetrics && sseMetrics.totalMessages > 0) {
        setLastSSEMetrics(sseMetrics);
      }
      if (wsMetrics && wsMetrics.totalMessages > 0) {
        setLastWSMetrics(wsMetrics);
      }
    }
  }, [isRunning, hasSimulationRun, sseMetrics, wsMetrics]);

  const handleStartSimulation = async () => {
    if (isRunning) return;

    try {
      // First, reset all backend data and metrics
      const resetResponse = await fetch("http://localhost:3001/api/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!resetResponse.ok) {
        throw new Error('Failed to reset simulation data');
      }

      clearSSEData();
      clearWSData();
      
      setLastSSEMetrics(null);
      setLastWSMetrics(null);
      
      setSimulationKey((prev) => prev + 1);
      setHasSimulationRun(true);

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
    } catch (error) {
      console.error("Failed to stop simulation:", error);
    }
  };

  const getDisplayMetrics = (currentMetrics, lastMetrics) => {
    if (isRunning) {
      return currentMetrics || null;
    }
    
    return hasSimulationRun ? (lastMetrics || currentMetrics) : currentMetrics;
  };

  const scenarios = [
    { value: "stock-prices", label: "Stock Prices", icon: TrendingUp },
    { value: "social-feed", label: "Social Feed", icon: Smartphone },
    { value: "chat-messages", label: "Chat Messages", icon: MessageSquare },
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
          metrics={getDisplayMetrics(sseMetrics, lastSSEMetrics)}
          color="blue"
          isSimulationRunning={isRunning}
          hasSimulationRun={hasSimulationRun}
        />
        <PerformanceMetrics
          title="WebSocket Performance"
          metrics={getDisplayMetrics(wsMetrics, lastWSMetrics)}
          color="green"
          isSimulationRunning={isRunning}
          hasSimulationRun={hasSimulationRun}
        />
      </div>
    </div>
  );
};

export default Dashboard;
