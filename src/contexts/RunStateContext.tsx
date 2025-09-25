'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { RunState, initializeRunState, stepUpdate, DEFAULT_CONFIG } from '@/lib/scaling-meter';
import { Delta, ContentPack } from '@/lib/content-pack';
import { getDefaultPack } from '@/lib/default-pack';

// Extended game state that includes UI-specific properties
interface GameState extends RunState {
  currentStep: number;
  choices: Array<{ choice: 'A' | 'B'; delta: Delta }>;
  effective: { R: number; U: number; S: number; C: number; I: number };
}

// Actions for the GameState reducer
type GameStateAction = 
  | { type: 'INITIALIZE'; seed?: number }
  | { type: 'APPLY_CHOICE'; choice: 'A' | 'B'; delta: Delta }
  | { type: 'ADVANCE_STEP' }
  | { type: 'RESET' }
  | { type: 'LOAD_FROM_STORAGE'; gameState: GameState };

// Context interface
interface RunStateContextType {
  runState: GameState;
  contentPack: ContentPack;
  dispatch: React.Dispatch<GameStateAction>;
  saveToStorage: () => void;
  loadFromStorage: () => void;
  resetRun: () => void;
  // Consent management
  consent: boolean | null;
  setConsent: (consent: boolean) => void;
  // Pack info persistence
  savePackInfo: (packInfo: { id: string; version: string; source?: string }) => void;
  loadPackInfo: () => { id: string; version: string; source?: string } | null;
}


// Storage keys
const STORAGE_KEYS = {
  RUN_STATE: 'tcgame_run_state',
  CONSENT: 'tcgame_consent',
  PACK_INFO: 'tcgame_pack_info',
  SESSION_TOKEN: 'tcgame_session_token'
};

// Initialize GameState with UI-specific properties
function initializeGameState(seed?: number): GameState {
  const baseRunState = initializeRunState(seed);
  return {
    ...baseRunState,
    currentStep: 1,
    choices: [],
    effective: { R: 0, U: 0, S: 0, C: 0, I: 0 }
  };
}

// GameState reducer
function gameStateReducer(state: GameState, action: GameStateAction): GameState {
  switch (action.type) {
    case 'INITIALIZE':
      return initializeGameState(action.seed);
    
    case 'APPLY_CHOICE': {
      // Use the scaling meter engine to update the core RunState
      const { newRunState, result } = stepUpdate(state, action.delta, action.choice, DEFAULT_CONFIG);
      
      // Return extended GameState with UI properties
      return {
        ...newRunState,
        currentStep: state.currentStep,
        choices: [...state.choices, { choice: action.choice, delta: action.delta }],
        effective: result.effective
      };
    }
    
    case 'ADVANCE_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, 5)
      };
    
    case 'RESET':
      return initializeGameState();
    
    case 'LOAD_FROM_STORAGE':
      return action.gameState;
    
    default:
      return state;
  }
}

// Create context
const RunStateContext = createContext<RunStateContextType | null>(null);

// Provider component
interface RunStateProviderProps {
  children: ReactNode;
}

