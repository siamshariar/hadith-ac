import { useState, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import Drawer from "@mui/material/Drawer";
import SettingsModal from "./settings-modal";
import CategoryModal from "./CategoryModal";
import MenuBookIcon from "../icons/MenuBook";
import NearMeIcon from "../icons/NearMeOutlined";
import SubtitlesIcon from "../icons/SubtitlesOutlined";
import DownloadIcon from "../icons/FileDownload";
import SettingsIcon from "../icons/SettingsOutlined";
import FeedbackIcon from "../icons/Feedback";
import ShareIcon from "../icons/ShareOutlined";
import CreateIcon from "../icons/Create";
import AttachMoneyIcon from "../icons/AttachMoney";
import FavoriteBorderIcon from "../icons/FavoriteBorder";
import InfoIcon from "../icons/Info";
import ContactIcon from "../icons/ContactSupport";
import SecurityIcon from "../icons/Security";
import AdminIcon from "../icons/AdminPanelSettings";
import Names99Icon from "../icons/Names99";
import BookmarkIcon from "../icons/BookmarkBorder";
import CategoryIcon from "@mui/icons-material/CategoryOutlined";
import PinIcon from "../icons/PinOutline";
import AutoStoriesIcon from "../icons/AutoStories";
import { SidenavContext } from "../../contexts/SidenavContext";
import { useRouter } from "next/router";

// import PinModal from './pin-modal'
// import PinIcon from '../icons/PinOutline'

// import BookmarkModal from './bookmark-modal'
// import BookmarkBorderIcon from '../icons/BookmarkBorder'

import styles from "./MobileNav.module.scss";

export default function MobileNav({
  navOpen,
  navControl,
  categoryList,
  categoryTree,
  selectedCategoryId,
}) {
  // go to verse modal

  // settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSettingsModal = (open) => (event) => {
    event.preventDefault();
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setSettingsOpen(open);
    setTimeout(() => {
      navControl(false)(event);
    }, 50000000);
  };

  // category modal
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const handleCategoryModal = (open) => (event) => {
    event.preventDefault();
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setCategoriesOpen(open);
    setTimeout(() => {
      navControl(false)(event);
    }, 0);
  };

  // // pin modal
  // const [pinOpen, setPinOpen] = useState(false)

  // const handlePinModal = open => event => {
  // 	event.preventDefault()
  // 	if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
  // 		return
  // 	}
  // 	setPinOpen(open)
  // 	setTimeout(() => {
  // 		navControl(false)(event)
  // 	}, 300)
  // }

  // // bookmark modal
  // const [bookmarkOpen, setBookmarkOpen] = useState(false)

  // const handleBookmarkModal = open => event => {
  // 	event.preventDefault()
  // 	if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
  // 		return
  // 	}
  // 	setBookmarkOpen(open)
  // 	setTimeout(() => {
  // 		navControl(false)(event)
  // 	}, 300)
  // }

  // handle bookmark page
  const { bookmarkOpen, changeBookmarkOpen } = useContext(SidenavContext);
  const router = useRouter();

  const handleBookmarkPage = (e, tab) => {
    e.preventDefault();
    changeBookmarkOpen(tab);
    router.push(`/bookmarks`);
    return;
  };

  return (
    <>
      <Drawer
        anchor="left"
        open={navOpen}
        onClose={navControl(false)}
        classes={{
          root: styles.menu_root,
          paper: styles.paper,
        }}
      >
        <div className={styles.wrapper}>
          <div className={styles.menu_ctn}>
            <div className={styles.menu_top}>
              <Link href="/" className={styles.logo}>

                <Image
                  src="/img/logo_full_white.png"
                  alt=""
                  width={122}
                  height={26}
                  loading="eager"
                />
                <span>
                  Quran.vn
                  <br />
                  v1.0.1
                </span>

              </Link>
            </div>

            <ul className={styles.menu}>
              {/*<li>*/}
              {/*	<Link href="/">*/}
              {/*		<a>*/}
              {/*			<span className={styles.icon}><MenuBookIcon /></span>*/}
              {/*			<span className={styles.text}>Learn Quran</span>*/}
              {/*		</a>*/}
              {/*	</Link>*/}
              {/*</li>*/}

              <li>
                <Link href="/categories" onClick={handleCategoryModal(true)}>

                  <span className={styles.icon}>
                    <CategoryIcon />
                  </span>
                  <span className={styles.text}>Categories</span>

                </Link>
              </li>

              <li>
                <Link href="/bookmarks" onClick={(e) => handleBookmarkPage(e, 1)}>

                  <span className={styles.icon}>
                    <BookmarkIcon />
                  </span>
                  <span className={styles.text}>Bookmarks</span>

                </Link>
              </li>
              <li>
                <Link href="/bookmarks" onClick={(e) => handleBookmarkPage(e, 2)}>

                  <span className={styles.icon}>
                    <PinIcon />
                  </span>
                  <span className={styles.text}>Pin</span>

                </Link>
              </li>
              <li>
                <Link href="/bookmarks" onClick={(e) => handleBookmarkPage(e, 3)}>

                  <span className={styles.icon}>
                    <AutoStoriesIcon />
                  </span>
                  <span className={styles.text}>Last Read</span>

                </Link>
              </li>
              {/* <li>
                <Link href="/download">
                  <a>
                    <span className={styles.icon}>
                      <DownloadIcon />
                    </span>
                    <span className={styles.text}>Download</span>
                  </a>
                </Link>
              </li> */}

              <li>
                <Link href="/settings" onClick={handleSettingsModal(true)}>

                  <span className={styles.icon}>
                    <SettingsIcon />
                  </span>
                  <span className={styles.text}>Settings</span>

                </Link>
              </li>
              {/* <li>
								<Link href="/pin">
									<a onClick={handlePinModal(true)}>
										<span className={styles.icon}><PinIcon /></span>
										<span className={styles.text}>Pinned verses</span>
									</a>
								</Link>
							</li> */}
              {/* <li>
								<Link href="/bookmark">
									<a onClick={handleBookmarkModal(true)}>
										<span className={styles.icon}><BookmarkBorderIcon /></span>
										<span className={styles.text}>Bookmarks</span>
									</a>
								</Link>
							</li> */}
            </ul>

            <hr className={styles.menu_hr} />

            <ul className={styles.menu}>
              {/*<li>*/}
              {/*	<Link href="/">*/}
              {/*		<a>*/}
              {/*			<span className={styles.icon}><FeedbackIcon /></span>*/}
              {/*			<span className={styles.text}>Rating & Review</span>*/}
              {/*		</a>*/}
              {/*	</Link>*/}
              {/*</li>*/}
              {/*<li>*/}
              {/*	<Link href="/">*/}
              {/*		<a>*/}
              {/*			<span className={styles.icon}><ShareIcon /></span>*/}
              {/*			<span className={styles.text}>Share</span>*/}
              {/*		</a>*/}
              {/*	</Link>*/}
              {/*</li>*/}
              {/*<li>*/}
              {/*	<Link href="/">*/}
              {/*		<a>*/}
              {/*			<span className={styles.icon}><CreateIcon /></span>*/}
              {/*			<span className={styles.text}>Writer</span>*/}
              {/*		</a>*/}
              {/*	</Link>*/}
              {/*</li>*/}
              <li>
                <Link href="/support">

                  <span className={styles.icon}>
                    <ContactIcon />
                  </span>
                  <span className={styles.text}>Support</span>

                </Link>
              </li>
              <li>
                <Link href="/grateful">

                  <span className={styles.icon}>
                    <FavoriteBorderIcon />
                  </span>
                  <span className={styles.text}>Grateful</span>

                </Link>
              </li>
            </ul>

            <hr className={styles.menu_hr} />

            <ul className={styles.menu}>
              <li>
                <Link href="/about">

                  <span className={styles.icon}>
                    <InfoIcon />
                  </span>
                  <span className={styles.text}>About</span>

                </Link>
              </li>
              <li>
                <Link href="/contact">

                  <span className={styles.icon}>
                    <ContactIcon />
                  </span>
                  <span className={styles.text}>Contact</span>

                </Link>
              </li>
              <li>
                <Link href="/deeniinfotech">

                  <span className={styles.icon}>
                    <InfoIcon />
                  </span>
                  <span className={styles.text}>Deeni Info Tech</span>

                </Link>
              </li>
              <li>
                <Link href="/privacy-policy">

                  <span className={styles.icon}>
                    <SecurityIcon />
                  </span>
                  <span className={styles.text}>Privacy Policy</span>

                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Drawer>
      <SettingsModal open={settingsOpen} controller={handleSettingsModal} />
      <CategoryModal
        open={categoriesOpen}
        controller={handleCategoryModal}
        categoryList={categoryList}
        categoryTree={categoryTree}
        selectedCategoryId={selectedCategoryId}
      />
      {/* <PinModal
				open={pinOpen}
				controller={handlePinModal}
			/> */}
      {/* <BookmarkModal
				open={bookmarkOpen}
				controller={handleBookmarkModal}
			/> */}
    </>
  );
}
