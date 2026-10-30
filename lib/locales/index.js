// Interface catalogs besides Vietnamese and English (those two live in lib/i18n.js).
// Each module exports its strings (default) and `languageNames`, the language names it uses
// inside sentences. To add a language: write lib/locales/<code>.js like bn.js, list it
// below, then run `npm run i18n:missing`. A country whose `ui` has a catalog here gets that
// interface (lib/language.js), except right-to-left languages, until the layout supports them.
//
// Imports keep their .js extension so that the Node scripts (scripts/*.mjs) can load them too.
import bn, { languageNames as bnLanguageNames } from "./bn.js";

export const locales = { bn };

export const localeLanguageNames = { bn: bnLanguageNames };
