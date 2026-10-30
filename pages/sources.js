import Link from "next/link";
import { server } from "../lib/config";
import { getBooks, getEditions, getLanguages, loadPage } from "../lib/api";
import { bookPath, shortBookName } from "../lib/hadith";
import { site } from "../lib/sites";
import { useLocale } from "../contexts/LocaleContext";
import Meta from "../components/core/meta";
import Breadcrumbs from "../components/core/breadcrumbs";
import Layout from "../components/layouts/LayoutSecondary";
import { sidebarCategoriesData } from "../components/sidebar/data";
import styles from "../components/content/Page.module.scss";

const FAWAZ_URL = "https://github.com/fawazahmed0/hadith-api";
const HADEETHENC_URL = "https://hadeethenc.com";

// Prose in the two interface languages; figures come from the API.
const COPY = {
  vi: {
    title: "Nguồn & phương pháp",
    intro:
      "{site} hiển thị văn bản hadith từ hai nguồn, qua API hadith của Quran API. Mỗi hadith ghi rõ số tham chiếu và ấn bản của từng bản dịch đang hiển thị, cùng tên mà ấn bản đó ghi.",
    sourcesTitle: "Nguồn dữ liệu",
    fawaz:
      "Các bộ sưu tập kinh điển: văn bản tiếng Ả Rập, bản dịch và đánh giá độ xác thực theo từng học giả. Theo dự án này, văn bản tiếng Ả Rập và tiếng Anh được lấy từ sunnah.com.",
    hadeethenc:
      "Bách khoa toàn thư hadith được dịch: hadith kèm giải thích, bài học, nghĩa của từ và cây danh mục, do đội ngũ HadeethEnc dịch sang nhiều ngôn ngữ, gồm tiếng Việt. HadeethEnc cho phép sử dụng lại miễn phí với điều kiện ghi nguồn, theo chính sách của IslamHouse.",
    collections: "Bộ sưu tập",
    rulesTitle: "Nguyên tắc",
    rules: [
      "Không dùng máy dịch. Mọi bản dịch đều lấy nguyên văn từ một ấn bản đã công bố và ghi mã ấn bản đó. Tên đi kèm là tên mà ấn bản ghi, giữ nguyên: phần lớn ấn bản không nêu tên người dịch, và vài ấn bản ghi tên người biên soạn bộ sách, nên tên đó không được gọi là người dịch.",
      "Khi một hadith chưa có bản dịch bằng ngôn ngữ bạn chọn, bản dịch tiếng Anh được hiển thị kèm nhãn rõ ràng; nếu không có cả bản tiếng Anh, chỉ hiển thị nguyên văn tiếng Ả Rập.",
      "Liên kết giữa các bộ sưu tập chỉ được tạo khi lời văn tiếng Ả Rập trùng khớp chính xác. Bản dịch HadeethEnc của phần lời văn trùng khớp được ghi nhãn riêng, không bao giờ trình bày như bản dịch của chính bộ sách.",
      "Đánh giá độ xác thực chỉ hiển thị kèm tên người đánh giá, đúng như nguồn ghi. Nguồn không có đánh giá theo từng hadith cho Sahih al-Bukhari, Sahih Muslim và ba bộ 40 hadith, nên ở đó không có đánh giá nào.",
      "Số hadith là số tham chiếu dùng để trích dẫn; với Sahih Muslim là số Abdul-Baqi (8, 8a, 8.01 ...). “Vị trí trong sách” là thứ tự của hadith trong chương theo nguồn.",
    ],
    coverageTitle: "Mức độ có tiếng Việt",
    coverage: ({ own, hencTotal, linked, readable, total, linkedBooks }) =>
      `${own} trong ${hencTotal} hadith của HadeethEnc có bản dịch tiếng Việt của HadeethEnc. Thêm ${linked} hadith trong các bộ sưu tập khác đọc được qua bản dịch HadeethEnc của phần lời văn trùng khớp${linkedBooks ? ` (${linkedBooks})` : ""}. Các bộ sưu tập kinh điển chưa có bản dịch tiếng Việt riêng: với các hadith đó, nguyên văn tiếng Ả Rập và bản dịch tiếng Anh được hiển thị, có ghi nhãn. Tổng cộng ${readable} trong ${total} hadith đọc được bằng tiếng Việt.`,
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
      "The Encyclopedia of Translated Prophetic Hadiths: hadiths with explanation, benefits, word meanings and a category tree, translated by the HadeethEnc team into many languages, Vietnamese included. HadeethEnc allows free reuse with attribution, under the IslamHouse policy.",
    collections: "Collections",
    rulesTitle: "Rules",
    rules: [
      "No machine translation. Every translation is taken word for word from a published edition, whose code is given. The name shown with it is the one the edition gives, as given: most editions name no translator and a few name the collection's compiler, so that name is never called the translator.",
      "When a hadith has no translation in the chosen language, the English translation is shown and clearly labelled; without English either, only the Arabic is shown.",
      "Collections are linked only when the Arabic wording matches exactly. HadeethEnc's translation of a matching wording is labelled as such and never presented as the collection's own translation.",
      "Grades are shown only with the grader's name, exactly as the source gives them. The source has no per-hadith grades for Sahih al-Bukhari, Sahih Muslim and the three forty-hadith books, so none are shown there.",
      "Hadith numbers are the reference numbers people cite; for Sahih Muslim the Abdul-Baqi numbers (8, 8a, 8.01 ...). The in-book reference is the hadith's position in its book in the source's order.",
    ],
    coverageTitle: "Vietnamese coverage",
    coverage: ({ own, hencTotal, linked, readable, total, linkedBooks }) =>
      `${own} of HadeethEnc's ${hencTotal} hadiths have HadeethEnc's Vietnamese translation. Another ${linked} hadiths in other collections can be read through HadeethEnc's translation of a matching wording${linkedBooks ? ` (${linkedBooks})` : ""}. The canonical collections have no Vietnamese translation of their own: for those hadiths the Arabic and the labelled English translation are shown. In all, ${readable} of ${total} hadiths can be read in Vietnamese.`,
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
};

export default function Sources({ books, vietnamese, translators, hencLanguages }) {
  const { t, ui, formatNumber } = useLocale();
  const base = COPY[ui] || COPY.en;
  const copy = { ...base, intro: base.intro.replace("{site}", site.siteName) };
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

        {vietnamese && (
          <section className={styles.section} aria-labelledby="sources-coverage">
            <h2 id="sources-coverage" className={styles.sectionTitle}>
              {copy.coverageTitle}
            </h2>
            <p className={`${styles.notice} ${styles.warning}`}>
              {copy.coverage({
                own: formatNumber(vietnamese.own),
                hencTotal: formatNumber(vietnamese.hencTotal),
                linked: formatNumber(vietnamese.linked),
                readable: formatNumber(vietnamese.own + vietnamese.linked),
                total: formatNumber(vietnamese.total),
                linkedBooks: vietnamese.linkedBooks
                  .map((item) => `${item.name} ${formatNumber(item.count)}`)
                  .join(", "),
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
  const rank = (code) => (code === "vi" ? 0 : code === "en" ? 1 : 2);
  return [...byCode.values()].sort((x, y) => rank(x.code) - rank(y.code) || x.name.localeCompare(y.name));
}

export async function getServerSideProps(context) {
  return loadPage(context, async (lang) => {
    const [books, languages, vietnameseBooks] = await Promise.all([
      getBooks(lang),
      getLanguages().catch(() => []),
      getBooks("vi").catch(() => []),
    ]);

    let vietnamese = null;
    if (vietnameseBooks.length) {
      const henc = vietnameseBooks.find((book) => book.source === "hadeethenc");
      vietnamese = {
        own: vietnameseBooks.reduce((sum, book) => sum + (book.totalTranslated || 0), 0),
        linked: vietnameseBooks.reduce((sum, book) => sum + (book.totalLinkedTranslated || 0), 0),
        total: vietnameseBooks.reduce((sum, book) => sum + (book.totalHadith || 0), 0),
        hencTotal: henc ? henc.totalHadith : 0,
        linkedBooks: vietnameseBooks
          .filter((book) => book.totalLinkedTranslated > 0)
          .map((book) => ({ name: shortBookName(book), count: book.totalLinkedTranslated })),
      };
    }

    const editions = await getEditions().catch(() => null);
    const translators = editions ? translatorsByLanguage(editions) : null;

    return {
      props: {
        books: books.map(({ slug, code, name, source, totalHadith }) => ({ slug, code, name, source, totalHadith })),
        vietnamese,
        translators,
        hencLanguages: languages.filter((language) => language.code !== "ar").length,
        contentTitle: (COPY.vi || {}).title,
        sidebarData: await sidebarCategoriesData(lang),
        backLink: "/",
      },
    };
  });
}
