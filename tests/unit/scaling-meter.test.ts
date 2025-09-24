import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyChoice,
  computeEffective,
  computeMeter,
  stepUpdate,
  initializeRunState,
  mulberry32,
  generateSeed,
  getMeterTier,
  getInsights,
  applyRubberBand,
  DEFAULT_CONFIG,
  type State,
  type RunState,
  type MeterConfig,
} from '../../src/lib/scaling-meter';
import { createDelta } from '../../src/lib/content-pack';

describe('Scaling Meter Engine', () => {
  let initialState: State;
  let runState: RunState;

  beforeEach(() => {
    initialState = { R: 0, U: 0, S: 0, C: 0, I: 0 };
    runState = initializeRunState(12345); // Fixed seed for deterministic tests
  });

  describe('applyChoice', () => {
    it('should apply positive deltas correctly', () => {
      const delta = createDelta({ R: 10, U: 5, S: 3 });
      const result = applyChoice(initialState, delta);
      
      expect(result).toEqual({ R: 10, U: 5, S: 3, C: 0, I: 0 });
    });

    it('should apply negative deltas correctly', () => {
      const state = { R: 10, U: 8, S: 5, C: 3, I: 2 };
      const delta = createDelta({ R: -3, U: -2, I: -1 });
      const result = applyChoice(state, delta);
      
      expect(result).toEqual({ R: 7, U: 6, S: 5, C: 3, I: 1 });
    });

    it('should handle mixed positive and negative deltas', () => {
      const state = { R: 5, U: 5, S: 5, C: 5, I: 5 };
      const delta = createDelta({ R: 10, U: -3, S: 0, C: 8, I: -2 });
      const result = applyChoice(state, delta);
      
      expect(result).toEqual({ R: 15, U: 2, S: 5, C: 13, I: 3 });
    });
  });

  describe('computeEffective', () => {
    it('should apply diminishing returns correctly', () => {
      const state = { R: 16, U: 25, S: 36, C: 49, I: 64 };
      const result = computeEffective(state);
      
      // With exponent 0.9, values should be reduced
      expect(result.R).toBeCloseTo(Math.pow(16, 0.9), 2);
      expect(result.U).toBeCloseTo(Math.pow(25, 0.9), 2);
      expect(result.S).toBeCloseTo(Math.pow(36, 0.9), 2);
      expect(result.C).toBeCloseTo(Math.pow(49, 0.9), 2);
      expect(result.I).toBeCloseTo(Math.pow(64, 0.9), 2);
    });

    it('should handle zero and negative values', () => {
      const state = { R: 0, U: -5, S: 10, C: 0, I: -2 };
      const result = computeEffective(state);
      
      expect(result.R).toBe(0);
      expect(result.U).toBe(0); // Negative values become 0
      expect(result.S).toBeCloseTo(Math.pow(10, 0.9), 2);
      expect(result.C).toBe(0);
      expect(result.I).toBe(0); // Negative values become 0
    });

    it('should use custom diminishing returns exponent', () => {
      const state = { R: 16, U: 0, S: 0, C: 0, I: 0 };
      const customConfig: MeterConfig = {
        ...DEFAULT_CONFIG,
        diminishingReturns: 0.8,
      };
      
      const result = computeEffective(state, customConfig);
      expect(result.R).toBeCloseTo(Math.pow(16, 0.8), 2);
    });
  });

  describe('mulberry32 RNG', () => {
    it('should generate deterministic random numbers', () => {
      const rng1 = mulberry32(12345);
      const rng2 = mulberry32(12345);
      
      // Same seed should produce same sequence
      expect(rng1()).toBe(rng2());
      expect(rng1()).toBe(rng2());
      expect(rng1()).toBe(rng2());
    });

    it('should generate different sequences for different seeds', () => {
      const rng1 = mulberry32(12345);
      const rng2 = mulberry32(54321);
      
      expect(rng1()).not.toBe(rng2());
    });

    it('should generate numbers in [0, 1) range', () => {
      const rng = mulberry32(12345);
      
      for (let i = 0; i < 100; i++) {
        const value = rng();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('computeMeter', () => {
    it('should calculate weighted score correctly', () => {
      const effective = { R: 10, U: 8, S: 6, C: 4, I: 2 };
      const rng = () => 0.5; // Fixed random value
      
      const result = computeMeter(effective, 0, rng);
      
      // Expected raw score: 0.30*10 + 0.25*8 + 0.20*6 + 0.15*4 + 0.10*2 = 7.6
      expect(result.raw).toBeCloseTo(7.6, 1);
    });

    it('should apply momentum bonus when meter increases', () => {
      const effective = { R: 20, U: 20, S: 20, C: 20, I: 20 };
      const rng = () => 0.5; // Fixed random value
      
      const result = computeMeter(effective, 50, rng); // lastMeter = 50
      
      if (result.meter > 50) {
        expect(result.momentum).toBe(3);
      } else {
        expect(result.momentum).toBe(0);
      }
    });

    it('should not apply momentum when meter decreases', () => {
      const effective = { R: 1, U: 1, S: 1, C: 1, I: 1 };
      const rng = () => 0.5; // Fixed random value
      
      const result = computeMeter(effective, 80, rng); // lastMeter = 80
      
      expect(result.momentum).toBe(0);
    });

    it('should apply randomness within bounds', () => {
      const effective = { R: 10, U: 10, S: 10, C: 10, I: 10 };
      
      // Test with extreme random values
      const rngMin = () => 0; // Should give minimum randomness (-3)
      const rngMax = () => 1; // Should give maximum randomness (+3)
      
      const resultMin = computeMeter(effective, 0, rngMin);
      const resultMax = computeMeter(effective, 0, rngMax);
      
      expect(resultMin.randomness).toBe(-3);
      expect(resultMax.randomness).toBe(3);
    });

    it('should clamp meter to [0, 100] range', () => {
      const highEffective = { R: 100, U: 100, S: 100, C: 100, I: 100 };
      const lowEffective = { R: 0, U: 0, S: 0, C: 0, I: 0 };
      const rng = () => 0.5;
      
      const highResult = computeMeter(highEffective, 0, rng);
      const lowResult = computeMeter(lowEffective, 0, rng);
      
      expect(highResult.meter).toBeLessThanOrEqual(100);
      expect(lowResult.meter).toBeGreaterThanOrEqual(0);
    });

    it('should detect rubber-band condition', () => {
      const lowEffective = { R: 1, U: 1, S: 1, C: 1, I: 1 };
      const rng = () => 0; // Minimum randomness to ensure low meter
      
      const result = computeMeter(lowEffective, 0, rng);
      
      if (result.meter < 30) {
        expect(result.rubberBand).toBe(true);
      }
    });
  });

  describe('applyRubberBand', () => {
    it('should apply bonus to S when S <= C', () => {
      const state = { R: 10, U: 10, S: 5, C: 8, I: 10 };
      const result = applyRubberBand(state);
      
      expect(result.S).toBe(7); // 5 + 2
      expect(result.C).toBe(8); // unchanged
    });

    it('should apply bonus to C when C < S', () => {
      const state = { R: 10, U: 10, S: 8, C: 5, I: 10 };
      const result = applyRubberBand(state);
      
      expect(result.S).toBe(8); // unchanged
      expect(result.C).toBe(7); // 5 + 2
    });

    it('should use custom rubber-band bonus', () => {
      const state = { R: 10, U: 10, S: 5, C: 8, I: 10 };
      const customConfig: MeterConfig = {
        ...DEFAULT_CONFIG,
        rubberBand: { threshold: 30, bonus: 5 },
      };
      
      const result = applyRubberBand(state, customConfig);
      expect(result.S).toBe(10); // 5 + 5
    });
  });

  describe('stepUpdate', () => {
    it('should complete a full step update', () => {
      const delta = createDelta({ R: 10, U: 5, S: 3, C: 2, I: 1 });
      const { newRunState, result } = stepUpdate(runState, delta);
      
      // State should be updated
      expect(newRunState.state).toEqual({ R: 10, U: 5, S: 3, C: 2, I: 1 });
      
      // Step count should increment
      expect(newRunState.stepCount).toBe(1);
      
      // History should contain result
      expect(newRunState.history).toHaveLength(1);
      expect(newRunState.history[0]).toBe(result);
      
      // Last meter should be updated
      expect(newRunState.lastMeter).toBe(result.meter);
    });

    it('should apply rubber-band from previous step', () => {
      // First step with low meter to trigger rubber-band
      const lowDelta = createDelta({ R: 1, U: 1 });
      const { newRunState: state1 } = stepUpdate(runState, lowDelta);
      
      // Check if rubber-band was triggered
      const lastResult = state1.history[state1.history.length - 1];
      if (lastResult.rubberBand) {
        // Second step should apply rubber-band bonus
        const secondDelta = createDelta({ R: 2, U: 2 });
        const { newRunState: state2 } = stepUpdate(state1, secondDelta);
        
        // State should have rubber-band bonus applied
        expect(state2.state.S > state1.state.S || state2.state.C > state1.state.C).toBe(true);
      }
    });

    it('should use deterministic RNG based on seed and step', () => {
      const delta = createDelta({ R: 5, U: 5 });
      
      // Same initial state and delta should produce same result
      const result1 = stepUpdate(runState, delta);
      const result2 = stepUpdate(runState, delta);
      
      expect(result1.result.meter).toBe(result2.result.meter);
      expect(result1.result.randomness).toBe(result2.result.randomness);
    });
  });

  describe('getMeterTier', () => {
    it('should return correct tiers for different meter values', () => {
      expect(getMeterTier(95)).toEqual({
        tier: 'Breakout Trajectory',
        emoji: '🦄',
        range: '85-100',
      });
      
      expect(getMeterTier(75)).toEqual({
        tier: 'Scaling Up',
        emoji: '🚀',
        range: '70-84',
      });
      
      expect(getMeterTier(60)).toEqual({
        tier: 'Gaining Steam',
        emoji: '⚡',
        range: '50-69',
      });
      
      expect(getMeterTier(40)).toEqual({
        tier: 'Finding Fit',
        emoji: '🌱',
        range: '30-49',
      });
      
      expect(getMeterTier(20)).toEqual({
        tier: 'Scrappy Mode',
        emoji: '🚧',
        range: '0-29',
      });
    });

    it('should handle boundary values correctly', () => {
      expect(getMeterTier(85).tier).toBe('Breakout Trajectory');
      expect(getMeterTier(84).tier).toBe('Scaling Up');
      expect(getMeterTier(70).tier).toBe('Scaling Up');
      expect(getMeterTier(69).tier).toBe('Gaining Steam');
      expect(getMeterTier(50).tier).toBe('Gaining Steam');
      expect(getMeterTier(49).tier).toBe('Finding Fit');
      expect(getMeterTier(30).tier).toBe('Finding Fit');
      expect(getMeterTier(29).tier).toBe('Scrappy Mode');
    });
  });

  describe('getInsights', () => {
    it('should identify top drivers correctly', () => {
      const effective = { R: 20, U: 15, S: 10, C: 5, I: 3 };
      const delta = createDelta({ R: 5, U: 3 });
      
      const { drivers } = getInsights(effective, delta);
      
      expect(drivers).toHaveLength(2);
      expect(drivers[0]).toBe('Revenue'); // Highest effective value
      expect(drivers[1]).toBe('User Growth'); // Second highest
    });

    it('should identify bottleneck correctly', () => {
      const effective = { R: 20, U: 15, S: 10, C: 8, I: 2 }; // I is lowest
      const delta = createDelta({ I: -2 }); // Negative delta on I
      
      const { bottleneck } = getInsights(effective, delta);
      
      expect(bottleneck).toBe('Investor Confidence');
    });

    it('should not identify bottleneck when value is high', () => {
      const effective = { R: 20, U: 15, S: 12, C: 11, I: 10 }; // All values > 10
      const delta = createDelta({ I: -2 });
      
      const { bottleneck } = getInsights(effective, delta);
      
      expect(bottleneck).toBeNull();
    });

    it('should not identify bottleneck when delta is positive', () => {
      const effective = { R: 20, U: 15, S: 10, C: 8, I: 2 }; // I is lowest
      const delta = createDelta({ I: 2 }); // Positive delta on I
      
      const { bottleneck } = getInsights(effective, delta);
      
      expect(bottleneck).toBeNull();
    });
  });

  describe('Example deltas from docs', () => {
    it('should handle Step 1A deltas (subscriptions)', () => {
      // Step 1A – Subscriptions: +R +U, slight -I
      // Δ ≈ R+10, U+4, I-2
      const delta = createDelta({ R: 10, U: 4, I: -2 });
      const { newRunState, result } = stepUpdate(runState, delta);
      
      expect(newRunState.state.R).toBe(10);
      expect(newRunState.state.U).toBe(4);
      expect(newRunState.state.I).toBe(-2);
      expect(result.meter).toBeGreaterThan(0);
    });

    it('should handle Step 1B deltas (investor dashboard)', () => {
      // Step 1B – Investor Dashboard: +I, slight -R
      // Δ ≈ I+10, R-3
      const delta = createDelta({ I: 10, R: -3 });
      const { newRunState, result } = stepUpdate(runState, delta);
      
      expect(newRunState.state.I).toBe(10);
      expect(newRunState.state.R).toBe(-3);
      expect(result.meter).toBeGreaterThan(0);
    });

    it('should handle Step 4A deltas (autoscaling)', () => {
      // Step 4A – Autoscaling: +S +I, no change to C
      // Δ ≈ S+10, I+3
      const delta = createDelta({ S: 10, I: 3 });
      const { newRunState, result } = stepUpdate(runState, delta);
      
      expect(newRunState.state.S).toBe(10);
      expect(newRunState.state.I).toBe(3);
      expect(newRunState.state.C).toBe(0); // No change
      expect(result.meter).toBeGreaterThan(0);
    });

    it('should handle Step 4B deltas (AI support)', () => {
      // Step 4B – AI Support: +C +I, risk to S
      // Δ ≈ C+7, I+4, S-5
      const delta = createDelta({ C: 7, I: 4, S: -5 });
      const { newRunState, result } = stepUpdate(runState, delta);
      
      expect(newRunState.state.C).toBe(7);
      expect(newRunState.state.I).toBe(4);
      expect(newRunState.state.S).toBe(-5);
      expect(result.meter).toBeGreaterThanOrEqual(0);
    });
  });

  describe('initializeRunState', () => {
    it('should create initial state with zero values', () => {
      const state = initializeRunState(12345);
      
      expect(state.state).toEqual({ R: 0, U: 0, S: 0, C: 0, I: 0 });
      expect(state.seed).toBe(12345);
      expect(state.lastMeter).toBe(0);
      expect(state.stepCount).toBe(0);
      expect(state.history).toHaveLength(0);
    });

    it('should generate random seed when not provided', () => {
      const state1 = initializeRunState();
      const state2 = initializeRunState();
      
      expect(state1.seed).not.toBe(state2.seed);
      expect(typeof state1.seed).toBe('number');
    });
  });

  describe('generateSeed', () => {
    it('should generate different seeds', () => {
      const seed1 = generateSeed();
      const seed2 = generateSeed();
      
      expect(seed1).not.toBe(seed2);
      expect(typeof seed1).toBe('number');
      expect(typeof seed2).toBe('number');
    });

    it('should generate seeds within valid range', () => {
      for (let i = 0; i < 10; i++) {
        const seed = generateSeed();
        expect(seed).toBeGreaterThanOrEqual(0);
        expect(seed).toBeLessThan(2147483647);
      }
    });
  });
});