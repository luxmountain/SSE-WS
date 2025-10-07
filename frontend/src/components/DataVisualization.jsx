import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  MessageCircle, 
  Monitor, 
  Thermometer, 
  Zap, 
  Database,
  Heart
} from 'lucide-react';

const DataVisualization = ({ title, data, scenario, color = 'blue' }) => {
  const [displayData, setDisplayData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (data && data.timestamp !== lastUpdate) {
      setDisplayData(prevData => {
        const newData = [...prevData, { ...data, id: Date.now() }];
        return newData;
      });
      setLastUpdate(data.timestamp);
    }
  }, [data, lastUpdate]);

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      accent: 'bg-blue-600'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      accent: 'bg-green-600'
    }
  };

  const colors = colorClasses[color];

  const getScenarioIcon = (scenario) => {
    const icons = {
      'stock-prices': TrendingUp,
      'social-feed': MessageCircle,
      'system-metrics': Monitor,
      'chat-messages': MessageCircle,
      'iot-sensors': Thermometer,
      'high-frequency': Zap
    };
    return icons[scenario] || Database;
  };

  const ScenarioIcon = getScenarioIcon(scenario);

  const renderScenarioData = (item) => {
    if (!item || !item.data) return null;

    switch (scenario) {
      case 'stock-prices':
        return renderStockData(item.data);
      case 'social-feed':
        return renderSocialData(item.data);
      case 'system-metrics':
        return renderSystemData(item.data);
      case 'chat-messages':
        return renderChatData(item.data);
      case 'iot-sensors':
        return renderIoTData(item.data);
      case 'high-frequency':
        return renderHighFrequencyData(item.data);
      default:
        return renderGenericData(item.data);
    }
  };

  const renderStockData = (data) => (
    <div className="space-y-2">
      {Array.isArray(data) ? data.slice(0, 3).map((stock, index) => (
        <div key={index} className="flex justify-between items-center">
          <span className="font-medium">{stock.symbol}</span>
          <div className="text-right">
            <div className="font-semibold">${stock.price}</div>
            <div className={`text-sm ${parseFloat(stock.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stock.change > 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
            </div>
          </div>
        </div>
      )) : (
        <div>No stock data available</div>
      )}
    </div>
  );

  const renderSocialData = (data) => (
    <div className="space-y-2">
      {Array.isArray(data) ? data.slice(0, 3).map((activity, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm">
            <strong>{activity.user}</strong> {activity.action} {activity.topic}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            {activity.likes} <Heart size={12} className="text-red-500" />
          </span>
        </div>
      )) : (
        <div>No social data available</div>
      )}
    </div>
  );

  const renderSystemData = (data) => (
    <div className="grid grid-cols-2 gap-2">
      <div className="flex justify-between">
        <span>CPU:</span>
        <span className="font-semibold">{data.cpu}%</span>
      </div>
      <div className="flex justify-between">
        <span>Memory:</span>
        <span className="font-semibold">{data.memory}%</span>
      </div>
      <div className="flex justify-between">
        <span>Disk:</span>
        <span className="font-semibold">{data.disk}%</span>
      </div>
      <div className="flex justify-between">
        <span>Processes:</span>
        <span className="font-semibold">{data.processes}</span>
      </div>
    </div>
  );

  const renderChatData = (data) => (
    <div className="space-y-1">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {data.user?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">{data.user}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{data.message}</div>
        </div>
        {data.reactions > 0 && (
          <span className="text-xs text-gray-500">+{data.reactions}</span>
        )}
      </div>
    </div>
  );

  const renderIoTData = (data) => (
    <div className="space-y-2">
      {Array.isArray(data) ? data.slice(0, 3).map((sensor, index) => (
        <div key={index} className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${sensor.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{sensor.sensor} ({sensor.location})</span>
          </div>
          <span className="font-semibold">{sensor.value} {sensor.unit}</span>
        </div>
      )) : (
        <div>No IoT data available</div>
      )}
    </div>
  );

  const renderHighFrequencyData = (data) => (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Sequence:</span>
        <span className="font-semibold">#{data.sequence}</span>
      </div>
      <div className="flex justify-between">
        <span>Value:</span>
        <span className="font-semibold">{data.value?.toFixed(4)}</span>
      </div>
      <div className="flex justify-between">
        <span>Frequency:</span>
        <span className="font-semibold">{data.frequency} Hz</span>
      </div>
      <div className="flex justify-between">
        <span>Signal:</span>
        <span className="font-semibold">{data.signal?.toFixed(3)}</span>
      </div>
    </div>
  );

  const renderGenericData = (data) => (
    <div className="text-sm">
      <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-hidden">
        {JSON.stringify(data, null, 2).substring(0, 200)}...
      </pre>
    </div>
  );

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <ScenarioIcon size={20} className={colors.icon} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${colors.accent} ${data ? 'animate-pulse' : ''}`}></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {data ? 'Live' : 'Waiting...'}
          </span>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {displayData.length > 0 ? (
          displayData.slice().reverse().map((item, index) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg transition-all duration-500 ${colors.bg} ${colors.border} border
                ${index === 0 ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  #{item.messageId}
                </span>
              </div>
              {renderScenarioData(item)}
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="mb-2">
                <ScenarioIcon size={48} className="text-gray-400 mx-auto" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Waiting for {scenario.replace('-', ' ')} data...
              </p>
            </div>
          </div>
        )}
      </div>

      {data && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Scenario: {scenario.replace('-', ' ')}</span>
            <span>Messages: {displayData.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataVisualization;