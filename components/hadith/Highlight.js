import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Search-term highlighting, done in the browser at render time: the text
// itself is never changed (and the server-rendered HTML has no marks).
// It mirrors how the API matches (docs/HADITH_API.md, Search):
// - Arabic: without diacritics, alef / ya / ta marbuta / hamza forms unified;
// - Chinese, Japanese, Thai, Khmer, Burmese, Lao: substrings;
// - other scripts: case- and accent-insensitive, words of 3+ letters by prefix.

const HighlightContext = createContext(null);

const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/;
const ARABIC_FORMS = { "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ئ": "ي", "ة": "ه", "ؤ": "و", "ء": "" };
const SUBSTRING_SCRIPTS = /[぀-ヿ㐀-鿿豈-﫿฀-๿຀-໿ក-៿က-႟]/;
const WORD_CHAR = /[\p{L}\p{N}]/u;

const foldArabic = (ch) => (ARABIC_MARKS.test(ch) ? "" : ARABIC_FORMS[ch] ?? ch);
const foldLatin = (ch) =>
  ch.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

// Folded copy of the text plus, for each folded character, its original index.
function foldWithMap(text, foldChar) {
  let folded = "";
  const map = [];
  for (let i = 0; i < text.length; i += 1) {
    const out = foldChar(text[i]);
    for (const c of out) {
      folded += c;
      map.push(i);
    }
  }
  return { folded, map };
}

function makeMatcher(query, arabic) {
  const foldChar = arabic ? foldArabic : foldLatin;
  const terms = String(query || "")
    .split(/\s+/)
    .map((word) => Array.from(word).map(foldChar).join("").replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((word) => word.length >= (arabic ? 2 : 1));
  if (!terms.length) return null;

  return (text) => {
    if (!text) return text;
    const { folded, map } = foldWithMap(text, foldChar);
    const ranges = [];
    terms.forEach((term) => {
      const substring = arabic || SUBSTRING_SCRIPTS.test(term);
      let from = 0;
      while (from <= folded.length - term.length) {
        const at = folded.indexOf(term, from);
        if (at === -1) break;
        from = at + 1;
        if (!substring) {
          const before = at > 0 ? folded[at - 1] : "";
          if (before && WORD_CHAR.test(before)) continue; // must start a word
          const after = folded[at + term.length] || "";
          if (term.length < 3 && after && WORD_CHAR.test(after)) continue; // short words: whole word
        }
        const start = map[at];
        let end = map[at + term.length - 1] + 1;
        // keep trailing diacritics / combining marks inside the mark
        while (end < text.length && foldChar(text[end]) === "") end += 1;
        ranges.push([start, end]);
      }
    });
    if (!ranges.length) return text;

    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [];
    ranges.forEach((range) => {
      const last = merged[merged.length - 1];
      if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
      else merged.push([...range]);
    });

    const nodes = [];
    let cursor = 0;
    merged.forEach(([start, end], index) => {
      if (start > cursor) nodes.push(text.slice(cursor, start));
      nodes.push(<mark key={index}>{text.slice(start, end)}</mark>);
      cursor = end;
    });
    if (cursor < text.length) nodes.push(text.slice(cursor));
    return nodes;
  };
}

// `field`: "arabic" or the language code of the translations that were searched.
export function HighlightProvider({ query, field, children }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const value = useMemo(() => {
    if (!ready || !query || !field) return null;
    const matcher = makeMatcher(query, field === "arabic");
    return matcher ? { field, matcher } : null;
  }, [ready, query, field]);
  return <HighlightContext.Provider value={value}>{children}</HighlightContext.Provider>;
}

// `field`: "arabic" or the language code of this text.
export function Highlighted({ text, field }) {
  const context = useContext(HighlightContext);
  if (!context || context.field !== field) return text;
  return context.matcher(text);
}
