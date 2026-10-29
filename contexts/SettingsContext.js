import { useState, useEffect, createContext } from "react";
import { useRouter } from "next/router";
import { settings as defaultSettings, fontStacks } from "../lib/settings";

// Settings saved before version 2 never let the reader choose the Arabic font
// or size (those controls were hidden), so they get the new defaults.
// Version 3 changes the default translation face from Roboto to Be Vietnam
// Pro (full Vietnamese support); saved Roboto (the old default) follows it.
const migrateSettings = (saved) => {
  if (!saved || typeof saved !== "object") return defaultSettings;
  if (saved.version === defaultSettings.version) return saved;
  if (saved.version === 2) {
    const family = saved.fontFamily || {};
    return {
      ...saved,
      fontFamily: {
        ...defaultSettings.fontFamily,
        ...family,
        translation: !family.translation || family.translation === "Roboto" ? defaultSettings.fontFamily.translation : family.translation,
      },
      version: defaultSettings.version,
    };
  }
  return {
    ...defaultSettings,
    ...saved,
    fontSize: {
      ...defaultSettings.fontSize,
      ...(saved.fontSize || {}),
      arabic: defaultSettings.fontSize.arabic,
    },
    fontFamily: {
      ...defaultSettings.fontFamily,
      ...(saved.fontFamily || {}),
      arabic: defaultSettings.fontFamily.arabic,
    },
    version: defaultSettings.version,
  };
};

// Typography is applied through CSS variables on <html>, so it also reaches
// content rendered after a client-side navigation.
const applyTypography = (settings) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement.style;
  const size = settings.fontSize || defaultSettings.fontSize;
  const family = settings.fontFamily || defaultSettings.fontFamily;
  root.setProperty("--fs-arabic", `${size.arabic || defaultSettings.fontSize.arabic}px`);
  root.setProperty("--fs-trans", `${size.translation || defaultSettings.fontSize.translation}px`);
  root.setProperty("--font-arabic", fontStacks[family.arabic] || fontStacks.Amiri);
  root.setProperty("--font-trans", fontStacks[family.translation] || fontStacks.BeVietnamPro);
};

export const SettingsContext = createContext();

const SettingsContextProvider = ({ children }) => {
  // state declare
  const [settings, setSettings] = useState(defaultSettings);
  const router = useRouter();

  // first render
  useEffect(() => {
    let newSettings = defaultSettings;
    try {
      const savedSettings = localStorage.getItem("settings");
      newSettings =
        savedSettings === null ? defaultSettings : migrateSettings(JSON.parse(savedSettings));
      saveToLocalStorage(newSettings);
    } catch (error) {
      newSettings = defaultSettings;
    }
    initSettings(newSettings);
    setSettings(newSettings);
  }, []);

  // helper functions
  const saveToLocalStorage = (settings) => {
    try {
      localStorage.setItem("settings", JSON.stringify(settings));
    } catch (error) {
      // storage unavailable (private mode): settings last for this visit only
    }
  };

  const initSettings = (settings) => {
    // init theme
    document.body.setAttribute("class", settings.theme);

    applyTypography(settings);
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
    if (value > 60 || value < 16) return;

    const obj = {
      arabic: value,
      translation: settings.fontSize.translation,
    };
    const newSettings = { ...settings, ["fontSize"]: obj };
    applyTypography(newSettings);
    saveToLocalStorage(newSettings);
    setSettings(newSettings);
  };

  const changeFontSizeTranslation = (value) => {
    if (value > 40 || value < 12) return;

    const obj = {
      arabic: settings.fontSize.arabic,
      translation: value,
    };
    const newSettings = { ...settings, ["fontSize"]: obj };
    applyTypography(newSettings);
    saveToLocalStorage(newSettings);
    setSettings(newSettings);
  };

  const changeFontFamilyArabic = (value) => {
    const obj = {
      arabic: value,
      translation: settings.fontFamily.translation,
    };
    const newSettings = { ...settings, ["fontFamily"]: obj };
    applyTypography(newSettings);
    saveToLocalStorage(newSettings);
    setSettings(newSettings);
  };

  const changeFontFamilyTranslation = (value) => {
    const obj = {
      arabic: settings.fontFamily.arabic,
      translation: value,
    };
    const newSettings = { ...settings, ["fontFamily"]: obj };
    applyTypography(newSettings);
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