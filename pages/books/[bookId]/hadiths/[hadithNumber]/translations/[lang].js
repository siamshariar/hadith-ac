import { server, config } from "../../../../../../lib/config";
import {
  getHadithDetails,
  getBooks,
} from "../../../../../../lib/fetch";
import Meta from "../../../../../../components/core/meta";
import Layout from "../../../../../../components/layouts/LayoutSecondary";
import HadithContent from "../../../../../../components/content/Hadith";

export default function HadithTranslation({ hadith }) {
  return (
    <>
      <Meta
        title={`Hadith ${hadith.title} - ${hadith.language}`}
        description={`Hadith ${hadith.title} in ${hadith.language}. Hadith application in Vietnamese.`}
        url={`${server}/books/${hadith.book_id}/hadiths/${hadith.hadith_number}/translations/${hadith.language}`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <HadithContent hadith={hadith} />
    </>
  );
}

HadithTranslation.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export async function getStaticProps(context) {
  const bookId = parseInt(encodeURI(context.params.bookId));
  const hadithNumber = parseInt(encodeURI(context.params.hadithNumber));
  const lang = encodeURI(context.params.lang);
  let details = null;
  try {
    details = await getHadithDetails(bookId, hadithNumber, lang);
  } catch (error) {
    console.error('Failed to fetch hadith translation', error);
  }

  if (!details) {
    return {
      notFound: true,
    };
  }

  // Map to expected format
  const hadith = {
    ...details,
    language: lang,
  };

  return {
    props: {
      hadith,
      backLink: `/books/${bookId}/hadiths/${hadithNumber}`,
      key: `${bookId}-${hadithNumber}-${lang}`,
    },
  };
}

export async function getStaticPaths() {
  // Reduce static paths to speed up build - only generate for first 10 hadiths
  let paths = [];

  const languages = ['en'];
  const { books } = await getBooks();
  for (const book of books.slice(0, 2)) { // Only first 2 books
    for (let i = 1; i <= 5; i++) { // Only first 5 hadiths
      languages.forEach(lang => {
        paths.push({
          params: {
            bookId: String(book.id),
            hadithNumber: String(i),
            lang: lang,
          },
        });
      });
    }
  }

  return {
    paths: paths,
    fallback: 'blocking',
  };
}