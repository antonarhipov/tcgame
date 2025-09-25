'use client';

import React from 'react';
import { useRunState, useCanResume } from '@/contexts/RunStateContext';

interface StartScreenProps {
  onStartNew: () => void;
  onResume: () => void;
}

/**
 * Start screen component for beginning or resuming a game
 */
export function StartScreen({ onStartNew, onResume }: StartScreenProps) {
  const { contentPack, resetRun } = useRunState();
  const canResume = useCanResume();
  const currentPack = contentPack;

  const handleNewRun = () => {
    resetRun();
    onStartNew();
  };

  const handleResume = () => {
    onResume();
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset your progress? This cannot be undone.')) {
      resetRun();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-hard)]">
            {currentPack.title}
          </h1>
          {currentPack.description && (
            <p className="text-lg text-[var(--text-average)] max-w-xl mx-auto">
              {currentPack.description}
            </p>
          )}
        </div>

        {/* Game description */}
        <div className="bg-[var(--surface-1)] rounded-md p-6 border border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--text-hard)] mb-4">
            How it works
          </h2>
          <div className="text-left space-y-3 text-[var(--text-average)]">
            <p>• Navigate through 5 stages of startup growth</p>
            <p>• Make strategic decisions that impact your scaling meter</p>
            <p>• Watch Junie (your AI cofounder) implement your choices</p>
            <p>• Track your progress across 5 key dimensions:</p>
            <div className="ml-4 space-y-1 text-sm">
              <p>- <strong>Revenue (R):</strong> Monetization and financial growth</p>
              <p>- <strong>Users (U):</strong> User acquisition and activation</p>
              <p>- <strong>System (S):</strong> Technical reliability and scalability</p>
              <p>- <strong>Customer (C):</strong> Customer satisfaction and retention</p>
              <p>- <strong>Investor (I):</strong> Investor confidence and story</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <button
            onClick={handleNewRun}
            className="w-full max-w-sm mx-auto block text-white font-semibold py-4 px-8 rounded-[20px] transition-all duration-200 focus:outline-none hover:brightness-110"
            style={{ 
              background: 'var(--gradient-a)',
              boxShadow: 'var(--shadow-focus)'
            }}
            onFocus={(e) => e.target.style.boxShadow = 'var(--shadow-focus)'}
            onBlur={(e) => e.target.style.boxShadow = 'none'}
          >
            Start New Run
          </button>

          {canResume && (
            <div className="space-y-2">
              <button
                onClick={handleResume}
                className="w-full max-w-sm mx-auto block bg-transparent border border-[var(--border)] text-[var(--text-hard)] font-semibold py-4 px-8 rounded-[20px] transition-all duration-200 focus:outline-none hover:bg-[rgba(255,255,255,0.06)]"
                style={{ 
                  boxShadow: 'none'
                }}
                onFocus={(e) => e.target.style.boxShadow = 'var(--shadow-focus)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              >
                Resume Progress
              </button>
              <button
                onClick={handleReset}
                className="w-full max-w-sm mx-auto block bg-transparent text-[var(--text-average)] font-medium py-2 px-6 rounded-md transition-all duration-200 focus:outline-none hover:text-[var(--color-pink)] hover:underline text-sm"
                style={{ 
                  boxShadow: 'none'
                }}
                onFocus={(e) => e.target.style.boxShadow = 'var(--shadow-focus)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              >
                Reset Progress
              </button>
            </div>
          )}
        </div>

        {/* Pack info */}
        <div className="text-sm text-[var(--text-pale)] space-y-1">
          <p>Content Pack: {currentPack.id} v{currentPack.version}</p>
          {currentPack.author && <p>by {currentPack.author}</p>}
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-xs text-[var(--text-pale)] border-t border-[var(--divider)] pt-4">
          <p>💡 Tip: Use Tab and Enter keys to navigate</p>
        </div>
      </div>
    </div>
  );
}