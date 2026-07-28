import { DEFAULT_LOCALE, type Locale } from "@/lib/constants";

type TranslationValue = string | Record<string, unknown>;

const translations: Record<string, Record<string, TranslationValue>> = {};

/**
 * Load translations for a given locale.
 * In production, this would load from JSON files or a CMS.
 */
export async function loadTranslations(locale: string) {
  if (translations[locale]) return translations[locale];

  try {
    const module = await import(`@/../public/locales/${locale}/common.json`);
    translations[locale] = module.default || module;
  } catch {
    translations[locale] = {};
  }

  return translations[locale];
}

/**
 * Get a nested translation value using dot notation.
 * E.g., t("nav.home") returns the value at translations.nav.home
 */
export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  const keys = key.split(".");
  let value: TranslationValue | undefined = translations[locale];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, TranslationValue>)[k];
    } else {
      return key; // Fallback to the key itself
    }
  }

  return typeof value === "string" ? value : key;
}
