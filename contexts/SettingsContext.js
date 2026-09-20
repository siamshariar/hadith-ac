import { useState, useEffect, createContext } from "react";
import { useRouter } from "next/router";
import { settings as defaultSettings } from "../lib/settings";

export const SettingsContext = createContext();

const SettingsContextProvider = ({ children }) => {
  // state declare
  const [settings, setSettings] = useState(defaultSettings);
  const router = useRouter();

  // first render
  useEffect(() => {
    const savedSettings = localStorage.getItem("settings");
    const newSettings =
      savedSettings === null ? defaultSettings : JSON.parse(savedSettings);
    initSettings(newSettings);
    setSettings(newSettings);
  }, []);

  // helper functions
  const saveToLocalStorage = (settings) => {
    localStorage.setItem("settings", JSON.stringify(settings));
  };

  const initSettings = (settings) => {
    // init theme
    document.body.setAttribute("class", settings.theme);

    // init font css
    // const elemsArabic = document.querySelectorAll(".text_arabic");
    // const elemsTrans = document.querySelectorAll(".text_trans");

    // for (const elem of elemsArabic) {
    //   elem.style.fontSize = settings.fontSize.arabic + "px";
    //   elem.style.fontFamily = settings.fontFamily.arabic;
    // }
    // for (const elem of elemsTrans) {
    //   elem.style.fontSize = settings.fontSize.translation + "px";
    //   elem.style.fontFamily = settings.fontFamily.translation;
    // }

    const customFont = document.querySelectorAll(".custom_font");
    for (const elem of customFont) {
    if (settings.fontSize && settings.fontSize.translation) {
      elem.style.fontSize = settings.fontSize.translation + "px";
      }
    if (settings.fontFamily && settings.fontFamily.translation) {
      elem.style.fontFamily = settings.fontFamily.translation;
    }
    }
  };

  const redirectAfterChangeVerseMode = (mode) => {
    if (typeof window !== "undefined") {
      let path = window.location.pathname;
      let parts = path.split("/");
      let activeVerse = settings.activeVerse;
      if (parts.length > 3 && parts[1] == "chapters" && mode == "scroll") {
        router.push(
          activeVerse == 1
            ? `/chapters/${parts[2]}`
            : `/chapters/${parts[2]}#verse-${activeVerse}`
        );
      } else if (
        parts.length == 3 &&
        parts[1] == "chapters" &&
        mode == "slide"
      ) {
        router.push(`/chapters/${parts[2]}/verses/${activeVerse}`);
      }
    }
  };

  // change settings functions
  const changeView = (view) => {
    const newSettings = { ...settings, ["view"]: view };
    saveToLocalStorage(newSettings);
    setSettings(newSettings);
  };

  const changeFontSizeArabic = (value) => {
    if (value > 100 || value < 10) return;

    const elems = document.querySelectorAll(".text_arabic");
    for (const elem of elems) {
      elem.style.fontSize = value + "px";
    }

    const obj = {
      arabic: value,
      translation: settings.fontSize.translation,
    };
    const newSettings = { ...settings, ["fontSize"]: obj };
    saveToLocalStorage(newSettings);
    setSettings(newSettings);
  };

  const changeFontSizeTranslation = (value) => {
    if (value > 60 || value < 6) return;

    const elems = document.querySelectorAll(".custom_font");
    for (const elem of elems) {
      elem.style.fontSize = value + "px";
    }

    const obj = {
      arabic: settings.fontSize.arabic,
      translation: value,
    };
    const newSettings = { ...settings, ["fontSize"]: obj };
    saveToLocalStorage(newSettings);
    setSettings(newSettings);
  };

  const changeFontFamilyArabic = (value) => {
    const elems = document.querySelectorAll(".text_arabic");
    for (const elem of elems) {
      elem.style.fontFamily = value;
    }

    const obj = {
      arabic: value,
      translation: settings.fontFamily.translation,
    };
    const newSettings = { ...settings, ["fontFamily"]: obj };
    saveToLocalStorage(newSettings);
    setSettings(newSettings);
  };

  const changeFontFamilyTranslation = (value) => {
    const elems = document.querySelectorAll(".custom_font");
    for (const elem of elems) {
      elem.style.fontFamily = value;
    }

    const obj = {
      arabic: settings.fontFamily.arabic,
      translation: value,
    };
    const newSettings = { ...settings, ["fontFamily"]: obj };
    saveToLocalStorage(newSettings);
    setSettings(newSettings);
  };

  const changeTheme = (theme) => {
    document.body.setAttribute("class", theme);
    const newSettings = { ...settings, ["theme"]: theme };
    saveToLocalStorage(newSettings);
    setSettings(newSettings);
  };

  const changeVerseMode = (mode) => {
    const newSettings = { ...settings, ["verseMode"]: mode };
    saveToLocalStorage(newSettings);
    setSettings(newSettings);
    redirectAfterChangeVerseMode(mode);
  };

  const changeActiveVerse = (verseNo) => {
    const newSettings = { ...settings, ["activeVerse"]: verseNo };
    saveToLocalStorage(newSettings);
    setSettings(newSettings);
  };

  const changeAutoScroll = (status) => {
    const newSettings = { ...settings, ["autoScroll"]: status };
    saveToLocalStorage(newSettings);
    setSettings(newSettings);
  };

  const changeNotification = (status) => {
    const newSettings = { ...settings, ["notification"]: status };
    saveToLocalStorage(newSettings);
    setSettings(newSettings);
  };

  const resetSettings = () => {
    initSettings(defaultSettings);
    saveToLocalStorage(defaultSettings);
    setSettings(defaultSettings);
    // redirectAfterChangeVerseMode(defaultSettings.verseMode);
  };

  return (
    <SettingsContext.Provider
      value={{
        view: settings.view,
        changeView,
        theme: settings.theme,
        changeTheme,
        fontSizeArabic: settings.fontSize?.arabic ?? defaultSettings.fontSize.arabic,
        changeFontSizeArabic,
        fontSizeTranslation: settings.fontSize?.translation ?? defaultSettings.fontSize.translation,
        changeFontSizeTranslation,
        fontFamilyArabic: settings.fontFamily?.arabic ?? defaultSettings.fontFamily.arabic,
        changeFontFamilyArabic,
        fontFamilyTranslation: settings.fontFamily?.translation ?? defaultSettings.fontFamily.translation,
        verseMode: settings.verseMode,
        changeVerseMode,
        activeVerse: settings.activeVerse,
        changeActiveVerse,
        autoScroll: settings.autoScroll,
        changeAutoScroll,
        notification: settings.notification,
        changeNotification,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContextProvider;