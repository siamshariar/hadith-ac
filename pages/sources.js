import Link from "next/link";
import { server } from "../lib/config";
import { getBooks, getEditions, getLanguages, loadPage } from "../lib/api";
import { bookPath, shortBookName } from "../lib/hadith";
import { DEFAULT_LANGUAGE, INTERFACE_LANGUAGE, compareLanguages } from "../lib/language";
import { site } from "../lib/sites";
import { useLocale } from "../contexts/LocaleContext";
import Meta from "../components/core/meta";
import Breadcrumbs from "../components/core/breadcrumbs";
import Layout from "../components/layouts/LayoutSecondary";
import { sidebarCategoriesData } from "../components/sidebar/data";
import styles from "../components/content/Page.module.scss";

const FAWAZ_URL = "https://github.com/fawazahmed0/hadith-api";
const HADEETHENC_URL = "https://hadeethenc.com";

// Prose in each interface language with a catalog (English when there is
// none); figures come from the API. {site} is the site's name, {language} the
// deployment's content language (lib/sites.js), whose coverage is described.
const COPY = {
  vi: {
    title: "Nguồn & phương pháp",
    intro:
      "{site} hiển thị văn bản hadith từ hai nguồn, qua API hadith của Quran API. Mỗi hadith ghi rõ số tham chiếu và ấn bản của từng bản dịch đang hiển thị, cùng tên mà ấn bản đó ghi.",
    sourcesTitle: "Nguồn dữ liệu",
    fawaz:
      "Các bộ sưu tập kinh điển: văn bản tiếng Ả Rập, bản dịch và đánh giá độ xác thực theo từng học giả. Theo dự án này, văn bản tiếng Ả Rập và tiếng Anh được lấy từ sunnah.com.",
    hadeethenc:
      "Bách khoa toàn thư hadith được dịch: hadith kèm giải thích, bài học, nghĩa của từ và cây danh mục, do đội ngũ HadeethEnc dịch sang nhiều ngôn ngữ, gồm {language}. HadeethEnc cho phép sử dụng lại miễn phí với điều kiện ghi nguồn, theo chính sách của IslamHouse.",
    collections: "Bộ sưu tập",
    rulesTitle: "Nguyên tắc",
    rules: [
      "Không dùng máy dịch. Mọi bản dịch đều lấy nguyên văn từ một ấn bản đã công bố và ghi mã ấn bản đó. Tên đi kèm là tên mà ấn bản ghi, giữ nguyên: phần lớn ấn bản không nêu tên người dịch, và vài ấn bản ghi tên người biên soạn bộ sách, nên tên đó không được gọi là người dịch.",
      "Khi một hadith chưa có bản dịch bằng ngôn ngữ bạn chọn, bản dịch tiếng Anh được hiển thị kèm nhãn rõ ràng; nếu không có cả bản tiếng Anh, chỉ hiển thị nguyên văn tiếng Ả Rập.",
      "Liên kết giữa các bộ sưu tập chỉ được tạo khi lời văn tiếng Ả Rập trùng khớp chính xác. Bản dịch HadeethEnc của phần lời văn trùng khớp được ghi nhãn riêng, không bao giờ trình bày như bản dịch của chính bộ sách.",
      "Đánh giá độ xác thực chỉ hiển thị kèm tên người đánh giá, đúng như nguồn ghi. Nguồn không có đánh giá theo từng hadith cho Sahih al-Bukhari, Sahih Muslim và ba bộ 40 hadith, nên ở đó không có đánh giá nào.",
      "Số hadith là số tham chiếu dùng để trích dẫn; với Sahih Muslim là số Abdul-Baqi (8, 8a, 8.01 ...). “Vị trí trong sách” là thứ tự của hadith trong chương theo nguồn.",
    ],
    coverageTitle: "Mức độ có {language}",
    coverage: ({ language, hencOwn, hencTotal, bookOwn, linked, readable, total, linkedBooks }) =>
      [
        `${hencOwn} trong ${hencTotal} hadith của HadeethEnc có bản dịch ${language} của HadeethEnc.`,
        linked && `Thêm ${linked} hadith trong các bộ sưu tập khác đọc được qua bản dịch HadeethEnc của phần lời văn trùng khớp${linkedBooks ? ` (${linkedBooks})` : ""}.`,
        bookOwn
          ? `Các bộ sưu tập khác có ${bookOwn} hadith bằng ${language} từ ấn bản riêng của chúng.`
          : `Các bộ sưu tập kinh điển chưa có bản dịch ${language} riêng: với các hadith đó, nguyên văn tiếng Ả Rập và bản dịch tiếng Anh được hiển thị, có ghi nhãn.`,
        `Tổng cộng ${readable} trong ${total} hadith đọc được bằng ${language}.`,
      ]
        .filter(Boolean)
        .join(" "),
    translatorsTitle: "Ấn bản bản dịch theo ngôn ngữ",
    translatorsIntro:
      "Mọi ấn bản bản dịch theo dữ liệu API: bộ sưu tập, tên mà ấn bản ghi (giữ nguyên, không phải lúc nào cũng là người dịch), mã ấn bản (liên kết tới tệp nguồn) và số hadith.",
    language: "Ngôn ngữ",
    translator: "Tên trong nguồn",
    edition: "Ấn bản",
    unknownTranslator: "không nêu tên",
    hencLanguages: (count) => `HadeethEnc.com: bản dịch bằng ${count} ngôn ngữ.`,
    unavailable: "Không tải được danh sách ấn bản lúc này.",
  },
  en: {
    title: "Sources & method",
    intro:
      "{site} shows hadith texts from two sources, through the Quran API's hadith endpoints. Every hadith shows its reference number and the edition of each translation on screen, with the name that edition gives.",
    sourcesTitle: "Sources",
    fawaz:
      "The canonical collections: Arabic text, translations and per-scholar grades. The project states that its Arabic and English texts come from sunnah.com.",
    hadeethenc:
      "The Encyclopedia of Translated Prophetic Hadiths: hadiths with explanation, benefits, word meanings and a category tree, translated by the HadeethEnc team into many languages, {language} included. HadeethEnc allows free reuse with attribution, under the IslamHouse policy.",
    collections: "Collections",
    rulesTitle: "Rules",
    rules: [
      "No machine translation. Every translation is taken word for word from a published edition, whose code is given. The name shown with it is the one the edition gives, as given: most editions name no translator and a few name the collection's compiler, so that name is never called the translator.",
      "When a hadith has no translation in the chosen language, the English translation is shown and clearly labelled; without English either, only the Arabic is shown.",
      "Collections are linked only when the Arabic wording matches exactly. HadeethEnc's translation of a matching wording is labelled as such and never presented as the collection's own translation.",
      "Grades are shown only with the grader's name, exactly as the source gives them. The source has no per-hadith grades for Sahih al-Bukhari, Sahih Muslim and the three forty-hadith books, so none are shown there.",
      "Hadith numbers are the reference numbers people cite; for Sahih Muslim the Abdul-Baqi numbers (8, 8a, 8.01 ...). The in-book reference is the hadith's position in its book in the source's order.",
    ],
    coverageTitle: "{language} coverage",
    coverage: ({ language, hencOwn, hencTotal, bookOwn, linked, readable, total, linkedBooks }) =>
      [
        `${hencOwn} of HadeethEnc's ${hencTotal} hadiths have HadeethEnc's ${language} translation.`,
        linked && `Another ${linked} hadiths in other collections can be read through HadeethEnc's translation of a matching wording${linkedBooks ? ` (${linkedBooks})` : ""}.`,
        bookOwn
          ? `The other collections have ${bookOwn} hadiths in ${language} from editions of their own.`
          : `The canonical collections have no ${language} translation of their own: for those hadiths the Arabic and the labelled English translation are shown.`,
        `In all, ${readable} of ${total} hadiths can be read in ${language}.`,
      ]
        .filter(Boolean)
        .join(" "),
    translatorsTitle: "Translation editions by language",
    translatorsIntro:
      "Every translation edition the API lists: the collection, the name the edition gives (as given, not always the translator), the edition code (linked to the source file) and the number of hadiths.",
    language: "Language",
    translator: "Name in the source",
    edition: "Edition",
    unknownTranslator: "not named",
    hencLanguages: (count) => `HadeethEnc.com: translations in ${count} languages.`,
    unavailable: "The list of editions could not be loaded right now.",
  },
  // Drafted by Claude (AI), needs review by a native Bengali speaker before
  // launch, like lib/locales/bn.js (same terms).
  bn: {
    title: "উৎস ও পদ্ধতি",
    intro:
      "{site} দুটি উৎস থেকে হাদিসের পাঠ দেখায়, Quran API-এর হাদিস API-এর মাধ্যমে। প্রতিটি হাদিসে রেফারেন্স নম্বর এবং পর্দায় দেখানো প্রতিটি অনুবাদের সংস্করণ উল্লেখ থাকে, সেই সংস্করণে দেওয়া নামসহ।",
    sourcesTitle: "উৎস",
    fawaz:
      "প্রধান হাদিস গ্রন্থসমূহ: আরবি পাঠ, অনুবাদ এবং প্রত্যেক আলেমের দেওয়া মান। প্রকল্পটির বক্তব্য অনুযায়ী এর আরবি ও ইংরেজি পাঠ sunnah.com থেকে নেওয়া।",
    hadeethenc:
      "অনূদিত নববী হাদিসের বিশ্বকোষ: ব্যাখ্যা, শিক্ষা, শব্দার্থ ও বিষয়ভিত্তিক শ্রেণিবিন্যাসসহ হাদিস, যা HadeethEnc দল {language}সহ বহু ভাষায় অনুবাদ করেছে। IslamHouse-এর নীতিমালা অনুযায়ী উৎস উল্লেখ করে HadeethEnc বিনামূল্যে পুনর্ব্যবহারের অনুমতি দেয়।",
    collections: "গ্রন্থসমূহ",
    rulesTitle: "নীতিমালা",
    rules: [
      "কোনো যন্ত্র-অনুবাদ নেই। প্রতিটি অনুবাদ কোনো প্রকাশিত সংস্করণ থেকে হুবহু নেওয়া, যার কোড উল্লেখ করা হয়। অনুবাদের সঙ্গে দেখানো নামটি সংস্করণে যেমন দেওয়া আছে তেমনই: বেশিরভাগ সংস্করণে অনুবাদকের নাম নেই এবং কয়েকটিতে গ্রন্থের সংকলকের নাম দেওয়া, তাই সেই নামকে কখনো অনুবাদক বলা হয় না।",
      "কোনো হাদিসের অনুবাদ বাছাই করা ভাষায় না থাকলে ইংরেজি অনুবাদ স্পষ্ট লেবেলসহ দেখানো হয়; ইংরেজিও না থাকলে শুধু আরবি পাঠ দেখানো হয়।",
      "আরবি শব্দাবলি হুবহু মিললেই কেবল গ্রন্থগুলোর মধ্যে সংযোগ করা হয়। মিলে যাওয়া শব্দাবলির HadeethEnc অনুবাদ আলাদা লেবেলসহ দেখানো হয়, কখনো গ্রন্থের নিজস্ব অনুবাদ হিসেবে নয়।",
      "হাদিসের মান কেবল মান-নির্ধারকের নামসহ দেখানো হয়, ঠিক যেমন উৎসে আছে। Sahih al-Bukhari, Sahih Muslim এবং চল্লিশ হাদিসের তিনটি সংকলনের জন্য উৎসে প্রতিটি হাদিসের আলাদা মান নেই, তাই সেখানে কোনো মান দেখানো হয় না।",
      "হাদিস নম্বর হলো উদ্ধৃতিতে ব্যবহৃত রেফারেন্স নম্বর; Sahih Muslim-এর ক্ষেত্রে আবদুল বাকির নম্বর (8, 8a, 8.01 ...)। “গ্রন্থে অবস্থান” হলো উৎসের ক্রম অনুযায়ী অধ্যায়ে হাদিসটির অবস্থান।",
    ],
    coverageTitle: "{language} ভাষায় প্রাপ্যতা",
    coverage: ({ language, hencOwn, hencTotal, bookOwn, linked, readable, total, linkedBooks }) =>
      [
        `HadeethEnc-এর ${hencTotal}টি হাদিসের মধ্যে ${hencOwn}টির ${language} অনুবাদ HadeethEnc-এ আছে।`,
        linked && `অন্যান্য গ্রন্থের আরও ${linked}টি হাদিস মিলে যাওয়া শব্দাবলির HadeethEnc অনুবাদের মাধ্যমে পড়া যায়${linkedBooks ? ` (${linkedBooks})` : ""}।`,
        bookOwn
          ? `অন্যান্য গ্রন্থের ${bookOwn}টি হাদিস সেগুলোর নিজস্ব ${language} সংস্করণে পড়া যায়।`
          : `প্রধান গ্রন্থগুলোর নিজস্ব কোনো ${language} অনুবাদ নেই: সেসব হাদিসে আরবি পাঠ ও লেবেলসহ ইংরেজি অনুবাদ দেখানো হয়।`,
        `সব মিলিয়ে ${total}টি হাদিসের মধ্যে ${readable}টি ${language} ভাষায় পড়া যায়।`,
      ]
        .filter(Boolean)
        .join(" "),
    translatorsTitle: "ভাষা অনুযায়ী অনুবাদের সংস্করণ",
    translatorsIntro:
      "API-তে থাকা প্রতিটি অনুবাদ সংস্করণ: গ্রন্থ, সংস্করণে দেওয়া নাম (যেমন দেওয়া আছে; সব সময় অনুবাদক নন), সংস্করণের কোড (উৎস ফাইলের লিংক) এবং হাদিসের সংখ্যা।",
    language: "ভাষা",
    translator: "উৎসে দেওয়া নাম",
    edition: "সংস্করণ",
    unknownTranslator: "নাম উল্লেখ নেই",
    hencLanguages: (count) => `HadeethEnc.com: ${count}টি ভাষায় অনুবাদ।`,
    unavailable: "এই মুহূর্তে সংস্করণের তালিকা লোড করা যায়নি।",
  },
};

