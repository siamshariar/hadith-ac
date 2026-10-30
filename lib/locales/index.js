// Interface catalogs besides Vietnamese and English (those two live in lib/i18n.js).
// Each module exports its strings (default), `languageNames` (the language names it uses
// inside sentences), `nativeName` (its own name, for the interface menu of an international
// site) and `locale` (BCP 47: dates). To add a language: write lib/locales/<code>.js like
// bn.js, list it below, then run `npm run i18n:missing`. A country whose `ui` has a catalog
// here gets that interface (lib/language.js), and an international site offers it, except
// right-to-left languages, until the layout supports them.
//
// Imports keep their .js extension so that the Node scripts (scripts/*.mjs) can load them too.
import bn, { languageNames as bnLanguageNames, locale as bnLocale, nativeName as bnNativeName } from "./bn.js";

export const locales = { bn };

export const localeLanguageNames = { bn: bnLanguageNames };

export const localeInfo = { bn: { nativeName: bnNativeName, locale: bnLocale } };
