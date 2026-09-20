import { server } from "../lib/config";
import { getAllCategories, getAllCategoriesTree, ensureSerializable } from "../lib/fetch";
import Meta from "../components/core/meta";
import Layout from "../components/layouts/LayoutTertiary";
import DeeniinfotechContent from "../components/pages/deeniinfotech";

export default function DeeniInfoTech() {
  return (
    <>
      <Meta
        title="Deeni Info Tech"
        description={`Deeni Info Tech : A non-profitable software development organization to spread Dawah all over the world`}
        url={`${server}/deeniinfotech`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <DeeniinfotechContent />
    </>
  );
}

DeeniInfoTech.getLayout = function getLayout(page) {
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
      contentTitle: "Deeni Info Tech",
    }),
  };
}