export default function Sources({ books, coverage, translators, hencLanguages }) {
  const { t, ui, formatNumber, languageName } = useLocale();
  const base = COPY[ui] || COPY.en;
  // the deployment's content language, as the interface names it in a sentence
  const language = languageName(DEFAULT_LANGUAGE, coverage && coverage.language);
  const copy = {
    ...base,
    intro: base.intro.replace("{site}", site.siteName),
    hadeethenc: base.hadeethenc.replace("{language}", language),
    // capitalized only where it opens the title ("Vietnamese coverage")
    coverageTitle: base.coverageTitle.replace("{language}", (_, offset) =>
      offset === 0 ? language.charAt(0).toUpperCase() + language.slice(1) : language
    ),
  };
  const fawazBooks = (books || []).filter((book) => book.source === "fawaz");
  const henc = (books || []).find((book) => book.source === "hadeethenc");

  return (
    <>
      <Meta
        title={copy.title}
        description={copy.intro}
        url={`${server}/sources`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <div className={`${styles.page} ${styles.prosePage}`}>
        <Breadcrumbs items={[{ href: "/", label: t("home") }, { label: copy.title }]} />

        <header className={styles.header}>
          <h1 className={styles.title}>{copy.title}</h1>
          <p className={styles.subtitle}>{copy.intro}</p>
        </header>

        <section className={styles.section} aria-labelledby="sources-data">
          <h2 id="sources-data" className={styles.sectionTitle}>
            {copy.sourcesTitle}
          </h2>
          <div className={styles.sourceList}>
            <article className={styles.sourceItem}>
              <h3>
                <a href={FAWAZ_URL} target="_blank" rel="noopener noreferrer">
                  Fawaz hadith-api
                </a>
              </h3>
              <p>{copy.fawaz}</p>
              {fawazBooks.length > 0 && (
                <ul className={styles.inlineList} aria-label={copy.collections}>
                  {fawazBooks.map((book) => (
                    <li key={book.slug}>
                      <Link href={bookPath(book)}>{book.name}</Link> ({formatNumber(book.totalHadith)})
                    </li>
                  ))}
                </ul>
              )}
            </article>
            <article className={styles.sourceItem}>
              <h3>
                <a href={HADEETHENC_URL} target="_blank" rel="noopener noreferrer">
                  HadeethEnc.com
                </a>
              </h3>
              <p>{copy.hadeethenc}</p>
              {henc && (
                <ul className={styles.inlineList}>
                  <li>
                    <Link href={bookPath(henc)}>{shortBookName(henc)}</Link> ({formatNumber(henc.totalHadith)})
                  </li>
                  {hencLanguages > 0 && <li>{copy.hencLanguages(formatNumber(hencLanguages))}</li>}
                </ul>
              )}
            </article>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="sources-rules">
          <h2 id="sources-rules" className={styles.sectionTitle}>
            {copy.rulesTitle}
          </h2>
          <ol className={styles.rules}>
            {copy.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </section>

        {coverage && (
          <section className={styles.section} aria-labelledby="sources-coverage">
            <h2 id="sources-coverage" className={styles.sectionTitle}>
              {copy.coverageTitle}
            </h2>
            <p className={`${styles.notice} ${styles.warning}`}>
              {copy.coverage({
                language,
                hencOwn: formatNumber(coverage.hencOwn),
                hencTotal: formatNumber(coverage.hencTotal),
                bookOwn: coverage.bookOwn > 0 ? formatNumber(coverage.bookOwn) : null,
                linked: coverage.linked > 0 ? formatNumber(coverage.linked) : null,
                readable: formatNumber(coverage.own + coverage.linked),
                total: formatNumber(coverage.total),
                linkedBooks: coverage.linkedBooks.map((item) => `${item.name} ${formatNumber(item.count)}`).join(", "),
              })}
            </p>
          </section>
        )}

        <section className={styles.section} aria-labelledby="sources-translators">
          <h2 id="sources-translators" className={styles.sectionTitle}>
            {copy.translatorsTitle}
          </h2>
          <p className={styles.subtitle}>{copy.translatorsIntro}</p>
          {translators && translators.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th scope="col">{copy.language}</th>
                    <th scope="col">{copy.collections}</th>
                    <th scope="col">{copy.translator}</th>
                    <th scope="col">{copy.edition}</th>
                  </tr>
                </thead>
                {/* One group of rows per language, one row per edition. */}
                {translators.map((row) => (
                  <tbody key={row.code}>
                    {row.editions.map((item, index) => (
                        <tr key={item.code}>
                          {index === 0 && (
                            <th scope="rowgroup" rowSpan={row.editions.length}>
                              <bdi>{row.nativeName}</bdi>
                              {row.nativeName !== row.name ? <span className={styles.tableNote}> ({row.name})</span> : null}
                            </th>
                          )}
                          <td>{item.name}</td>
                          <td>
                            {item.author ? (
                              <bdi>{item.author}</bdi>
                            ) : (
                              <span className={styles.tableNote}>{copy.unknownTranslator}</span>
                            )}
                          </td>
                          <td>
                            {item.sourceUrl ? (
                              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                                {item.code}
                              </a>
                            ) : (
                              item.code
                            )}{" "}
                            <span className={styles.tableNote}>({formatNumber(item.count)})</span>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          ) : (
            <p className={styles.notice}>{copy.unavailable}</p>
          )}
        </section>
      </div>
    </>
  );
}

Sources.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

// Translators by language from /hadith/editions: one row per language, one
// entry per edition (collection, translator as the source names them,
// edition code linked to the source file).
function translatorsByLanguage(editions) {
  const byCode = new Map();
  (editions || []).forEach((edition) => {
    if (!byCode.has(edition.languageCode)) {
      byCode.set(edition.languageCode, {
        code: edition.languageCode,
        name: edition.languageName || edition.languageCode,
        nativeName: edition.languageNativeName || edition.languageName || edition.languageCode,
        editions: [],
      });
    }
    byCode.get(edition.languageCode).editions.push({
      code: edition.code,
      name: edition.source === "hadeethenc" ? "HadeethEnc" : edition.bookName,
      author: edition.author || null,
      sourceUrl: edition.sourceUrl || null,
      count: edition.totalHadith || 0,
    });
  });
  // the deployment's language first, then English, then by name
  return [...byCode.values()].sort(compareLanguages);
}

export async function getServerSideProps(context) {
  return loadPage(context, async (lang) => {
    // Coverage of the deployment's content language (none for Arabic, the original).
    const [books, languages, siteBooks] = await Promise.all([
      getBooks(lang),
      getLanguages().catch(() => []),
      DEFAULT_LANGUAGE === "ar" ? Promise.resolve([]) : getBooks(DEFAULT_LANGUAGE).catch(() => []),
    ]);

    let coverage = null;
    if (siteBooks.length) {
      const henc = siteBooks.find((book) => book.source === "hadeethenc");
      const info = languages.find((item) => item.code === DEFAULT_LANGUAGE);
      coverage = {
        language: info ? { code: info.code, name: info.name, nativeName: info.nativeName } : null,
        own: siteBooks.reduce((sum, book) => sum + (book.totalTranslated || 0), 0),
        hencOwn: henc ? henc.totalTranslated || 0 : 0,
        bookOwn: siteBooks
          .filter((book) => book.source !== "hadeethenc")
          .reduce((sum, book) => sum + (book.totalTranslated || 0), 0),
        linked: siteBooks.reduce((sum, book) => sum + (book.totalLinkedTranslated || 0), 0),
        total: siteBooks.reduce((sum, book) => sum + (book.totalHadith || 0), 0),
        hencTotal: henc ? henc.totalHadith : 0,
        linkedBooks: siteBooks
          .filter((book) => book.totalLinkedTranslated > 0)
          .map((book) => ({ name: shortBookName(book), count: book.totalLinkedTranslated })),
      };
    }

    const editions = await getEditions().catch(() => null);
    const translators = editions ? translatorsByLanguage(editions) : null;

    return {
      props: {
        books: books.map(({ slug, code, name, source, totalHadith }) => ({ slug, code, name, source, totalHadith })),
        coverage,
        translators,
        hencLanguages: languages.filter((language) => language.code !== "ar").length,
        contentTitle: (COPY[INTERFACE_LANGUAGE] || COPY.en).title,
        sidebarData: await sidebarCategoriesData(lang),
        backLink: "/",
      },
    };
  });
}
