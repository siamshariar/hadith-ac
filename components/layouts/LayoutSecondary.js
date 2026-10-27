"use client";

import SettingsContextProvider from "../../contexts/SettingsContext";
import PinContextProvider from "../../contexts/PinContext";
import BookmarkContextProvider from "../../contexts/BookmarkContext";
import SidenavContextProvider from "../../contexts/SidenavContext";
import HeaderWeb from "../web/Header";
import HeaderMobile from "../mobile/HeaderSecondary";
import FooterWeb from "../web/Footer";
import Sidebar from "../sidebar";
import styles from "./Layout.module.scss";

// Pages pass what the sidebar should show: the category tree (default) or
// the books with their chapters. The sidebar loads its own data.
const Layout = ({
  children,
  sidebar = "categories",
  selectedCategoryId,
  selectedBookSlug,
  selectedChapterNo,
}) => {
  return (
    <SettingsContextProvider>
      <PinContextProvider>
        <BookmarkContextProvider>
          <SidenavContextProvider>
            <div className={styles.wrapper}>
              <div className={styles.header}>
                <HeaderWeb page={null} />
                <HeaderMobile
                  selectedCategoryId={selectedCategoryId}
                  backLink={children.props.backLink}
                />
              </div>

              <div className={styles.body}>
                <aside className={styles.sidebar}>
                  <Sidebar
                    mode={sidebar}
                    selectedCategoryId={selectedCategoryId}
                    selectedBookSlug={selectedBookSlug}
                    selectedChapterNo={selectedChapterNo}
                  />
                </aside>
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
