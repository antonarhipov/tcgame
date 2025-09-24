'use client';

import React, { useState } from 'react';
import { RunStateProvider } from '@/contexts/RunStateContext';
import { GameLayout } from '@/components/GameLayout';
import { ScalingMeter } from '@/components/ScalingMeter';
import { StartScreen } from '@/components/StartScreen';
import { StepScreen } from '@/components/StepScreen';
import { FeedbackScreen } from '@/components/FeedbackScreen';
import { FinaleScreen } from '@/components/FinaleScreen';
import { Delta } from '@/lib/content-pack';

type GameState = 'start' | 'step' | 'feedback' | 'finale';

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('start');

  const handleStartNew = () => {
    setGameState('step');
  };

  const handleResume = () => {
    setGameState('step');
  };

  const handleChoiceMade = (choice: 'A' | 'B', delta: Delta) => {
    // Choice is already applied to RunState in StepScreen
    // Just transition to feedback
    setGameState('feedback');
  };

  const handleAdvanceToFeedback = () => {
    setGameState('feedback');
  };

  const handleContinueFromFeedback = () => {
    // Check if we should go to finale or next step
    // This will be determined by the current step in RunState
    setGameState('step');
  };

  const handleViewFinale = () => {
    setGameState('finale');
  };

  const handleStartOver = () => {
    setGameState('start');
  };

  const renderGameContent = () => {
    switch (gameState) {
      case 'start':
        return (
          <StartScreen
            onStartNew={handleStartNew}
            onResume={handleResume}
          />
        );
      
      case 'step':
        return (
          <GameLayout meter={<ScalingMeter />}>
            <StepScreen
              onChoiceMade={handleChoiceMade}
              onAdvanceToFeedback={handleAdvanceToFeedback}
            />
          </GameLayout>
        );
      
      case 'feedback':
        return (
          <GameLayout meter={<ScalingMeter />}>
            <FeedbackScreen
              onContinue={handleContinueFromFeedback}
              onViewFinale={handleViewFinale}
            />
          </GameLayout>
        );
      
      case 'finale':
        return (
          <GameLayout meter={<ScalingMeter />}>
            <FinaleScreen
              onStartOver={handleStartOver}
            />
          </GameLayout>
        );
      
      default:
        return (
          <StartScreen
            onStartNew={handleStartNew}
            onResume={handleResume}
          />
        );
    }
  };

  return (
    <RunStateProvider>
      <GameFlowManager
        gameState={gameState}
        setGameState={setGameState}
        onViewFinale={handleViewFinale}
      >
        {renderGameContent()}
      </GameFlowManager>
    </RunStateProvider>
  );
}

/**
 * Game flow manager that handles automatic state transitions
 * based on RunState changes
 */
interface GameFlowManagerProps {
  children: React.ReactNode;
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onViewFinale: () => void;
}

function GameFlowManager({ children, gameState, setGameState, onViewFinale }: GameFlowManagerProps) {
  const [lastProcessedStep, setLastProcessedStep] = React.useState(0);

  // This component monitors RunState and handles automatic transitions
  React.useEffect(() => {
    // Import useRunState inside useEffect to avoid SSR issues
    const { useRunState } = require('@/contexts/RunStateContext');
    
    // We'll handle state transitions based on game logic here
    // For now, we'll rely on manual transitions from the components
  }, [gameState, setGameState, onViewFinale]);

  // Validate game state transitions based on RunState
  React.useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server-side
    
    try {
      const { useRunState } = require('@/contexts/RunStateContext');
      const runStateHook = useRunState();
      
      if (!runStateHook) return;
      
      const { runState } = runStateHook;
      
      // Enforce step progression validation
      if (gameState === 'step') {
        // Users can only access steps they've unlocked
        // Step 1 is always unlocked, subsequent steps require completing previous ones
        const maxUnlockedStep = Math.min(runState.choices.length + 1, 5);
        
        if (runState.currentStep > maxUnlockedStep) {
          // User is trying to access a step they haven't unlocked
          console.warn(`Step ${runState.currentStep} not unlocked. Max unlocked: ${maxUnlockedStep}`);
          // Reset to the highest unlocked step
          runStateHook.dispatch({ 
            type: 'LOAD_FROM_STORAGE', 
            gameState: { 
              ...runState, 
              currentStep: maxUnlockedStep 
            } 
          });
        }
      }
      
      // Auto-navigate to finale after completing step 5
      if (gameState === 'feedback' && runState.currentStep >= 5 && runState.choices.length >= 5) {
        // All steps completed, should go to finale
        setTimeout(() => onViewFinale(), 100);
      }
      
    } catch (error) {
      // Handle cases where useRunState is not available (e.g., outside provider)
      console.warn('GameFlowManager: RunState not available', error);
    }
  }, [gameState, setGameState, onViewFinale]);

  return <>{children}</>;
}
