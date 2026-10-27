import HeaderWeb from "../web/Header";
import HeaderMobile from "../mobile/HeaderPrimary";
import FooterWeb from "../web/Footer";
import SettingsContextProvider from "../../contexts/SettingsContext";
import PinContextProvider from "../../contexts/PinContext";
import BookmarkContextProvider from "../../contexts/BookmarkContext";
import SidenavContextProvider from "../../contexts/SidenavContext";
import styles from "./Layout.module.scss";

const Layout = ({ children }) => {
  return (
    <SettingsContextProvider>
      <PinContextProvider>
        <BookmarkContextProvider>
          <SidenavContextProvider>
            <div className={styles.wrapper}>
              <div className={styles.header}>
                <HeaderWeb page="home" />
                <HeaderMobile />
              </div>

              <main id="viewport" className="viewport">
                {children}
              </main>

              <div className={styles.footer}>
                <FooterWeb />
                {/* <FooterMobile /> */}
              </div>
            </div>
          </SidenavContextProvider>
        </BookmarkContextProvider>
      </PinContextProvider>
    </SettingsContextProvider>
  );
};

export default Layout;
