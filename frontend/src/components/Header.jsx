import { Moon, Sun, Activity, Zap } from 'lucide-react';

const Header = ({ darkMode, toggleDarkMode }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                SSE vs WebSocket Demo
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Real-time Performance Comparison
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Tech Focus: SSE vs WebSocket</span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;