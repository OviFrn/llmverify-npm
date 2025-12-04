/**
 * Plugin Registry System
 * 
 * Extensible rule system for custom verification logic
 * 
 * @module plugins/registry
 */

/**
 * Plugin context provided to rules
 */
export interface PluginContext {
  content: string;
  prompt?: string;
  config?: any;
  metadata?: Record<string, any>;
}

/**
 * Plugin result
 */
export interface PluginResult {
  findings: Array<{
    category: string;
    severity: string;
    message: string;
    metadata?: any;
  }>;
  score?: number;
  metadata?: Record<string, any>;
}

/**
 * Plugin function signature
 */
export type PluginFunction = (context: PluginContext) => PluginResult | Promise<PluginResult>;

/**
 * Plugin definition
 */
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  category: 'security' | 'privacy' | 'safety' | 'quality' | 'custom';
  enabled: boolean;
  priority?: number; // Higher priority runs first
  execute: PluginFunction;
}

/**
 * Plugin registry
 */
export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  
  /**
   * Register a plugin
   */
  public register(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already registered`);
    }
    
    // Validate plugin
    this.validatePlugin(plugin);
    
    this.plugins.set(plugin.id, plugin);
  }
  
  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: Plugin): void {
    if (!plugin.id || typeof plugin.id !== 'string') {
      throw new Error('Plugin must have a valid id');
    }
    
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Plugin must have a valid name');
    }
    
    if (typeof plugin.execute !== 'function') {
      throw new Error('Plugin must have an execute function');
    }
  }
  
  /**
   * Unregister a plugin
   */
  public unregister(pluginId: string): boolean {
    return this.plugins.delete(pluginId);
  }
  
  /**
   * Get a plugin
   */
  public get(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  /**
   * Get all plugins
   */
  public getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Get enabled plugins
   */
  public getEnabled(): Plugin[] {
    return this.getAll()
      .filter(p => p.enabled)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
  
  /**
   * Get plugins by category
   */
  public getByCategory(category: Plugin['category']): Plugin[] {
    return this.getAll().filter(p => p.category === category);
  }
  
  /**
   * Enable a plugin
   */
  public enable(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = true;
    }
  }
  
  /**
   * Disable a plugin
   */
  public disable(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = false;
    }
  }
  
  /**
   * Execute all enabled plugins
   */
  public async executeAll(context: PluginContext): Promise<PluginResult[]> {
    const enabledPlugins = this.getEnabled();
    const results: PluginResult[] = [];
    
    for (const plugin of enabledPlugins) {
      try {
        const result = await plugin.execute(context);
        results.push(result);
      } catch (error) {
        console.error(`Plugin ${plugin.id} failed:`, error);
        // Continue with other plugins
      }
    }
    
    return results;
  }
  
  /**
   * Execute specific plugins
   */
  public async execute(pluginIds: string[], context: PluginContext): Promise<PluginResult[]> {
    const results: PluginResult[] = [];
    
    for (const id of pluginIds) {
      const plugin = this.plugins.get(id);
      if (plugin && plugin.enabled) {
        try {
          const result = await plugin.execute(context);
          results.push(result);
        } catch (error) {
          console.error(`Plugin ${id} failed:`, error);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Clear all plugins
   */
  public clear(): void {
    this.plugins.clear();
  }
  
  /**
   * Get plugin count
   */
  public count(): number {
    return this.plugins.size;
  }
}

/**
 * Global plugin registry
 */
let globalRegistry: PluginRegistry | null = null;

/**
 * Get global plugin registry
 */
export function getPluginRegistry(): PluginRegistry {
  if (!globalRegistry) {
    globalRegistry = new PluginRegistry();
  }
  return globalRegistry;
}

/**
 * Reset global registry
 */
export function resetPluginRegistry(): void {
  globalRegistry = null;
}
