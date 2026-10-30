"use client";

import { fonts, themes } from "../../lib/settings";
import { useEffect, useState, useContext } from "react";
import { SettingsContext } from "../../contexts/SettingsContext";
import { compareLanguages, readLanguageCookie } from "../../lib/language";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Skeleton from "react-loading-skeleton";
import ErrorState from "../core/error";
import { useLocale } from "../../contexts/LocaleContext";
import useApi from "../../hooks/useApi";
import { getLanguages } from "../../lib/api";
import Switcher from "../core/switcher";
import UpIcon from "../icons/ChevronUp";
import DownIcon from "../icons/ChevronDown";
import PlusIcon from "../icons/Plus";
import MinusIcon from "../icons/Minus";
import styles from "./index.module.scss";

export default function SettingsContent() {
  return (
    <div className={styles.wrapper}>
      <Language />
      <hr className={styles.divider} />
      {/* <View />
      <hr className={styles.divider} /> */}
      {/* <VerseMode />
      <hr className={styles.divider} /> */}
      <FontSize />
      <hr className={styles.divider} />
      <FontFamily />
      <hr className={styles.divider} />
      <Theme />
      <hr className={styles.divider} />
      {/*<AutoScroll />*/}
      {/*<hr className={styles.divider} />*/}
      {/*<Notification />*/}
      {/*<hr className={styles.divider} />*/}
      <Note />
      <Reset />
    </div>
  );
}

// Content language: populated from /hadith/languages, saved in a cookie so
// server-rendered pages use it as {localizationCode}. Arabic is not offered
// here because the Arabic text is always shown. The translations panel of
// the hadith pages saves the same cookie, so the value is read from it.
const Language = () => {
  const { t, preferredLang, setLanguage, formatNumber } = useLocale();
  const { data, error, loading, retry } = useApi("languages", () => getLanguages());
  const [saved, setSaved] = useState(null);
  useEffect(() => {
    setSaved(readLanguageCookie());
  }, []);

  const languages = (Array.isArray(data) ? data : []).filter((language) => language.code !== "ar").sort(compareLanguages);

  return (
    <div className={`${styles.block} ${styles.language}`}>
      <div className={styles.title}>{t("contentLanguage")}</div>
      <div className={styles.list}>
        {loading && !languages.length ? (
          <Skeleton height={40} />
        ) : error ? (
          <ErrorState error={error} onRetry={retry} compact />
        ) : (
          <select
            className={styles.language_select}
            value={saved || preferredLang}
            onChange={(event) => {
              setSaved(event.target.value);
              setLanguage(event.target.value);
            }}
            aria-label={t("contentLanguage")}
          >
            {languages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.nativeName}
                {language.nativeName !== language.name ? ` (${language.name})` : ""}
                {` - ${t("translatedCount", { count: formatNumber(language.totalTranslated) })}`}
              </option>
            ))}
          </select>
        )}
        <p className={styles.language_note}>{t("contentLanguageNote")}</p>
      </div>
    </div>
  );
};

