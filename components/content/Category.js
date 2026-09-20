import { useState, useEffect } from 'react';
import HadithCard from "./HadithListCard";
import Pagination from "../core/pagination";
import styles from "./Content.module.scss";
import { getPaginatedHadithsByChapter, getPaginatedHadithsByCategory } from "../../lib/fetch";

export default function CategoryContent({ 
  initialHadiths, 
  category, 
  categoryId, 
  book, 
  bookId, 
  breadcrumbPath, 
  pageTitle,
  initialPagination = null 
}) {
  const [hadiths, setHadiths] = useState(initialHadiths || []);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(initialPagination || {
    current_page: 1,
    per_page: 20,
    total: initialHadiths?.length || 0,
    last_page: 1
  });
  
  // Fetch paginated data
  const fetchPage = async (page) => {
    setLoading(true);
    try {
      // Chapter page (a book's chapter, identified via category.id carrying the chapter id)
      // vs. a real category page (identified via categoryId).
      const result = (bookId && category?.id)
        ? await getPaginatedHadithsByChapter(bookId, category.id, page, pagination.per_page)
        : await getPaginatedHadithsByCategory(categoryId, page, pagination.per_page);

      setHadiths(result.data);
      setPagination({
        current_page: result.pagination.current_page,
        per_page: result.pagination.per_page,
        total: result.pagination.total_items ?? result.pagination.total ?? 0,
        last_page: result.pagination.total_pages ?? result.pagination.last_page ?? 1,
      });
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch page:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle page change
  const handlePageChange = (page) => {
    fetchPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Fetch first page if no initial data
  useEffect(() => {
    if ((!initialHadiths || initialHadiths.length === 0) && categoryId) {
      fetchPage(1);
    }
  }, [categoryId]);
  
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.title}>
          <h1 className={styles.title_text}>
            {pageTitle || category?.title || category?.name_en || `Category ${categoryId}`}
          </h1>
          {category?.hadiths_count && (
            <div className={styles.subtitle}>
              {pagination.total} hadiths
            </div>
          )}
        </div>
        
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading hadiths...</p>
          </div>
        ) : (
          <>
            <div className={styles.verses}>
              {hadiths.length > 0 ? (
                hadiths.map((hadith, index) => (
                  <HadithCard
                    key={hadith.id || index}
                    hadith={hadith}
                    bookId={bookId || hadith.book_id}
                    bookName={book?.name_en || hadith.book?.name_en}
                    chapterName={category?.title || category?.name_en}
                    breadcrumbPath={breadcrumbPath}
                    categoryId={categoryId}
                  />
                ))
              ) : (
                <div className={styles.no_hadiths}>
                  <div className={styles.no_hadiths_icon}>📖</div>
                  <h3>No hadiths found</h3>
                  <p>There are no hadiths available in this section.</p>
                </div>
              )}
            </div>
            
            {pagination.total > pagination.per_page && (
              <Pagination
                totalItems={pagination.total}
                currentPage={currentPage}
                perPage={pagination.per_page}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}