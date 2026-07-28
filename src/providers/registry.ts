import { createSupabaseAdminClient } from "@/lib/utils/supabase";
import { BaseProvider } from "./base-provider";
import type { ProviderInfo, ProviderConfig } from "./types";
import { G2BulkProvider } from "./g2bulk/index";

/**
 * Provider Registry.
 *
 * Manages all registered provider adapters.
 * Providers are loaded from the database and instantiated dynamically.
 */
export class ProviderRegistry {
  private static providers = new Map<string, BaseProvider>();
  private static initialized = false;

  /**
   * Initialize all active providers from the database.
   * Should be called once on server startup.
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const supabase = createSupabaseAdminClient();

      const { data: providers, error } = await supabase
        .from("providers")
        .select("*, provider_credentials(*)")
        .eq("is_active", true);

      if (error) {
        console.error("Failed to load providers:", error.message);
        return;
      }

      if (!providers || providers.length === 0) {
        console.log("No active providers found in database.");
        this.initialized = true;
        return;
      }

      for (const provider of providers) {
        try {
          const instance = this.createInstance(provider);
          if (instance) {
            this.providers.set(provider.slug, instance);
            console.log(`Provider registered: ${provider.name} (${provider.slug})`);
          }
        } catch (err) {
          console.error(`Failed to register provider ${provider.slug}:`, err);
        }
      }

      this.initialized = true;
    } catch (err) {
      console.error("Provider initialization error:", err);
      this.initialized = true;
    }
  }

  /**
   * Get a provider instance by slug.
   */
  static get(slug: string): BaseProvider | undefined {
    return this.providers.get(slug);
  }

  /**
   * Get all registered providers.
   */
  static getAll(): BaseProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get product providers (for catalog sync).
   */
  static getProductProviders(): BaseProvider[] {
    return this.getAll(); // Filter could be refined with provider type
  }

  /**
   * Create a provider instance from database row.
   * Extend this method when adding new provider types.
   */
  private static createInstance(provider: any): BaseProvider | null {
    const info: ProviderInfo = {
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      type: provider.type,
      isActive: provider.is_active,
      config: provider.config,
    };

    // Extract credentials from the joined provider_credentials
    const creds: { key: string; value: string; is_active: boolean }[] =
      (provider as any).provider_credentials || [];
    const apiKey = creds.find(
      (c: any) => c.key === "api_key" && c.is_active,
    )?.value;

    switch (provider.slug) {
      case "g2bulk":
        return new G2BulkProvider(info, apiKey);
      // Future providers will be added here
      // case "sam":
      //   return new SAMProvider(info);
      default:
        console.warn(`Unknown provider slug: ${provider.slug}`);
        return null;
    }
  }

  /**
   * Check if a provider is registered.
   */
  static has(slug: string): boolean {
    return this.providers.has(slug);
  }

  /**
   * Reset the registry (useful for testing or reinitialization).
   */
  static reset(): void {
    this.providers.clear();
    this.initialized = false;
  }
}
