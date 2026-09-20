import { server, config } from "../../../../lib/config";
import {
  getAllCategories,
  getAllCategoriesTree,
  getHadithDetails,
  getHadithsByCategory,
  getBooks,
  ensureSerializable,
} from "../../../../lib/fetch";
import Meta from "../../../../components/core/meta";
import Layout from "../../../../components/layouts/LayoutSecondary";
import HadithContent from "../../../../components/content/Hadith";

export default function HadithDetail({ hadith }) {
  return (
    <>
      <Meta
        title={`Hadith ${hadith.title}`}
        description={`Hadith ${hadith.title}. Hadith application in Vietnamese.`}
        url={`${server}/books/${hadith.book_id}/hadiths/${hadith.hadith_number}`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <HadithContent hadith={hadith} />
    </>
  );
}

HadithDetail.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export async function getStaticProps(context) {
  const bookId = parseInt(encodeURI(context.params.bookId));
  const hadithNumber = parseInt(encodeURI(context.params.hadithNumber));
  let details = null;
  try {
    details = await getHadithDetails(bookId, hadithNumber, config.language);
  } catch (error) {
    console.error('Failed to fetch hadith details', error);
  }
  const categoryListData = await getAllCategories();
  const categoryList = categoryListData?.categories || [];
  const categoryTree = await getAllCategoriesTree();

  return {
    props: ensureSerializable({
      categoryList,
      categoryTree,
      hadith: details || { book_id: bookId, hadith_number: hadithNumber, title: `Hadith ${hadithNumber}`, hadeeth: 'Data not available', attribution: '', grade: '', explanation: '', categories: [] },
      selectedCategoryId: details?.categories?.[0] || null,
      // contentTitle: details.title,
      backLink: "/",
      key: `${bookId}-${hadithNumber}`,
    }),
    // revalidate: 60,
  };
}

export async function getStaticPaths() {
  let paths = [];

  // Generate paths for hadith_number 1 to 10 for first 2 books only
  const { books } = await getBooks();
  for (const book of books.slice(0, 2)) { // Only first 2 books
    for (let i = 1; i <= 10; i++) { // Only first 10 hadiths
      paths.push({
        params: {
          bookId: String(book.id),
          hadithNumber: String(i),
        },
      });
    }
  }

  return {
    paths: paths,
    fallback: 'blocking',
  };
}