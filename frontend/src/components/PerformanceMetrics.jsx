// Using emoji icons for Yarn compatibility

const PerformanceMetrics = ({ title, metrics, color = 'blue' }) => {
  if (!metrics) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <span className="text-5xl text-gray-400 block mb-4">⚠️</span>
            <p className="text-gray-500 dark:text-gray-400">No metrics available</p>
          </div>
        </div>
      </div>
    );
  }

  const colorClasses = {
    blue: {
      icon: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900',
      text: 'text-blue-800 dark:text-blue-200',
      border: 'border-blue-200 dark:border-blue-800'
    },
    green: {
      icon: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-800 dark:text-green-200',
      border: 'border-green-200 dark:border-green-800'
    }
  };

  const colors = colorClasses[color];

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const metricsData = [
    {
      icon: '📊',
      label: 'Total Messages',
      value: metrics.totalMessages?.toLocaleString() || '0',
      subtext: 'messages sent'
    },
    {
      icon: '⚡',
      label: 'Data Transfer',
      value: formatBytes(metrics.totalBytes || 0),
      subtext: 'total transferred'
    },
    {
      icon: '⏱️',
      label: 'Average Latency',
      value: `${metrics.averageLatency || 0}ms`,
      subtext: `${metrics.minLatency || 0}ms - ${metrics.maxLatency || 0}ms range`
    },
    {
      icon: '🚀',
      label: 'Throughput',
      value: `${metrics.messagesPerSecond || 0}`,
      subtext: 'messages per second'
    }
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        
        <div className={`px-3 py-1 rounded-full ${colors.bg} ${colors.text}`}>
          <span className="text-sm font-medium">Live</span>
        </div>
      </div>

      <div className="space-y-4">
        {metricsData.map((metric, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-xl">{metric.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {metric.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metric.subtext}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {metric.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Indicators */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Performance</span>
          <div className="flex items-center space-x-2">
            {getPerformanceIndicator(metrics)}
          </div>
        </div>
      </div>
    </div>
  );
};

const getPerformanceIndicator = (metrics) => {
  if (!metrics) return null;

  const latency = metrics.averageLatency || 0;
  const throughput = metrics.messagesPerSecond || 0;

  let latencyStatus = 'good';
  let throughputStatus = 'good';

  if (latency > 1000) latencyStatus = 'poor';
  else if (latency > 500) latencyStatus = 'fair';

  if (throughput < 1) throughputStatus = 'poor';
  else if (throughput < 10) throughputStatus = 'fair';

  const getStatusColor = (status) => {
    switch (status) {
      case 'good':
        return 'bg-green-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <>
      <div className="flex items-center space-x-1">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(latencyStatus)}`}></div>
        <span className="text-xs text-gray-500">Latency</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(throughputStatus)}`}></div>
        <span className="text-xs text-gray-500">Throughput</span>
      </div>
    </>
  );
};

export default PerformanceMetrics;