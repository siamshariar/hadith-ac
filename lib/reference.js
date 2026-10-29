// "Go to hadith": turns "Bukhari 1", "Muslim 8a", "Abu Dawud 2" or
// "40 Hadith Nawawi 5" into { slug, number } for /books/{slug}/hadiths/{number}
// (that endpoint accepts the citable number, Muslim's 8 / 8a / 8.01 included).

const fold = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();

const clean = (value) =>
  fold(value)
    .replace(/['’`ʿʾ]/g, "")
    .replace(/[^a-z0-9.]+/g, " ")
    .trim();

// Common spellings by API book code, on top of each book's own code, slug and names.
const EXTRA_ALIASES = {
  bukhari: ["bukhari", "sahih bukhari", "al bukhari", "bukhary"],
  muslim: ["muslim", "sahih muslim"],
  abudawud: ["abu dawud", "abu dawood", "abu daud", "abi dawud", "abudawood", "dawud"],
  tirmidhi: ["tirmidhi", "tirmizi", "tirmidzi", "at tirmidhi", "jami tirmidhi"],
  nasai: ["nasai", "nasa i", "an nasai", "sunan nasai"],
  ibnmajah: ["ibn majah", "ibnu majah", "ibn maja", "ibnmaja", "majah"],
  malik: ["malik", "muwatta", "muwatta malik", "muwatta imam malik"],
  nawawi: ["nawawi", "nawawi 40", "40 nawawi", "arbain nawawi"],
  qudsi: ["qudsi", "hadith qudsi", "40 qudsi"],
  dehlawi: ["dehlawi", "40 dehlawi"],
  hadeethenc: ["hadeethenc", "hadeeth enc", "hadithenc", "hadeeth"],
};

export const REFERENCE_NUMBER = /^\d+(?:\.\d+)?[a-z]?$/i;

function aliasIndex(books) {
  const index = new Map();
  (books || []).forEach((book) => {
    const names = [book.code, book.slug && book.slug.replace(/-/g, " "), book.name, book.nameEnglish];
    names.concat(EXTRA_ALIASES[book.code] || []).forEach((name) => {
      const key = clean(name);
      if (key && !index.has(key)) index.set(key, book.slug);
    });
  });
  return index;
}

export function parseReference(input, books) {
  const text = clean(input);
  const match = text.match(/^(.*?)\s*(\d+(?:\.\d+)?[a-z]?)$/);
  if (!match) return null;
  const alias = match[1].trim();
  const number = match[2];
  if (!alias) return null;

  const index = aliasIndex(books);
  if (index.has(alias)) return { slug: index.get(alias), number };

  // "sahih al bukhari" / "sunan abu dawud" style prefixes
  const stripped = alias.replace(/^(sahih|sunan|jami|al|an|at|imam)\s+/g, "").trim();
  if (stripped && index.has(stripped)) return { slug: index.get(stripped), number };

  // An unambiguous prefix of one collection's alias ("bukh 3")
  if (alias.length >= 3) {
    const slugs = new Set();
    index.forEach((slug, key) => {
      if (key.startsWith(alias)) slugs.add(slug);
    });
    if (slugs.size === 1) return { slug: [...slugs][0], number };
  }
  return null;
}
