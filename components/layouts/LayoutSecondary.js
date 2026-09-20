"use client";

// import { useContext } from "react";
// import { LayoutContext } from "../../contexts/LayoutContext";
import SettingsContextProvider from "../../contexts/SettingsContext";
import PinContextProvider from "../../contexts/PinContext";
import BookmarkContextProvider from "../../contexts/BookmarkContext";
import SidenavContextProvider from "../../contexts/SidenavContext";
import HeaderWeb from "../web/Header";
import HeaderMobile from "../mobile/HeaderSecondary";
import FooterWeb from "../web/Footer";
import Sidebar from "../sidebar";
import styles from "./Layout.module.scss";


import { useEffect, useState } from "react";
import { getBooks, getChaptersByBook } from "../../lib/fetch";

const Layout = ({ children, linkPattern = "categories", books, selectedBookId, categoryList, categoryTree, chapters, selectedChapterId }) => {
  const [allBooks, setAllBooks] = useState([]);
  const [allChapters, setAllChapters] = useState({});

  useEffect(() => {
    async function fetchBooksAndChapters() {
      const booksData = await getBooks();
      setAllBooks(booksData.books);
      const chaptersData = {};
      for (const book of booksData.books) {
        chaptersData[book.id] = await getChaptersByBook(book.id);
      }
      setAllChapters(chaptersData);
    }
    fetchBooksAndChapters();
  }, []);

  return (
    <SettingsContextProvider>
      <PinContextProvider>
        <BookmarkContextProvider>
          <SidenavContextProvider>
            {/* <ArabicDialog /> */}

            <div className={styles.wrapper}>
              <div className={styles.header}>
                <HeaderWeb page={null} />
                <HeaderMobile
                  categoryList={categoryList || children.props.categoryList}
                  categoryTree={categoryTree || children.props.categoryTree}
                  selectedCategoryId={children.props.selectedCategoryId}
                  backLink={children.props.backLink}
                />
              </div>

              <div className={styles.body}>
                <div className={styles.sidebar}>
                  <Sidebar
                    categoryList={categoryList || children.props.categoryList}
                    categoryTree={categoryTree || children.props.categoryTree}
                    selectedCategoryId={children.props.selectedCategoryId}
                    books={allBooks.length ? allBooks : (books || children.props.books)}
                    allChapters={allChapters}
                    selectedBookId={selectedBookId || children.props.selectedBookId}
                    linkPattern={linkPattern}
                    chapters={chapters || children.props.chapters}
                    selectedChapterId={selectedChapterId || children.props.selectedChapterId}
                  />
                </div>
                <main id="viewport" className={styles.content}>
                  <div className={styles.container}>{children}</div>
                </main>
              </div>

              <div className={styles.footer}>
                <FooterWeb />
              </div>
            </div>
          </SidenavContextProvider>
        </BookmarkContextProvider>
      </PinContextProvider>
    </SettingsContextProvider>
  );
};

export default Layout;
