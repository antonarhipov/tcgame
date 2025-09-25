import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { FeedbackScreen } from '../FeedbackScreen';

// Mock RunStateContext hooks
const mockDispatch = vi.fn();
const mockOnContinue = vi.fn();
const mockOnViewFinale = vi.fn();

vi.mock('@/contexts/RunStateContext', () => {
  return {
    useRunState: () => ({
      runState: {
        state: { R: 0, U: 0, S: 0, C: 0, I: 0 },
        seed: 12345,
        lastMeter: 42,
        stepCount: 2, // implies last step index is 1
        history: [
          {
            meter: 30,
            raw: 0,
            effective: { R: 0, U: 0, S: 0, C: 0, I: 0 },
            momentum: 0,
            randomness: 0,
            rubberBand: false,
          },
          {
            meter: 42,
            raw: 0,
            effective: { R: 0, U: 0, S: 0, C: 0, I: 0 },
            momentum: 0,
            randomness: 0,
            rubberBand: false,
            unluckApplied: true,
            luckFactor: 0.5,
          },
        ],
        currentStep: 1,
        choices: [
          { choice: 'A' as const, delta: { R: 1, U: 1, S: 0, C: 0, I: 0 } },
        ],
        effective: { R: 0, U: 0, S: 0, C: 0, I: 0 },
      },
      dispatch: mockDispatch,
      contentPack: {},
      saveToStorage: vi.fn(),
      loadFromStorage: vi.fn(),
      resetRun: vi.fn(),
      consent: null,
      setConsent: vi.fn(),
      savePackInfo: vi.fn(),
      loadPackInfo: vi.fn(),
    }),
    useCurrentStep: () => ({
      currentStep: 1,
      stepData: {
        id: 1,
        title: 'Step 1',
        scenario: 'Test',
        optionA: {
          label: 'Option A',
          body: 'Body A',
          delta: { R: 1, U: 1, S: 0, C: 0, I: 0 },
          unluckMessages: ['Test unluck message'],
        },
        optionB: {
          label: 'Option B',
          body: 'Body B',
          delta: { R: 0, U: 0, S: 1, C: 1, I: 0 },
          unluckMessages: ['B message'],
        },
      },
    }),
  };
});

describe('FeedbackScreen Unluck popup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows the Unluck popup with contextual message and factor', () => {
    render(<FeedbackScreen onContinue={mockOnContinue} onViewFinale={mockOnViewFinale} />);

    // Heading and message
    expect(screen.getByText('Unluck event — gains reduced')).toBeInTheDocument();
    expect(screen.getByText(/Test unluck message/)).toBeInTheDocument();
    expect(screen.getByText(/cut to 50%/)).toBeInTheDocument();

    // Close button present
    const closeBtn = screen.getByRole('button', { name: /dismiss unluck message/i });
    expect(closeBtn).toBeInTheDocument();
  });

  it('dismisses the popup when Close is clicked', () => {
    render(<FeedbackScreen onContinue={mockOnContinue} onViewFinale={mockOnViewFinale} />);

    const closeBtn = screen.getByRole('button', { name: /dismiss unluck message/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Unluck event — gains reduced')).not.toBeInTheDocument();
  });

  it('auto-dismisses the popup after 5 seconds', () => {
    render(<FeedbackScreen onContinue={mockOnContinue} onViewFinale={mockOnViewFinale} />);

    // Initially visible
    expect(screen.getByText('Unluck event — gains reduced')).toBeInTheDocument();

    // Advance timers by 5s
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should be gone
    expect(screen.queryByText('Unluck event — gains reduced')).not.toBeInTheDocument();
  });
});
