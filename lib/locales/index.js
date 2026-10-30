// The interface catalogs besides English (./en.js: the fallback, always in the bundle), one
// line each. A catalog module exports its strings (default), `languageNames` (the language
// names it uses inside sentences), `nativeName` (its own name) and `locale` (BCP 47: numbers,
// plurals, dates, og:locale). None of them is in the scripts every page loads: the server
// sends a page the catalog of its interface with its props (lib/api loadPage), and the static
// pages (404, 500) load the reader's as a chunk of its own (contexts/LocaleContext.js).
//
// To add a language: write lib/locales/<code>.js like bn.js, add its line below, then run
// `npm run i18n:missing`. A reader whose content language has a catalog gets that interface
// (lib/language.js interfaceFor), except right-to-left ones until lib/i18n.js RTL_INTERFACES
// is turned on.
//
// The imports keep their .js extension so that the Node scripts (scripts/*.mjs) can load them too.
export const catalogLoaders = {
  vi: () => import("./vi.js"),
  bn: () => import("./bn.js"),
};
