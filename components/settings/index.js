"use client";

import { fonts, themes } from "../../lib/settings";
import { useState, useContext } from "react";
import { SettingsContext } from "../../contexts/SettingsContext";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Switcher from "../core/switcher";
import UpIcon from "../icons/ChevronUp";
import DownIcon from "../icons/ChevronDown";
import PlusIcon from "../icons/Plus";
import MinusIcon from "../icons/Minus";
import styles from "./index.module.scss";

export default function SettingsContent() {
  return (
    <div className={styles.wrapper}>
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

const FontSize = () => {
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
      <div className={styles.title}>Font Size</div>
      <div className={styles.list}>
        {/* <div className={styles.item}>
          <div className={styles.label}>Arabic</div>
          <div className={styles.sizer}>
            <IconButton
              className={styles.sizer_btn}
              onClick={() => handleFontSizeArabic(fontSizeArabic - 1)}
            >
              <MinusIcon />
            </IconButton>

            <span className={styles.sizer_text}>{fontSizeArabic}</span>

            <IconButton
              className={styles.sizer_btn}
              onClick={() => handleFontSizeArabic(fontSizeArabic + 1)}
            >
              <PlusIcon />
            </IconButton>
          </div>
        </div> */}
        <div className={styles.item}>
          <div className={styles.label}>Change Font Size</div>
          <div className={styles.sizer}>
            <IconButton
              className={styles.sizer_btn}
              onClick={() => handleFontSizeTranslation(fontSizeTranslation - 1)}
              aria-label="Decrease font size"
            >
              <MinusIcon />
            </IconButton>

            <span className={styles.sizer_text}>{fontSizeTranslation}</span>

            <IconButton
              className={styles.sizer_btn}
              onClick={() => handleFontSizeTranslation(fontSizeTranslation + 1)}
              aria-label="Increase font size"
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
      <div className={styles.title}>Font Family</div>
      <div className={styles.list}>
        {/* <div className={styles.item}>
          <Accordion
            className={styles.accordion}
            expanded={expanded === "font_arabic"}
            onChange={controlAccordion("font_arabic")}
          >
            <AccordionSummary className={styles.accordion_summary}>
              <IconButton className={styles.btn}>
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
              <div className={styles.label}>Choose Arabic Font</div>
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
        </div> */}
        <div className={styles.item}>
          <Accordion
            className={styles.accordion}
            expanded={expanded === "font_trans"}
            onChange={controlAccordion("font_trans")}
          >
            <AccordionSummary className={styles.accordion_summary}>
              <IconButton
                className={styles.btn}
                aria-label={expanded === "font_trans" ? "Collapse font choices" : "Expand font choices"}
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
              <div className={styles.label}>Choose Font</div>
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
      <div className={styles.title}>Theme</div>
      <div className={styles.list}>
        <div className={styles.item}>
          <Accordion
            className={styles.accordion}
            expanded={expanded === "theme"}
            onChange={controlAccordion("theme")}
          >
            <AccordionSummary className={styles.accordion_summary}>
              <IconButton
                className={styles.btn}
                aria-label={expanded === "theme" ? "Collapse theme choices" : "Expand theme choices"}
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
              <div className={styles.label}>Choose theme</div>
            </AccordionSummary>

            <AccordionDetails className={styles.accordion_details}>
              <div className={styles.themes}>
                {themes &&
                  themes.map((item) => (
                    <span
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
                    >
                      Aa
                    </span>
                  ))}
              </div>
            </AccordionDetails>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

const Note = () => {
  return (
    <div className={`${styles.block} ${styles.note}`}>
      <p className={styles.note_text}>
        <span>Note: </span>If you remove storage or cache then your settings
        will be reset to default.
      </p>
    </div>
  );
};

const Reset = () => {
  const { resetSettings } = useContext(SettingsContext);
  return (
    <Button className={styles.btn_reset} onClick={resetSettings} disableRipple>
      Reset
    </Button>
  );
};
