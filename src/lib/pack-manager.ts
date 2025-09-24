import { ContentPack } from './content-pack';
import { loadContentPack, loadContentPackFromString, LoadResult } from './content-loader';
import { getDefaultPack } from './default-pack';

/**
 * Pack Manager
 * 
 * Handles content pack switching, URL parameter parsing, and pack management
 * for operators and developers.
 */

export interface PackManagerOptions {
  enableDevMode?: boolean;
  allowUrlOverride?: boolean;
  defaultPackId?: string;
}

export interface PackInfo {
  id: string;
  version: string;
  title: string;
  description?: string;
  source: 'default' | 'url' | 'local' | 'embedded';
  isActive: boolean;
}

export class PackManager {
  private currentPack: ContentPack;
  private availablePacks: Map<string, ContentPack> = new Map();
  private options: PackManagerOptions;
  private loadHistory: LoadResult[] = [];

  constructor(options: PackManagerOptions = {}) {
    this.options = {
      enableDevMode: false,
      allowUrlOverride: true,
      ...options,
    };

    // Initialize with default pack
    const defaultPack = getDefaultPack();
    this.currentPack = defaultPack;
    this.availablePacks.set(defaultPack.id, defaultPack);
  }

  /**
   * Get the currently active content pack
   */
  getCurrentPack(): ContentPack {
    return this.currentPack;
  }

  /**
   * Get information about all available packs
   */
  getAvailablePacks(): PackInfo[] {
    return Array.from(this.availablePacks.entries()).map(([id, pack]) => ({
      id: pack.id,
      version: pack.version,
      title: pack.title,
      description: pack.description,
      source: this.getPackSource(pack.id),
      isActive: pack.id === this.currentPack.id,
    }));
  }

  /**
   * Switch to a different content pack by ID
   */
  async switchToPack(packId: string): Promise<LoadResult | null> {
    const pack = this.availablePacks.get(packId);
    if (pack) {
      this.currentPack = pack;
      this.updateUrlParam(packId);
      return null; // No loading needed, pack already available
    }

    // Try to load pack from URL or other sources
    try {
      const result = await this.loadPackById(packId);
      if (result.pack) {
        this.currentPack = result.pack;
        this.availablePacks.set(result.pack.id, result.pack);
        this.updateUrlParam(packId);
        this.loadHistory.push(result);
        return result;
      }
    } catch (error) {
      console.error(`Failed to switch to pack ${packId}:`, error);
    }

    return null;
  }

  /**
   * Load a content pack from URL
   */
  async loadPackFromUrl(url: string): Promise<LoadResult> {
    const result = await loadContentPack(url, {
      fallbackPack: getDefaultPack(),
      validateAssets: false,
    });

    if (result.pack) {
      this.availablePacks.set(result.pack.id, result.pack);
      this.loadHistory.push(result);
    }

    return result;
  }

  /**
   * Load a content pack from string data
   */
  loadPackFromString(content: string, format: 'json' | 'yaml' = 'json'): LoadResult {
    const result = loadContentPackFromString(content, format, getDefaultPack());

    if (result.pack) {
      this.availablePacks.set(result.pack.id, result.pack);
      this.loadHistory.push(result);
    }

    return result;
  }

  /**
   * Initialize pack manager from URL parameters
   */
  async initializeFromUrl(): Promise<LoadResult | null> {
    if (!this.options.allowUrlOverride) {
      return null;
    }

    const urlParams = this.getUrlParams();
    const packParam = urlParams.get('pack');
    const packUrlParam = urlParams.get('packUrl');

    if (packUrlParam) {
      // Load pack from URL
      try {
        const result = await this.loadPackFromUrl(packUrlParam);
        if (result.pack) {
          this.currentPack = result.pack;
        }
        return result;
      } catch (error) {
        console.error('Failed to load pack from URL:', error);
      }
    } else if (packParam && packParam !== this.currentPack.id) {
      // Switch to existing pack or try to load it
      return await this.switchToPack(packParam);
    }

    return null;
  }

  /**
   * Reset to default pack
   */
  resetToDefault(): void {
    const defaultPack = getDefaultPack();
    this.currentPack = defaultPack;
    this.updateUrlParam(defaultPack.id);
  }

  /**
   * Get pack loading history for debugging
   */
  getLoadHistory(): LoadResult[] {
    return [...this.loadHistory];
  }

  /**
   * Clear pack loading history
   */
  clearHistory(): void {
    this.loadHistory = [];
  }

  /**
   * Get current pack info for display
   */
  getCurrentPackInfo(): PackInfo {
    return {
      id: this.currentPack.id,
      version: this.currentPack.version,
      title: this.currentPack.title,
      description: this.currentPack.description,
      source: this.getPackSource(this.currentPack.id),
      isActive: true,
    };
  }

  /**
   * Check if dev mode is enabled
   */
  isDevModeEnabled(): boolean {
    return this.options.enableDevMode || this.getUrlParams().has('dev');
  }

  // Private helper methods

  private getPackSource(packId: string): 'default' | 'url' | 'local' | 'embedded' {
    const defaultPack = getDefaultPack();
    if (packId === defaultPack.id) {
      return 'default';
    }

    // Check load history for source information
    const historyEntry = this.loadHistory.find(entry => entry.pack.id === packId);
    if (historyEntry) {
      return historyEntry.source === 'url' ? 'url' : 'local';
    }

    return 'embedded';
  }

  private async loadPackById(packId: string): Promise<LoadResult> {
    // This could be extended to support a registry of pack URLs
    // For now, we'll try common patterns
    const possibleUrls = [
      `/packs/${packId}.json`,
      `/packs/${packId}.yaml`,
      `https://cdn.example.com/packs/${packId}.json`,
    ];

    for (const url of possibleUrls) {
      try {
        const result = await loadContentPack(url, {
          fallbackPack: getDefaultPack(),
          timeout: 3000,
        });
        if (result.pack && result.pack.id === packId) {
          return result;
        }
      } catch (error) {
        // Continue to next URL
        continue;
      }
    }

    throw new Error(`Pack ${packId} not found`);
  }

  private getUrlParams(): URLSearchParams {
    if (typeof window === 'undefined') {
      return new URLSearchParams();
    }
    return new URLSearchParams(window.location.search);
  }

  private updateUrlParam(packId: string): void {
    if (typeof window === 'undefined' || !this.options.allowUrlOverride) {
      return;
    }

    const url = new URL(window.location.href);
    const defaultPack = getDefaultPack();
    
    if (packId === defaultPack.id) {
      url.searchParams.delete('pack');
    } else {
      url.searchParams.set('pack', packId);
    }

    // Update URL without page reload
    window.history.replaceState({}, '', url.toString());
  }
}

// Global pack manager instance
let globalPackManager: PackManager | null = null;

/**
 * Get the global pack manager instance
 */
export function getPackManager(options?: PackManagerOptions): PackManager {
  if (!globalPackManager) {
    globalPackManager = new PackManager(options);
  }
  return globalPackManager;
}

/**
 * Initialize pack manager from URL (convenience function)
 */
export async function initializePackManager(options?: PackManagerOptions): Promise<LoadResult | null> {
  const manager = getPackManager(options);
  return await manager.initializeFromUrl();
}