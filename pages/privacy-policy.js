import { server } from "../lib/config";
import Meta from "../components/core/meta";
import { getAllCategories, getAllCategoriesTree, ensureSerializable } from "../lib/fetch";
import Layout from "../components/layouts/LayoutTertiary";
import PrivacyPolicyContent from "../components/pages/privacy-policy";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Meta
        title="Privacy Policy"
        description="Hadith application in Vietnamese"
        url={`${server}/privacy-policy`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <PrivacyPolicyContent />
    </>
  );
}

PrivacyPolicyPage.getLayout = function getLayout(page) {
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
      contentTitle: "Privacy Policy",
    }),
  };
}
