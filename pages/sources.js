import Link from "next/link";
import { server } from "../lib/config";
import { getBookHadith, getBooks, getLanguages, loadPage } from "../lib/api";
import { bookPath, shortBookName } from "../lib/hadith";
import { useLocale } from "../contexts/LocaleContext";
import Meta from "../components/core/meta";
import Breadcrumbs from "../components/core/breadcrumbs";
import Layout from "../components/layouts/LayoutSecondary";
import styles from "../components/content/Page.module.scss";

const FAWAZ_URL = "https://github.com/fawazahmed0/hadith-api";
const HADEETHENC_URL = "https://hadeethenc.com";

// Prose in the two interface languages; figures come from the API.
const COPY = {
  vi: {
    title: "Nguồn & phương pháp",
    intro:
      "Hadith.vn hiển thị văn bản hadith từ hai nguồn, qua API hadith của Quran API. Mỗi hadith ghi rõ số tham chiếu, người dịch và ấn bản của bản dịch đang hiển thị.",
    sourcesTitle: "Nguồn dữ liệu",
    fawaz:
      "Các bộ sưu tập kinh điển: văn bản tiếng Ả Rập, bản dịch và đánh giá độ xác thực theo từng học giả. Theo dự án này, văn bản tiếng Ả Rập và tiếng Anh được lấy từ sunnah.com.",
    hadeethenc:
      "Bách khoa toàn thư hadith được dịch: hadith kèm giải thích, bài học, nghĩa của từ và cây danh mục, do đội ngũ HadeethEnc dịch sang nhiều ngôn ngữ, gồm tiếng Việt. HadeethEnc cho phép sử dụng lại miễn phí với điều kiện ghi nguồn, theo chính sách của IslamHouse.",
    collections: "Bộ sưu tập",
    rulesTitle: "Nguyên tắc",
    rules: [
      "Không dùng máy dịch. Mọi bản dịch đều là bản dịch đã xuất bản, có tên người dịch và ấn bản.",
      "Khi một hadith chưa có bản dịch bằng ngôn ngữ bạn chọn, bản dịch tiếng Anh được hiển thị kèm nhãn rõ ràng; nếu không có cả bản tiếng Anh, chỉ hiển thị nguyên văn tiếng Ả Rập.",
      "Liên kết giữa các bộ sưu tập chỉ được tạo khi lời văn tiếng Ả Rập trùng khớp chính xác. Bản dịch HadeethEnc của phần lời văn trùng khớp được ghi nhãn riêng, không bao giờ trình bày như bản dịch của chính bộ sách.",
      "Đánh giá độ xác thực chỉ hiển thị kèm tên người đánh giá, đúng như nguồn ghi. Nguồn không có đánh giá theo từng hadith cho Sahih al-Bukhari, Sahih Muslim và ba bộ 40 hadith, nên ở đó không có đánh giá nào.",
      "Số hadith là số tham chiếu dùng để trích dẫn; với Sahih Muslim là số Abdul-Baqi (8, 8a, 8.01 ...). “Vị trí trong sách” là thứ tự của hadith trong chương theo nguồn.",
    ],
    coverageTitle: "Mức độ có tiếng Việt",
    coverage: ({ own, hencTotal, linked, readable, total, linkedBooks }) =>
      `${own} trong ${hencTotal} hadith của HadeethEnc có bản dịch tiếng Việt của HadeethEnc. Thêm ${linked} hadith trong các bộ sưu tập khác đọc được qua bản dịch HadeethEnc của phần lời văn trùng khớp${linkedBooks ? ` (${linkedBooks})` : ""}. Các bộ sưu tập kinh điển chưa có bản dịch tiếng Việt riêng: với các hadith đó, nguyên văn tiếng Ả Rập và bản dịch tiếng Anh được hiển thị, có ghi nhãn. Tổng cộng ${readable} trong ${total} hadith đọc được bằng tiếng Việt.`,
    translatorsTitle: "Người dịch theo ngôn ngữ",
    translatorsIntro:
      "Bản dịch các bộ sưu tập kinh điển (Fawaz hadith-api), theo dữ liệu API. Mọi bản dịch của HadeethEnc là của HadeethEnc.com.",
    language: "Ngôn ngữ",
    translator: "Người dịch",
    unknownTranslator: "không ghi tên",
    hencLanguages: (count) => `HadeethEnc.com: bản dịch bằng ${count} ngôn ngữ.`,
    unavailable: "Không tải được danh sách người dịch lúc này.",
  },
  en: {
    title: "Sources & method",
    intro:
      "Hadith.vn shows hadith texts from two sources, through the Quran API's hadith endpoints. Every hadith shows its reference number and who translated the text on screen, from which edition.",
    sourcesTitle: "Sources",
    fawaz:
      "The canonical collections: Arabic text, translations and per-scholar grades. The project states that its Arabic and English texts come from sunnah.com.",
    hadeethenc:
      "The Encyclopedia of Translated Prophetic Hadiths: hadiths with explanation, benefits, word meanings and a category tree, translated by the HadeethEnc team into many languages, Vietnamese included. HadeethEnc allows free reuse with attribution, under the IslamHouse policy.",
    collections: "Collections",
    rulesTitle: "Rules",
    rules: [
      "No machine translation. Every translation is a published one, with its translator and edition.",
      "When a hadith has no translation in the chosen language, the English translation is shown and clearly labelled; without English either, only the Arabic is shown.",
      "Collections are linked only when the Arabic wording matches exactly. HadeethEnc's translation of a matching wording is labelled as such and never presented as the collection's own translation.",
      "Grades are shown only with the grader's name, exactly as the source gives them. The source has no per-hadith grades for Sahih al-Bukhari, Sahih Muslim and the three forty-hadith books, so none are shown there.",
      "Hadith numbers are the reference numbers people cite; for Sahih Muslim the Abdul-Baqi numbers (8, 8a, 8.01 ...). The in-book reference is the hadith's position in its book in the source's order.",
    ],
    coverageTitle: "Vietnamese coverage",
    coverage: ({ own, hencTotal, linked, readable, total, linkedBooks }) =>
      `${own} of HadeethEnc's ${hencTotal} hadiths have HadeethEnc's Vietnamese translation. Another ${linked} hadiths in other collections can be read through HadeethEnc's translation of a matching wording${linkedBooks ? ` (${linkedBooks})` : ""}. The canonical collections have no Vietnamese translation of their own: for those hadiths the Arabic and the labelled English translation are shown. In all, ${readable} of ${total} hadiths can be read in Vietnamese.`,
    translatorsTitle: "Translators by language",
    translatorsIntro:
      "Translations of the canonical collections (Fawaz hadith-api), as the API reports them. All HadeethEnc translations are by HadeethEnc.com.",
    language: "Language",
    translator: "Translator",
    unknownTranslator: "not named",
    hencLanguages: (count) => `HadeethEnc.com: translations in ${count} languages.`,
    unavailable: "The list of translators could not be loaded right now.",
  },
};

