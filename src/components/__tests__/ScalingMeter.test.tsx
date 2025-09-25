import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ScalingMeter } from '../ScalingMeter';
import { RunStateProvider } from '@/contexts/RunStateContext';
import { RunState, MeterResult, EffectiveState } from '@/lib/scaling-meter';

// Mock the RunStateContext
const mockRunState: RunState & {
  currentStep: number;
  choices: Array<{ choice: 'A' | 'B'; delta: any }>;
  effective: EffectiveState;
} = {
  state: { R: 10, U: 15, S: 8, C: 12, I: 6 },
  seed: 12345,
  lastMeter: 45,
  stepCount: 2,
  history: [
    {
      meter: 35,
      raw: 25.5,
      effective: { R: 8.5, U: 12.2, S: 6.8, C: 10.1, I: 5.2 },
      momentum: 0,
      randomness: 2,
      rubberBand: false,
    } as MeterResult,
    {
      meter: 45,
      raw: 32.1,
      effective: { R: 9.8, U: 14.5, S: 7.9, C: 11.8, I: 5.9 },
      momentum: 3,
      randomness: -1,
      rubberBand: false,
    } as MeterResult,
  ],
  currentStep: 2,
  choices: [
    { choice: 'A' as const, delta: { R: 5, U: 3, S: -1, C: 2, I: 0 } },
    { choice: 'B' as const, delta: { R: 2, U: 4, S: 1, C: 3, I: -1 } },
  ],
  effective: { R: 9.8, U: 14.5, S: 7.9, C: 11.8, I: 5.9 },
};

const mockUseRunState = vi.fn(() => ({
  runState: mockRunState,
  contentPack: {},
  dispatch: vi.fn(),
  saveToStorage: vi.fn(),
  loadFromStorage: vi.fn(),
  resetRun: vi.fn(),
}));

// Mock the context
vi.mock('@/contexts/RunStateContext', () => ({
  useRunState: () => mockUseRunState(),
  RunStateProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ScalingMeter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the scaling meter with correct overall value', () => {
    render(<ScalingMeter />);
    
    expect(screen.getByText('Scaling Meter')).toBeInTheDocument();
    expect(screen.getByText('45/100')).toBeInTheDocument();
  });

  it('displays the correct tier information', () => {
    render(<ScalingMeter />);
    
    // For meter value 45, should be "Finding Fit" tier
    expect(screen.getByText('Finding Fit')).toBeInTheDocument();
    expect(screen.getByText('(30-49)')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Finding Fit' })).toBeInTheDocument();
  });

  it('shows delta indicator when there is a change', () => {
    render(<ScalingMeter />);
    
    // Delta should be 45 - 35 = +10
    expect(screen.getByText('↗')).toBeInTheDocument();
    expect(screen.getByText('+10')).toBeInTheDocument();
  });

  it('displays individual dimension bars with correct values', () => {
    render(<ScalingMeter />);
    
    // Check that all dimensions are displayed
    expect(screen.getByText('Revenue (R)')).toBeInTheDocument();
    expect(screen.getByText('Users (U)')).toBeInTheDocument();
    expect(screen.getByText('System (S)')).toBeInTheDocument();
    expect(screen.getByText('Customer (C)')).toBeInTheDocument();
    expect(screen.getByText('Investor (I)')).toBeInTheDocument();
    
    // Check dimension values (rounded to 1 decimal)
    expect(screen.getByText('9.8')).toBeInTheDocument(); // Revenue
    expect(screen.getByText('14.5')).toBeInTheDocument(); // Users
    expect(screen.getByText('7.9')).toBeInTheDocument(); // System
    expect(screen.getByText('11.8')).toBeInTheDocument(); // Customer
    expect(screen.getByText('5.9')).toBeInTheDocument(); // Investor
  });

  it('displays insights section with drivers and tier', () => {
    render(<ScalingMeter />);
    
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Top Drivers:')).toBeInTheDocument();
    expect(screen.getByText('Current Tier:')).toBeInTheDocument();
    expect(screen.getByText('Finding Fit (30-49 range)')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ScalingMeter />);
    
    // Check main region
    expect(screen.getByRole('region', { name: 'Scaling Meter' })).toBeInTheDocument();
    
    // Check progress bars
    const overallProgressBar = screen.getByRole('progressbar', { name: /Overall scaling meter: 45 out of 100/ });
    expect(overallProgressBar).toBeInTheDocument();
    expect(overallProgressBar).toHaveAttribute('aria-valuenow', '45');
    expect(overallProgressBar).toHaveAttribute('aria-valuemin', '0');
    expect(overallProgressBar).toHaveAttribute('aria-valuemax', '100');
    
    // Check dimension progress bars
    const revenueBar = screen.getByRole('progressbar', { name: /Revenue Momentum: 9.8/ });
    expect(revenueBar).toBeInTheDocument();
  });

  it('displays live region for screen reader announcements', () => {
    render(<ScalingMeter />);
    
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    expect(liveRegion).toHaveClass('sr-only');
  });

  it('handles empty history state gracefully', () => {
    const emptyRunState = {
      ...mockRunState,
      history: [],
      effective: { R: 0, U: 0, S: 0, C: 0, I: 0 },
      choices: [],
    };
    
    mockUseRunState.mockReturnValueOnce({
      runState: emptyRunState,
      contentPack: {},
      dispatch: vi.fn(),
      saveToStorage: vi.fn(),
      loadFromStorage: vi.fn(),
      resetRun: vi.fn(),
    });
    
    render(<ScalingMeter />);
    
    expect(screen.getByText('0/100')).toBeInTheDocument();
    expect(screen.getByText('Scrappy Mode')).toBeInTheDocument();
    expect(screen.getByText('Make your first choice to see scaling insights!')).toBeInTheDocument();
    
    // Should not show delta indicator
    expect(screen.queryByText('↗')).not.toBeInTheDocument();
    expect(screen.queryByText('↘')).not.toBeInTheDocument();
  });

  it('displays different tiers correctly', () => {
    // Test Scaling Up tier (70-84)
    const scalingUpRunState = {
      ...mockRunState,
      history: [{
        ...mockRunState.history[0],
        meter: 75,
      }],
    };
    
    mockUseRunState.mockReturnValueOnce({
      runState: scalingUpRunState,
      contentPack: {},
      dispatch: vi.fn(),
      saveToStorage: vi.fn(),
      loadFromStorage: vi.fn(),
      resetRun: vi.fn(),
    });
    
    render(<ScalingMeter />);
    
    expect(screen.getByText('Scaling Up')).toBeInTheDocument();
    expect(screen.getByText('(70-84)')).toBeInTheDocument();
    expect(screen.getByText('75/100')).toBeInTheDocument();
  });

  it('shows negative delta correctly', () => {
    const decreasingRunState = {
      ...mockRunState,
      history: [
        { ...mockRunState.history[0], meter: 50 },
        { ...mockRunState.history[1], meter: 40 },
      ],
    };
    
    mockUseRunState.mockReturnValueOnce({
      runState: decreasingRunState,
      contentPack: {},
      dispatch: vi.fn(),
      saveToStorage: vi.fn(),
      loadFromStorage: vi.fn(),
      resetRun: vi.fn(),
    });
    
    render(<ScalingMeter />);
    
    expect(screen.getByText('↘')).toBeInTheDocument();
    expect(screen.getByText('-10')).toBeInTheDocument();
  });

  it('applies correct CSS classes for styling', () => {
    render(<ScalingMeter />);
    
    const container = screen.getByRole('region', { name: 'Scaling Meter' });
    expect(container).toHaveClass('max-w-4xl', 'mx-auto');
    
    // Check that progress bars have transition classes
    const overallBar = screen.getByRole('progressbar', { name: /Overall scaling meter/ });
    expect(overallBar).toHaveClass('transition-all', 'duration-700', 'ease-out');
  });
});

