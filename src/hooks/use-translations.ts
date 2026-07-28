"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "./use-locale";

type TranslationValue = string | Record<string, unknown>;
type Namespace = "common" | "auth";

// Static module map — each path is fully literal for Turbopack compatibility.
const modules = {
  "ar:auth": () => import("../../public/locales/ar/auth.json"),
  "en:auth": () => import("../../public/locales/en/auth.json"),
  "ar:common": () => import("../../public/locales/ar/common.json"),
  "en:common": () => import("../../public/locales/en/common.json"),
} as const;

const cache = new Map<string, Record<string, TranslationValue>>();

/**
 * Load a translation namespace JSON file.
 * Uses a static module map for Turbopack compatibility.
 * Results are cached in a module-level Map to avoid re-fetching.
 */
async function loadNamespace(locale: string, ns: Namespace): Promise<Record<string, TranslationValue>> {
  const key = `${locale}:${ns}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const loader = modules[key as keyof typeof modules];
    if (!loader) {
      cache.set(key, {});
      return {};
    }
    const module = await loader();
    const data = (module.default || module) as Record<string, TranslationValue>;
    cache.set(key, data);
    return data;
  } catch {
    cache.set(key, {});
    return {};
  }
}

/**
 * Get a deeply nested value from a translations object using dot notation.
 */
function getValue(obj: Record<string, TranslationValue>, path: string): string {
  const keys = path.split(".");
  let current: TranslationValue | undefined = obj as TranslationValue;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, TranslationValue>)[key];
    } else {
      return path; // fallback to key itself
    }
  }

  return typeof current === "string" ? current : path;
}

/**
 * React hook that provides translated strings for the current locale.
 *
 * Automatically loads the JSON file for the given namespace.
 * Results are cached across re-renders and re-mounts.
 *
 * @example
 * ```tsx
 * const { t, locale, isRtl, loaded } = useTranslations("auth");
 * return <h1>{t("login.title")}</h1>;
 * ```
 */
export function useTranslations(namespace: Namespace = "common") {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [translations, setTranslations] = useState<Record<string, TranslationValue>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadNamespace(locale, namespace).then((data) => {
      if (!cancelled) {
        setTranslations(data);
        setLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [locale, namespace]);

  const t = useCallback(
    (key: string): string => {
      // Try the loaded translations first, then fall back to the cache
      if (loaded && Object.keys(translations).length > 0) {
        return getValue(translations, key);
      }
      const cached = cache.get(`${locale}:${namespace}`);
      if (cached) return getValue(cached, key);
      return key;
    },
    [locale, namespace, loaded, translations],
  );

  return { t, locale, isRtl, loaded };
}
