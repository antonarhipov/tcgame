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
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
            {currentPack.title}
          </h1>
          {currentPack.description && (
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              {currentPack.description}
            </p>
          )}
        </div>

        {/* Game description */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            How it works
          </h2>
          <div className="text-left space-y-3 text-gray-700 dark:text-gray-300">
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
            className="w-full max-w-sm mx-auto block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start New Run
          </button>

          {canResume && (
            <div className="space-y-2">
              <button
                onClick={handleResume}
                className="w-full max-w-sm mx-auto block bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Resume Progress
              </button>
              <button
                onClick={handleReset}
                className="w-full max-w-sm mx-auto block bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
              >
                Reset Progress
              </button>
            </div>
          )}
        </div>

        {/* Pack info */}
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <p>Content Pack: {currentPack.id} v{currentPack.version}</p>
          {currentPack.author && <p>by {currentPack.author}</p>}
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-4">
          <p>💡 Tip: Use Tab and Enter keys to navigate</p>
        </div>
      </div>
    </div>
  );
}