import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadContentPackFromString,
  validateContentPackSafe,
  type LoadResult,
} from '../../src/lib/content-loader';
import { getDefaultPack } from '../../src/lib/default-pack';
import { createDelta, type ContentPack } from '../../src/lib/content-pack';

// Mock fetch for URL loading tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Content Loader', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadContentPackFromString', () => {
    const validPackJson = JSON.stringify({
      id: 'test-pack',
      version: '1.0.0',
      title: 'Test Pack',
      steps: Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        title: `Step ${i + 1}`,
        scenario: `Scenario ${i + 1}`,
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
    });

    const validPackYaml = `
id: test-pack-yaml
version: 1.0.0
title: Test Pack YAML
steps:
  - id: 1
    title: Step 1
    scenario: Scenario 1
    optionA:
      label: Option A1
      body: Body A1
      delta:
        R: 5
        U: 0
        S: 0
        C: 0
        I: 0
    optionB:
      label: Option B1
      body: Body B1
      delta:
        R: 0
        U: 5
        S: 0
        C: 0
        I: 0
  - id: 2
    title: Step 2
    scenario: Scenario 2
    optionA:
      label: Option A2
      body: Body A2
      delta:
        R: 3
        U: 0
        S: 0
        C: 0
        I: 0
    optionB:
      label: Option B2
      body: Body B2
      delta:
        R: 0
        U: 3
        S: 0
        C: 0
        I: 0
  - id: 3
    title: Step 3
    scenario: Scenario 3
    optionA:
      label: Option A3
      body: Body A3
      delta:
        R: 2
        U: 0
        S: 0
        C: 0
        I: 0
    optionB:
      label: Option B3
      body: Body B3
      delta:
        R: 0
        U: 2
        S: 0
        C: 0
        I: 0
  - id: 4
    title: Step 4
    scenario: Scenario 4
    optionA:
      label: Option A4
      body: Body A4
      delta:
        R: 1
        U: 0
        S: 0
        C: 0
        I: 0
    optionB:
      label: Option B4
      body: Body B4
      delta:
        R: 0
        U: 1
        S: 0
        C: 0
        I: 0
  - id: 5
    title: Step 5
    scenario: Scenario 5
    optionA:
      label: Option A5
      body: Body A5
      delta:
        R: 4
        U: 0
        S: 0
        C: 0
        I: 0
    optionB:
      label: Option B5
      body: Body B5
      delta:
        R: 0
        U: 4
        S: 0
        C: 0
        I: 0
`;

    it('should load valid JSON content pack', () => {
      const result = loadContentPackFromString(validPackJson, 'json');
      
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.pack.id).toBe('test-pack');
      expect(result.pack.steps).toHaveLength(5);
      expect(result.source).toBe('file');
    });

    it('should load valid YAML content pack', () => {
      const result = loadContentPackFromString(validPackYaml, 'yaml');
      
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.pack.id).toBe('test-pack-yaml');
      expect(result.pack.steps).toHaveLength(5);
      expect(result.source).toBe('file');
    });

    it('should handle malformed JSON with fallback', () => {
      const malformedJson = '{ invalid json }';
      const fallbackPack = getDefaultPack();
      
      const result = loadContentPackFromString(malformedJson, 'json', fallbackPack);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings).toContain('Using fallback content pack due to parsing errors');
      expect(result.pack).toEqual(fallbackPack);
      expect(result.source).toBe('fallback');
    });

    it('should handle invalid schema with fallback', () => {
      const invalidPack = JSON.stringify({
        id: 'invalid-pack',
        version: '1.0.0',
        title: 'Invalid Pack',
        steps: [], // Invalid: must have exactly 5 steps
      });
      const fallbackPack = getDefaultPack();
      
      const result = loadContentPackFromString(invalidPack, 'json', fallbackPack);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings).toContain('Using fallback content pack due to parsing errors');
      expect(result.pack).toEqual(fallbackPack);
      expect(result.source).toBe('fallback');
    });

    it('should throw error without fallback pack', () => {
      const malformedJson = '{ invalid json }';
      
      expect(() => {
        loadContentPackFromString(malformedJson, 'json');
      }).toThrow('Content parsing failed');
    });

    it('should handle missing required fields', () => {
      const incompletePack = JSON.stringify({
        id: 'incomplete-pack',
        version: '1.0.0',
        // Missing title and steps
      });
      const fallbackPack = getDefaultPack();
      
      const result = loadContentPackFromString(incompletePack, 'json', fallbackPack);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.pack).toEqual(fallbackPack);
      expect(result.source).toBe('fallback');
    });

    it('should validate delta ranges', () => {
      const packWithInvalidDeltas = JSON.stringify({
        id: 'invalid-deltas',
        version: '1.0.0',
        title: 'Invalid Deltas Pack',
        steps: [{
          id: 1,
          title: 'Step 1',
          scenario: 'Test scenario',
          optionA: {
            label: 'Option A',
            body: 'Body A',
            delta: { R: 20, U: 0, S: 0, C: 0, I: 0 }, // R too high (max 15)
          },
          optionB: {
            label: 'Option B',
            body: 'Body B',
            delta: { R: 0, U: -15, S: 0, C: 0, I: 0 }, // U too low (min -10)
          },
        }],
      });
      const fallbackPack = getDefaultPack();
      
      const result = loadContentPackFromString(packWithInvalidDeltas, 'json', fallbackPack);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.pack).toEqual(fallbackPack);
    });
  });

  describe('validateContentPackSafe', () => {
    it('should return valid result for good data', () => {
      const validPack = getDefaultPack();
      const result = validateContentPackSafe(validPack);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result for bad data', () => {
      const invalidPack = {
        id: 'invalid',
        version: 'not-semver',
        title: '',
        steps: [],
      };
      
      const result = validateContentPackSafe(invalidPack);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle null/undefined input', () => {
      expect(validateContentPackSafe(null).valid).toBe(false);
      expect(validateContentPackSafe(undefined).valid).toBe(false);
      expect(validateContentPackSafe({}).valid).toBe(false);
    });
  });

  describe('Asset URL Validation', () => {
    it('should accept valid asset URLs', () => {
      const packWithAssets = {
        id: 'assets-pack',
        version: '1.0.0',
        title: 'Assets Pack',
        steps: [{
          id: 1,
          title: 'Step 1',
          scenario: 'Test scenario',
          optionA: {
            label: 'Option A',
            body: 'Body A',
            delta: createDelta({ R: 5 }),
          },
          optionB: {
            label: 'Option B',
            body: 'Body B',
            delta: createDelta({ U: 5 }),
          },
          assets: [
            'https://example.com/image.png',
            'https://cdn.example.com/video.mp4',
          ],
        }],
      };

      // Fill remaining steps to make it valid
      for (let i = 2; i <= 5; i++) {
        packWithAssets.steps.push({
          id: i,
          title: `Step ${i}`,
          scenario: `Scenario ${i}`,
          optionA: {
            label: `Option A${i}`,
            body: `Body A${i}`,
            delta: createDelta({ R: 1 }),
          },
          optionB: {
            label: `Option B${i}`,
            body: `Body B${i}`,
            delta: createDelta({ U: 1 }),
          },
        });
      }

      const result = validateContentPackSafe(packWithAssets);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid asset URLs', () => {
      const packWithInvalidAssets = {
        id: 'invalid-assets',
        version: '1.0.0',
        title: 'Invalid Assets Pack',
        steps: [{
          id: 1,
          title: 'Step 1',
          scenario: 'Test scenario',
          optionA: {
            label: 'Option A',
            body: 'Body A',
            delta: createDelta({ R: 5 }),
          },
          optionB: {
            label: 'Option B',
            body: 'Body B',
            delta: createDelta({ U: 5 }),
          },
          assets: [
            'not-a-url',
            'ftp://invalid-protocol.com/file.txt',
          ],
        }],
      };

      const result = validateContentPackSafe(packWithInvalidAssets);
      expect(result.valid).toBe(false);
    });
  });

  describe('Default Pack Validation', () => {
    it('should validate that default pack is valid', () => {
      const defaultPack = getDefaultPack();
      const result = validateContentPackSafe(defaultPack);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(defaultPack.steps).toHaveLength(5);
      expect(defaultPack.id).toBe('ai-cofounder-default');
    });

    it('should have proper delta values in default pack', () => {
      const defaultPack = getDefaultPack();
      
      // Check that all deltas are within valid ranges
      defaultPack.steps.forEach((step, index) => {
        const { optionA, optionB } = step;
        
        // Check delta ranges
        Object.values(optionA.delta).forEach(value => {
          expect(value).toBeGreaterThanOrEqual(-10);
          expect(value).toBeLessThanOrEqual(15);
        });
        
        Object.values(optionB.delta).forEach(value => {
          expect(value).toBeGreaterThanOrEqual(-10);
          expect(value).toBeLessThanOrEqual(15);
        });
        
        // Check that step IDs are sequential
        expect(step.id).toBe(index + 1);
      });
    });
  });
});