import { useState, useEffect } from 'react';
import styles from './pagination.module.scss';

const Pagination = ({ 
  totalItems, 
  currentPage, 
  perPage, 
  onPageChange,
  maxVisiblePages = 5 
}) => {
  const totalPages = Math.ceil(totalItems / perPage);
  
  if (totalPages <= 1) {
    return null;
  }
  
  // Calculate range of pages to show
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return (
    <div className={styles.pagination}>
      <button
        className={`${styles.pageButton} ${currentPage === 1 ? styles.disabled : ''}`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      
      {startPage > 1 && (
        <>
          <button
            className={styles.pageButton}
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {startPage > 2 && <span className={styles.ellipsis}>...</span>}
        </>
      )}
      
      {pages.map(page => (
        <button
          key={page}
          className={`${styles.pageButton} ${currentPage === page ? styles.active : ''}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className={styles.ellipsis}>...</span>}
          <button
            className={styles.pageButton}
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}
      
      <button
        className={`${styles.pageButton} ${currentPage === totalPages ? styles.disabled : ''}`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
      
      <div className={styles.pageInfo}>
        Showing {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalItems)} of {totalItems}
      </div>
    </div>
  );
};

export default Pagination;