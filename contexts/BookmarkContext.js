import { useState, useEffect, createContext } from "react";
import { archiveLegacy, archivedCount, readJson, splitLegacy, writeJson } from "../lib/storage";

var defaultBookmarks = {
  favorites: {
    name: "Favorites",
    entry: [],
  },
};

export const BookmarkContext = createContext();

// Bookmark folders keep their names; entries are references (ids and
// numbers). Entries from the previous app version are archived, see lib/storage.
const BookmarkContextProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState(defaultBookmarks);
  const [archived, setArchived] = useState(0);

  useEffect(() => {
    const saved = readJson("bookmarks", null);
    const folders = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : defaultBookmarks;

    const cleaned = {};
    const legacy = {};
    Object.entries(folders).forEach(([key, folder]) => {
      const { current, legacy: old } = splitLegacy(folder && folder.entry);
      cleaned[key] = { name: (folder && folder.name) || key, entry: current };
      if (old.length) legacy[key] = old;
    });
    if (!cleaned.favorites) cleaned.favorites = defaultBookmarks.favorites;

    archiveLegacy("bookmarks", legacy);
    writeJson("bookmarks", cleaned);
    setBookmarks(cleaned);
    setArchived(archivedCount("bookmarks"));
  }, []);

  // Always pass a new object: mutating the current one would not re-render.
  const changeBookmarks = (bookmarks) => {
    const next = { ...bookmarks };
    writeJson("bookmarks", next);
    setBookmarks(next);
  };

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        changeBookmarks,
        archived,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
};

export default BookmarkContextProvider;
