// Plain-text citation and copy text for a hadith, with the same labels as
// the page (a fallback translation stays marked as such; grades keep their
// grader names). Used by the copy buttons.

import { server } from "./config";
import { UNASSIGNED_CHAPTER, citation, cleanText, hadithPath, isCategoryBook, shortBookName } from "./hadith";

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

// Which translations the reader sees (see components/hadith/HadithText).
export function displayedTranslations(hadith) {
  const own = hadith.translation && hadith.translation.text ? hadith.translation : null;
  const linked = hadith.linkedTranslation && hadith.linkedTranslation.text ? hadith.linkedTranslation : null;
  const ownIsNative = own && !own.isFallback;
  return { own, linked: ownIsNative ? null : linked };
}

export function translationLabel(translation, t, languageName) {
  if (translation.isFallback && translation.languageCode === "en") return t("fallbackTranslation");
  return t("translationIn", { language: languageName(translation.languageCode) });
}

export function linkedLabel(linked, t, languageName) {
  return t("linkedTranslation", { language: languageName(linked.languageCode) });
}

export const permalink = (hadith) => `${server}${hadithPath(hadith)}`;

export function buildCitation(hadith, book, { t, languageName }) {
  const lines = [referenceText(hadith, book, t)];
  const inBook = isCategoryBook(book) ? null : inBookText(hadith.inBookReference, t);
  if (inBook) lines.push(`${t("inBookReference")}: ${inBook}`);

  const { own, linked } = displayedTranslations(hadith);
  if (linked) {
    // "Bản dịch tiếng Việt theo HadeethEnc: HadeethEnc.com, ấn bản hadeethenc-vi - <source> - <HadeethEnc hadith>"
    const parts = [linked.author || "HadeethEnc.com"];
    if (linked.edition && linked.edition.code) parts.push(`${t("edition")} ${linked.edition.code}`);
    let line = `${linkedLabel(linked, t, languageName)}: ${parts.join(", ")}`;
    if (linked.edition && linked.edition.sourceUrl) line += ` - ${linked.edition.sourceUrl}`;
    line += ` - ${server}${hadithPath({ id: linked.hadithId })}`;
    lines.push(line);
  }
  if (own) {
    // "Bản dịch tiếng Anh: Muhsin Khan, ấn bản eng-bukhari - <source>"
    const parts = [];
    if (own.author) parts.push(own.author);
    if (own.edition && own.edition.code) parts.push(`${t("edition")} ${own.edition.code}`);
    let line = `${translationLabel(own, t, languageName)}: ${parts.join(", ") || "-"}`;
    if (own.edition && own.edition.sourceUrl) line += ` - ${own.edition.sourceUrl}`;
    lines.push(line);
  }
  lines.push(permalink(hadith));
  return lines.join("\n");
}

export function buildText(hadith, book, { t, languageName }) {
  const parts = [referenceText(hadith, book, t)];
  if (hadith.title) parts.push(cleanText(hadith.title));
  if (hadith.arabic) parts.push(`[${t("arabicText")}]\n${cleanText(hadith.arabic)}`);

  const { own, linked } = displayedTranslations(hadith);
  if (linked) {
    parts.push(`[${linkedLabel(linked, t, languageName)} - ${linked.author || "HadeethEnc.com"}]\n${cleanText(linked.text)}`);
  }
  if (own) {
    const label = [translationLabel(own, t, languageName), own.author].filter(Boolean).join(" - ");
    parts.push(`[${label}]\n${cleanText(own.text)}`);
  }

  const grades = [];
  if (hadith.gradeText) grades.push(hadith.gradeText);
  (hadith.grades || []).forEach((grade) => grades.push(`${grade.graderName}: ${grade.grade}`));
  if (grades.length) parts.push(`${t("grades")}: ${grades.join("; ")}`);

  parts.push(permalink(hadith));
  return parts.join("\n\n");
}
