const TRANSLATIONS = {
  en: {
    addressSearch: {
      placeholder: 'Search Address',
      searchFailed: 'Search failed. Please try again.',
      showing: 'Showing',
      of: 'of',
      results: 'results',
      preferNearby: 'Prefer nearby',
      noResults: 'No results',
    },
  },
  de: {
    addressSearch: {
      placeholder: 'Adresse suchen',
      searchFailed: 'Suche fehlgeschlagen. Bitte erneut versuchen.',
      showing: 'Zeige',
      of: 'von',
      results: 'Ergebnisse',
      preferNearby: 'Nächstgelegene bevorzugen',
      noResults: 'Keine Ergebnisse',
    },
  },
};

/**
 * Resolves a BCP 47 language tag to a 2-letter language code.
 * Priority: langOverride > <html lang> > navigator.language > 'en'
 * @param {string|null|undefined} langOverride
 * @returns {string}
 */
export function resolveLanguage(langOverride) {
  const raw =
    langOverride || document.documentElement.lang || navigator.language || 'en';
  return raw.split('-')[0].toLowerCase();
}

/**
 * Returns the translation bundle for a given namespace and optional language override.
 * Falls back to English if the language or namespace is not found.
 * @param {string} namespace
 * @param {string|null|undefined} langOverride
 * @returns {Record<string, string>}
 */
export function getTranslations(namespace, langOverride) {
  const lang = resolveLanguage(langOverride);
  return (
    (TRANSLATIONS[lang] ?? TRANSLATIONS.en)[namespace] ??
    TRANSLATIONS.en[namespace]
  );
}
