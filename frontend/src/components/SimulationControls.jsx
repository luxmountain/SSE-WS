import { Play, Pause, Settings } from 'lucide-react';

const SimulationControls = ({
  scenarios,
  selectedScenario,
  onScenarioChange,
  duration,
  onDurationChange,
  isRunning,
  onStart,
  onStop
}) => {
  return (
    <div className="card p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Simulation Controls
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          {isRunning ? (
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Simulation Running</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm font-medium">Simulation Stopped</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Scenario Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Data Scenario
          </label>
          <select
            value={selectedScenario}
            onChange={(e) => onScenarioChange(e.target.value)}
            disabled={isRunning}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scenarios.map((scenario) => (
              <option key={scenario.value} value={scenario.value}>
                {scenario.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Choose the type of data to simulate
          </p>
        </div>

        {/* Duration Control */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Duration (seconds)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => onDurationChange(parseInt(e.target.value) || 30)}
            min="5"
            max="300"
            step="5"
            disabled={isRunning}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            How long to run the simulation
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-col justify-end">
          <div className="flex space-x-3">
            <button
              onClick={isRunning ? onStop : onStart}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                isRunning
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            {isRunning ? 'Click to stop current simulation' : 'Start data simulation for both protocols'}
          </p>
        </div>
      </div>

      {/* Scenario Description */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Current Scenario: {scenarios.find(s => s.value === selectedScenario)?.label}
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {getScenarioDescription(selectedScenario)}
        </p>
      </div>
    </div>
  );
};

const getScenarioDescription = (scenario) => {
  const descriptions = {
    'stock-prices': 'Real-time stock market data with prices, volume, and market cap updates. Good for testing steady data streams.',
    'social-feed': 'Social media activity simulation with posts, likes, and comments. Tests burst traffic patterns.',
    'system-metrics': 'System performance monitoring including CPU, memory, disk usage. Tests moderate frequency updates.',
    'chat-messages': 'Live chat simulation with user messages and reactions. Tests high-frequency bidirectional communication.',
    'iot-sensors': 'IoT device data including temperature, humidity, and sensor readings. Tests device monitoring scenarios.',
    'high-frequency': 'High-frequency data simulation at 10Hz. Tests maximum throughput and latency performance.'
  };
  
  return descriptions[scenario] || 'Select a scenario to see its description.';
};

export default SimulationControls;