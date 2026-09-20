// components/core/HadithPagination.js
import Link from 'next/link';
import styles from './pagination.module.scss';

export default function HadithPagination({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage = 20,
  baseUrl,
  onPageChange 
}) {
  if (!totalPages || totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        end = 4;
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handlePageClick = (page) => {
    if (onPageChange && typeof page === 'number') {
      onPageChange(page);
    }
  };

  const pageNumbers = getPageNumbers();
  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={styles.wrapper}>
      <div className={styles.pagination_info}>
        Showing {startItem} to {endItem} of {totalItems} hadiths
      </div>
      
      <div className={styles.pagination_controls}>
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage <= 1}
          className={styles.page_button}
        >
          Previous
        </button>
        
        <div className={styles.page_numbers}>
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className={styles.ellipsis}>...</span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                className={`${styles.page_number} ${currentPage === page ? styles.active : ''}`}
                disabled={currentPage === page}
              >
                {page}
              </button>
            )
          ))}
        </div>
        
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={styles.page_button}
        >
          Next
        </button>
      </div>
      
      <div className={styles.page_jump}>
        <span>Go to page:</span>
        <input
          type="number"
          min="1"
          max={totalPages}
          defaultValue={currentPage}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages) {
                handlePageClick(page);
              }
            }
          }}
          className={styles.page_input}
        />
      </div>
    </div>
  );
}