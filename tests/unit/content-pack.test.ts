import { describe, it, expect } from 'vitest';
import {
  ContentPackSchema,
  DeltaSchema,
  ChoiceSchema,
  StepSchema,
  validateContentPack,
  isValidContentPack,
  createDelta,
  EMPTY_DELTA,
  type ContentPack,
  type Delta,
} from '../../src/lib/content-pack';

describe('ContentPack Schema Validation', () => {
  describe('DeltaSchema', () => {
    it('should validate valid delta objects', () => {
      const validDeltas = [
        { R: 0, U: 0, S: 0, C: 0, I: 0 },
        { R: 10, U: -5, S: 3, C: 0, I: 8 },
        { R: 15, U: -10, S: 0, C: 0, I: 0 }, // boundary values
      ];

      validDeltas.forEach(delta => {
        expect(() => DeltaSchema.parse(delta)).not.toThrow();
      });
    });

    it('should reject invalid delta values', () => {
      const invalidDeltas = [
        { R: 16, U: 0, S: 0, C: 0, I: 0 }, // R too high
        { R: 0, U: -11, S: 0, C: 0, I: 0 }, // U too low
        { R: 1.5, U: 0, S: 0, C: 0, I: 0 }, // non-integer
      ];

      invalidDeltas.forEach((delta, index) => {
        expect(() => DeltaSchema.parse(delta), `Delta ${index} should throw`).toThrow();
      });
    });

    it('should allow extra properties (Zod strips them)', () => {
      // Zod strips extra properties by default, so this should not throw
      const deltaWithExtra = { R: 0, U: 0, S: 0, C: 0, I: 0, X: 5 };
      const result = DeltaSchema.parse(deltaWithExtra);
      expect(result).toEqual({ R: 0, U: 0, S: 0, C: 0, I: 0 });
      expect(result).not.toHaveProperty('X');
    });

    it('should apply default values', () => {
      const result = DeltaSchema.parse({});
      expect(result).toEqual({ R: 0, U: 0, S: 0, C: 0, I: 0 });
    });
  });

  describe('ChoiceSchema', () => {
    it('should validate valid choice objects', () => {
      const validChoice = {
        label: 'Add subscription payments',
        body: 'Implement Stripe integration for monthly subscriptions.',
        delta: { R: 10, U: 4, S: 0, C: 0, I: -2 },
      };

      expect(() => ChoiceSchema.parse(validChoice)).not.toThrow();
    });

    it('should reject invalid choice objects', () => {
      const invalidChoices = [
        { label: '', body: 'test', delta: EMPTY_DELTA }, // empty label
        { label: 'test', body: '', delta: EMPTY_DELTA }, // empty body
        { label: 'test', body: 'test' }, // missing delta
        { label: 'a'.repeat(201), body: 'test', delta: EMPTY_DELTA }, // label too long
      ];

      invalidChoices.forEach(choice => {
        expect(() => ChoiceSchema.parse(choice)).toThrow();
      });
    });
  });

  describe('StepSchema', () => {
    it('should validate valid step objects', () => {
      const validStep = {
        id: 1,
        title: 'Early Stage',
        subtitle: 'Getting started',
        scenario: 'You just raised seed funding...',
        optionA: {
          label: 'Option A',
          body: 'Description A',
          delta: { R: 5, U: 0, S: 0, C: 0, I: 0 },
        },
        optionB: {
          label: 'Option B',
          body: 'Description B',
          delta: { R: 0, U: 5, S: 0, C: 0, I: 0 },
        },
        assets: ['https://example.com/image.png'],
      };

      expect(() => StepSchema.parse(validStep)).not.toThrow();
    });

    it('should reject invalid step objects', () => {
      const baseStep = {
        id: 1,
        title: 'Test',
        scenario: 'Test scenario',
        optionA: {
          label: 'A',
          body: 'A body',
          delta: EMPTY_DELTA,
        },
        optionB: {
          label: 'B',
          body: 'B body',
          delta: EMPTY_DELTA,
        },
      };

      const invalidSteps = [
        { ...baseStep, id: 0 }, // id too low
        { ...baseStep, id: 6 }, // id too high
        { ...baseStep, title: '' }, // empty title
        { ...baseStep, scenario: '' }, // empty scenario
        { ...baseStep, optionA: undefined }, // missing optionA
        { ...baseStep, assets: ['invalid-url'] }, // invalid asset URL
      ];

      invalidSteps.forEach(step => {
        expect(() => StepSchema.parse(step)).toThrow();
      });
    });
  });

  describe('ContentPackSchema', () => {
    const createValidPack = (): ContentPack => ({
      id: 'test-pack',
      version: '1.0.0',
      title: 'Test Pack',
      description: 'A test content pack',
      author: 'Test Author',
      steps: Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        title: `Step ${i + 1}`,
        scenario: `Scenario for step ${i + 1}`,
        optionA: {
          label: `Option A${i + 1}`,
          body: `Body A${i + 1}`,
          delta: createDelta({ R: i + 1 }),
        },
        optionB: {
          label: `Option B${i + 1}`,
          body: `Body B${i + 1}`,
          delta: createDelta({ U: i + 1 }),
        },
      })),
      metadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        tags: ['test'],
      },
    });

    it('should validate valid content pack', () => {
      const validPack = createValidPack();
      expect(() => validateContentPack(validPack)).not.toThrow();
      expect(isValidContentPack(validPack)).toBe(true);
    });

    it('should reject invalid content packs', () => {
      const basePack = createValidPack();

      const invalidPacks = [
        { ...basePack, id: '' }, // empty id
        { ...basePack, version: '1.0' }, // invalid version format
        { ...basePack, title: '' }, // empty title
        { ...basePack, steps: [] }, // no steps
        { ...basePack, steps: basePack.steps.slice(0, 3) }, // too few steps
        { ...basePack, steps: [...basePack.steps, basePack.steps[0]] }, // too many steps
      ];

      invalidPacks.forEach(pack => {
        expect(() => validateContentPack(pack)).toThrow();
        expect(isValidContentPack(pack)).toBe(false);
      });
    });

    it('should handle optional fields correctly', () => {
      const minimalPack = {
        id: 'minimal-pack',
        version: '1.0.0',
        title: 'Minimal Pack',
        steps: Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          title: `Step ${i + 1}`,
          scenario: `Scenario ${i + 1}`,
          optionA: {
            label: `A${i + 1}`,
            body: `Body A${i + 1}`,
            delta: EMPTY_DELTA,
          },
          optionB: {
            label: `B${i + 1}`,
            body: `Body B${i + 1}`,
            delta: EMPTY_DELTA,
          },
        })),
      };

      expect(() => validateContentPack(minimalPack)).not.toThrow();
    });
  });

  describe('Helper Functions', () => {
    describe('createDelta', () => {
      it('should create delta with specified values', () => {
        const delta = createDelta({ R: 5, C: -2 });
        expect(delta).toEqual({ R: 5, U: 0, S: 0, C: -2, I: 0 });
      });

      it('should handle empty input', () => {
        const delta = createDelta({});
        expect(delta).toEqual(EMPTY_DELTA);
      });
    });

    describe('EMPTY_DELTA', () => {
      it('should have all zero values', () => {
        expect(EMPTY_DELTA).toEqual({ R: 0, U: 0, S: 0, C: 0, I: 0 });
      });
    });
  });
});