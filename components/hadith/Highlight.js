import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Search-term highlighting, done in the browser at render time: the text
// itself is never changed (and the server-rendered HTML has no marks).
// It mirrors how the API matches (docs/HADITH_API.md, Search):
// - Arabic: without diacritics, alef / ya / ta marbuta / hamza forms unified, as substrings;
// - Chinese, Japanese, Thai, Khmer, Burmese, Lao: substrings;
// - other scripts: whole words, never single letters. The query is marked
//   as a phrase where its words follow each other; on their own, words of 2
//   letters are marked where they are a whole word, words of 3+ also where
//   they start a longer word (the whole word is marked). One-letter words
//   ("ý" in "ý định") are only marked as part of the phrase.
//   Diacritics count when the reader typed them: "định" marks "định" but not
//   "dính" or "dinh"; "dinh" (typed without) marks all three.

const HighlightContext = createContext(null);

const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/;
const ARABIC_FORMS = { "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ئ": "ي", "ة": "ه", "ؤ": "و", "ء": "" };
const SUBSTRING_SCRIPTS = /[぀-ヿ㐀-鿿豈-﫿฀-๿຀-໿ក-៿က-႟]/;
const WORD = /[\p{L}\p{M}\p{N}]+/gu;
const MARKS = /\p{M}/gu;

const foldArabic = (ch) => (ARABIC_MARKS.test(ch) ? "" : ARABIC_FORMS[ch] ?? ch);
const foldPlain = (ch) => ch.toLowerCase();

// Words compared with their diacritics (decomposed, so precomposed and
// combining spellings are equal) or without them.
const withMarks = (word) => word.normalize("NFD").toLowerCase();
const withoutMarks = (marked) => marked.replace(MARKS, "").replace(/đ/g, "d");

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

// [start, end) of every occurrence of the terms (Arabic, CJK ...).
function substringRanges(text, terms, foldChar) {
  if (!terms.length) return [];
  const { folded, map } = foldWithMap(text, foldChar);
  const ranges = [];
  terms.forEach((term) => {
    let from = 0;
    while (from <= folded.length - term.length) {
      const at = folded.indexOf(term, from);
      if (at === -1) break;
      from = at + 1;
      const start = map[at];
      let end = map[at + term.length - 1] + 1;
      // keep trailing diacritics / combining marks inside the mark
      while (end < text.length && foldChar(text[end]) === "") end += 1;
      ranges.push([start, end]);
    }
  });
  return ranges;
}

const queryTerm = (word) => {
  const marked = withMarks(word);
  const plain = withoutMarks(marked);
  const accented = marked !== plain;
  return { key: accented ? marked : plain, accented, length: Array.from(plain).length };
};

// [start, end) of whole words, and of the phrase, for the other scripts.
function wordRanges(text, terms) {
  if (!terms.length) return [];
  const singles = terms.filter((term) => term.length >= 2);
  const phrase = terms.length > 1 ? terms : null;
  const words = [];
  for (const match of text.matchAll(WORD)) {
    const marked = withMarks(match[0]);
    words.push({ start: match.index, end: match.index + match[0].length, marked, plain: withoutMarks(marked) });
  }
  const same = (word, term, prefix) => {
    const value = term.accented ? word.marked : word.plain;
    return prefix ? value.startsWith(term.key) : value === term.key;
  };

  const ranges = [];
  words.forEach((word, index) => {
    if (singles.some((term) => same(word, term, term.length >= 3))) ranges.push([word.start, word.end]);
    if (!phrase || index + phrase.length > words.length) return;
    for (let k = 0; k < phrase.length; k += 1) {
      const current = words[index + k];
      const last = k === phrase.length - 1;
      if (!same(current, phrase[k], last && phrase[k].length >= 3)) return;
      // the words of a phrase are separated by spaces only
      if (k > 0 && !/^\s+$/.test(text.slice(words[index + k - 1].end, current.start))) return;
    }
    ranges.push([word.start, words[index + phrase.length - 1].end]);
  });
  return ranges;
}

function makeMatcher(query, arabic) {
  const words = String(query || "").match(WORD) || [];
  let find;
  if (arabic) {
    const terms = words.map((word) => Array.from(word).map(foldArabic).join("")).filter((word) => word.length >= 2);
    if (!terms.length) return null;
    find = (text) => substringRanges(text, terms, foldArabic);
  } else {
    const substrings = words.filter((word) => SUBSTRING_SCRIPTS.test(word)).map((word) => word.toLowerCase());
    const terms = words.filter((word) => !SUBSTRING_SCRIPTS.test(word)).map(queryTerm);
    if (!substrings.length && terms.length < 2 && !terms.some((term) => term.length >= 2)) return null;
    find = (text) => [...substringRanges(text, substrings, foldPlain), ...wordRanges(text, terms)];
  }

  return (text) => {
    if (!text) return text;
    const ranges = find(text);
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
