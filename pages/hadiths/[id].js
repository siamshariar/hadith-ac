import { server, config } from "../../lib/config";
import {
  getAllCategories,
  getAllCategoriesTree,
  getHadithDetailsById,
  getHadithsByCategory,
  ensureSerializable,
} from "../../lib/fetch";
import Meta from "../../components/core/meta";
import Layout from "../../components/layouts/LayoutSecondary";
import HadithContent from "../../components/content/Hadith";

export default function HadithDetail({ hadith }) {
  return (
    <>
      <Meta
        title={`Hadith ${hadith.title}`}
        description={`Hadith ${hadith.title}. Hadith application in Vietnamese.`}
        url={`${server}/hadiths/${hadith.id}`}
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
  const id = parseInt(encodeURI(context.params.id));
  let details = null;
  try {
    details = await getHadithDetailsById(id);
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
      hadith: details || { id, title: `Hadith ${id}`, hadeeth: 'Data not available', attribution: '', grade: '', explanation: '', categories: [] },
      selectedCategoryId: details?.categories?.[0] || null,
      // contentTitle: details.title,
      backLink: "/",
      key: id,
    }),
    // revalidate: 60,
  };
}

export async function getStaticPaths() {
  let paths = [];

  // Generate paths for hadith_number 1 to 50 only
  for (let i = 1; i <= 50; i++) {
    paths.push({
      params: {
        id: String(i),
      },
    });
  }

  return {
    paths: paths,
    fallback: 'blocking',
  };
}
