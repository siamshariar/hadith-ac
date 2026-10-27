export const settings = {
  view: {
    arabic: true,
    translation: true,
    tafseer: true,
  },
  fontSize: {
    arabic: 28,
    translation: 18,
  },
  fontFamily: {
    arabic: "Amiri",
    translation: "Roboto",
  },
  theme: "light",
  verseMode: "scroll",
  activeVerse: 1,
  autoScroll: true,
  notification: false,
  version: 2,
};

// Font stacks used for the CSS variables set by SettingsContext.
export const fontStacks = {
  Amiri: '"Amiri", "Noto Naskh Arabic", "Traditional Arabic", serif',
  PDMSIslam: '"PDMSIslam", "Amiri", serif',
  AlQalam: '"AlQalam", "Amiri", serif',
  Othmani: '"Othmani", "Amiri", serif',
  PalatinoLinotype: '"PalatinoLinotype", "Palatino Linotype", Georgia, serif',
  TimesNewRoman: '"TimesNewRoman", "Times New Roman", serif',
  Roboto: '"Roboto", -apple-system, "Segoe UI", sans-serif',
};

export const fonts = {
  arabic: [
    {
      displayName: "Amiri (Naskh)",
      familyName: "Amiri",
    },
    {
      displayName: "PDMS Islamic Font",
      familyName: "PDMSIslam",
    },
    {
      displayName: "Al Qalam Quran 2",
      familyName: "AlQalam",
    },
    {
      displayName: "Othmani",
      familyName: "Othmani",
    },
  ],
  translation: [
    {
      displayName: "Palatino Linotype",
      familyName: "PalatinoLinotype",
    },
    {
      displayName: "Times New Roman",
      familyName: "TimesNewRoman",
    },
    {
      displayName: "Roboto",
      familyName: "Roboto",
    },
  ],
};

export const themes = [
  {
    name: "light",
    color: "#F4F4F4",
  },
  {
    name: "dark",
    color: "#293145",
  },
  // {
  //     name: 'blue',
  //     color: '#2196F3'
  // },
  // {
  //     name: 'orange',
  //     color: '#FF9800'
  // },
  // {
  //     name: 'red',
  //     color: '#F44336'
  // },
];
