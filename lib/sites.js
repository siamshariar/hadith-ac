import countries from "../config/countries.json";

// The deployment's country (config/countries.json). NEXT_PUBLIC_ values are inlined at
// build time, so each country is its own build; next.config.js refuses unknown codes.
export const DEFAULT_COUNTRY = "vn";

const DEFAULTS = {
  siteName: "Hadith",
  logo: null, // no logo of its own yet: the header shows siteName as a wordmark
  contactEmail: "deeniinfotech@gmail.com",
};

export function resolveSite(code) {
  const countryCode = String(code || DEFAULT_COUNTRY).trim().toLowerCase();
  const entry = countryCode !== "_comment" && countries[countryCode];
  if (!entry) return null;
  return { countryCode, ...DEFAULTS, ...entry };
}

const configured = resolveSite(process.env.NEXT_PUBLIC_COUNTRY_CODE) || resolveSite(DEFAULT_COUNTRY);

export const site = {
  ...configured,
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || configured.siteName,
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || configured.contactEmail,
};
