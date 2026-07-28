"use client";

import { useParams } from "next/navigation";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/lib/constants";

/**
 * Returns the current locale from the URL params.
 * Falls back to DEFAULT_LOCALE if not found.
 */
export function useLocale(): Locale {
  const params = useParams();
  const locale = params?.locale as string;

  if (SUPPORTED_LOCALES.includes(locale as Locale)) {
    return locale as Locale;
  }

  return DEFAULT_LOCALE;
}
