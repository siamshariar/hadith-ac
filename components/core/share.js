"use client";

import Modal from "@mui/material/Modal";
import Backdrop from "@mui/material/Backdrop";
import Fade from "@mui/material/Fade";
import CloseIcon from "../icons/Close";

import {
  EmailShareButton,
  EmailIcon,
  FacebookShareButton,
  FacebookIcon,
  FacebookMessengerShareButton,
  FacebookMessengerIcon,
  TwitterShareButton,
  TwitterIcon,
  LinkedinShareButton,
  LinkedinIcon,
  WhatsappShareButton,
  WhatsappIcon,
  LineShareButton,
  LineIcon,
  TelegramShareButton,
  TelegramIcon,
  ViberShareButton,
  ViberIcon,
  RedditShareButton,
  RedditIcon,
  TumblrShareButton,
  TumblrIcon,
} from "react-share";

import styles from "./share.module.scss";

export default function Share({ open, closer, url, title }) {
  return (
    <Modal
      open={open}
      onClose={closer(false)}
      className={styles.root}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 100,
        classes: {
          root: styles.backdrop,
        },
      }}
    >
      <Fade in={open} timeout={100} style={{ transitionDelay: "0ms" }}>
        <div className={styles.modal}>
          <span className={styles.close} onClick={closer(false)}>
            <CloseIcon />
          </span>

          <div className={styles.title}>Share verse</div>

          <div className={styles.lists}>
            <div className={styles.item}>
              <EmailShareButton
                url={url}
                onShareWindowClose={closer(false)}
                subject={title}
              >
                <EmailIcon size={32} round={true} />
              </EmailShareButton>
            </div>

            <div className={styles.item}>
              <FacebookShareButton url={url} onShareWindowClose={closer(false)}>
                <FacebookIcon size={32} round={true} />
              </FacebookShareButton>
            </div>

            <div className={styles.item}>
              <TwitterShareButton
                url={url}
                onShareWindowClose={closer(false)}
                title={title}
              >
                <TwitterIcon size={32} round={true} />
              </TwitterShareButton>
            </div>

            <div className={styles.item}>
              <LinkedinShareButton
                url={url}
                onShareWindowClose={closer(false)}
                title={title}
              >
                <LinkedinIcon size={32} round={true} />
              </LinkedinShareButton>
            </div>

            <div className={styles.item}>
              <WhatsappShareButton
                url={url}
                onShareWindowClose={closer(false)}
                title={title}
              >
                <WhatsappIcon size={32} round={true} />
              </WhatsappShareButton>
            </div>

            <div className={styles.item}>
              <LineShareButton
                url={url}
                onShareWindowClose={closer(false)}
                title={title}
              >
                <LineIcon size={32} round={true} />
              </LineShareButton>
            </div>

            <div className={styles.item}>
              <TelegramShareButton
                url={url}
                onShareWindowClose={closer(false)}
                title={title}
              >
                <TelegramIcon size={32} round={true} />
              </TelegramShareButton>
            </div>

            <div className={styles.item}>
              <ViberShareButton
                url={url}
                onShareWindowClose={closer(false)}
                title={title}
              >
                <ViberIcon size={32} round={true} />
              </ViberShareButton>
            </div>

            <div className={styles.item}>
              <RedditShareButton
                url={url}
                onShareWindowClose={closer(false)}
                title={title}
              >
                <RedditIcon size={32} round={true} />
              </RedditShareButton>
            </div>

            <div className={styles.item}>
              <TumblrShareButton
                url={url}
                onShareWindowClose={closer(false)}
                title={title}
              >
                <TumblrIcon size={32} round={true} />
              </TumblrShareButton>
            </div>
          </div>
        </div>
      </Fade>
    </Modal>
  );
}
