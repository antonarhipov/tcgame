'use client';

import React from 'react';
import { useRunState } from '@/contexts/RunStateContext';
import { getUnluckMessage } from '@/lib/content-pack';
import { mulberry32 } from '@/lib/scaling-meter';

interface GameLayoutProps {
  children: React.ReactNode;
  console?: React.ReactNode;
  meter?: React.ReactNode;
  className?: string;
}

/**
 * Main game layout component
 * Layout: left: Scenario/A-B, right: Console (top 1/3) + Meter (bottom 2/3)
 */
export function GameLayout({ children, console, meter, className = '' }: GameLayoutProps) {
  return (
    <div className={`h-screen bg-[var(--bg)] ${className}`}>
      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 h-screen">
        {/* Left side: Scenario/A-B choices */}
        <div className="flex flex-col p-6 lg:p-8">
          <div className="flex-1 max-w-2xl mx-auto w-full">
            {children}
          </div>
        </div>

        {/* Right side: Console (top 1/3) + Meter (bottom 2/3) */}
        <div className="bg-[var(--surface-1)] border-l border-[var(--border)] flex flex-col">
          {/* Console section - 1/3 height */}
          <div className="flex-none h-1/3 flex flex-col">
            <div className="p-4 border-b border-[var(--divider)]">
              <h2 className="text-lg font-semibold text-[var(--text-hard)]">
                Junie Console
              </h2>
              <p className="text-sm text-[var(--text-average)]">
                AI development in progress...
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              {console || <ConsolePlaceholder />}
            </div>
          </div>

          {/* Meter section - 2/3 height */}
          <div className="flex-1 border-t border-[var(--border)] overflow-y-auto">
            <div className="p-4 h-full">
              {meter || <MeterPlaceholder />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Placeholder console component for Phase 3
 */
function ConsolePlaceholder() {
  const { runState, contentPack } = useRunState();
  const [logs, setLogs] = React.useState<string[]>([
    '> Initializing AI Cofounder development environment...',
    '> Loading startup simulation engine...',
    '> Ready for founder decisions! 🚀'
  ]);

  const lastUnluckIndexRef = React.useRef<number>(-1);

  // Append Unluck message when event occurs on a step
  React.useEffect(() => {
    const stepIndex = runState.history.length - 1;
    if (stepIndex < 0) return;
    const last = runState.history[stepIndex];
    if (!last?.unluckApplied) return;
    if (!runState.choices[stepIndex]) return;
    if (lastUnluckIndexRef.current === stepIndex) return;
    lastUnluckIndexRef.current = stepIndex;

    const choice = runState.choices[stepIndex].choice;
    const step = contentPack.steps[stepIndex];
    const rng = mulberry32(runState.seed + stepIndex);
    const msg = getUnluckMessage(step, choice, rng) || 'Unluck event — gains reduced';
    const pct = last.luckFactor != null ? Math.round((last.luckFactor as number) * 100) : null;
    const line = `> ⚠️ Unluck: ${msg}${pct ? ` (gains cut to ${pct}%)` : ''}`;
    setLogs(prev => [...prev, line].slice(-20));
  }, [runState.history.length, runState.seed, contentPack.steps, runState.choices]);

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
        return updated.slice(-20);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col font-mono text-sm" aria-live="polite">
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {logs.map((log, index) => {
          const isUnluck = log.includes('⚠️ Unluck');
          return (
            <div 
              key={index}
              className={isUnluck
                ? 'text-[var(--color-pink)]'
                : 'text-[var(--text-average)] animate-pulse'}
              style={!isUnluck ? { animationDelay: `${index * 100}ms` } : undefined}
            >
              {log}
            </div>
          );
        })}
      </div>
      <div className="p-4 border-t border-[var(--divider)]">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse"></div>
          <span className="text-xs text-[var(--text-pale)]">
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
        <h3 className="text-lg font-semibold text-[var(--text-hard)]">
          Scaling Meter
        </h3>
        <div className="text-sm text-[var(--text-pale)]">
          Phase 5 implementation pending
        </div>
      </div>
      
      {/* Placeholder meter bar */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-[var(--text-average)] w-20">
            Overall
          </span>
          <div className="flex-1 bg-[var(--surface-2)] rounded-full h-4">
            <div 
              className="h-4 rounded-full transition-all duration-500"
              style={{ 
                width: '42%',
                background: 'var(--gradient-a)'
              }}
            ></div>
          </div>
          <span className="text-sm font-medium text-[var(--text-average)] w-12">
            42/100
          </span>
        </div>

        {/* Dimension placeholders */}
        {[
          { label: 'Revenue (R)', value: 35, color: 'var(--color-orange)' },
          { label: 'Users (U)', value: 48, color: 'var(--color-primary)' },
          { label: 'System (S)', value: 52, color: 'var(--color-magenta)' },
          { label: 'Customer (C)', value: 38, color: 'var(--color-pink)' },
          { label: 'Investor (I)', value: 45, color: 'var(--color-orange)' }
        ].map((dim, index) => (
          <div key={index} className="flex items-center space-x-4 text-sm">
            <span className="text-[var(--text-average)] w-20">
              {dim.label}
            </span>
            <div className="flex-1 bg-[var(--surface-2)] rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${dim.value}%`,
                  backgroundColor: dim.color
                }}
              ></div>
            </div>
            <span className="text-[var(--text-average)] w-12">
              {dim.value}
            </span>
          </div>
        ))}
      </div>

      {/* Insights placeholder */}
      <div className="mt-6 p-4 bg-[var(--surface-2)] rounded-md border border-[var(--border)]">
        <h4 className="font-medium text-[var(--text-hard)] mb-2">
          Insights
        </h4>
        <div className="text-sm text-[var(--text-average)] space-y-1">
          <p>• <strong>Top Driver:</strong> System reliability improvements</p>
          <p>• <strong>Bottleneck:</strong> Revenue generation needs attention</p>
          <p>• <strong>Tier:</strong> Finding Fit (30-49 range)</p>
        </div>
      </div>
    </div>
  );
}