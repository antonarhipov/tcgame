'use client';

import React from 'react';

interface GameLayoutProps {
  children: React.ReactNode;
  console?: React.ReactNode;
  meter?: React.ReactNode;
  className?: string;
}

/**
 * Main game layout component
 * Layout: left: Scenario/A-B, right: Console, bottom: Meter/Insights
 */
export function GameLayout({ children, console, meter, className = '' }: GameLayoutProps) {
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left side: Scenario/A-B choices */}
        <div className="flex flex-col p-6 lg:p-8">
          <div className="flex-1 max-w-2xl mx-auto w-full">
            {children}
          </div>
        </div>

        {/* Right side: Console */}
        <div className="bg-gray-100 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Junie Console
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI development in progress...
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              {console || <ConsolePlaceholder />}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Meter/Insights */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-4">
          {meter || <MeterPlaceholder />}
        </div>
      </div>
    </div>
  );
}

/**
 * Placeholder console component for Phase 3
 */
function ConsolePlaceholder() {
  const [logs, setLogs] = React.useState<string[]>([
    '> Initializing AI Cofounder development environment...',
    '> Loading startup simulation engine...',
    '> Ready for founder decisions! 🚀'
  ]);

  // Simulate some activity
  React.useEffect(() => {
    const interval = setInterval(() => {
      const messages = [
        '> Analyzing market conditions...',
        '> Optimizing product-market fit algorithms...',
        '> Monitoring user engagement metrics...',
        '> Calculating scaling potential...',
        '> Processing founder feedback...',
        '> Updating investor confidence models...'
      ];
      
      setLogs(prev => {
        const newLog = messages[Math.floor(Math.random() * messages.length)];
        const updated = [...prev, newLog];
        // Keep only last 10 logs
        return updated.slice(-10);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col font-mono text-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {logs.map((log, index) => (
          <div 
            key={index} 
            className="text-green-600 dark:text-green-400 animate-pulse"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {log}
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Console active - Phase 4 implementation pending
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Placeholder meter component for Phase 3
 */
function MeterPlaceholder() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Scaling Meter
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Phase 5 implementation pending
        </div>
      </div>
      
      {/* Placeholder meter bar */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
            Overall
          </span>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
              style={{ width: '42%' }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
            42/100
          </span>
        </div>

        {/* Dimension placeholders */}
        {[
          { label: 'Revenue (R)', value: 35, color: 'from-green-500 to-green-600' },
          { label: 'Users (U)', value: 48, color: 'from-blue-500 to-blue-600' },
          { label: 'System (S)', value: 52, color: 'from-purple-500 to-purple-600' },
          { label: 'Customer (C)', value: 38, color: 'from-pink-500 to-pink-600' },
          { label: 'Investor (I)', value: 45, color: 'from-yellow-500 to-yellow-600' }
        ].map((dim, index) => (
          <div key={index} className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400 w-20">
              {dim.label}
            </span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`bg-gradient-to-r ${dim.color} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${dim.value}%` }}
              ></div>
            </div>
            <span className="text-gray-600 dark:text-gray-400 w-12">
              {dim.value}
            </span>
          </div>
        ))}
      </div>

      {/* Insights placeholder */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
          Insights
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>• <strong>Top Driver:</strong> System reliability improvements</p>
          <p>• <strong>Bottleneck:</strong> Revenue generation needs attention</p>
          <p>• <strong>Tier:</strong> Finding Fit (30-49 range)</p>
        </div>
      </div>
    </div>
  );
}