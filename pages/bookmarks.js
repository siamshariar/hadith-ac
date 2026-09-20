import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { server } from "../lib/config";
import { getAllCategories, getAllCategoriesTree, ensureSerializable } from "../lib/fetch";
import Meta from "../components/core/meta";
import Layout from "../components/layouts/LayoutSecondary";
import BookmarkContent from "../components/bookmark/page";
import BookmarkMobile from "../components/mobile/Storage";

export default function Bookmark() {
  const router = useRouter();
  const { key } = router.query;
  const [bookmarkName, setBookmarkName] = useState(null);
  const [isExists, setExists] = useState(true);
  const [bookmarksData, setBookmarksData] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      const x = window.matchMedia("(min-width: 1024px)");
      return !x.matches;
    };

    const loadBookmarks = () => {
      try {
        const savedBookmarks = localStorage.getItem("bookmarks");
        if (!savedBookmarks) {
          router.push("/404");
          return;
        }

        const bookmarks = JSON.parse(savedBookmarks);
        const queryKey = "key";
        const keyMatcher = router.asPath.match(
          new RegExp(`[&?]${queryKey}=(.*?)(&|$)`)
        );

        const mobileView = checkMobile();

        if (mobileView && !keyMatcher && !key) {
          setIsMobile(true);
          setIsLoading(false);
          return;
        } else {
          setIsMobile(false);
        }

        if (!keyMatcher && !key) {
          router.push("/404");
          return;
        }

        const currentKey = key || (keyMatcher ? keyMatcher[1] : null);
        
        if (!currentKey) {
          setIsLoading(false);
          return;
        }

        if (!bookmarks[currentKey]) {
          router.push("/404");
          return;
        }

        setBookmarkName(bookmarks[currentKey].name);

        if (bookmarks.hasOwnProperty(currentKey)) {
          if (bookmarks[currentKey]["entry"] && bookmarks[currentKey]["entry"].length > 0) {
            setBookmarksData(bookmarks[currentKey]["entry"]);
          } else {
            setExists(false);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading bookmarks:", error);
        setIsLoading(false);
      }
    };

    // Wait for router to be ready
    if (router.isReady) {
      loadBookmarks();
    }
  }, [router, key]);

  const updateBookmarksData = (id) => {
    const updatedBookmarksData = bookmarksData.filter((item) => item.id !== id);
    setBookmarksData(updatedBookmarksData);
  };

  if (isLoading) {
    return (
      <div className="loading">
        <Meta
          title="Loading..."
          description="Loading bookmarks..."
          url={`${server}/bookmarks`}
          image={`${server}/img/s_logo.png`}
          type="website"
        />
        <div>Loading...</div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        <Meta
          title="Bookmarks"
          description="Bookmarks. Hadith application in Vietnamese."
          url={`${server}/bookmarks`}
          image={`${server}/img/s_logo.png`}
          type="website"
        />
        <BookmarkMobile />
      </>
    );
  }

  return (
    <>
      <Meta
        title={`Bookmark ${bookmarkName || 'Favorites'}`}
        description={`Bookmark ${bookmarkName || 'Favorites'}. Hadith application in Vietnamese.`}
        url={`${server}/bookmarks?key=${key || 'favorites'}`}
        image={`${server}/img/s_logo.png`}
        type="website"
      />
      <BookmarkContent
        name={bookmarkName}
        data={bookmarksData}
        exist={isExists}
        isBookmarkPage={true}
        queryKey={key}
        updateBookmarksData={updateBookmarksData}
      />
    </>
  );
}

Bookmark.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export async function getStaticProps() {
  try {
    const categoryListData = await getAllCategories();
    const categoryList = categoryListData?.categories || [];
    const categoryTree = await getAllCategoriesTree();

    return {
      props: ensureSerializable({
        categoryList: categoryList || [],
        categoryTree: categoryTree || [],
        selectedCategoryId: null,
      }),
    };
  } catch (error) {
    console.error("Error in getStaticProps:", error);
    return {
      props: {
        categoryList: [],
        categoryTree: [],
        selectedCategoryId: null,
      },
    };
  }
}