export function RunStateProvider({ children }: RunStateProviderProps) {
  const [runState, dispatch] = useReducer(gameStateReducer, initializeGameState());
  const [consent, setConsentState] = React.useState<boolean | null>(null);
  const contentPack = getDefaultPack();

  // Enhanced save to localStorage with validation
  const saveToStorage = React.useCallback(() => {
    try {
      // Validate runState before saving
      if (!runState || typeof runState !== 'object') {
        console.error('Invalid runState, skipping save');
        return;
      }
      
      const dataToSave = {
        ...runState,
        timestamp: Date.now(),
        version: '1.0' // Schema version for future migrations
      };
      
      localStorage.setItem(STORAGE_KEYS.RUN_STATE, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      // Try to recover space by clearing old data
      try {
        localStorage.removeItem(STORAGE_KEYS.RUN_STATE);
        console.warn('Cleared corrupted localStorage data');
      } catch (clearError) {
        console.error('Failed to clear localStorage:', clearError);
      }
    }
  }, [runState]);

  // Enhanced load from localStorage with robust corruption detection
  const loadFromStorage = React.useCallback(() => {
    try {
      const savedRunState = localStorage.getItem(STORAGE_KEYS.RUN_STATE);

      if (savedRunState) {
        const parsedData = JSON.parse(savedRunState);
        
        // Enhanced validation with detailed checks
        const isValidGameState = (
          parsedData &&
          typeof parsedData === 'object' &&
          typeof parsedData.currentStep === 'number' &&
          parsedData.currentStep >= 1 && parsedData.currentStep <= 5 &&
          parsedData.state &&
          typeof parsedData.state === 'object' &&
          typeof parsedData.state.R === 'number' &&
          typeof parsedData.state.U === 'number' &&
          typeof parsedData.state.S === 'number' &&
          typeof parsedData.state.C === 'number' &&
          typeof parsedData.state.I === 'number' &&
          typeof parsedData.seed === 'number' &&
          Array.isArray(parsedData.choices) &&
          parsedData.effective &&
          typeof parsedData.effective === 'object' &&
          Array.isArray(parsedData.history) &&
          // Minimal per-entry validation to keep optional fields like unluckApplied/luckFactor intact
          parsedData.history.every((entry: any) => entry && typeof entry.meter === 'number')
        );

        if (isValidGameState) {
          // Check for data staleness (older than 7 days)
          const timestamp = parsedData.timestamp || 0;
          const isStale = Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000;
          
          if (isStale) {
            console.warn('Saved data is stale, resetting to clean state');
            localStorage.removeItem(STORAGE_KEYS.RUN_STATE);
            dispatch({ type: 'RESET' });
          } else {
            dispatch({ type: 'LOAD_FROM_STORAGE', gameState: parsedData });
          }
        } else {
          console.warn('Invalid saved data structure, clearing and resetting');
          localStorage.removeItem(STORAGE_KEYS.RUN_STATE);
          dispatch({ type: 'RESET' });
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      // Clear corrupted data and reset to clean state
      try {
        localStorage.removeItem(STORAGE_KEYS.RUN_STATE);
        console.warn('Cleared corrupted localStorage data');
      } catch (clearError) {
        console.error('Failed to clear corrupted data:', clearError);
      }
      dispatch({ type: 'RESET' });
    }
  }, []);

  // Consent management
  const setConsent = React.useCallback((consentValue: boolean) => {
    try {
      setConsentState(consentValue);
      localStorage.setItem(STORAGE_KEYS.CONSENT, JSON.stringify({
        consent: consentValue,
        timestamp: Date.now(),
        version: '1.0'
      }));
    } catch (error) {
      console.error('Failed to save consent:', error);
    }
  }, []);

  const loadConsent = React.useCallback(() => {
    try {
      const savedConsent = localStorage.getItem(STORAGE_KEYS.CONSENT);
      if (savedConsent) {
        const parsedConsent = JSON.parse(savedConsent);
        if (parsedConsent && typeof parsedConsent.consent === 'boolean') {
          setConsentState(parsedConsent.consent);
        }
      }
    } catch (error) {
      console.error('Failed to load consent:', error);
      setConsentState(null);
    }
  }, []);

  // Pack info persistence
  const savePackInfo = React.useCallback((packInfo: { id: string; version: string; source?: string }) => {
    try {
      const dataToSave = {
        ...packInfo,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(STORAGE_KEYS.PACK_INFO, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save pack info:', error);
    }
  }, []);

  const loadPackInfo = React.useCallback(() => {
    try {
      const savedPackInfo = localStorage.getItem(STORAGE_KEYS.PACK_INFO);
      if (savedPackInfo) {
        const parsedPackInfo = JSON.parse(savedPackInfo);
        if (parsedPackInfo && parsedPackInfo.id && parsedPackInfo.version) {
          return {
            id: parsedPackInfo.id,
            version: parsedPackInfo.version,
            source: parsedPackInfo.source
          };
        }
      }
    } catch (error) {
      console.error('Failed to load pack info:', error);
    }
    return null;
  }, []);

  // Enhanced reset run and clear all storage
  const resetRun = React.useCallback(() => {
    try {
      // Clear all localStorage keys
      localStorage.removeItem(STORAGE_KEYS.RUN_STATE);
      localStorage.removeItem(STORAGE_KEYS.CONSENT);
      localStorage.removeItem(STORAGE_KEYS.PACK_INFO);
      localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
      
      // Reset state
      dispatch({ type: 'RESET' });
      setConsentState(null);
      
      console.log('Successfully reset all game data');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      // Still try to reset the state even if localStorage fails
      dispatch({ type: 'RESET' });
      setConsentState(null);
    }
  }, []);

  // Load from storage on mount
  useEffect(() => {
    loadFromStorage();
    loadConsent();
  }, [loadFromStorage, loadConsent]);

  // Auto-save when runState changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToStorage();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [runState, saveToStorage]);

  const contextValue: RunStateContextType = {
    runState,
    contentPack,
    dispatch,
    saveToStorage,
    loadFromStorage,
    resetRun,
    // Consent management
    consent,
    setConsent,
    // Pack info persistence
    savePackInfo,
    loadPackInfo
  };

  return (
    <RunStateContext.Provider value={contextValue}>
      {children}
    </RunStateContext.Provider>
  );
}

// Hook to use the context
export function useRunState() {
  const context = useContext(RunStateContext);
  if (!context) {
    throw new Error('useRunState must be used within a RunStateProvider');
  }
  return context;
}

// Helper hooks for common operations
export function useCurrentStep() {
  const { runState, contentPack } = useRunState();
  const currentStepData = contentPack.steps.find(step => step.id === runState.currentStep);
  return { currentStep: runState.currentStep, stepData: currentStepData };
}

export function useCanResume() {
  const { runState } = useRunState();
  return runState.currentStep > 1 || runState.choices.length > 0;
}