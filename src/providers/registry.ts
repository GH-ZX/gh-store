import { createSupabaseAdminClient } from "@/lib/utils/supabase";
import { G2BulkProvider } from "./g2bulk/index";
import type { BaseProvider } from "./base-provider";
import type { ProviderInfo, ProviderType } from "./types";

/**
 * Provider Registry.
 *
 * Adapters register a *factory* against their slug. Adding a provider is one
 * `registerProviderFactory(...)` call plus the adapter class — the registry
 * itself never changes, which is Phase 10's exit criterion ("adding new
 * providers requires minimal code changes").
 *
 * Credentials are read from `provider_credentials` with the service-role
 * client and handed to the factory. This module must therefore never be
 * imported from a client component.
 */

/** Credentials for one provider, keyed as stored in provider_credentials. */
export type ProviderCredentials = Record<string, string>;

/** Builds an adapter instance from its DB row + resolved credentials. */
export type ProviderFactory = (
  info: ProviderInfo,
  credentials: ProviderCredentials,
) => BaseProvider;

interface ProviderRow {
  id: string;
  name: string;
  slug: string;
  type: ProviderType;
  is_active: boolean;
  config: Record<string, unknown> | null;
  provider_credentials?: Array<{
    key: string;
    value: string;
    is_active: boolean;
  }> | null;
}

/** slug → factory. Populated at module load by the registrations below. */
const factories = new Map<string, ProviderFactory>();

/**
 * Register a provider adapter.
 *
 * Call this once per adapter at module scope. Registering the same slug twice
 * overwrites the previous factory, which keeps hot-reload predictable.
 */
export function registerProviderFactory(slug: string, factory: ProviderFactory): void {
  factories.set(slug, factory);
}

/** Slugs with a registered adapter — useful for admin UIs. */
export function getRegisteredSlugs(): string[] {
  return Array.from(factories.keys());
}

// ─── Built-in adapters ────────────────────────────────
// New providers are added here (and nowhere else in this file).
registerProviderFactory(
  "g2bulk",
  (info, credentials) => new G2BulkProvider(info, credentials.api_key),
);

export class ProviderRegistry {
  private static providers = new Map<string, BaseProvider>();
  private static initialized = false;

  /**
   * Load and instantiate all active providers from the database.
   * Safe to call repeatedly — subsequent calls are no-ops until `reset()`.
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const supabase = createSupabaseAdminClient();

      const { data, error } = await supabase
        .from("providers")
        .select("*, provider_credentials(*)")
        .eq("is_active", true);

      if (error) {
        console.error("Failed to load providers:", error.message);
        return;
      }

      const rows = (data ?? []) as unknown as ProviderRow[];

      for (const row of rows) {
        try {
          const instance = this.createInstance(row);
          if (instance) this.providers.set(row.slug, instance);
        } catch (err) {
          console.error(`Failed to register provider ${row.slug}:`, err);
        }
      }

      this.initialized = true;
    } catch (err) {
      console.error("Provider initialization error:", err);
      // Mark initialized regardless so a transient DB error does not make
      // every subsequent request retry the same failing query.
      this.initialized = true;
    }
  }

  /** Get a provider instance by slug. */
  static get(slug: string): BaseProvider | undefined {
    return this.providers.get(slug);
  }

  /** Get all registered provider instances. */
  static getAll(): BaseProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Providers that supply products and therefore participate in catalogue
   * sync — i.e. `type` is `product` or `hybrid`.
   */
  static async getProductProviders(): Promise<BaseProvider[]> {
    const infos = await Promise.all(
      this.getAll().map(async (p) => ({ provider: p, info: await p.getInfo() })),
    );

    return infos
      .filter(({ info }) => info.type === "product" || info.type === "hybrid")
      .map(({ provider }) => provider);
  }

  /** Whether a provider instance exists for this slug. */
  static has(slug: string): boolean {
    return this.providers.has(slug);
  }

  /** Clear instances and allow `initialize()` to run again. */
  static reset(): void {
    this.providers.clear();
    this.initialized = false;
  }

  /**
   * Build an adapter from a DB row using its registered factory.
   * Returns null when no adapter is registered for the slug.
   */
  private static createInstance(row: ProviderRow): BaseProvider | null {
    const factory = factories.get(row.slug);

    if (!factory) {
      // Expected for provider rows that exist only as config holders — e.g.
      // `sam-api`, whose payment flow runs through the edge function rather
      // than a BaseProvider adapter.
      return null;
    }

    const info: ProviderInfo = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      type: row.type,
      isActive: row.is_active,
      config: row.config ?? undefined,
    };

    const credentials: ProviderCredentials = {};
    for (const cred of row.provider_credentials ?? []) {
      if (cred.is_active) credentials[cred.key] = cred.value;
    }

    return factory(info, credentials);
  }
}
