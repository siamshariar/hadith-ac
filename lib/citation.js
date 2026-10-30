// Plain-text citation and copy texts for a hadith, with the same labels as
// the page: a fallback translation stays marked as such, HadeethEnc's linked
// translation is said to be HadeethEnc's, grades keep their grader names, and
// the name an edition gives is quoted as given, never called the translator
// ("Bản dịch tiếng Anh · Muhsin Khan · eng-bukhari"). Used by the copy menu.

import { server } from "./config";
import { site } from "./sites";
import { UNASSIGNED_CHAPTER, citablePath, citation, cleanText, hadithPath, isCategoryBook, shortBookName } from "./hadith";
import { extraTranslations, fallbackShownAsExtra, primaryTranslation } from "./translations";

// "Book 1, Hadith 3" (API inBookReference: { chapterNo, position }).
export function inBookText(inBook, t) {
  if (!inBook || inBook.position == null) return null;
  if (inBook.chapterNo === UNASSIGNED_CHAPTER) return t("inBookUnassigned", { position: inBook.position });
  return t("inBookValue", { chapter: inBook.chapterNo, position: inBook.position });
}

// "Sahih al-Bukhari 3"; records without a citable number say so.
export function referenceText(hadith, book, t) {
  if (hadith.referenceNumber) return citation(hadith, book);
  return `${shortBookName(book)} (${t("noReferenceNumber")})`;
}

// Every translation on the page, in the order shown (see
// components/hadith/HadithText): the primary one (the hadith's own, the
// English fallback, or HadeethEnc's linked one with the collection's English
// folded under it), then the reader's extra languages that have a text.
// Each item: { entry, code, primary, fallback, linked, language }, where
// `language` is the API's { name, nativeName } of an extra language.
export function shownTranslations(hadith) {
  const { own, linked, fallback } = primaryTranslation(hadith);
  const items = [];
  if (linked) items.push({ entry: linked, code: linked.languageCode, primary: true, linked: true });
  if (own) items.push({ entry: own, code: own.languageCode, primary: true, fallback: Boolean(own.isFallback) });
  if (linked && fallback && !fallbackShownAsExtra(hadith)) {
    items.push({ entry: fallback, code: fallback.languageCode, primary: true, fallback: true });
  }
  extraTranslations(hadith).forEach((slot) => {
    if (slot.entry) {
      items.push({ entry: slot.entry, code: slot.code, primary: false, linked: Boolean(slot.entry.linked), language: slot });
    }
  });
  return items;
}

// "Bản dịch tiếng Anh" (the English fallback), "Bản dịch বাংলা", "Bản dịch
// tiếng Việt theo HadeethEnc". `languageName(code, fallback)` is the locale's.
export function translationItemLabel(item, t, languageName) {
  const name = item.language ? languageName(item.code, item.language) : languageName(item.code);
  if (item.linked) return t("linkedTranslation", { language: name });
  if (item.fallback && item.code === "en") return t("fallbackTranslation");
  return t("translationIn", { language: name });
}

// "Muhsin Khan · eng-bukhari", "không nêu tên · ben-bukhari": the name the
// edition gives, quoted as given, and the edition code.
export function creditText(entry, t) {
  const edition = (entry && entry.edition) || {};
  return [(entry && entry.author) || t("nameNotGiven"), edition.code].filter(Boolean).join(" · ");
}

// Kept for callers of the previous API: the primary translations only.
export function displayedTranslations(hadith) {
  const { own, linked, fallback } = primaryTranslation(hadith);
  return linked ? { own: fallback, linked } : { own, linked: null };
}

export function translationLabel(translation, t, languageName) {
  if (translation.isFallback && translation.languageCode === "en") return t("fallbackTranslation");
  return t("translationIn", { language: languageName(translation.languageCode) });
}

export function linkedLabel(linked, t, languageName) {
  return t("linkedTranslation", { language: languageName(linked.languageCode) });
}

// The citable URL (/books/{book}/hadiths/{number}), also the canonical one.
export const permalink = (hadith, book) => `${server}${citablePath(hadith, book)}`;

// "Báo lỗi": an e-mail to the site's contact address with the citation and
// permalink already filled in.
export function reportErrorHref(hadith, book, t) {
  const reference = referenceText(hadith, book, t);
  const subject = t("reportErrorSubject", { citation: reference });
  const body = t("reportErrorBody", { citation: reference, url: permalink(hadith, book) });
  return `mailto:${site.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Reference, in-book reference, where each translation shown comes from
// (with HadeethEnc's hadith for a linked one) and the permalink.
export function buildCitation(hadith, book, { t, languageName }) {
  const lines = [referenceText(hadith, book, t)];
  const inBook = isCategoryBook(book) ? null : inBookText(hadith.inBookReference, t);
  if (inBook) lines.push(t("labelValue", { label: t("inBookReference"), value: inBook }));

  shownTranslations(hadith).forEach((item) => {
    const { entry } = item;
    let line = `${translationItemLabel(item, t, languageName)} · ${creditText(entry, t)}`;
    if (entry.edition && entry.edition.sourceUrl) line += ` - ${entry.edition.sourceUrl}`;
    const linkedId = item.linked ? (entry.linked ? entry.linked.hadithId : entry.hadithId) : null;
    if (linkedId) line += ` - ${server}${hadithPath({ id: linkedId })}`;
    lines.push(line);
  });
  lines.push(permalink(hadith, book));
  return lines.join("\n");
}

function translationParts(hadith, { t, languageName }) {
  return shownTranslations(hadith).map(
    (item) => `[${translationItemLabel(item, t, languageName)} · ${creditText(item.entry, t)}]\n${cleanText(item.entry.text)}`
  );
}

// "Copy tiếng Ả Rập": the reference, the Arabic and the permalink.
export function buildArabic(hadith, book, { t }) {
  const parts = [referenceText(hadith, book, t)];
  if (hadith.arabic) parts.push(`[${t("arabicText")}]\n${cleanText(hadith.arabic)}`);
  parts.push(permalink(hadith, book));
  return parts.join("\n\n");
}

// "Copy bản dịch": the reference, every translation shown, labelled, and the permalink.
export function buildTranslations(hadith, book, locale) {
  return [referenceText(hadith, book, locale.t), ...translationParts(hadith, locale), permalink(hadith, book)].join("\n\n");
}

// Whether there is any translation to copy.
export const hasTranslations = (hadith) => shownTranslations(hadith).length > 0;

// "Copy tất cả": reference, title, Arabic, the translations, grades, permalink.
export function buildText(hadith, book, locale) {
  const { t } = locale;
  const parts = [referenceText(hadith, book, t)];
  if (hadith.title) parts.push(cleanText(hadith.title));
  if (hadith.arabic) parts.push(`[${t("arabicText")}]\n${cleanText(hadith.arabic)}`);
  parts.push(...translationParts(hadith, locale));

  const grades = [];
  if (hadith.gradeText) grades.push(hadith.gradeText);
  (hadith.grades || []).forEach((grade) => grades.push(`${grade.graderName}: ${grade.grade}`));
  if (grades.length) parts.push(t("labelValue", { label: t("grades"), value: grades.join("; ") }));

  parts.push(permalink(hadith, book));
  return parts.join("\n\n");
}
