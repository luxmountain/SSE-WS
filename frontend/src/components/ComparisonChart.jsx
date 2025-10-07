import { useState, useEffect } from 'react';

const ComparisonChart = ({ sseMetrics, wsMetrics }) => {
  const [chartData, setChartData] = useState([]);
  const [activeTab, setActiveTab] = useState('latency');

  useEffect(() => {
    const updateChartData = () => {
      const timestamp = new Date().toLocaleTimeString();
      
      const newDataPoint = {
        time: timestamp,
        sseLatency: sseMetrics?.averageLatency || 0,
        wsLatency: wsMetrics?.averageLatency || 0,
        sseThroughput: sseMetrics?.messagesPerSecond || 0,
        wsThroughput: wsMetrics?.messagesPerSecond || 0,
        sseMessages: sseMetrics?.totalMessages || 0,
        wsMessages: wsMetrics?.totalMessages || 0,
        sseBytes: sseMetrics?.totalBytes || 0,
        wsBytes: wsMetrics?.totalBytes || 0
      };

      setChartData(prevData => {
        const newData = [...prevData, newDataPoint];
        // Keep only last 20 data points
        return newData.slice(-20);
      });
    };

    // Update every 2 seconds when we have metrics
    if (sseMetrics || wsMetrics) {
      updateChartData();
    }
  }, [sseMetrics, wsMetrics]);

  const tabs = [
    { id: 'latency', label: 'Latency Comparison', icon: '⚡' },
    { id: 'throughput', label: 'Throughput Comparison', icon: '📊' },
    { id: 'messages', label: 'Message Count', icon: '📈' },
    { id: 'bandwidth', label: 'Bandwidth Usage', icon: '🌐' }
  ];

  const renderLatencyChart = () => (
    <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="text-4xl mb-4">📈</div>
        <div className="text-gray-600 dark:text-gray-400">
          <div className="mb-2">
            <span className="inline-block w-3 h-3 bg-blue-500 mr-2"></span>
            SSE Latency: {chartData[chartData.length - 1]?.sseLatency || 0}ms
          </div>
          <div>
            <span className="inline-block w-3 h-3 bg-green-500 mr-2"></span>
            WebSocket Latency: {chartData[chartData.length - 1]?.wsLatency || 0}ms
          </div>
        </div>
      </div>
    </div>
  );

  const renderThroughputChart = () => (
    <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="text-4xl mb-4">📊</div>
        <div className="text-gray-600 dark:text-gray-400">
          <div className="mb-2">
            <span className="inline-block w-3 h-3 bg-blue-500 mr-2"></span>
            SSE Throughput: {chartData[chartData.length - 1]?.sseThroughput || 0} msg/sec
          </div>
          <div>
            <span className="inline-block w-3 h-3 bg-green-500 mr-2"></span>
            WebSocket Throughput: {chartData[chartData.length - 1]?.wsThroughput || 0} msg/sec
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessagesChart = () => (
    <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="text-4xl mb-4">📈</div>
        <div className="text-gray-600 dark:text-gray-400">
          <div className="mb-2">
            <span className="inline-block w-3 h-3 bg-blue-500 mr-2"></span>
            SSE Messages: {chartData[chartData.length - 1]?.sseMessages || 0}
          </div>
          <div>
            <span className="inline-block w-3 h-3 bg-green-500 mr-2"></span>
            WebSocket Messages: {chartData[chartData.length - 1]?.wsMessages || 0}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBandwidthChart = () => (
    <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="text-4xl mb-4">🌐</div>
        <div className="text-gray-600 dark:text-gray-400">
          <div className="mb-2">
            <span className="inline-block w-3 h-3 bg-blue-500 mr-2"></span>
            SSE Data: {Math.round((chartData[chartData.length - 1]?.sseBytes || 0) / 1024)} KB
          </div>
          <div>
            <span className="inline-block w-3 h-3 bg-green-500 mr-2"></span>
            WebSocket Data: {Math.round((chartData[chartData.length - 1]?.wsBytes || 0) / 1024)} KB
          </div>
        </div>
      </div>
    </div>
  );

  const renderChart = () => {
    switch (activeTab) {
      case 'latency':
        return renderLatencyChart();
      case 'throughput':
        return renderThroughputChart();
      case 'messages':
        return renderMessagesChart();
      case 'bandwidth':
        return renderBandwidthChart();
      default:
        return renderLatencyChart();
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Performance Comparison
        </h3>
        
        {/* Summary Stats */}
        <div className="flex space-x-4 text-sm">
          <div className="text-center">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">SSE</span>
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">WebSocket</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Chart Content */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        {chartData.length > 0 ? (
          renderChart()
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-gray-400">📊</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Waiting for performance data...
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Start a simulation to see real-time comparisons
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonChart;