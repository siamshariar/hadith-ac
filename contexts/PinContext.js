import { useState, useEffect, createContext } from "react";
var defaultPin = [];
var defaultLastRead = [];

export const PinContext = createContext();

const PinContextProvider = ({ children }) => {
  // state declare
  const [pin, setPin] = useState(defaultPin);
  const [lastRead, setLastRead] = useState(defaultLastRead);

  // first render
  useEffect(() => {
    const savedPin = localStorage.getItem("pin");
    const newPin = savedPin === null ? defaultPin : JSON.parse(savedPin);
    setPin(newPin);
    saveToLocalStorage(newPin);

    // last read
    const savedLastRead = localStorage.getItem("lastRead");
    const newLastRead =
      savedLastRead === null ? defaultLastRead : JSON.parse(savedLastRead);
    setLastRead(newLastRead);
    saveLastReadToLocalStorage(newLastRead);
  }, []);

  // helper functions
  const saveToLocalStorage = (pin) => {
    localStorage.setItem("pin", JSON.stringify(pin));
  };

  const saveLastReadToLocalStorage = (lastRead) => {
    localStorage.setItem("lastRead", JSON.stringify(lastRead));
  };

  const checkPinnedAnyVerseOfThisChapter = (arr, id) => {
    return arr.some((el) => el.id == id);
  };

  // change pin functions
  const addPin = (hadith) => {
    if (!checkPinnedAnyVerseOfThisChapter(pin, hadith.id)) {
      let newPin = pin.slice(); // assign pin to newPin
      
      // Create comprehensive pin data with source context
      const pinData = {
        id: hadith.id,
        title: hadith.title || hadith.hadeeth || hadith.arabic_text || 'Hadith',
        hadeeth: hadith.hadeeth,
        arabic_text: hadith.arabic_text,
        hadith_number: hadith.hadith_number,
        grade: hadith.grade,
        // Store source context for navigation
        book_id: hadith.book_id,
        book_name: hadith.book_name,
        chapter_id: hadith.chapter_id,
        chapter_name: hadith.chapter_name,
        category_id: hadith.category_id,
        category_name: hadith.category_name,
        // Store the original source URL for navigation back to context
        source_url: hadith.source_url || getCurrentContextUrl(hadith),
        date: new Date().toISOString()
      };

      newPin.unshift(pinData);
      saveToLocalStorage(newPin);
      setPin(newPin);
    }
  };

  // Helper function to get current context URL
  const getCurrentContextUrl = (hadith) => {
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.pathname + window.location.search;
      const hadithAnchor = `#hadith-${hadith.hadith_number || hadith.id}`;
      const fullUrl = baseUrl + hadithAnchor;
      return fullUrl;
    }
    return '';
  };

  const removePin = (hadith) => {
    let newPin = [];
    pin.forEach((el) => {
      if (!(el.id == hadith.id)) {
        newPin.push(el);
      }
    });
    saveToLocalStorage(newPin);
    setPin(newPin);
  };

  // last read functions
  const checkIfLastReadAnyVerseOfThisChapter = (arr, id) => {
    return arr.some((el) => el.id == id);
  };

  const addLastRead = (hadith) => {
    let maxLength = 10; // should be 100 later
    
    // Create comprehensive last read data
    const lastReadData = {
      id: hadith.id,
      title: hadith.title || hadith.hadeeth || hadith.arabic_text || 'Hadith',
      hadeeth: hadith.hadeeth,
      arabic_text: hadith.arabic_text,
      hadith_number: hadith.hadith_number,
      grade: hadith.grade,
      // Store source context for navigation
      book_id: hadith.book_id,
      book_name: hadith.book_name,
      chapter_id: hadith.chapter_id,
      chapter_name: hadith.chapter_name,
      category_id: hadith.category_id,
      category_name: hadith.category_name,
      // Store source URL
      source_url: hadith.source_url || getCurrentContextUrl(hadith),
      date: Date.now()
    };

    if (checkIfLastReadAnyVerseOfThisChapter(lastRead, hadith.id)) {
      let newLastRead = [
        lastReadData
      ];

      for (let index = 0; index < lastRead.length; index++) {
        if (newLastRead.length == maxLength) {
          break;
        }
        if (lastRead[index].id != hadith.id) newLastRead.push(lastRead[index]);
      }

      saveLastReadToLocalStorage(newLastRead);
      setLastRead(newLastRead);
    } else {
      let newLastRead = lastRead.slice(); // assign lastRead to newLastRead
      newLastRead.unshift(lastReadData);
      if (newLastRead.length > maxLength) {
        newLastRead.pop();
      }
      saveLastReadToLocalStorage(newLastRead);
      setLastRead(newLastRead);
    }
  };

  return (
    <PinContext.Provider
      value={{
        pin,
        addPin,
        removePin,
        lastRead,
        addLastRead,
      }}
    >
      {children}
    </PinContext.Provider>
  );
};

export default PinContextProvider;