export default function Sources({ books, vietnamese, translators, hencLanguages }) {
  const { t, ui, formatNumber } = useLocale();
  const copy = COPY[ui] || COPY.vi;
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
                  </tr>
                </thead>
                <tbody>
                  {translators.map((row) => (
                    <tr key={row.code}>
                      <th scope="row">
                        {row.nativeName}
                        {row.nativeName !== row.name ? <span className={styles.tableNote}> ({row.name})</span> : null}
                      </th>
                      <td>
                        <ul className={styles.translatorList}>
                          {row.books.map((item) => (
                            <li key={item.slug}>
                              <span>{item.name}</span>: {item.author || copy.unknownTranslator}{" "}
                              <span className={styles.tableNote}>({formatNumber(item.count)})</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
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

// Translators per language for the canonical (Fawaz) collections: the
// languages come from the first hadith of each collection (availableLanguages),
// the names from the books list in each language (translationAuthor).
async function loadTranslators(fawazBooks, languages) {
  const firsts = await Promise.all(fawazBooks.map((book) => getBookHadith(book.slug, 1, "en").catch(() => null)));
  const codes = new Set();
  firsts.forEach((hadith) => ((hadith && hadith.availableLanguages) || []).forEach((code) => code !== "ar" && codes.add(code)));

  const byCode = new Map(languages.map((language) => [language.code, language]));
  const rows = await Promise.all(
    [...codes].map(async (code) => {
      const list = await getBooks(code).catch(() => []);
      const translated = list
        .filter((book) => book.source === "fawaz" && book.totalTranslated > 0)
        .map((book) => ({ slug: book.slug, name: shortBookName(book), author: book.translationAuthor || null, count: book.totalTranslated }));
      const info = byCode.get(code) || { code, name: code, nativeName: code };
      return translated.length ? { code, name: info.name, nativeName: info.nativeName, books: translated } : null;
    })
  );
  return rows.filter(Boolean).sort((a, b) => (a.code === "en" ? -1 : b.code === "en" ? 1 : a.name.localeCompare(b.name)));
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

    const translators = await loadTranslators(
      books.filter((book) => book.source === "fawaz"),
      languages
    ).catch(() => null);

    return {
      props: {
        books: books.map(({ slug, code, name, source, totalHadith }) => ({ slug, code, name, source, totalHadith })),
        vietnamese,
        translators,
        hencLanguages: languages.filter((language) => language.code !== "ar").length,
        contentTitle: (COPY.vi || {}).title,
        backLink: "/",
      },
    };
  });
}
