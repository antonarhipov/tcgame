'use client';

import React from 'react';
import { useRunState } from '@/contexts/RunStateContext';
import { getMeterTier, getInsights } from '@/lib/scaling-meter';

interface ScalingMeterProps {
  className?: string;
}

/**
 * Scaling Meter UI component for Phase 5
 * Displays current meter value, tier, individual dimensions, and insights
 */
export function ScalingMeter({ className = '' }: ScalingMeterProps) {
  const { runState } = useRunState();
  
  // Get current meter value from latest history entry or 0 if no history
  const currentMeter = runState.history.length > 0 
    ? runState.history[runState.history.length - 1].meter 
    : 0;
  
  // Get previous meter value for delta calculation
  const previousMeter = runState.history.length > 1 
    ? runState.history[runState.history.length - 2].meter 
    : 0;
  
  const delta = currentMeter - previousMeter;
  
  // Get tier information
  const tierInfo = getMeterTier(currentMeter);
  
  // Get insights from current effective state and last delta
  const lastResult = runState.history[runState.history.length - 1];
  const insights = lastResult 
    ? getInsights(lastResult.effective, runState.choices[runState.choices.length - 1]?.delta || { R: 0, U: 0, S: 0, C: 0, I: 0 })
    : { drivers: [], bottleneck: null };

  // Unluck state from last result
  const unluckApplied = Boolean(lastResult && lastResult.unluckApplied);
  const luckFactor = typeof lastResult?.luckFactor === 'number' ? lastResult!.luckFactor as number : null;
  const [showUnluckOverlay, setShowUnluckOverlay] = React.useState(true);
  const unluckPercent = luckFactor !== null ? Math.round(luckFactor * 100) : null;
  
  // Individual dimension data
  const dimensions = [
    { 
      label: 'Revenue (R)', 
      value: runState.effective.R, 
      color: 'from-green-500 to-green-600',
      description: 'Revenue Momentum'
    },
    { 
      label: 'Users (U)', 
      value: runState.effective.U, 
      color: 'from-blue-500 to-blue-600',
      description: 'User Growth / Activation'
    },
    { 
      label: 'System (S)', 
      value: runState.effective.S, 
      color: 'from-purple-500 to-purple-600',
      description: 'System Reliability / Scalability'
    },
    { 
      label: 'Customer (C)', 
      value: runState.effective.C, 
      color: 'from-pink-500 to-pink-600',
      description: 'Customer Love (NPS / retention)'
    },
    { 
      label: 'Investor (I)', 
      value: runState.effective.I, 
      color: 'from-yellow-500 to-yellow-600',
      description: 'Investor Confidence / Story'
    }
  ];

  return (
    <div className={`max-w-4xl mx-auto ${className}`} role="region" aria-label="Scaling Meter">
      {/* Header with tier information */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Scaling Meter
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl" role="img" aria-label={tierInfo.tier}>
              {tierInfo.emoji}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {tierInfo.tier}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({tierInfo.range})
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Delta indicator */}
          {delta !== 0 && (
            <div className={`flex items-center space-x-1 text-sm font-medium ${
              delta > 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              <span>{delta > 0 ? '↗' : '↘'}</span>
              <span>{delta > 0 ? '+' : ''}{delta}</span>
            </div>
          )}
          {/* Toggle for Unluck overlay */}
          {unluckApplied && (
            <button
              type="button"
              aria-pressed={showUnluckOverlay}
              aria-label="Toggle Unluck info"
              title="Toggle Unluck info"
              className="text-xs px-2 py-1 rounded border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
              onClick={() => setShowUnluckOverlay(v => !v)}
              data-testid="unluck-toggle"
            >
              Unluck
            </button>
          )}
        </div>
      </div>
      
      {/* Main meter bar */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
            Overall
          </span>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-6 rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${Math.max(2, currentMeter)}%` }}
              role="progressbar"
              aria-valuenow={currentMeter}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Overall scaling meter: ${currentMeter} out of 100`}
            >
              {/* Animated shimmer effect for visual appeal */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              {/* Red spark animation overlay when Unluck applied */}
              {unluckApplied && (
                <div aria-hidden="true" data-testid="unluck-spark" className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(239,68,68,0.35),transparent_60%)] animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16 text-right">
            {currentMeter}/100
          </span>
        </div>

        {/* Reduced delta visualization when Unluck applied */}
        {unluckApplied && delta > 0 && (
          <div className="flex items-center gap-2 pl-20">
            <div className="h-2 w-40 bg-gray-300 dark:bg-gray-600 rounded overflow-hidden" aria-hidden="true" data-testid="reduced-delta-bar">
              <div className="h-2 bg-red-500/50" style={{ width: `${unluckPercent ?? 60}%` }}></div>
            </div>
            <span className="text-xs text-red-700 dark:text-red-300">
              Gains cut{unluckPercent ? ` to ${unluckPercent}%` : ''} this step
            </span>
          </div>
        )}

        {/* Individual dimension bars */}
        {dimensions.map((dim, index) => (
          <div key={index} className="flex items-center space-x-4 text-sm">
            <span 
              className="text-gray-600 dark:text-gray-400 w-20"
              title={dim.description}
            >
              {dim.label}
            </span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className={`bg-gradient-to-r ${dim.color} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${Math.max(1, Math.min(100, dim.value * 2))}%` }}
                role="progressbar"
                aria-valuenow={dim.value}
                aria-valuemin={0}
                aria-valuemax={50}
                aria-label={`${dim.description}: ${dim.value.toFixed(1)}`}
              ></div>
            </div>
            <span className="text-gray-600 dark:text-gray-400 w-12 text-right">
              {dim.value.toFixed(1)}
            </span>
          </div>
        ))}

        {/* Unluck overlay/tooltip (toggleable, non-blocking) */}
        {unluckApplied && showUnluckOverlay && (
          <div
            className="mt-2 inline-flex items-center gap-2 px-2 py-1 rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
            role="note"
            aria-live="polite"
            id="unluck-overlay"
            data-testid="unluck-overlay"
          >
            <span className="text-xs font-medium">Unluck event — gains reduced</span>
            {unluckPercent !== null && (
              <span className="text-[10px] opacity-80">(cut to {unluckPercent}%)</span>
            )}
          </div>
        )}
      </div>

      {/* Insights section */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
          Insights
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          {insights.drivers.length > 0 && (
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Top Drivers:</span>
              <span className="ml-2">{insights.drivers.join(', ')}</span>
            </div>
          )}
          
          {insights.bottleneck && (
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Bottleneck:</span>
              <span className="ml-2">{insights.bottleneck} needs attention</span>
            </div>
          )}
          
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Current Tier:</span>
            <span className="ml-2">{tierInfo.tier} ({tierInfo.range} range)</span>
          </div>
          
          {runState.history.length === 0 && (
            <div className="text-gray-500 dark:text-gray-400 italic">
              Make your first choice to see scaling insights!
            </div>
          )}
        </div>
      </div>

      {/* Live region for screen reader announcements */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        key={`meter-${currentMeter}-${runState.currentStep}`}
      >
        {runState.history.length > 0 && (
          `Scaling meter updated to ${currentMeter}. Current tier: ${tierInfo.tier}. ${
            delta > 0 ? `Increased by ${delta} points.` : 
            delta < 0 ? `Decreased by ${Math.abs(delta)} points.` : 
            'No change.'
          }${unluckApplied && unluckPercent !== null ? ` Unluck: gains cut to ${unluckPercent}% this step.` : ''}`
        )}
      </div>
    </div>
  );
}