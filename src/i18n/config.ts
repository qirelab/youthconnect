export const locales = [
  "ru", // Russian (default)
  "en", // English
  "uk", // Ukrainian
  "be", // Belarusian
  "pl", // Polish
  "de", // German
  "fr", // French
  "es", // Spanish
  "it", // Italian
  "pt", // Portuguese
  "nl", // Dutch
  "ro", // Romanian
  "cs", // Czech
  "sk", // Slovak
  "hu", // Hungarian
  "bg", // Bulgarian
  "hr", // Croatian
  "sr", // Serbian
  "sl", // Slovenian
  "lt", // Lithuanian
  "lv", // Latvian
  "et", // Estonian
  "fi", // Finnish
  "sv", // Swedish
  "da", // Danish
  "el", // Greek
  "kk", // Kazakh
  "uz", // Uzbek
  "hy", // Armenian
  "ka", // Georgian
  "az", // Azerbaijani
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

export const localeNames: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  uk: "Українська",
  be: "Беларуская",
  pl: "Polski",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  ro: "Română",
  cs: "Čeština",
  sk: "Slovenčina",
  hu: "Magyar",
  bg: "Български",
  hr: "Hrvatski",
  sr: "Српски",
  sl: "Slovenščina",
  lt: "Lietuvių",
  lv: "Latviešu",
  et: "Eesti",
  fi: "Suomi",
  sv: "Svenska",
  da: "Dansk",
  el: "Ελληνικά",
  kk: "Қазақша",
  uz: "Oʻzbek",
  hy: "Հայեր",
  ka: "ქართული",
  az: "Azərbaycan",
};

export const localeFlags: Record<Locale, string> = {
  ru: "🇷🇺",
  en: "🇬🇧",
  uk: "🇺🇦",
  be: "🇧🇾",
  pl: "🇵🇱",
  de: "🇩🇪",
  fr: "🇫🇷",
  es: "🇪🇸",
  it: "🇮🇹",
  pt: "🇵🇹",
  nl: "🇳🇱",
  ro: "🇷🇴",
  cs: "🇨🇿",
  sk: "🇸🇰",
  hu: "🇭🇺",
  bg: "🇧🇬",
  hr: "🇭🇷",
  sr: "🇷🇸",
  sl: "🇸🇮",
  lt: "🇱🇹",
  lv: "🇱🇻",
  et: "🇪🇪",
  fi: "🇫🇮",
  sv: "🇸🇪",
  da: "🇩🇰",
  el: "🇬🇷",
  kk: "🇰🇿",
  uz: "🇺🇿",
  hy: "🇦🇲",
  ka: "🇬🇪",
  az: "🇦🇿",
};
