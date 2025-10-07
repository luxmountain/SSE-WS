// Using emoji icons instead of lucide-react for Yarn compatibility

const ConnectionStatus = ({ 
  type, 
  isConnected, 
  status, 
  error, 
  onConnect, 
  onDisconnect 
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <span className="text-green-500">✅</span>;
      case 'connecting':
      case 'reconnecting':
        return <span className="text-yellow-500 animate-spin">🔄</span>;
      case 'error':
      case 'failed':
        return <span className="text-red-500">❌</span>;
      case 'disconnected':
      default:
        return <span className="text-gray-500">⚠️</span>;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'status-online';
      case 'connecting':
      case 'reconnecting':
        return 'status-connecting';
      case 'error':
      case 'failed':
        return 'status-offline';
      case 'disconnected':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'error':
        return 'Connection Error';
      case 'failed':
        return 'Connection Failed';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {isConnected ? (
            <span className="text-2xl text-green-500">📶</span>
          ) : (
            <span className="text-2xl text-gray-400">📵</span>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {type} Connection
            </h3>
            <div className={`connection-status ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="ml-2">{getStatusText()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {isConnected ? (
            <button
              onClick={onDisconnect}
              className="btn-secondary"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={onConnect}
              className="btn-primary"
              disabled={status === 'connecting' || status === 'reconnecting'}
            >
              {status === 'connecting' || status === 'reconnecting' ? (
                <span className="animate-spin">🔄</span>
              ) : (
                'Connect'
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">❌</span>
            <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <span className="font-medium">Protocol:</span>
          <span className="ml-2">{type === 'SSE' ? 'Server-Sent Events' : 'WebSocket'}</span>
        </div>
        <div>
          <span className="font-medium">State:</span>
          <span className="ml-2">{status}</span>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;