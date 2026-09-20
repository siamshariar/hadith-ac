import { server } from "../../../lib/config";
import {
  getAllCategoriesTree,
  getCategoryById,
  getAllHadithsByCategory,
  getSubcategories,
  ensureSerializable,
} from "../../../lib/fetch";
import Meta from "../../../components/core/meta";
import Layout from "../../../components/layouts/LayoutSecondary";
import CategoryContent from "../../../components/content/Category";

export default function Categories({ 
  category, 
  hadiths, 
  categoryId, 
  categoryTree, 
  subcategories,
  initialHadiths
}) {
  const title = category ? (category.title || category.name_en || `Category ${categoryId}`) : `Category ${categoryId}`;
  const description = `${title}. Hadith application in Vietnamese.`;
  const url = `${server}/categories/${categoryId}/hadiths`;

  return (
    <>
      <Meta
        title={title}
        description={description}
        url={url}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <CategoryContent 
        hadiths={hadiths || initialHadiths || []}
        category={category} 
        categoryId={categoryId} 
        subcategories={subcategories || []}
        categoryTree={categoryTree || []}
      />
    </>
  );
}

Categories.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export async function getStaticProps(context) {
  const id = encodeURI(context.params.id);
  const categoryId = parseInt(id);

  try {
    // Get category data from API with limited hadiths for initial page
    const [category, categoryTree, subcategories] = await Promise.all([
      getCategoryById(categoryId),
      getAllCategoriesTree(),
      getSubcategories(categoryId),
    ]);

    // Fetch first page of hadiths only
    const hadiths = await getAllHadithsByCategory(categoryId);

    return {
      props: ensureSerializable({
        categoryTree: categoryTree || [],
        categoryId,
        category: category || null,
        hadiths: hadiths || [],
        initialHadiths: hadiths || [],
        subcategories: subcategories || [],
        selectedCategoryId: categoryId,
        backLink: "/",
      }),
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    
    return {
      props: {
        categoryTree: [],
        categoryId,
        category: { 
          id: categoryId, 
          title: `Category ${categoryId}`,
          hadiths_count: 0,
        },
        hadiths: [],
        initialHadiths: [],
        subcategories: [],
        selectedCategoryId: categoryId,
        backLink: "/",
      },
      revalidate: 3600,
    };
  }
}

export async function getStaticPaths() {
  let paths = [];
  
  // Generate paths for first 50 categories
  for (let i = 1; i <= 50; i++) {
    paths.push({ params: { id: i.toString() } });
  }

  return {
    paths: paths,
    fallback: 'blocking',
  };
}