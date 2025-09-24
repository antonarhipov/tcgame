import { z } from 'zod';

/**
 * ContentPack v1 Schema
 * 
 * Defines the structure for game content packs including steps, choices,
 * and scaling meter deltas based on docs/game-levels.md and docs/scaling-meter.md
 */

// Delta represents changes to the 5-dimensional state vector
export const DeltaSchema = z.object({
  R: z.number().int().min(-10).max(15).default(0), // Revenue Momentum
  U: z.number().int().min(-10).max(15).default(0), // User Growth / Activation
  S: z.number().int().min(-10).max(15).default(0), // System Reliability / Scalability
  C: z.number().int().min(-10).max(15).default(0), // Customer Love (NPS / retention)
  I: z.number().int().min(-10).max(15).default(0), // Investor Confidence / Story
});

// Choice represents one of two options (A or B) in a step
export const ChoiceSchema = z.object({
  label: z.string().min(1).max(200), // Short description of the choice
  body: z.string().min(1).max(1000), // Detailed description/demo text
  delta: DeltaSchema, // Impact on the scaling meter dimensions
});

// Step represents one level/stage of the game
export const StepSchema = z.object({
  id: z.number().int().min(1).max(5), // Step number (1-5)
  title: z.string().min(1).max(100), // Step title (e.g., "Early Maturity Stage")
  subtitle: z.string().min(1).max(200).optional(), // Optional subtitle
  scenario: z.string().min(1).max(2000), // Scenario description/context
  optionA: ChoiceSchema, // First choice option
  optionB: ChoiceSchema, // Second choice option
  assets: z.array(z.string().url()).optional(), // Optional asset URLs
});

// ContentPack represents a complete game content pack
export const ContentPackSchema = z.object({
  id: z.string().min(1).max(50), // Unique identifier (e.g., "ai-cofounder-v1")
  version: z.string().regex(/^\d+\.\d+\.\d+$/), // Semantic version (e.g., "1.0.0")
  title: z.string().min(1).max(100), // Pack title for display
  description: z.string().min(1).max(500).optional(), // Optional description
  author: z.string().min(1).max(100).optional(), // Optional author
  steps: z.array(StepSchema).length(5), // Exactly 5 steps
  metadata: z.object({
    created: z.string().datetime().optional(), // ISO datetime
    updated: z.string().datetime().optional(), // ISO datetime
    tags: z.array(z.string()).optional(), // Optional tags
  }).optional(),
});

// Type exports for TypeScript usage
export type Delta = z.infer<typeof DeltaSchema>;
export type Choice = z.infer<typeof ChoiceSchema>;
export type Step = z.infer<typeof StepSchema>;
export type ContentPack = z.infer<typeof ContentPackSchema>;

// Validation helper functions
export function validateContentPack(data: unknown): ContentPack {
  return ContentPackSchema.parse(data);
}

export function isValidContentPack(data: unknown): data is ContentPack {
  return ContentPackSchema.safeParse(data).success;
}

// Default empty delta for convenience
export const EMPTY_DELTA: Delta = { R: 0, U: 0, S: 0, C: 0, I: 0 };

// Helper to create a delta with only specified values
export function createDelta(partial: Partial<Delta>): Delta {
  return { ...EMPTY_DELTA, ...partial };
}