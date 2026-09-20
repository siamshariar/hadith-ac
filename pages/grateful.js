import { server } from "../lib/config";
import { getAllCategories, getAllCategoriesTree, ensureSerializable } from "../lib/fetch";
import Meta from "../components/core/meta";
import Layout from "../components/layouts/LayoutTertiary";
import GratefulContent from "../components/pages/grateful";

export default function GratefulPage() {
  return (
    <>
      <Meta
        title="Grateful"
        description="Hadith application in Vietnamese"
        url={`${server}/grateful`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <GratefulContent />
    </>
  );
}

GratefulPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export async function getStaticProps(context) {
  const categoryListData = await getAllCategories();
  const categoryList = categoryListData?.categories || [];
  const categoryTree = await getAllCategoriesTree();

  if (!categoryList || !categoryTree) {
    return {
      notFound: true,
    };
  }

  return {
    props: ensureSerializable({
      categoryList,
      categoryTree,
      selectedCategoryId: null,
      contentTitle: "Grateful",
    }),
  };
}