it('shows red-spark animation and reduced delta bar when Unluck is applied', () => {
  const unluckRunState = {
    ...mockRunState,
    history: [
      { ...mockRunState.history[0], meter: 35 } as MeterResult,
      { ...mockRunState.history[1], meter: 45, unluckApplied: true, luckFactor: 0.5 } as MeterResult,
    ],
  };

  mockUseRunState.mockReturnValueOnce({
    runState: unluckRunState,
    contentPack: {},
    dispatch: vi.fn(),
    saveToStorage: vi.fn(),
    loadFromStorage: vi.fn(),
    resetRun: vi.fn(),
  });

  render(<ScalingMeter />);

  // Spark overlay present
  expect(screen.getByTestId('unluck-spark')).toBeInTheDocument();

  // Reduced delta bar present and overlay text includes percentage
  expect(screen.getByTestId('reduced-delta-bar')).toBeInTheDocument();
  expect(screen.getByText(/Gains cut/)).toBeInTheDocument();
});

it('allows toggling the Unluck overlay visibility', async () => {
  const unluckRunState = {
    ...mockRunState,
    history: [
      { ...mockRunState.history[0], meter: 35 } as MeterResult,
      { ...mockRunState.history[1], meter: 45, unluckApplied: true, luckFactor: 0.5 } as MeterResult,
    ],
  };

  mockUseRunState.mockReturnValue({
    runState: unluckRunState,
    contentPack: {},
    dispatch: vi.fn(),
    saveToStorage: vi.fn(),
    loadFromStorage: vi.fn(),
    resetRun: vi.fn(),
  });

  render(<ScalingMeter />);

  let toggle = screen.getByTestId('unluck-toggle');
  // Overlay visible initially
  expect(screen.getByTestId('unluck-overlay')).toBeInTheDocument();

  // Hide overlay
  const user = userEvent.setup();
  await user.click(toggle);
  await waitFor(() => expect(screen.queryByTestId('unluck-overlay')).not.toBeInTheDocument());

  // Show overlay again
  await user.click(screen.getByTestId('unluck-toggle'));
  await waitFor(() => expect(screen.getByTestId('unluck-overlay')).toBeInTheDocument());
});