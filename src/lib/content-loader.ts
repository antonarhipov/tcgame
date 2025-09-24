import yaml from 'js-yaml';
import { ContentPack, validateContentPack, isValidContentPack } from './content-pack';

/**
 * Content Loader
 * 
 * Handles loading and validation of content packs from JSON and YAML sources
 * with proper error handling and fallback mechanisms.
 */

export interface LoadResult {
  pack: ContentPack;
  source: 'file' | 'url' | 'fallback';
  errors: string[];
  warnings: string[];
}

export interface LoadOptions {
  fallbackPack?: ContentPack;
  validateAssets?: boolean;
  timeout?: number; // in milliseconds
}

/**
 * Load content pack from a file path or URL
 */
export async function loadContentPack(
  source: string,
  options: LoadOptions = {}
): Promise<LoadResult> {
  const { fallbackPack, validateAssets = false, timeout = 5000 } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Determine if source is URL or file path
    const isUrl = source.startsWith('http://') || source.startsWith('https://');
    let rawContent: string;

    if (isUrl) {
      // Load from URL with timeout
      rawContent = await loadFromUrl(source, timeout);
    } else {
      // Load from file system (for server-side or build-time loading)
      rawContent = await loadFromFile(source);
    }

    // Parse content based on file extension
    const parsedData = parseContent(rawContent, source);
    
    // Validate against schema
    const pack = validateContentPack(parsedData);

    // Optional asset validation
    if (validateAssets && pack.steps) {
      await validatePackAssets(pack, warnings);
    }

    return {
      pack,
      source: isUrl ? 'url' : 'file',
      errors,
      warnings,
    };

  } catch (error) {
    errors.push(`Failed to load content pack: ${error instanceof Error ? error.message : String(error)}`);

    // Try fallback pack
    if (fallbackPack) {
      warnings.push('Using fallback content pack due to loading errors');
      return {
        pack: fallbackPack,
        source: 'fallback',
        errors,
        warnings,
      };
    }

    // If no fallback, throw the error
    throw new Error(`Content pack loading failed: ${errors.join(', ')}`);
  }
}

/**
 * Load content pack from raw string data
 */
export function loadContentPackFromString(
  content: string,
  format: 'json' | 'yaml' = 'json',
  fallbackPack?: ContentPack
): LoadResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const parsedData = format === 'yaml' ? yaml.load(content) : JSON.parse(content);
    const pack = validateContentPack(parsedData);

    return {
      pack,
      source: 'file',
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(`Failed to parse content: ${error instanceof Error ? error.message : String(error)}`);

    if (fallbackPack) {
      warnings.push('Using fallback content pack due to parsing errors');
      return {
        pack: fallbackPack,
        source: 'fallback',
        errors,
        warnings,
      };
    }

    throw new Error(`Content parsing failed: ${errors.join(', ')}`);
  }
}

/**
 * Validate multiple content packs and return the first valid one
 */
export async function loadFirstValidPack(
  sources: string[],
  options: LoadOptions = {}
): Promise<LoadResult> {
  const allErrors: string[] = [];

  for (const source of sources) {
    try {
      const result = await loadContentPack(source, options);
      if (result.errors.length === 0) {
        return result;
      }
      allErrors.push(`${source}: ${result.errors.join(', ')}`);
    } catch (error) {
      allErrors.push(`${source}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // If all sources failed, use fallback
  if (options.fallbackPack) {
    return {
      pack: options.fallbackPack,
      source: 'fallback',
      errors: allErrors,
      warnings: ['All content pack sources failed, using fallback'],
    };
  }

  throw new Error(`All content pack sources failed: ${allErrors.join('; ')}`);
}

// Helper functions

async function loadFromUrl(url: string, timeout: number): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function loadFromFile(filePath: string): Promise<string> {
  // For client-side, this would need to be handled differently
  // This is primarily for server-side or build-time loading
  if (typeof window !== 'undefined') {
    throw new Error('File system access not available in browser environment');
  }

  // Only import fs/promises on server-side
  try {
    const fs = await import('fs/promises');
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`File system access failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function parseContent(content: string, source: string): unknown {
  const isYaml = source.endsWith('.yaml') || source.endsWith('.yml');
  
  if (isYaml) {
    return yaml.load(content);
  } else {
    return JSON.parse(content);
  }
}

async function validatePackAssets(pack: ContentPack, warnings: string[]): Promise<void> {
  const assetUrls: string[] = [];
  
  // Collect all asset URLs from steps
  for (const step of pack.steps) {
    if (step.assets) {
      assetUrls.push(...step.assets);
    }
  }

  // Validate each asset URL
  for (const url of assetUrls) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        warnings.push(`Asset not accessible: ${url} (${response.status})`);
      }
    } catch (error) {
      warnings.push(`Asset validation failed: ${url} (${error instanceof Error ? error.message : String(error)})`);
    }
  }
}

/**
 * Utility to check if a content pack is valid without throwing
 */
export function validateContentPackSafe(data: unknown): { valid: boolean; errors: string[] } {
  try {
    validateContentPack(data);
    return { valid: true, errors: [] };
  } catch (error) {
    return {
      valid: false,
      errors: error instanceof Error ? [error.message] : ['Unknown validation error'],
    };
  }
}