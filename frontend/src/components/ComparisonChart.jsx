import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

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
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="time" 
          stroke="#6B7280"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          stroke="#6B7280"
          tick={{ fontSize: 12 }}
          label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F9FAFB'
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="sseLatency" 
          stroke="#3B82F6" 
          name="SSE Latency"
          strokeWidth={2}
          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="wsLatency" 
          stroke="#10B981" 
          name="WebSocket Latency"
          strokeWidth={2}
          dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderThroughputChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData.slice(-10)}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="time" 
          stroke="#6B7280"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          stroke="#6B7280"
          tick={{ fontSize: 12 }}
          label={{ value: 'Messages/sec', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F9FAFB'
          }}
        />
        <Legend />
        <Bar dataKey="sseThroughput" fill="#3B82F6" name="SSE Throughput" />
        <Bar dataKey="wsThroughput" fill="#10B981" name="WebSocket Throughput" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderMessagesChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="time" 
          stroke="#6B7280"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          stroke="#6B7280"
          tick={{ fontSize: 12 }}
          label={{ value: 'Total Messages', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F9FAFB'
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="sseMessages" 
          stroke="#3B82F6" 
          name="SSE Messages"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="wsMessages" 
          stroke="#10B981" 
          name="WebSocket Messages"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderBandwidthChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData.slice(-10)}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="time" 
          stroke="#6B7280"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          stroke="#6B7280"
          tick={{ fontSize: 12 }}
          label={{ value: 'Bytes', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F9FAFB'
          }}
          formatter={(value, name) => [
            `${Math.round(value / 1024)} KB`,
            name
          ]}
        />
        <Legend />
        <Bar dataKey="sseBytes" fill="#3B82F6" name="SSE Data" />
        <Bar dataKey="wsBytes" fill="#10B981" name="WebSocket Data" />
      </BarChart>
    </ResponsiveContainer>
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
                <BarChart className="w-8 h-8 text-gray-400" />
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