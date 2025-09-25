'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRunState, useCurrentStep } from '@/contexts/RunStateContext';
import { Choice, Delta } from '@/lib/content-pack';

interface StepScreenProps {
  onChoiceMade: (choice: 'A' | 'B', delta: Delta) => void;
  onAdvanceToFeedback: () => void;
}

/**
 * Step screen component for displaying scenarios and handling A/B choices
 */
export function StepScreen({ onChoiceMade, onAdvanceToFeedback }: StepScreenProps) {
  const { runState, dispatch } = useRunState();
  const { currentStep, stepData } = useCurrentStep();
  const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refs for keyboard navigation
  const optionARef = useRef<HTMLButtonElement>(null);
  const optionBRef = useRef<HTMLButtonElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);

  // Check if this step has already been completed
  const isStepCompleted = runState.choices.length >= currentStep;
  const lastChoice = isStepCompleted ? runState.choices[currentStep - 1] : null;

  useEffect(() => {
    // Focus first option when component mounts
    if (!isStepCompleted && optionARef.current) {
      optionARef.current.focus();
    }
  }, [isStepCompleted]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isProcessing) return;

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          if (document.activeElement === optionARef.current) {
            optionBRef.current?.focus();
          } else if (document.activeElement === optionBRef.current && continueRef.current) {
            continueRef.current.focus();
          }
          break;
        
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          if (document.activeElement === optionBRef.current) {
            optionARef.current?.focus();
          } else if (document.activeElement === continueRef.current) {
            optionBRef.current?.focus();
          }
          break;
        
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (document.activeElement === optionARef.current && !isStepCompleted) {
            handleChoiceSelect('A');
          } else if (document.activeElement === optionBRef.current && !isStepCompleted) {
            handleChoiceSelect('B');
          } else if (document.activeElement === continueRef.current && selectedChoice) {
            handleContinue();
          }
          break;
        
        case '1':
          if (!isStepCompleted) {
            event.preventDefault();
            handleChoiceSelect('A');
          }
          break;
        
        case '2':
          if (!isStepCompleted) {
            event.preventDefault();
            handleChoiceSelect('B');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isProcessing, isStepCompleted, selectedChoice]);

  const handleChoiceSelect = async (choice: 'A' | 'B') => {
    if (isStepCompleted || isProcessing) return;

    setIsProcessing(true);
    setSelectedChoice(choice);

    const choiceData = choice === 'A' ? stepData?.optionA : stepData?.optionB;
    if (!choiceData) return;

    // Apply the choice to the run state
    dispatch({ type: 'APPLY_CHOICE', choice, delta: choiceData.delta });
    
    // Notify parent component
    onChoiceMade(choice, choiceData.delta);

    // Auto-advance after a short delay to show the selection
    setTimeout(() => {
      setIsProcessing(false);
      if (continueRef.current) {
        continueRef.current.focus();
      }
    }, 1000);
  };

  const handleContinue = () => {
    onAdvanceToFeedback();
  };

  if (!stepData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--text-hard)] mb-4">
            Step not found
          </h2>
          <p className="text-[var(--text-average)]">
            Unable to load step {currentStep}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center min-h-screen py-8">
      <div className="space-y-8">
        {/* Step header */}
        <div className="text-center space-y-2">
          <div className="text-sm font-medium text-[var(--color-primary)]">
            Step {currentStep} of 5
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-hard)]">
            {stepData.title}
          </h1>
          {stepData.subtitle && (
            <p className="text-lg text-[var(--text-average)]">
              {stepData.subtitle}
            </p>
          )}
        </div>

        {/* Scenario */}
        <div className="bg-[var(--surface-1)] rounded-md p-6 border border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--text-hard)] mb-4">
            Scenario
          </h2>
          <p className="text-[var(--text-average)] leading-relaxed">
            {stepData.scenario}
          </p>
        </div>

        {/* Choices */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--text-hard)] text-center">
            What do you choose?
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Option A */}
            <ChoiceButton
              ref={optionARef}
              choice="A"
              choiceData={stepData.optionA}
              isSelected={selectedChoice === 'A' || (isStepCompleted && lastChoice?.choice === 'A')}
              isDisabled={isStepCompleted || isProcessing}
              onClick={() => handleChoiceSelect('A')}
            />

            {/* Option B */}
            <ChoiceButton
              ref={optionBRef}
              choice="B"
              choiceData={stepData.optionB}
              isSelected={selectedChoice === 'B' || (isStepCompleted && lastChoice?.choice === 'B')}
              isDisabled={isStepCompleted || isProcessing}
              onClick={() => handleChoiceSelect('B')}
            />
          </div>
        </div>

        {/* Continue button */}
        {(selectedChoice || isStepCompleted) && (
          <div className="text-center">
            <button
              ref={continueRef}
              onClick={handleContinue}
              disabled={isProcessing}
              className="text-white font-semibold py-3 px-8 rounded-[20px] transition-all duration-200 focus:outline-none hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: isProcessing ? 'var(--surface-2)' : 'var(--gradient-a)',
                boxShadow: 'none'
              }}
              onFocus={(e) => e.target.style.boxShadow = 'var(--shadow-focus)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            >
              {isProcessing ? 'Processing...' : 'Continue to Feedback'}
            </button>
          </div>
        )}

        {/* Keyboard hints */}
        <div className="text-center text-xs text-[var(--text-pale)] space-y-1">
          <p>💡 Use arrow keys to navigate, Enter/Space to select</p>
          <p>Or press 1 for Option A, 2 for Option B</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Choice button component with proper styling and accessibility
 */
