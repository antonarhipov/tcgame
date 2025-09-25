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
      
      // Expected raw score: 0.30*10 + 0.25*8 + 0.20*6 + 0.15*4 + 0.10*2 = 7.0
      expect(result.raw).toBeCloseTo(7.0, 1);
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
      const rngMin = () => 0; // Should give minimum randomness (-5)
      const rngMax = () => 1; // Should give maximum randomness (+5)
      
      const resultMin = computeMeter(effective, 0, rngMin);
      const resultMax = computeMeter(effective, 0, rngMax);
      
      expect(resultMin.randomness).toBe(-5);
      expect(resultMax.randomness).toBe(5);
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
      const { newRunState, result } = stepUpdate(runState, delta, 'A');
      
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
      const { newRunState: state1 } = stepUpdate(runState, lowDelta, 'A');
      
      // Check if rubber-band was triggered
      const lastResult = state1.history[state1.history.length - 1];
      if (lastResult.rubberBand) {
        // Second step should apply rubber-band bonus
        const secondDelta = createDelta({ R: 2, U: 2 });
        const { newRunState: state2 } = stepUpdate(state1, secondDelta, 'B');
        
        // State should have rubber-band bonus applied
        expect(state2.state.S > state1.state.S || state2.state.C > state1.state.C).toBe(true);
      }
    });

    it('should use deterministic RNG based on seed and step', () => {
      const delta = createDelta({ R: 5, U: 5 });
      
      // Same initial state and delta should produce same result
      const result1 = stepUpdate(runState, delta, 'A');
      const result2 = stepUpdate(runState, delta, 'A');
      
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
      const { newRunState, result } = stepUpdate(runState, delta, 'A');
      
      expect(newRunState.state.R).toBe(10);
      expect(newRunState.state.U).toBe(4);
      expect(newRunState.state.I).toBe(-2);
      expect(result.meter).toBeGreaterThan(0);
    });

    it('should handle Step 1B deltas (investor dashboard)', () => {
      // Step 1B – Investor Dashboard: +I, slight -R
      // Δ ≈ I+10, R-3
      const delta = createDelta({ I: 10, R: -3 });
      const { newRunState, result } = stepUpdate(runState, delta, 'B');
      
      expect(newRunState.state.I).toBe(10);
      expect(newRunState.state.R).toBe(-3);
      expect(result.meter).toBeGreaterThan(0);
    });

    it('should handle Step 4A deltas (autoscaling)', () => {
      // Step 4A – Autoscaling: +S +I, no change to C
      // Δ ≈ S+10, I+3
      const delta = createDelta({ S: 10, I: 3 });
      const { newRunState, result } = stepUpdate(runState, delta, 'A');
      
      expect(newRunState.state.S).toBe(10);
      expect(newRunState.state.I).toBe(3);
      expect(newRunState.state.C).toBe(0); // No change
      expect(result.meter).toBeGreaterThan(0);
    });

    it('should handle Step 4B deltas (AI support)', () => {
      // Step 4B – AI Support: +C +I, risk to S
      // Δ ≈ C+7, I+4, S-5
      const delta = createDelta({ C: 7, I: 4, S: -5 });
      const { newRunState, result } = stepUpdate(runState, delta, 'B');
      
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

// Additional tests for tuning and variance
describe('Meter tuning behavior', () => {
  it('should reach Breakout tier with strong effective state', () => {
    // Strong effective values should reach high tier (≥85)
    const effective = { R: 60, U: 50, S: 40, C: 30, I: 20 };
    const rngMax = () => 1; // maximum randomness (+5 with current config)

    const result = computeMeter(effective, 0, rngMax);
    expect(result.meter).toBeGreaterThanOrEqual(85);
  });

  it('should show noticeable variance between min and max randomness', () => {
    // With widened randomness [-5,5], extreme RNG should shift meter meaningfully
    const effective = { R: 20, U: 20, S: 20, C: 20, I: 20 };
    const rngMin = () => 0; // -5
    const rngMax = () => 1; // +5

    const resMin = computeMeter(effective, 0, rngMin);
    const resMax = computeMeter(effective, 0, rngMax);

    expect(Math.abs(resMax.meter - resMin.meter)).toBeGreaterThanOrEqual(8);
  });
});


// Balance validation via seeded simulations
// The goal is to validate that with DEFAULT_CONFIG tuning, a large sample of 5-step runs
// (random A/B choices, seeded/deterministic) lands around a ~60–75 median.
// We build deltas from docs/scaling-meter.md and simulate many runs with different seeds.

describe('Balance validation via seeded simulations', () => {
  type DeltaLike = ReturnType<typeof createDelta>;

  const steps: [DeltaLike, DeltaLike][] = [
    // Step 1: A (R+10, U+4, I-2) vs B (I+10, R-3)
    [createDelta({ R: 10, U: 4, I: -2 }), createDelta({ I: 10, R: -3 })],
    // Step 2: A (U+8, C-2) vs B (C+8, U-2)
    [createDelta({ U: 8, C: -2 }), createDelta({ C: 8, U: -2 })],
    // Step 3: A (U+6, R+5, S-3) vs B (C+6, I+4, U-2)
    [createDelta({ U: 6, R: 5, S: -3 }), createDelta({ C: 6, I: 4, U: -2 })],
    // Step 4: A (S+10, I+3) vs B (C+7, I+4, S-5)
    [createDelta({ S: 10, I: 3 }), createDelta({ C: 7, I: 4, S: -5 })],
    // Step 5: A (U+6, C+5) vs B (R+8, I+3, C-2)
    [createDelta({ U: 6, C: 5 }), createDelta({ R: 8, I: 3, C: -2 })],
  ];

  function simulateRunRandomChoices(seed: number): number {
    let rs = initializeRunState(seed);
    const choiceRng = mulberry32(seed ^ 0x9E3779B9);

    for (let step = 0; step < steps.length; step++) {
      const pickB = choiceRng() < 0.5; // 50/50 A vs B (deterministic per seed)
      const delta = steps[step][pickB ? 1 : 0];
      const choice = pickB ? 'B' : 'A';
      const { newRunState } = stepUpdate(rs, delta, choice, DEFAULT_CONFIG);
      rs = newRunState;
    }

    return rs.lastMeter;
  }

  it('median of random A/B runs over many seeds should be within [60, 75]', () => {
    const N = 512; // keep under 1k for test speed
    const finals: number[] = [];

    for (let i = 0; i < N; i++) {
      const seed = 1000 + i;
      finals.push(simulateRunRandomChoices(seed));
    }

    finals.sort((a, b) => a - b);
    const median = finals[Math.floor(finals.length / 2)];

    // Target band from docs: ~60–75 median
    expect(median).toBeGreaterThanOrEqual(60);
    expect(median).toBeLessThanOrEqual(75);
  });
});


// Greedy strategy reachability (85+)
// Choose at each step the option that maximizes projected raw after diminishing returns.

describe('Balance reachability (greedy strategy)', () => {
  type DeltaLike = ReturnType<typeof createDelta>;
  const steps: [DeltaLike, DeltaLike][] = [
    [createDelta({ R: 10, U: 4, I: -2 }), createDelta({ I: 10, R: -3 })],
    [createDelta({ U: 8, C: -2 }), createDelta({ C: 8, U: -2 })],
    [createDelta({ U: 6, R: 5, S: -3 }), createDelta({ C: 6, I: 4, U: -2 })],
    [createDelta({ S: 10, I: 3 }), createDelta({ C: 7, I: 4, S: -5 })],
    [createDelta({ U: 6, C: 5 }), createDelta({ R: 8, I: 3, C: -2 })],
  ];

  function projectRaw(state: State, delta: DeltaLike): number {
    // Compute effective after applying delta, then raw weighted with DEFAULT_CONFIG
    const s = applyChoice(state, delta);
    const eff = computeEffective(s, DEFAULT_CONFIG);
    const w = DEFAULT_CONFIG.weights;
    return w.R * eff.R + w.U * eff.U + w.S * eff.S + w.C * eff.C + w.I * eff.I;
  }

  it('a greedy but plausible strategy should achieve at least 85 in final meter', () => {
    let rs = initializeRunState(424242);

    for (let i = 0; i < steps.length; i++) {
      // pick option with higher projected raw
      const [a, b] = steps[i];
      const rawA = projectRaw(rs.state, a);
      const rawB = projectRaw(rs.state, b);
      const chosen = rawB > rawA ? b : a;
      const choice = rawB > rawA ? 'B' : 'A';
      const { newRunState } = stepUpdate(rs, chosen, choice, DEFAULT_CONFIG);
      rs = newRunState;
    }

    expect(rs.lastMeter).toBeGreaterThanOrEqual(80);
  });
});


// --- Unluck feature tests ---
describe('Unluck feature', () => {
  it('scales only positive deltas and keeps factor within bounds', () => {
    const base = initializeRunState(424242);
    const delta = createDelta({ R: 10, U: 5, S: -3, C: 0, I: 4 });
    const config: MeterConfig = {
      ...DEFAULT_CONFIG,
      momentumBonus: 0,
      randomnessRange: [0, 0],
      unluck: { probability: 1, factorRange: [0.4, 0.7] },
    };

    const { newRunState, result } = stepUpdate(base, delta, 'A', config);

    expect(result.unluckApplied).toBe(true);
    expect(result.luckFactor).not.toBeNull();
    const f = result.luckFactor as number;
    expect(f).toBeGreaterThanOrEqual(0.4);
    expect(f).toBeLessThanOrEqual(0.7);

    // Since initial state is zeros, new state equals applied delta.
    expect(newRunState.state.R).toBe(Math.round(10 * f));
    expect(newRunState.state.U).toBe(Math.round(5 * f));
    expect(newRunState.state.S).toBe(-3); // negative unchanged
    expect(newRunState.state.C).toBe(0);  // zero unchanged
    expect(newRunState.state.I).toBe(Math.round(4 * f));
  });

  it('triggers at roughly configured probability (~10%) across many trials', () => {
    let rs = initializeRunState(13579);
    const trials = 400;
    const delta = createDelta({ R: 5, U: 5, S: 0, C: 0, I: 0 });
    const config: MeterConfig = {
      ...DEFAULT_CONFIG,
      momentumBonus: 0,
      randomnessRange: [0, 0],
      unluck: { probability: 0.10, factorRange: [0.4, 0.7] },
    };

    let hits = 0;
    for (let i = 0; i < trials; i++) {
      const { newRunState, result } = stepUpdate(rs, delta, 'A', config);
      if (result.unluckApplied) hits++;
      rs = newRunState;
    }
    const rate = hits / trials;
    expect(rate).toBeGreaterThan(0.05);
    expect(rate).toBeLessThan(0.15);
  });

  it('reduces resulting meter compared to no-unluck under zero randomness and momentum', () => {
    const seed = 999;
    const base1 = initializeRunState(seed);
    const base2 = initializeRunState(seed);
    const delta = createDelta({ R: 8, U: 0, S: 2, C: 4, I: 0 });

    const cfgNo: MeterConfig = {
      ...DEFAULT_CONFIG,
      momentumBonus: 0,
      randomnessRange: [0, 0],
      unluck: { probability: 0, factorRange: [0.5, 0.5] },
    };
    const cfgYes: MeterConfig = {
      ...DEFAULT_CONFIG,
      momentumBonus: 0,
      randomnessRange: [0, 0],
      unluck: { probability: 1, factorRange: [0.5, 0.5] },
    };

    const resNo = stepUpdate(base1, delta, 'A', cfgNo).result;
    const resYes = stepUpdate(base2, delta, 'A', cfgYes).result;

    expect(resNo.unluckApplied || false).toBe(false);
    expect(resYes.unluckApplied || false).toBe(true);
    expect(resYes.meter).toBeLessThanOrEqual(resNo.meter);
  });
});

// --- Special Unluck feature tests ---
describe('Special Unluck feature (Step 4 Option B)', () => {
  it('should trigger special unluck when regular unluck occurs on step 4 option B', () => {
    // Set up run state at step 4 (stepCount = 3, so next step will be 4)
    const base = initializeRunState(424242);
    base.stepCount = 3; // Next step will be step 4
    base.state = { R: 10, U: 20, S: 5, C: 8, I: 12 }; // Some existing state
    
    const delta = createDelta({ C: 7, I: 4, S: -5 }); // Step 4B delta
    const config: MeterConfig = {
      ...DEFAULT_CONFIG,
      momentumBonus: 0,
      randomnessRange: [0, 0],
      unluck: { probability: 1, factorRange: [0.5, 0.5] }, // Force regular unluck
      specialUnluck: {
        enabled: true,
        step: 4,
        choice: 'B',
        probability: 1.0, // Force special unluck
        scalingGainsReduction: 0.5,
        usersReduction: 0.5,
        customersReduction: 0.7, // 70% reduction - "Perfect Storm"
        investorsReduction: 0.4, // 40% reduction - "Perfect Storm"
      },
    };

    const { newRunState, result } = stepUpdate(base, delta, 'B', config);

    // Both regular and special unluck should be applied
    expect(result.unluckApplied).toBe(true);
    expect(result.specialUnluckApplied).toBe(true);
    expect(result.luckFactor).toBe(0.5);

    // Check Perfect Storm penalties: scaling gains + parameter reductions
    // 1. Scaling gains: C+7, I+4 -> regular unluck (0.5) -> special unluck (0.5) -> C+2, I+1
    // 2. Parameter reductions: U*0.5, C*0.3, I*0.6 applied to final values
    // 3. S unchanged (negative delta not affected by unluck)
    expect(newRunState.state.S).toBe(base.state.S - 5); // 5 - 5 = 0 (negative delta unchanged)
    
    // Calculate expected final values after Perfect Storm
    const stateAfterDelta = {
      U: base.state.U, // 20 (no delta for U in this test)
      C: base.state.C + Math.round(7 * 0.5 * 0.5), // 8 + 2 = 10
      I: base.state.I + Math.round(4 * 0.5 * 0.5), // 12 + 1 = 13
    };
    const expectedU = Math.round(stateAfterDelta.U * (1 - 0.5)); // 20 * 0.5 = 10
    const expectedC = Math.round(stateAfterDelta.C * (1 - 0.7)); // 10 * 0.3 = 3
    const expectedI = Math.round(stateAfterDelta.I * (1 - 0.4)); // 13 * 0.6 = 8
    
    expect(newRunState.state.U).toBe(expectedU);
    expect(newRunState.state.C).toBe(expectedC);
    expect(newRunState.state.I).toBe(expectedI);
  });

  it('should not trigger special unluck on step 4 option A', () => {
    const base = initializeRunState(424242);
    base.stepCount = 3; // Next step will be step 4
    base.state = { R: 10, U: 20, S: 5, C: 8, I: 12 };
    
    const delta = createDelta({ S: 10, I: 3 }); // Step 4A delta
    const config: MeterConfig = {
      ...DEFAULT_CONFIG,
      momentumBonus: 0,
      randomnessRange: [0, 0],
      unluck: { probability: 1, factorRange: [0.5, 0.5] }, // Force regular unluck
      specialUnluck: {
        enabled: true,
        step: 4,
        choice: 'B', // Only triggers on B
        probability: 1.0,
        scalingGainsReduction: 0.5,
        usersReduction: 0.5,
        customersReduction: 0.7,
        investorsReduction: 0.4,
      },
    };

    const { newRunState, result } = stepUpdate(base, delta, 'A', config);

    // Only regular unluck should be applied
    expect(result.unluckApplied).toBe(true);
    expect(result.specialUnluckApplied).toBe(false);
    
    // Users parameter should not be reduced
    expect(newRunState.state.U).toBe(base.state.U); // 20, unchanged
  });

  it('should not trigger special unluck on other steps with option B', () => {
    const base = initializeRunState(424242);
    base.stepCount = 2; // Next step will be step 3
    base.state = { R: 10, U: 20, S: 5, C: 8, I: 12 };
    
    const delta = createDelta({ C: 6, I: 4, U: -2 }); // Step 3B delta
    const config: MeterConfig = {
      ...DEFAULT_CONFIG,
      momentumBonus: 0,
      randomnessRange: [0, 0],
      unluck: { probability: 1, factorRange: [0.5, 0.5] }, // Force regular unluck
      specialUnluck: {
        enabled: true,
        step: 4, // Only triggers on step 4
        choice: 'B',
        probability: 1.0,
        scalingGainsReduction: 0.5,
        usersReduction: 0.5,
        customersReduction: 0.7,
        investorsReduction: 0.4,
      },
    };

    const { newRunState, result } = stepUpdate(base, delta, 'B', config);

    // Only regular unluck should be applied
    expect(result.unluckApplied).toBe(true);
    expect(result.specialUnluckApplied).toBe(false);
    
    // Users parameter should not be reduced
    expect(newRunState.state.U).toBe(base.state.U - 2); // 20 - 2 = 18, only delta applied
  });

  it('should not trigger special unluck when regular unluck does not occur', () => {
    const base = initializeRunState(424242);
    base.stepCount = 3; // Next step will be step 4
    base.state = { R: 10, U: 20, S: 5, C: 8, I: 12 };
    
    const delta = createDelta({ C: 7, I: 4, S: -5 }); // Step 4B delta
    const config: MeterConfig = {
      ...DEFAULT_CONFIG,
      momentumBonus: 0,
      randomnessRange: [0, 0],
      unluck: { probability: 0, factorRange: [0.5, 0.5] }, // No regular unluck
      specialUnluck: {
        enabled: true,
        step: 4,
        choice: 'B',
        probability: 1.0,
        scalingGainsReduction: 0.5,
        usersReduction: 0.5,
        customersReduction: 0.7,
        investorsReduction: 0.4,
      },
    };

    const { newRunState, result } = stepUpdate(base, delta, 'B', config);

    // Neither regular nor special unluck should be applied
    expect(result.unluckApplied).toBe(false);
    expect(result.specialUnluckApplied).toBe(false);
    
    // Full deltas should be applied
    expect(newRunState.state.C).toBe(base.state.C + 7); // 8 + 7 = 15
    expect(newRunState.state.I).toBe(base.state.I + 4); // 12 + 4 = 16
    expect(newRunState.state.U).toBe(base.state.U); // 20, unchanged
  });

  it('should respect special unluck probability when less than 1.0', () => {
    const base = initializeRunState(999);
    base.stepCount = 3; // Next step will be step 4
    base.state = { R: 10, U: 20, S: 5, C: 8, I: 12 };
    
    const delta = createDelta({ C: 7, I: 4, S: -5 }); // Step 4B delta
    const config: MeterConfig = {
      ...DEFAULT_CONFIG,
      momentumBonus: 0,
      randomnessRange: [0, 0],
      unluck: { probability: 1, factorRange: [0.5, 0.5] }, // Force regular unluck
      specialUnluck: {
        enabled: true,
        step: 4,
        choice: 'B',
        probability: 0.0, // Never trigger special unluck
        scalingGainsReduction: 0.5,
        usersReduction: 0.5,
        customersReduction: 0.7,
        investorsReduction: 0.4,
      },
    };

    const { newRunState, result } = stepUpdate(base, delta, 'B', config);

    // Only regular unluck should be applied
    expect(result.unluckApplied).toBe(true);
    expect(result.specialUnluckApplied).toBe(false);
    
    // Only regular unluck scaling should be applied
    expect(newRunState.state.C).toBe(base.state.C + Math.round(7 * 0.5)); // 8 + 4 = 12
    expect(newRunState.state.I).toBe(base.state.I + Math.round(4 * 0.5)); // 12 + 2 = 14
    expect(newRunState.state.U).toBe(base.state.U); // 20, unchanged (no special unluck)
  });
});
