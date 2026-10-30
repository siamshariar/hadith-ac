import countries from "../config/countries.json";

// The deployment's country (config/countries.json). NEXT_PUBLIC_ values are inlined at
// build time, so each country is its own build; next.config.js refuses unknown codes.
// `language` is the default content language and `ui` the interface language wanted;
// lib/language.js decides the one used (English while lib/locales has no catalog for it).
// An `international` entry (ac) is one site for every language: there both follow the
// reader, and `language` and `ui` are only the defaults.
export const DEFAULT_COUNTRY = "vn";

const DEFAULTS = {
  siteName: "Hadith",
  logo: null, // no logo of its own yet: the header shows siteName as a wordmark
  logoDark: null, // for the dark theme; falls back to logo
  contactEmail: "deeniinfotech@gmail.com",
  international: false,
};

export function resolveSite(code) {
  const countryCode = String(code || DEFAULT_COUNTRY).trim().toLowerCase();
  const known = countryCode !== "_comment" && Object.prototype.hasOwnProperty.call(countries, countryCode);
  if (!known) return null;
  return { countryCode, ...DEFAULTS, ...countries[countryCode] };
}

const configured = resolveSite(process.env.NEXT_PUBLIC_COUNTRY_CODE) || resolveSite(DEFAULT_COUNTRY);

export const site = {
  ...configured,
  international: configured.international === true,
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || configured.siteName,
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || configured.contactEmail,
};