interface ChoiceButtonProps {
  choice: 'A' | 'B';
  choiceData: Choice;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

const ChoiceButton = React.forwardRef<HTMLButtonElement, ChoiceButtonProps>(
  ({ choice, choiceData, isSelected, isDisabled, onClick }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={isDisabled}
        className={`
          p-6 rounded-md border-2 text-left transition-all duration-200 focus:outline-none
          ${isSelected 
            ? 'border-[var(--color-primary)] bg-[var(--surface-2)]' 
            : 'border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--color-primary)] hover:bg-[var(--surface-2)]'
          }
          ${isDisabled ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
        `}
        style={{
          boxShadow: 'none'
        }}
        onFocus={(e) => e.target.style.boxShadow = 'var(--shadow-focus)'}
        onBlur={(e) => e.target.style.boxShadow = 'none'}
      >
        <div className="space-y-3">
          {/* Choice header */}
          <div className="flex items-center justify-between">
            <div className={`
              inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
              ${isSelected 
                ? 'bg-[var(--color-primary)] text-white' 
                : 'bg-[var(--surface-2)] text-[var(--text-average)]'
              }
            `}>
              {choice}
            </div>
            {isSelected && (
              <div className="text-[var(--color-primary)] text-sm font-medium">
                ✓ Selected
              </div>
            )}
          </div>

          {/* Choice content */}
          <div>
            <h3 className="font-semibold text-[var(--text-hard)] mb-2">
              {choiceData.label}
            </h3>
            <p className="text-sm text-[var(--text-average)] leading-relaxed">
              {choiceData.body}
            </p>
          </div>

          {/* Delta preview */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--divider)]">
            {Object.entries(choiceData.delta).map(([key, value]) => {
              if (value === 0) return null;
              return (
                <span
                  key={key}
                  className={`
                    inline-flex items-center px-2 py-1 rounded text-xs font-medium
                    ${value > 0 
                      ? 'text-[var(--color-primary)]' 
                      : 'text-[var(--color-pink)]'
                    }
                  `}
                  style={{
                    backgroundColor: value > 0 
                      ? 'rgba(143, 0, 231, 0.1)' 
                      : 'rgba(224, 1, 137, 0.1)'
                  }}
                >
                  {key}: {value > 0 ? '+' : ''}{value}
                </span>
              );
            })}
          </div>
        </div>
      </button>
    );
  }
);