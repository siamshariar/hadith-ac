import { server } from "../lib/config";
import {
  getBooks,
  getRootCategories,
  getAllCategories,
  ensureSerializable
} from "../lib/fetch";
import Meta from "../components/core/meta";
import Layout from "../components/layouts/LayoutPrimary";
import Banner from "../components/home/banner";
import CategoryList from "../components/home/category-list";
import BookList from "../components/home/book-list";
import Stats from "../components/home/Stats";
import { useEffect, useState } from 'react';
import styles from "../components/home/Home.module.scss";

export default function Home({ 
  rootCategories: initialRootCategories, 
  books: initialBooks, 
  allCategories: initialAllCategories 
}) {
  const [books, setBooks] = useState(initialBooks || []);
  const [rootCategories, setRootCategories] = useState(initialRootCategories || []);
  const [allCategories, setAllCategories] = useState(initialAllCategories || []);
  const [loading, setLoading] = useState(false);

  // Fetch API data after initial render
  useEffect(() => {
    let mounted = true;
    
    async function fetchApiData() {
      if (loading) return;
      
      setLoading(true);
      try {
        // Fetch books from API
        const apiBooksData = await getBooks(1, 20); // Get first page with 20 books
        if (mounted && apiBooksData.books && apiBooksData.books.length > 0) {
          setBooks(apiBooksData.books);
        }

        // Fetch root categories from API
        const apiRootCategories = await getRootCategories();
        if (mounted && apiRootCategories && apiRootCategories.length > 0) {
          setRootCategories(apiRootCategories);
        }

        // Fetch all categories from API
        const apiAllCategoriesData = await getAllCategories(1, 50); // Get first page with 50 categories
        if (mounted && apiAllCategoriesData.categories && apiAllCategoriesData.categories.length > 0) {
          setAllCategories(apiAllCategoriesData.categories);
        }
      } catch (err) {
        console.warn('Failed to fetch API data for home:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    
    // Only fetch if we don't have data or want fresh data
    const hasData = books.length > 0 || rootCategories.length > 0 || allCategories.length > 0;
    if (!hasData) {
      const timer = setTimeout(fetchApiData, 100);
      return () => { 
        mounted = false; 
        clearTimeout(timer); 
      };
    }
    
    return () => { mounted = false; };
  }, []);

  return (
    <>
      <Meta
        title="Homepage - Hadith Collection"
        description="Comprehensive collection of authentic Hadiths in multiple languages"
        url={server}
        image={`${server}/img/s_logo.png`}
        type="website"
      />

      <Banner />
      
      <Stats />
      
      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading data...</p>
        </div>
      )}
      
      <div className={styles.twoColumnLayout}>
        <div className={styles.column}>
          <BookList books={books} />
        </div>
        <div className={styles.column}>
          <CategoryList 
            categories={allCategories} 
            title="All Categories" 
            showCount={true}
          />
        </div>
      </div>
    </>
  );
}

Home.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export async function getStaticProps() {
  try {
    // Fetch initial data from API
    const [booksData, rootCategories, allCategoriesData] = await Promise.all([
      getBooks(1, 10).catch(() => ({ books: [] })),
      getRootCategories().catch(() => []),
      getAllCategories(1, 30).catch(() => ({ categories: [] }))
    ]);

    // Ensure all data is serializable
    const serializableBooks = ensureSerializable(booksData?.books || []);
    const serializableRootCategories = ensureSerializable(rootCategories || []);
    const serializableAllCategories = ensureSerializable(allCategoriesData?.categories || []);

    return {
      props: {
        rootCategories: serializableRootCategories,
        books: serializableBooks,
        allCategories: serializableAllCategories,
        contentTitle: "Hadith Collection",
        selectedCategoryId: null,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    
    // Return empty data on error
    return {
      props: {
        rootCategories: [],
        books: [],
        allCategories: [],
        contentTitle: "Hadith Collection",
        selectedCategoryId: null,
      },
      revalidate: 60, // Try again in 1 minute
    };
  }
}