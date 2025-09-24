import { Delta } from './content-pack';

/**
 * Scaling Meter Engine
 * 
 * Implements the 5-dimensional scaling meter system based on docs/scaling-meter.md
 * with diminishing returns, momentum, randomness, and rubber-band mechanics.
 */

// Core state representing the 5 dimensions
export interface State {
  R: number; // Revenue Momentum
  U: number; // User Growth / Activation
  S: number; // System Reliability / Scalability
  C: number; // Customer Love (NPS / retention)
  I: number; // Investor Confidence / Story
}

// Effective state after applying diminishing returns
export interface EffectiveState {
  R: number;
  U: number;
  S: number;
  C: number;
  I: number;
}

// Meter calculation result
export interface MeterResult {
  meter: number;        // Final meter value (0-100)
  raw: number;          // Raw weighted score before normalization
  effective: EffectiveState; // State after diminishing returns
  momentum: number;     // Momentum bonus applied
  randomness: number;   // Random adjustment applied
  rubberBand: boolean;  // Whether rubber-band was applied
}

// Run state including seed and history
export interface RunState {
  state: State;
  seed: number;
  lastMeter: number;
  stepCount: number;
  history: MeterResult[];
}

// Meter configuration
export interface MeterConfig {
  // Weights for final score calculation
  weights: {
    R: number; // Default: 0.30
    U: number; // Default: 0.25
    S: number; // Default: 0.20
    C: number; // Default: 0.15
    I: number; // Default: 0.10
  };
  
  // Sigmoid normalization parameters
  sigmoid: {
    mu: number;    // Mean (default: 25)
    sigma: number; // Standard deviation (default: 12)
  };
  
  // Diminishing returns exponent (default: 0.9)
  diminishingReturns: number;
  
  // Momentum bonus (default: 3)
  momentumBonus: number;
  
  // Randomness range (default: [-3, +3])
  randomnessRange: [number, number];
  
  // Rubber-band threshold and bonus (default: 30, 2)
  rubberBand: {
    threshold: number;
    bonus: number;
  };
}

// Default configuration based on docs/scaling-meter.md
export const DEFAULT_CONFIG: MeterConfig = {
  weights: {
    R: 0.30,
    U: 0.25,
    S: 0.20,
    C: 0.15,
    I: 0.10,
  },
  sigmoid: {
    // Tuning: adjust mu/sigma via seeded simulations to target ~60–75 median, 85+ reachable (2025-09-24)
    mu: -4,
    sigma: 11,
  },
  diminishingReturns: 0.9,
  momentumBonus: 3,
  // Tuning: widen randomness slightly to increase variation without overpowering choices
  randomnessRange: [-5, 5],
  rubberBand: {
    threshold: 30,
    bonus: 2,
  },
};

/**
 * Apply a choice delta to the current state
 */
export function applyChoice(state: State, delta: Delta): State {
  return {
    R: state.R + delta.R,
    U: state.U + delta.U,
    S: state.S + delta.S,
    C: state.C + delta.C,
    I: state.I + delta.I,
  };
}

/**
 * Compute effective state with diminishing returns
 */
export function computeEffective(state: State, config: MeterConfig = DEFAULT_CONFIG): EffectiveState {
  const { diminishingReturns } = config;
  
  return {
    R: Math.pow(Math.max(0, state.R), diminishingReturns),
    U: Math.pow(Math.max(0, state.U), diminishingReturns),
    S: Math.pow(Math.max(0, state.S), diminishingReturns),
    C: Math.pow(Math.max(0, state.C), diminishingReturns),
    I: Math.pow(Math.max(0, state.I), diminishingReturns),
  };
}

/**
 * Sigmoid function for normalization
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Mulberry32 PRNG - deterministic random number generator
 */
