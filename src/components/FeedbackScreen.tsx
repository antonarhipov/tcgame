'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRunState, useCurrentStep } from '@/contexts/RunStateContext';
import { getMeterTier, getInsights, mulberry32 } from '@/lib/scaling-meter';
import { getUnluckMessage } from '@/lib/content-pack';

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
  const lastResult = runState.history[runState.history.length - 1];
  const [showUnluck, setShowUnluck] = useState<boolean>(Boolean(lastResult?.unluckApplied));

  // Get the last choice made
  const lastChoice = runState.choices[runState.choices.length - 1];
  const choiceData = lastChoice?.choice === 'A' ? stepData?.optionA : stepData?.optionB;

  // Get current meter state and insights
  const meterValue = runState.lastMeter || 0;
  const meterTier = getMeterTier(meterValue);
  const insights = getInsights(runState.effective, lastChoice?.delta || { R: 0, U: 0, S: 0, C: 0, I: 0 });

  // Unluck popup data
  const unluckApplied = Boolean(lastResult?.unluckApplied);
  const luckFactorPct = lastResult?.luckFactor != null ? Math.round((lastResult.luckFactor as number) * 100) : null;
  const unluckRng = mulberry32(runState.seed + Math.max(0, runState.stepCount - 1));
  const unluckMsg = (unluckApplied && stepData && lastChoice)
    ? (getUnluckMessage(stepData, lastChoice.choice, unluckRng) || null)
    : null;

  useEffect(() => {
    // Focus continue button when component mounts
    if (continueRef.current) {
      continueRef.current.focus();
    }
  }, []);

  // Auto-dismiss Unluck popup after timeout
  useEffect(() => {
    if (showUnluck) {
      const timer = setTimeout(() => setShowUnluck(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showUnluck]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleContinue();
      } else if (event.key === 'Escape' && showUnluck) {
        event.preventDefault();
        setShowUnluck(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showUnluck]);

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
          <h2 className="text-2xl font-bold text-[var(--text-hard)] mb-4">
            No choice found
          </h2>
          <p className="text-[var(--text-average)]">
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
          <div className="text-sm font-medium text-[var(--color-primary)]">
            Step {currentStep} Complete
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-hard)]">
            Choice Implemented!
          </h1>
          <p className="text-lg text-[var(--text-average)]">
            Junie has implemented your decision
          </p>
        </div>

        {/* Choice recap */}
        <div className="bg-[var(--surface-1)] rounded-md p-6 border border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--text-hard)] mb-4">
            Your Choice: Option {lastChoice.choice}
          </h2>
          <div className="space-y-3">
            <h3 className="font-semibold text-[var(--text-hard)]">
              {choiceData.label}
            </h3>
            <p className="text-[var(--text-average)] leading-relaxed">
              {choiceData.body}
            </p>
          </div>
        </div>

        {/* Impact summary */}
        <div className="bg-[var(--surface-2)] rounded-md p-6 border border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--text-hard)] mb-4">
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
                  <div className="text-sm text-[var(--text-average)] mb-1">
                    {labels[key as keyof typeof labels]}
                  </div>
                  <div className={`
                    text-2xl font-bold
                    ${value > 0 ? 'text-[var(--color-primary)]' : 
                      value < 0 ? 'text-[var(--color-pink)]' : 
                      'text-[var(--text-pale)]'}
                  `}>
                    {value > 0 ? '+' : ''}{value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current meter status */}
          <div className="border-t border-[var(--divider)] pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--text-average)]">
                Current Scaling Meter
              </span>
              <span className="text-sm font-medium text-[var(--text-average)]">
                {Math.round(meterValue)}/100
              </span>
            </div>
            <div className="w-full bg-[var(--surface-1)] rounded-full h-3 mb-2">
              <div 
                className="h-3 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${Math.max(0, Math.min(100, meterValue))}%`,
                  background: 'var(--gradient-a)'
                }}
              ></div>
            </div>
            <div className="text-sm text-[var(--text-average)]">
              <strong>Tier:</strong> {meterTier.tier} ({meterTier.range})
            </div>
          </div>
        </div>

        {/* Insights */}
        {insights && (
          <div className="bg-[var(--surface-2)] rounded-md p-6 border border-[var(--border)]">
            <h2 className="text-xl font-semibold text-[var(--text-hard)] mb-4">
              💡 Insights
            </h2>
            <div className="space-y-2 text-[var(--text-average)]">
              {insights.drivers.length > 0 && (
                <p>
                  <strong className="text-[var(--text-hard)]">Top Drivers:</strong> {insights.drivers.join(', ')}
                </p>
              )}
              {insights.bottleneck && (
                <p>
                  <strong className="text-[var(--text-hard)]">Bottleneck:</strong> {insights.bottleneck}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Unluck popup balloon in console area */}
        {unluckApplied && showUnluck && (
          <div role="status" aria-live="polite" className="relative">
            <div className="border border-[var(--color-pink)] text-[var(--color-pink)] rounded-xl p-4 mb-4" style={{ backgroundColor: 'rgba(224, 1, 137, 0.1)' }}>
              <div className="flex items-start">
                <div className="mr-3 text-xl" aria-hidden>⚠️</div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Unluck event — gains reduced</div>
                  <div className="text-sm">
                    {unluckMsg ?? 'Something outside your control reduced your gains this step.'}
                    {typeof luckFactorPct === 'number' && (
                      <span> (cut to {luckFactorPct}% this step)</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUnluck(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowUnluck(false);
                    }
                  }}
                  className="ml-3 text-sm px-2 py-1 rounded border border-[var(--color-pink)] hover:bg-[rgba(224,1,137,0.2)] focus:outline-none"
                  style={{ boxShadow: 'none' }}
                  onFocus={(e) => e.target.style.boxShadow = 'var(--shadow-focus)'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                  aria-label="Dismiss Unluck message"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Junie's commentary */}
        <div className="bg-[var(--surface-1)] rounded-md p-6 border border-[var(--border)]">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white font-bold">
              J
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-[var(--text-hard)] mb-2">
                Junie (AI Cofounder)
              </div>
              <p className="text-[var(--text-average)] italic">
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
            className="text-white font-semibold py-3 px-8 rounded-[20px] transition-all duration-200 focus:outline-none hover:brightness-110"
            style={{ 
              background: 'var(--gradient-a)',
              boxShadow: 'none'
            }}
            onFocus={(e) => e.target.style.boxShadow = 'var(--shadow-focus)'}
            onBlur={(e) => e.target.style.boxShadow = 'none'}
          >
            {isLastStep ? 'View Final Results' : `Continue to Step ${currentStep + 1}`}
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="text-center text-xs text-[var(--text-pale)]">
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