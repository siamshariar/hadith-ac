import { useState, useEffect, createContext } from "react";
import { archiveLegacy, archivedCount, readJson, splitLegacy, writeJson } from "../lib/storage";

const MAX_LAST_READ = 10;

export const PinContext = createContext();

// Where the reader was when pinning (e.g. a chapter page, with an anchor to
// the hadith card), so the pin can take them back to that context.
const currentContextUrl = (id) => {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search}#hadith-${id}`;
};

// Pins and last-read entries are small references (lib/hadith storedHadithRef):
// ids and numbers only, never hadith text.
const PinContextProvider = ({ children }) => {
  const [pin, setPin] = useState([]);
  const [lastRead, setLastRead] = useState([]);
  const [archived, setArchived] = useState({ pin: 0, lastRead: 0 });

  // first render
  useEffect(() => {
    const pins = splitLegacy(readJson("pin", []));
    archiveLegacy("pin", pins.legacy);
    writeJson("pin", pins.current);
    setPin(pins.current);

    const history = splitLegacy(readJson("lastRead", []));
    archiveLegacy("lastRead", history.legacy);
    writeJson("lastRead", history.current);
    setLastRead(history.current);

    setArchived({ pin: archivedCount("pin"), lastRead: archivedCount("lastRead") });
  }, []);

  const addPin = (ref) => {
    if (!ref || pin.some((el) => el.id == ref.id)) return;
    const newPin = [
      { ...ref, source_url: currentContextUrl(ref.id), date: new Date().toISOString() },
      ...pin,
    ];
    writeJson("pin", newPin);
    setPin(newPin);
  };

  const removePin = (hadith) => {
    const newPin = pin.filter((el) => !(el.id == hadith.id));
    writeJson("pin", newPin);
    setPin(newPin);
  };

  // Uses the functional update: several cards can report "read" in one tick.
  const addLastRead = (ref) => {
    if (!ref) return;
    setLastRead((previous) => {
      const next = [
        { ...ref, date: Date.now() },
        ...previous.filter((el) => el.id != ref.id),
      ].slice(0, MAX_LAST_READ);
      writeJson("lastRead", next);
      return next;
    });
  };

  return (
    <PinContext.Provider
      value={{
        pin,
        addPin,
        removePin,
        lastRead,
        addLastRead,
        archived,
      }}
    >
      {children}
    </PinContext.Provider>
  );
};

export default PinContextProvider;