export function mulberry32(seed: number): () => number {
  let state = seed;
  return function() {
    state |= 0;
    state = state + 0x6D2B79F5 | 0;
    let t = Math.imul(state ^ state >>> 15, state | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Generate a random seed
 */
export function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

/**
 * Compute meter value from effective state
 */
export function computeMeter(
  effective: EffectiveState,
  lastMeter: number,
  rng: () => number,
  config: MeterConfig = DEFAULT_CONFIG
): MeterResult {
  const { weights, sigmoid: sigmoidConfig, momentumBonus, randomnessRange, rubberBand } = config;
  
  // Calculate raw weighted score
  const raw = (
    weights.R * effective.R +
    weights.U * effective.U +
    weights.S * effective.S +
    weights.C * effective.C +
    weights.I * effective.I
  );
  
  // Apply sigmoid normalization
  const normalizedScore = (raw - sigmoidConfig.mu) / sigmoidConfig.sigma;
  let meter = Math.round(100 * sigmoid(normalizedScore));
  
  // Apply momentum bonus
  let momentum = 0;
  if (meter > lastMeter) {
    momentum = momentumBonus;
    meter += momentum;
  }
  
  // Apply randomness
  const [minRand, maxRand] = randomnessRange;
  const randomness = Math.round(rng() * (maxRand - minRand) + minRand);
  meter += randomness;
  
  // Clamp to valid range
  meter = Math.max(0, Math.min(100, meter));
  
  // Check for rubber-band application (applied to next step, not current)
  const rubberBandApplied = meter < rubberBand.threshold;
  
  return {
    meter,
    raw,
    effective,
    momentum,
    randomness,
    rubberBand: rubberBandApplied,
  };
}

/**
 * Apply rubber-band bonus to state (called on next step if meter was low)
 */
export function applyRubberBand(state: State, config: MeterConfig = DEFAULT_CONFIG): State {
  const { rubberBand } = config;
  
  // Apply bonus to S or C (alternating or random choice)
  // For simplicity, we'll apply to S first, then C
  if (state.S <= state.C) {
    return { ...state, S: state.S + rubberBand.bonus };
  } else {
    return { ...state, C: state.C + rubberBand.bonus };
  }
}

/**
 * Complete step update: apply choice, compute meter, handle rubber-band
 */
export function stepUpdate(
  runState: RunState,
  delta: Delta,
  config: MeterConfig = DEFAULT_CONFIG
): { newRunState: RunState; result: MeterResult } {
  const rng = mulberry32(runState.seed + runState.stepCount);
  
  // Apply rubber-band from previous step if needed
  let currentState = runState.state;
  const lastResult = runState.history[runState.history.length - 1];
  if (lastResult?.rubberBand) {
    currentState = applyRubberBand(currentState, config);
  }
  
  // Apply choice delta
  const newState = applyChoice(currentState, delta);
  
  // Compute effective state and meter
  const effective = computeEffective(newState, config);
  const result = computeMeter(effective, runState.lastMeter, rng, config);
  
  // Update run state
  const newRunState: RunState = {
    state: newState,
    seed: runState.seed,
    lastMeter: result.meter,
    stepCount: runState.stepCount + 1,
    history: [...runState.history, result],
  };
  
  return { newRunState, result };
}

/**
 * Initialize a new run state
 */
export function initializeRunState(seed?: number): RunState {
  return {
    state: { R: 0, U: 0, S: 0, C: 0, I: 0 },
    seed: seed ?? generateSeed(),
    lastMeter: 0,
    stepCount: 0,
    history: [],
  };
}

/**
 * Get meter tier based on value
 */
export function getMeterTier(meter: number): {
  tier: string;
  emoji: string;
  range: string;
} {
  if (meter >= 85) {
    return { tier: 'Breakout Trajectory', emoji: '🦄', range: '85-100' };
  } else if (meter >= 70) {
    return { tier: 'Scaling Up', emoji: '🚀', range: '70-84' };
  } else if (meter >= 50) {
    return { tier: 'Gaining Steam', emoji: '⚡', range: '50-69' };
  } else if (meter >= 30) {
    return { tier: 'Finding Fit', emoji: '🌱', range: '30-49' };
  } else {
    return { tier: 'Scrappy Mode', emoji: '🚧', range: '0-29' };
  }
}

/**
 * Get insights based on effective state and deltas
 */
export function getInsights(
  effective: EffectiveState,
  delta: Delta
): { drivers: string[]; bottleneck: string | null } {
  // Find top 2 dimensions by effective value
  const dimensions = [
    { name: 'Revenue', key: 'R' as keyof EffectiveState, value: effective.R },
    { name: 'User Growth', key: 'U' as keyof EffectiveState, value: effective.U },
    { name: 'System Reliability', key: 'S' as keyof EffectiveState, value: effective.S },
    { name: 'Customer Love', key: 'C' as keyof EffectiveState, value: effective.C },
    { name: 'Investor Confidence', key: 'I' as keyof EffectiveState, value: effective.I },
  ];
  
  // Sort by effective value (descending)
  dimensions.sort((a, b) => b.value - a.value);
  
  // Top 2 are drivers
  const drivers = dimensions.slice(0, 2).map(d => d.name);
  
  // Find bottleneck (lowest effective value with recent negative delta)
  let bottleneck: string | null = null;
  const lowestDimension = dimensions[dimensions.length - 1];
  const deltaValue = delta[lowestDimension.key as keyof Delta];
  
  if (lowestDimension.value < 10 && deltaValue <= 0) {
    bottleneck = lowestDimension.name;
  }
  
  return { drivers, bottleneck };
}