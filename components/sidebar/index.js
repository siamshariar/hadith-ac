"use client";

import { useState, useEffect, useRef, useMemo, useContext } from "react";
import Link from "next/link";
import Scrollbar from "../core/scrollbar";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "../icons/Search";
import styles from "./index.module.scss";
import { SettingsContext } from "../../contexts/SettingsContext";

export default function Sidebar({
  categoryList = [],
  categoryTree = [],
  selectedCategoryId,
  books = [],
  selectedBookId,
  linkPattern = "categories",
  chapters = [],
  selectedChapterId,
}) {
  const { theme } = useContext(SettingsContext);
  const isBooksMode = linkPattern === "books";
  
  // Use provided data only (API-only mode)
  const currentCategoryList = useMemo(() => 
    Array.isArray(categoryList) ? categoryList : [], 
    [categoryList]
  );
  
  const currentCategoryTree = useMemo(() => 
    Array.isArray(categoryTree) ? categoryTree : [], 
    [categoryTree]
  );
  
  const currentBooks = useMemo(() => 
    Array.isArray(books) ? books : [], 
    [books]
  );
  
  const currentChapters = useMemo(() => 
    Array.isArray(chapters) ? chapters : [], 
    [chapters]
  );

  const items = isBooksMode ? currentBooks : currentCategoryList;
  const tree = isBooksMode ? currentBooks : currentCategoryTree;
  const selectedId = isBooksMode ? selectedBookId : selectedCategoryId;

  const input = useRef(null);
  const closeButton = useRef(null);
  const [filteredItems, setFilteredItems] = useState([]);
  const [search, setSearch] = useState("");
  const [isSearchEmpty, setIsSearchEmpty] = useState(true);
  const [scrollPos, setScrollPos] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedBooks, setExpandedBooks] = useState(new Set());

  const filterItems = (search) => {
    setSearch(search);
    const listToFilter = isBooksMode ? currentBooks : currentCategoryList;
    const filtered = listToFilter.filter((item) => {
      if (!item) return false;
      
      return (
        (item.title && item.title.toLowerCase().includes(search.toLowerCase())) ||
        (item.name_en && item.name_en.toLowerCase().includes(search.toLowerCase())) ||
        (item.name_ar && item.name_ar.toLowerCase().includes(search.toLowerCase())) ||
        (item.chapter_title && item.chapter_title.toLowerCase().includes(search.toLowerCase())) ||
        (item.hadiths_count && `(${item.hadiths_count})`.includes(search)) ||
        (item.id && item.id.toString().includes(search))
      );
    });
    setFilteredItems(filtered);
  };

  const handleClose = () => {
    setSearch("");
    if (input.current) {
      input.current.value = "";
    }
  };

  useEffect(() => {
    if (search === "") {
      setIsSearchEmpty(true);
      if (closeButton.current) {
        closeButton.current.style.display = "none";
      }
    } else {
      setIsSearchEmpty(false);
      if (closeButton.current) {
        closeButton.current.style.display = "block";
      }
    }
  }, [search]);

  // Auto-expand categories that contain the selected category
  useEffect(() => {
    if (selectedCategoryId && !isBooksMode && currentCategoryTree.length > 0) {
      const findParentCategories = (categories, targetId, parents = new Set()) => {
        for (const category of categories) {
          if (category.id === targetId) {
            return parents;
          }
          if (category.children && category.children.length > 0) {
            const newParents = new Set([...parents, category.id]);
            const found = findParentCategories(category.children, targetId, newParents);
            if (found) return found;
          }
        }
        return null;
      };

      const parentIds = findParentCategories(currentCategoryTree, selectedCategoryId);
      if (parentIds) {
        setExpandedCategories(parentIds);
      }
    }
  }, [selectedCategoryId, currentCategoryTree, isBooksMode]);

  // Auto-expand selected book
  useEffect(() => {
    if (selectedBookId && isBooksMode) {
      setExpandedBooks(new Set([selectedBookId]));
    }
  }, [selectedBookId, isBooksMode]);

  const handleCategoryToggle = (categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleBookToggle = (bookId) => {
    setExpandedBooks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookId)) {
        newSet.delete(bookId);
      } else {
        newSet.add(bookId);
      }
      return newSet;
    });
  };

  const getBookChapters = (bookId) => {
    return currentChapters.filter(chapter => chapter.book_id === bookId);
  };

  const renderCategoryTree = (categories, level = 0) => {
    if (!categories || categories.length === 0) return null;

    return categories.map((category) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.has(category.id);
      const isSelected = category.id === selectedCategoryId;
      
      if (hasChildren) {
        return (
          <div key={category.id} className={`${styles.tree_item} ${isSelected ? styles.selected : ''}`}>
            <Accordion
              expanded={isExpanded}
              onChange={() => handleCategoryToggle(category.id)}
              classes={{
                root: styles.acc_root,
                expanded: styles.acc_expanded,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                classes={{
                  root: styles.summary_root,
                  expanded: styles.summary_expanded,
                  expandIconWrapper: styles.summary_icon,
                  content: styles.summary_content,
                }}
              >
                <Link
                  href={`/categories/${category.id}/hadiths`}
                  className={`${styles.list} ${isSelected ? styles.active : ""} ${styles.parent}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{ paddingLeft: `${5 + (level * 15)}px` }}
                >
                  <span>{category.title || category.name_en || category.name_ar || `Category ${category.id}`}</span>
                  {category.hadiths_count > 0 && (
                    <span className={styles.count}>({category.hadiths_count})</span>
                  )}
                </Link>
              </AccordionSummary>
              <AccordionDetails
                classes={{
                  root: styles.detail_root,
                  expanded: styles.detail_expanded,
                }}
              >
                <div className={styles.sub_item}>
                  {renderCategoryTree(category.children, level + 1)}
                </div>
              </AccordionDetails>
            </Accordion>
          </div>
        );
      } else {
        return (
          <Link
            key={category.id}
            href={`/categories/${category.id}/hadiths`}
            className={`${styles.list} ${isSelected ? styles.active : ""}`}
            style={{ paddingLeft: `${5 + (level * 15)}px` }}
          >
            <span>{category.title || category.name_en || category.name_ar || `Category ${category.id}`}</span>
            {category.hadiths_count > 0 && (
              <span className={styles.count}>({category.hadiths_count})</span>
            )}
          </Link>
        );
      }
    });
  };

  const renderBookAccordion = (book) => {
    const bookChapters = getBookChapters(book.id);
    const isExpanded = expandedBooks.has(book.id);
    const isSelected = book.id === selectedBookId;
    const hasChapters = bookChapters.length > 0;

    if (hasChapters) {
      return (
        <Accordion
          key={book.id}
          expanded={isExpanded}
          onChange={() => handleBookToggle(book.id)}
          classes={{
            root: styles.acc_root,
            expanded: styles.acc_expanded,
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            classes={{
              root: styles.summary_root,
              expanded: styles.summary_expanded,
              expandIconWrapper: styles.summary_icon,
              content: styles.summary_content,
            }}
          >
            <Link 
              href={`/books/${book.id}`} 
              className={`${styles.list} ${isSelected ? styles.active : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <span>{book.title || book.name_en || book.name_ar || `Book ${book.id}`}</span>
              {book.total_hadiths > 0 && (
                <span className={styles.count}>({book.total_hadiths})</span>
              )}
            </Link>
          </AccordionSummary>
          <AccordionDetails
            classes={{
              root: styles.detail_root,
              expanded: styles.detail_expanded,
            }}
          >
            <div className={styles.sub_item}>
              {bookChapters.map((chapter, i) => (
                <Link
                  key={chapter.id}
                  href={`/books/${book.id}/chapters/${chapter.id}`}
                  className={`${styles.list} ${styles.chapter} ${book.id === selectedBookId && chapter.id === selectedChapterId ? styles.active : ""}`}
                  style={{ paddingLeft: '20px' }}
                >
                  <span>{chapter.title || chapter.name_en || chapter.chapter_title || `Chapter ${chapter.id}`}</span>
                  {chapter.total_hadiths > 0 && (
                    <span className={styles.count}>({chapter.total_hadiths})</span>
                  )}
                </Link>
              ))}
            </div>
          </AccordionDetails>
        </Accordion>
      );
    } else {
      return (
        <Link
          key={book.id}
          href={`/books/${book.id}`}
          className={`${styles.list} ${isSelected ? styles.active : ""}`}
        >
          <span>{book.title || book.name_en || book.name_ar || `Book ${book.id}`}</span>
          {book.total_hadiths > 0 && (
            <span className={styles.count}>({book.total_hadiths})</span>
          )}
        </Link>
      );
    }
  };

  const renderContent = () => {
    if (isBooksMode) {
      if (currentBooks.length === 0) {
        return <div className={styles.empty}>No books available</div>;
      }
      return currentBooks.map(book => renderBookAccordion(book));
    } else {
      if (currentCategoryTree.length > 0) {
        return renderCategoryTree(currentCategoryTree);
      } else if (currentCategoryList.length > 0) {
        // Fallback to flat list if tree not available
        return currentCategoryList.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.id}/hadiths`}
            className={`${styles.list} ${category.id === selectedCategoryId ? styles.active : ""}`}
          >
            <span>{category.title || category.name_en || category.name_ar || `Category ${category.id}`}</span>
            {category.hadiths_count > 0 && (
              <span className={styles.count}>({category.hadiths_count})</span>
            )}
          </Link>
        ));
      } else {
        return <div className={styles.empty}>No categories available</div>;
      }
    }
  };

  return (
    <div className={`${styles.wrapper} ${theme}`}>
      <div className={styles.top}>
        <div className={styles.search}>
          <span className={`${styles.icon} ${styles.search_icon}`}>
            <SearchIcon />
          </span>
          <span
            className={`${styles.icon} ${styles.close_icon}`}
            onClick={handleClose}
            ref={closeButton}
            style={{ display: 'none' }}
          >
            <CloseIcon />
          </span>
          <input
            type="text"
            name="search"
            placeholder={isBooksMode ? "Search books and chapters" : "Search categories"}
            className={styles.input}
            autoComplete="off"
            onChange={(e) => filterItems(e.target.value)}
            ref={input}
          />
        </div>
      </div>
      <div className={styles.content}>
        <Scrollbar
          className={styles.category}
          scrollPos={scrollPos}
          id={selectedId}
        >
          <div className={styles.lists}>
            {renderContent()}
          </div>
        </Scrollbar>

        {!isSearchEmpty && (
          <Scrollbar className={styles.category}>
            <div className={styles.lists}>
              {filteredItems && filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  isBooksMode ? (
                    <Link 
                      key={item.id} 
                      href={`/books/${item.id}`} 
                      className={`${styles.list} ${item.id === selectedBookId ? styles.active : ""}`}
                    >
                      <span>{item.title || item.name_en || item.name_ar || `Book ${item.id}`}</span>
                      {item.hadiths_count > 0 && (
                        <span className={styles.count}>({item.hadiths_count})</span>
                      )}
                    </Link>
                  ) : (
                    <Link 
                      key={item.id} 
                      href={`/categories/${item.id}/hadiths`} 
                      className={`${styles.list} ${item.id === selectedCategoryId ? styles.active : ""}`}
                    >
                      <span>{item.title || item.name_en || item.name_ar || `Category ${item.id}`}</span>
                      {item.hadiths_count > 0 && (
                        <span className={styles.count}>({item.hadiths_count})</span>
                      )}
                    </Link>
                  )
                ))
              ) : (
                <div className={styles.empty}>No records found!</div>
              )}
            </div>
          </Scrollbar>
        )}
      </div>
    </div>
  );
}