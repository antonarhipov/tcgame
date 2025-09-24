'use client';

import React, { useEffect, useRef } from 'react';
import { useRunState, useCurrentStep } from '@/contexts/RunStateContext';
import { getMeterTier, getInsights } from '@/lib/scaling-meter';

interface FeedbackScreenProps {
  onContinue: () => void;
  onViewFinale: () => void;
}

/**
 * Feedback screen component showing the results of the user's choice
 */
export function FeedbackScreen({ onContinue, onViewFinale }: FeedbackScreenProps) {
  const { runState, dispatch } = useRunState();
  const { currentStep, stepData } = useCurrentStep();
  const continueRef = useRef<HTMLButtonElement>(null);

  // Get the last choice made
  const lastChoice = runState.choices[runState.choices.length - 1];
  const choiceData = lastChoice?.choice === 'A' ? stepData?.optionA : stepData?.optionB;

  // Get current meter state and insights
  const meterValue = runState.lastMeter || 0;
  const meterTier = getMeterTier(meterValue);
  const insights = getInsights(runState.effective, lastChoice?.delta || { R: 0, U: 0, S: 0, C: 0, I: 0 });

  useEffect(() => {
    // Focus continue button when component mounts
    if (continueRef.current) {
      continueRef.current.focus();
    }
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleContinue();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleContinue = () => {
    if (currentStep < 5) {
      // Advance to next step
      dispatch({ type: 'ADVANCE_STEP' });
      onContinue();
    } else {
      // Game is complete, go to finale
      onViewFinale();
    }
  };

  if (!lastChoice || !choiceData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            No choice found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Unable to load feedback for this step
          </p>
        </div>
      </div>
    );
  }

  const isLastStep = currentStep >= 5;

  return (
    <div className="flex flex-col justify-center min-h-screen py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-sm font-medium text-green-600 dark:text-green-400">
            Step {currentStep} Complete
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Choice Implemented!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Junie has implemented your decision
          </p>
        </div>

        {/* Choice recap */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Your Choice: Option {lastChoice.choice}
          </h2>
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {choiceData.label}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {choiceData.body}
            </p>
          </div>
        </div>

        {/* Impact summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Impact on Your Startup
          </h2>
          
          {/* Delta changes */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {Object.entries(choiceData.delta).map(([key, value]) => {
              const labels = {
                R: 'Revenue',
                U: 'Users',
                S: 'System',
                C: 'Customer',
                I: 'Investor'
              };
              
              return (
                <div key={key} className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {labels[key as keyof typeof labels]}
                  </div>
                  <div className={`
                    text-2xl font-bold
                    ${value > 0 ? 'text-green-600 dark:text-green-400' : 
                      value < 0 ? 'text-red-600 dark:text-red-400' : 
                      'text-gray-500 dark:text-gray-400'}
                  `}>
                    {value > 0 ? '+' : ''}{value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current meter status */}
          <div className="border-t border-blue-200 dark:border-blue-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Scaling Meter
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {Math.round(meterValue)}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${Math.max(0, Math.min(100, meterValue))}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Tier:</strong> {meterTier.tier} ({meterTier.range})
            </div>
          </div>
        </div>

        {/* Insights */}
        {insights && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              💡 Insights
            </h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              {insights.drivers.length > 0 && (
                <p>
                  <strong>Top Drivers:</strong> {insights.drivers.join(', ')}
                </p>
              )}
              {insights.bottleneck && (
                <p>
                  <strong>Bottleneck:</strong> {insights.bottleneck}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Junie's commentary */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              J
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Junie (AI Cofounder)
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic">
                {getJunieCommentary(lastChoice.choice, choiceData.label, meterTier.tier)}
              </p>
            </div>
          </div>
        </div>

        {/* Continue button */}
        <div className="text-center">
          <button
            ref={continueRef}
            onClick={handleContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLastStep ? 'View Final Results' : `Continue to Step ${currentStep + 1}`}
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500">
          <p>💡 Press Enter or Space to continue</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate Junie's commentary based on the choice and current state
 */
function getJunieCommentary(choice: 'A' | 'B', choiceLabel: string, tier: string): string {
  const commentaries = {
    'Scrappy': [
      "Nice choice! We're still scrappy, but every decision counts. Let's keep building! 🚀",
      "Good call! We're in the trenches, but this move shows promise. Onward! 💪",
      "Solid decision! We're bootstrapping our way up. Rome wasn't built in a day! 🏗️"
    ],
    'Finding Fit': [
      "Interesting choice! We're finding our groove. This could be the breakthrough we need! 🎯",
      "Smart move! We're getting closer to product-market fit. I can feel it! ⚡",
      "Good thinking! We're in the sweet spot of discovery. Let's see where this leads! 🔍"
    ],
    'Gaining Steam': [
      "Excellent choice! We're gaining real momentum now. The engines are warming up! 🔥",
      "Great decision! We're hitting our stride. This is where things get exciting! 🚂",
      "Perfect timing! We're building steam. I can see the growth trajectory! 📈"
    ],
    'Scaling Up': [
      "Outstanding choice! We're in full scaling mode. This is what unicorns are made of! 🦄",
      "Brilliant move! We're scaling like pros. The market is taking notice! 🌟",
      "Fantastic decision! We're in the big leagues now. Let's dominate! 👑"
    ],
    'Breakout Trajectory': [
      "LEGENDARY choice! We're on a breakout trajectory. IPO here we come! 🚀🌙",
      "INCREDIBLE move! We're redefining the industry. History in the making! 🏆",
      "PHENOMENAL decision! We're not just scaling, we're transcending! ✨🚀"
    ]
  };

  const tierCommentaries = commentaries[tier as keyof typeof commentaries] || commentaries['Scrappy'];
  return tierCommentaries[Math.floor(Math.random() * tierCommentaries.length)];
}