const FontSize = () => {
  const { t } = useLocale();
  const {
    fontSizeArabic,
    changeFontSizeArabic,
    fontSizeTranslation,
    changeFontSizeTranslation,
  } = useContext(SettingsContext);

  const handleFontSizeArabic = (size) => {
    changeFontSizeArabic(size);
  };

  const handleFontSizeTranslation = (size) => {
    changeFontSizeTranslation(size);
  };

  return (
    <div className={`${styles.block} ${styles.font_size}`}>
      <div className={styles.title}>{t("fontSize")}</div>
      <div className={styles.list}>
        <div className={styles.item}>
          <div className={styles.label}>{t("arabicLabel")}</div>
          <div className={styles.sizer}>
            <IconButton
              className={styles.sizer_btn}
              onClick={() => handleFontSizeArabic(fontSizeArabic - 1)}
              aria-label={t("decreaseArabicSize")}
              title={t("decreaseArabicSize")}
            >
              <MinusIcon />
            </IconButton>

            <span className={styles.sizer_text}>{fontSizeArabic}</span>

            <IconButton
              className={styles.sizer_btn}
              onClick={() => handleFontSizeArabic(fontSizeArabic + 1)}
              aria-label={t("increaseArabicSize")}
              title={t("increaseArabicSize")}
            >
              <PlusIcon />
            </IconButton>
          </div>
        </div>
        <div className={styles.item}>
          <div className={styles.label}>{t("translationLabel")}</div>
          <div className={styles.sizer}>
            <IconButton
              className={styles.sizer_btn}
              onClick={() => handleFontSizeTranslation(fontSizeTranslation - 1)}
              aria-label={t("decreaseTranslationSize")}
              title={t("decreaseTranslationSize")}
            >
              <MinusIcon />
            </IconButton>

            <span className={styles.sizer_text}>{fontSizeTranslation}</span>

            <IconButton
              className={styles.sizer_btn}
              onClick={() => handleFontSizeTranslation(fontSizeTranslation + 1)}
              aria-label={t("increaseTranslationSize")}
              title={t("increaseTranslationSize")}
            >
              <PlusIcon />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
};

const FontFamily = () => {
  const { t } = useLocale();
  const fontsArabic = fonts.arabic;
  const fontsTranslation = fonts.translation;

  const {
    fontFamilyArabic,
    changeFontFamilyArabic,
    fontFamilyTranslation,
    changeFontFamilyTranslation,
  } = useContext(SettingsContext);

  const [expanded, setExpanded] = useState(false);
  const controlAccordion = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleFontFamilyArabic = (event) => {
    changeFontFamilyArabic(event.target.value);
  };

  const handleFontFamilyTranslation = (event) => {
    changeFontFamilyTranslation(event.target.value);
  };

  return (
    <div className={`${styles.block} ${styles.font_family}`}>
      <div className={styles.title}>{t("fontFamily")}</div>
      <div className={styles.list}>
        <div className={styles.item}>
          <Accordion
            className={styles.accordion}
            expanded={expanded === "font_arabic"}
            onChange={controlAccordion("font_arabic")}
          >
            <AccordionSummary className={styles.accordion_summary}>
              <IconButton
                component="span"
                tabIndex={-1}
                aria-hidden="true"
                className={styles.btn}
              >
                <span
                  className={
                    expanded !== "font_arabic" ? styles.none : styles.icon
                  }
                >
                  <UpIcon />
                </span>
                <span
                  className={
                    expanded === "font_arabic" ? styles.none : styles.icon
                  }
                >
                  <DownIcon />
                </span>
              </IconButton>
              <div className={styles.label}>{t("chooseArabicFont")}</div>
            </AccordionSummary>

            <AccordionDetails className={styles.accordion_details}>
              <RadioGroup
                name="fontArabic"
                value={fontFamilyArabic}
                onChange={handleFontFamilyArabic}
              >
                {fontsArabic &&
                  fontsArabic.map((font) => (
                    <FormControlLabel
                      key={font.familyName}
                      className="settings_radio"
                      value={font.familyName}
                      control={<Radio />}
                      label={font.displayName}
                    />
                  ))}
              </RadioGroup>
            </AccordionDetails>
          </Accordion>
        </div>
        <div className={styles.item}>
          <Accordion
            className={styles.accordion}
            expanded={expanded === "font_trans"}
            onChange={controlAccordion("font_trans")}
          >
            <AccordionSummary className={styles.accordion_summary}>
              <IconButton
                component="span"
                tabIndex={-1}
                aria-hidden="true"
                className={styles.btn}
              >
                <span
                  className={
                    expanded !== "font_trans" ? styles.none : styles.icon
                  }
                >
                  <UpIcon />
                </span>
                <span
                  className={
                    expanded === "font_trans" ? styles.none : styles.icon
                  }
                >
                  <DownIcon />
                </span>
              </IconButton>
              <div className={styles.label}>{t("chooseTranslationFont")}</div>
            </AccordionSummary>

            <AccordionDetails className={styles.accordion_details}>
              <RadioGroup
                name="fontTranslation"
                value={fontFamilyTranslation}
                onChange={handleFontFamilyTranslation}
              >
                {fontsTranslation &&
                  fontsTranslation.map((font) => (
                    <FormControlLabel
                      key={font.familyName}
                      className="settings_radio"
                      value={font.familyName}
                      control={<Radio />}
                      label={font.displayName}
                    />
                  ))}
              </RadioGroup>
            </AccordionDetails>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

const Theme = () => {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const controlAccordion = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const { theme, changeTheme } = useContext(SettingsContext);
  const handleThemeChange = (newTheme) => {
    changeTheme(newTheme);
  };

  return (
    <div className={`${styles.block} ${styles.theme}`}>
      <div className={styles.title}>{t("theme")}</div>
      <div className={styles.list}>
        <div className={styles.item}>
          <Accordion
            className={styles.accordion}
            expanded={expanded === "theme"}
            onChange={controlAccordion("theme")}
          >
            <AccordionSummary className={styles.accordion_summary}>
              <IconButton
                component="span"
                tabIndex={-1}
                aria-hidden="true"
                className={styles.btn}
              >
                <span
                  className={expanded !== "theme" ? styles.none : styles.icon}
                >
                  <UpIcon />
                </span>
                <span
                  className={expanded === "theme" ? styles.none : styles.icon}
                >
                  <DownIcon />
                </span>
              </IconButton>
              <div className={styles.label}>{t("chooseTheme")}</div>
            </AccordionSummary>

            <AccordionDetails className={styles.accordion_details}>
              <div className={styles.themes}>
                {themes &&
                  themes.map((item) => {
                    const name = item.name === "dark" ? t("themeDark") : t("themeLight");
                    return (
                      <button
                        type="button"
                        key={item.name}
                        onClick={() => handleThemeChange(item.name)}
                        className={
                          theme === item.name
                            ? `${styles.theme_item} ${styles.active}`
                            : styles.theme_item
                        }
                        style={{
                          background: item.color,
                        }}
                        aria-label={name}
                        aria-pressed={theme === item.name ? "true" : "false"}
                        title={name}
                      >
                        Aa
                      </button>
                    );
                  })}
              </div>
            </AccordionDetails>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

const Note = () => {
  const { t } = useLocale();
  return (
    <div className={`${styles.block} ${styles.note}`}>
      <p className={styles.note_text}>
        <span>{t("settingsNoteLabel")}: </span>
        {t("settingsNote")}
      </p>
    </div>
  );
};

const Reset = () => {
  const { t } = useLocale();
  const { resetSettings } = useContext(SettingsContext);
  return (
    <Button className={styles.btn_reset} onClick={resetSettings} disableRipple>
      {t("resetSettings")}
    </Button>
  );
};
