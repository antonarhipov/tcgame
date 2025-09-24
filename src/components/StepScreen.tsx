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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Step not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
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
          <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Step {currentStep} of 5
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stepData.title}
          </h1>
          {stepData.subtitle && (
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {stepData.subtitle}
            </p>
          )}
        </div>

        {/* Scenario */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Scenario
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {stepData.scenario}
          </p>
        </div>

        {/* Choices */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center">
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
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {isProcessing ? 'Processing...' : 'Continue to Feedback'}
            </button>
          </div>
        )}

        {/* Keyboard hints */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 space-y-1">
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
          p-6 rounded-lg border-2 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${isSelected 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
          }
          ${isDisabled ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="space-y-3">
          {/* Choice header */}
          <div className="flex items-center justify-between">
            <div className={`
              inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
              ${isSelected 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }
            `}>
              {choice}
            </div>
            {isSelected && (
              <div className="text-blue-500 text-sm font-medium">
                ✓ Selected
              </div>
            )}
          </div>

          {/* Choice content */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {choiceData.label}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {choiceData.body}
            </p>
          </div>

          {/* Delta preview */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {Object.entries(choiceData.delta).map(([key, value]) => {
              if (value === 0) return null;
              return (
                <span
                  key={key}
                  className={`
                    inline-flex items-center px-2 py-1 rounded text-xs font-medium
                    ${value > 0 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }
                  `}
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