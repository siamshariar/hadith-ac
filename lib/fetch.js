import { config } from "./config";

// API Configuration - Updated to match your production API
const apiBaseUrl = config.apiBaseUrl || "http://127.0.0.1:8000/api";
const language = config.language || "en";
const useApiOnly = config.useApiOnly || true;
const API_TIMEOUT = config.apiFetchTimeout || 30000;
const MAX_RETRIES = config.apiRetryAttempts || 3;

// ==================== LANGUAGE METADATA ====================
// Complete language metadata for all 26 supported languages
export const LANGUAGE_METADATA = {
  ar: { code: "ar", name: "Arabic", native: "العربية", direction: "rtl" },
  en: { code: "en", name: "English", native: "English", direction: "ltr" },
  bn: { code: "bn", name: "Bengali", native: "বাংলা", direction: "ltr" },
  ur: { code: "ur", name: "Urdu", native: "اردو", direction: "rtl" },
  id: { code: "id", name: "Indonesian", native: "Bahasa Indonesia", direction: "ltr" },
  fr: { code: "fr", name: "French", native: "Français", direction: "ltr" },
  tr: { code: "tr", name: "Turkish", native: "Türkçe", direction: "ltr" },
  ru: { code: "ru", name: "Russian", native: "Русский", direction: "ltr" },
  ta: { code: "ta", name: "Tamil", native: "தமிழ்", direction: "ltr" },
  es: { code: "es", name: "Spanish", native: "Español", direction: "ltr" },
  pt: { code: "pt", name: "Portuguese", native: "Português", direction: "ltr" },
  fa: { code: "fa", name: "Persian", native: "فارسی", direction: "rtl" },
  hi: { code: "hi", name: "Hindi", native: "हिन्दी", direction: "ltr" },
  de: { code: "de", name: "German", native: "Deutsch", direction: "ltr" },
  it: { code: "it", name: "Italian", native: "Italiano", direction: "ltr" },
  ms: { code: "ms", name: "Malay", native: "Bahasa Melayu", direction: "ltr" },
  bs: { code: "bs", name: "Bosnian", native: "Bosanski", direction: "ltr" },
  zh: { code: "zh", name: "Chinese", native: "中文", direction: "ltr" },
  ja: { code: "ja", name: "Japanese", native: "日本語", direction: "ltr" },
  vi: { code: "vi", name: "Vietnamese", native: "Tiếng Việt", direction: "ltr" },
  tl: { code: "tl", name: "Tagalog", native: "Tagalog", direction: "ltr" },
  si: { code: "si", name: "Sinhalese", native: "සිංහල", direction: "ltr" },
  ug: { code: "ug", name: "Uyghur", native: "ئۇيغۇرچە", direction: "rtl" },
  ha: { code: "ha", name: "Hausa", native: "Hausa", direction: "ltr" },
  ku: { code: "ku", name: "Kurdish", native: "کوردی", direction: "rtl" },
  sw: { code: "sw", name: "Swahili", native: "Kiswahili", direction: "ltr" },
};

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_METADATA);

// Helper function to fetch with retry logic
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      throw error;
    }
    
    return await response.json();
  } catch (error) {
    // A refused connection or unresolved host means the API isn't reachable at
    // all (misconfigured/offline backend), not a transient blip — retrying
    // wastes ~1s per attempt across every call on every page. Fail fast so
    // callers hit their local-data fallback immediately instead.
    const isUnreachable = error.cause?.code === 'ECONNREFUSED' || error.cause?.code === 'ENOTFOUND';

    if (retries > 0 && error.name !== 'AbortError' && !isUnreachable) {
      console.warn(`Retrying ${url} (${retries} attempts left)...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

// Helper to ensure serializable data
export function ensureSerializable(data) {
  if (data === undefined || data === null) return null;
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') return data;
  if (Array.isArray(data)) return data.map(ensureSerializable);
  if (typeof data === 'object') {
    const result = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = ensureSerializable(data[key]);
      }
    }
    return result;
  }
  return null;
}

// Normalize API response
function normalizeApiResponse(response) {
  if (!response) return null;
  
  // Handle HadeethEnc response format
  if (response.success !== undefined && response.data !== undefined) {
    return response.data;
  }
  
  // Handle direct data
  return response;
}

// ==================== CORE API FUNCTIONS ====================

export async function getBooks(page = 1, limit = 20) {
  try {
    const url = `${apiBaseUrl}/books`;
    const data = await fetchWithRetry(url);

    if (data && data.success && Array.isArray(data.data)) {
      const start = (page - 1) * limit;
      const paged = data.data.slice(start, start + limit);
      return {
        books: paged.map(book => ({
          id: book.id,
          code: book.code || book.slug,
          name_en: book.name_en || book.name || book.title,
          name_ar: book.name_ar,
          total_hadith: book.total_hadith || book.total_hadiths || 0,
          title: book.name_en || book.title,
          description: book.description || null,
          created_at: book.created_at,
          updated_at: book.updated_at,
        })),
        pagination: { current_page: page, per_page: limit, total: data.total || data.data.length }
      };
    }

    return { books: [] };
  } catch (error) {
    console.warn('Failed to fetch books from API, falling back to local data:', error);
    // Fallback to local data
    try {
      const localBooks = await import('../data/books.json');
      return {
        books: Array.isArray(localBooks.default) ? localBooks.default.slice(0, limit).map(book => ({
          id: book.id,
          code: book.code || book.slug,
          name_en: book.name_en || book.name || book.title,
          name_ar: book.name_ar,
          total_hadith: book.total_hadith || book.total_hadiths || 0,
          title: book.name_en || book.title,
          description: book.description || null,
          created_at: book.created_at,
          updated_at: book.updated_at,
        })) : [],
        pagination: {}
      };
    } catch (localError) {
      console.error('Failed to load local books data:', localError);
      return { books: [] };
    }
  }
}

export async function getBookById(bookId) {
  try {
    const url = `${apiBaseUrl}/books/${bookId}`;
    const data = await fetchWithRetry(url);

    if (data && data.success && data.data) {
      const book = data.data;
      return {
        id: book.id,
        code: book.code,
        name_en: book.name_en || book.name || book.title,
        name_ar: book.name_ar,
        total_hadith: book.total_hadith || 0,
        description: book.description || null,
        created_at: book.created_at,
        updated_at: book.updated_at,
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch book ${bookId}:`, error);
    return null;
  }
}

export async function getChaptersByBook(bookId) {
  try {
    const url = `${apiBaseUrl}/chapters?book_id=${bookId}&limit=100`;
    const data = await fetchWithRetry(url);

    if (data && data.success && Array.isArray(data.data)) {
      return data.data.map(chapter => ({
        id: chapter.id,
        book_id: chapter.book_id || parseInt(bookId),
        chapter_no: chapter.chapter_no || chapter.number || chapter.id,
        name_en: chapter.name_en || chapter.name || chapter.title || `Chapter ${chapter.id}`,
        name_ar: chapter.name_ar,
        title: chapter.name_en || chapter.title || `Chapter ${chapter.id}`,
        total_hadith: chapter.total_hadith || 0,
        created_at: chapter.created_at,
        updated_at: chapter.updated_at,
      }));
    }

    return [];
  } catch (error) {
    console.warn(`Failed to fetch chapters for book ${bookId} from API, falling back to local data:`, error);
    // Fallback to local data
    try {
      const localChapters = await import('../data/chapters.json');
      const bookChapters = localChapters.default[bookId] || [];
      return bookChapters.map(chapter => ({
        id: chapter.id,
        book_id: parseInt(bookId),
        chapter_no: chapter.chapter_no || chapter.number || chapter.id,
        name_en: chapter.name_en || chapter.name || chapter.title || `Chapter ${chapter.id}`,
        name_ar: chapter.name_ar,
        title: chapter.name_en || chapter.title || `Chapter ${chapter.id}`,
        total_hadith: chapter.total_hadith || 0,
        created_at: chapter.created_at,
        updated_at: chapter.updated_at,
      }));
    } catch (localError) {
      console.error('Failed to load local chapters data:', localError);
      return [];
    }
  }
}

// Real server-side pagination (one Laravel page = one call), unlike getHadithsByChapter
// which auto-accumulates from page 1. Use this for "load page N" UI controls.
export async function getPaginatedHadithsByChapter(bookId, chapterId, page = 1, perPage = 20) {
  try {
    const data = await fetchWithRetry(
      `${apiBaseUrl}/chapters/${chapterId}/hadiths?lang=${language}&include=all_translations&page=${page}&limit=${Math.min(100, perPage)}`
    );

    const hadiths = data && data.success ? data.data : [];

    const mapped = (hadiths || []).map(hadith => ({
      id: hadith.id,
      book_id: parseInt(bookId),
      chapter_id: hadith.chapter_id || parseInt(chapterId),
      hadith_number: hadith.hadith_number || hadith.number || hadith.id,
      arabic_text: hadith.arabic_text || hadith.text_ar || hadith.text || '',
      grade: hadith.grade,
      narrator: hadith.narrator,
      explanation: hadith.explanation,
      hints: hadith.hints,
      references: hadith.references,
      word_meanings: hadith.word_meanings,
      translations: normalizeTranslations(hadith.translations),
      book: hadith.book,
      chapter: hadith.chapter,
      created_at: hadith.created_at,
      updated_at: hadith.updated_at,
    }));

    if (mapped.length > 0) {
      return {
        data: ensureSerializable(mapped),
        pagination: data?.pagination || { current_page: page, per_page: perPage, total_items: mapped.length, total_pages: 1 },
      };
    }

    return await getLocalPaginatedChapterHadiths(bookId, chapterId, page, perPage);
  } catch (error) {
    console.warn(`Failed to fetch page ${page} of hadiths for chapter ${chapterId} from API, falling back to local data:`, error);
    return await getLocalPaginatedChapterHadiths(bookId, chapterId, page, perPage);
  }
}

async function getLocalPaginatedChapterHadiths(bookId, chapterId, page = 1, perPage = 20) {
  const all = await getLocalChapterHadiths(bookId, chapterId, 100000);
  const start = (page - 1) * perPage;
  const pageData = all.slice(start, start + perPage);
  return {
    data: pageData,
    pagination: {
      current_page: page,
      per_page: perPage,
      total_items: all.length,
      total_pages: Math.max(1, Math.ceil(all.length / perPage)),
    },
  };
}

export async function getHadithsByChapter(bookId, chapterId, limit = 50) {
  try {
    let allHadiths = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 5 && allHadiths.length < limit) {
      try {
        const pageLimit = Math.min(100, limit - allHadiths.length);
        const data = await fetchWithRetry(
          `${apiBaseUrl}/chapters/${chapterId}/hadiths?lang=${language}&include=all_translations&page=${page}&limit=${pageLimit}`
        );

        const hadiths = data && data.success ? data.data : [];

        if (Array.isArray(hadiths) && hadiths.length > 0) {
          const processedHadiths = hadiths.map(hadith => ({
            id: hadith.id,
            book_id: parseInt(bookId),
            chapter_id: hadith.chapter_id || parseInt(chapterId),
            hadith_number: hadith.hadith_number || hadith.number || hadith.id,
            arabic_text: hadith.arabic_text || hadith.text_ar || hadith.text || '',
            grade: hadith.grade,
            narrator: hadith.narrator,
            explanation: hadith.explanation,
            hints: hadith.hints,
            references: hadith.references,
            word_meanings: hadith.word_meanings,
            translations: normalizeTranslations(hadith.translations),
            book: hadith.book,
            chapter: hadith.chapter,
            created_at: hadith.created_at,
            updated_at: hadith.updated_at,
          }));

          allHadiths = [...allHadiths, ...processedHadiths];
          hasMore = data.pagination ? page < data.pagination.total_pages : false;
          page++;
        } else {
          hasMore = false;
        }
      } catch (pageError) {
        console.error(`Failed to fetch page ${page}:`, pageError);
        hasMore = false;
      }
    }

    if (allHadiths.length > 0) {
      return ensureSerializable(allHadiths);
    }

    console.warn(`No hadiths returned from API for chapter ${chapterId}, falling back to local data`);
    return await getLocalChapterHadiths(bookId, chapterId, limit);
  } catch (error) {
    console.warn(`Failed to fetch hadiths for book ${bookId}, chapter ${chapterId} from API, falling back to local data:`, error);
    return await getLocalChapterHadiths(bookId, chapterId, limit);
  }
}

// Several fields in data/hadiths.json (grade, narrator, explanation, hints,
// references, word_meanings) are keyed per-language, e.g. {en: "...", ar: "..."},
// unlike arabic_text/translations which are handled separately. Pick a single
// string out of that shape for the app's configured language, falling back to
// English, then any available language, then the raw value if it's already a string.
function pickLocalizedField(value, lang = language) {
  if (value == null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) return value;
  return value[lang] || value.en || Object.values(value)[0];
}

async function getLocalChapterHadiths(bookId, chapterId, limit = 50) {
  try {
    const localHadiths = await import('../data/hadiths.json');
    const bookData = localHadiths.default[String(bookId)];
    const chapterHadiths = bookData ? bookData[String(chapterId)] : null;

    if (!Array.isArray(chapterHadiths)) return [];

    const mapped = chapterHadiths.slice(0, limit).map(hadith => ({
      id: hadith.id,
      book_id: parseInt(bookId),
      chapter_id: parseInt(chapterId),
      hadith_number: hadith.hadith_number || hadith.id,
      arabic_text: hadith.arabic_text || hadith.hadeeth || '',
      grade: pickLocalizedField(hadith.grade),
      narrator: pickLocalizedField(hadith.narrator),
      explanation: pickLocalizedField(hadith.explanation),
      translations: hadith.translations || {},
      created_at: hadith.created_at,
      updated_at: hadith.updated_at,
    }));

    return ensureSerializable(mapped);
  } catch (localError) {
    console.error('Failed to load local hadiths data:', localError);
    return [];
  }
}

// Alias used by some pages that want the full (unpaginated) hadith list for a chapter.
export async function getAllHadithsByChapter(bookId, chapterId, limit = 500) {
  return getHadithsByChapter(bookId, chapterId, limit);
}

export async function getHadithDetailsById(hadithId) {
  try {
    const data = await fetchWithRetry(`${apiBaseUrl}/hadiths/${hadithId}`);
    const hadith = data && data.success ? data.data : null;

    if (!hadith) {
      console.warn(`Hadith ${hadithId} not found, falling back to local data`);
      return await getLocalHadithById(hadithId);
    }

    // The show endpoint already returns all translations in one call.
    const translations = normalizeTranslations(hadith.translations);

    const result = {
      id: hadith.id,
      book_id: hadith.book_id,
      chapter_id: hadith.chapter_id,
      hadith_number: hadith.hadith_number || hadith.number || hadith.id,
      arabic_text: hadith.arabic_text || hadith.hadeeth || hadith.text_ar || hadith.text || '',
      grade: hadith.grade,
      narrator: hadith.narrator,
      explanation: hadith.explanation,
      hints: hadith.hints,
      references: hadith.references,
      word_meanings: hadith.word_meanings,
      translations: translations,
      book: hadith.book,
      chapter: hadith.chapter,
      categories: hadith.categories || [],
      created_at: hadith.created_at,
      updated_at: hadith.updated_at,
    };
    
    return ensureSerializable(result);
  } catch (error) {
    console.warn(`Failed to fetch hadith details for ${hadithId} from API, falling back to local data:`, error);
    return await getLocalHadithById(hadithId);
  }
}

async function getLocalHadithById(hadithId) {
  try {
    const localHadiths = await import('../data/hadiths.json');
    const targetId = parseInt(hadithId);

    for (const [bookId, chapters] of Object.entries(localHadiths.default)) {
      for (const [chapterId, hadiths] of Object.entries(chapters)) {
        const found = (hadiths || []).find(h => h.id === targetId);
        if (found) {
          return ensureSerializable({
            id: found.id,
            book_id: parseInt(bookId),
            chapter_id: parseInt(chapterId),
            hadith_number: found.hadith_number || found.id,
            arabic_text: found.arabic_text || found.hadeeth || '',
            grade: pickLocalizedField(found.grade),
            narrator: pickLocalizedField(found.narrator),
            explanation: pickLocalizedField(found.explanation),
            translations: found.translations || {},
            categories: found.categories || [],
            created_at: found.created_at,
            updated_at: found.updated_at,
          });
        }
      }
    }

    return null;
  } catch (localError) {
    console.error('Failed to load local hadith data:', localError);
    return null;
  }
}

// Resolve a hadith by its book-scoped number (e.g. book 1, hadith "1a") rather than
// its internal database id, then delegate to getHadithDetailsById for the full record.
export async function getHadithDetails(bookId, hadithNumber, lang = language) {
  try {
    const data = await fetchWithRetry(
      `${apiBaseUrl}/hadiths?book_id=${bookId}&lang=${lang}&limit=100`
    );

    const list = data && data.success ? data.data : [];
    const match = (list || []).find(h => String(h.hadith_number) === String(hadithNumber));

    if (!match) {
      console.warn(`Hadith ${hadithNumber} not found in book ${bookId} via API, falling back to local data`);
      return await getLocalHadithByNumber(bookId, hadithNumber);
    }

    return getHadithDetailsById(match.id);
  } catch (error) {
    console.warn(`Failed to fetch hadith details for book ${bookId}, number ${hadithNumber} from API, falling back to local data:`, error);
    return await getLocalHadithByNumber(bookId, hadithNumber);
  }
}

async function getLocalHadithByNumber(bookId, hadithNumber) {
  try {
    const localHadiths = await import('../data/hadiths.json');
    const bookData = localHadiths.default[String(bookId)];
    if (!bookData) return null;

    for (const [chapterId, hadiths] of Object.entries(bookData)) {
      const found = (hadiths || []).find(h => String(h.hadith_number) === String(hadithNumber));
      if (found) {
        return ensureSerializable({
          id: found.id,
          book_id: parseInt(bookId),
          chapter_id: parseInt(chapterId),
          hadith_number: found.hadith_number || found.id,
          arabic_text: found.arabic_text || found.hadeeth || '',
          grade: pickLocalizedField(found.grade),
          narrator: pickLocalizedField(found.narrator),
          explanation: pickLocalizedField(found.explanation),
          translations: found.translations || {},
          categories: found.categories || [],
          created_at: found.created_at,
          updated_at: found.updated_at,
        });
      }
    }

    return null;
  } catch (localError) {
    console.error('Failed to load local hadith data:', localError);
    return null;
  }
}

function normalizeTranslations(translations) {
  if (!translations) return {};
  
  const result = {};
  
  if (Array.isArray(translations)) {
    translations.forEach(trans => {
      if ((trans.language || trans.localization_code) && (trans.translation_text || trans.translation || trans.text)) {
        const lang = trans.language || trans.localization_code;
        result[lang] = trans.translation_text || trans.translation || trans.text;
      }
    });
  } else if (typeof translations === 'object') {
    Object.entries(translations).forEach(([lang, value]) => {
      if (value && typeof value === 'object') {
        result[lang] = value.translation_text || value.translation || value.text || '';
      } else if (value) {
        result[lang] = String(value);
      }
    });
  }
  
  return result;
}

// ==================== CATEGORY FUNCTIONS ====================

export async function getRootCategories() {
  try {
    const url = `${apiBaseUrl}/categories?parent_id=0`;
    const data = await fetchWithRetry(url);

    if (data && data.success && Array.isArray(data.data)) {
      return data.data.map(cat => ({
        id: cat.id,
        name_en: cat.name_en || cat.name || cat.title,
        name_ar: cat.name_ar,
        title: cat.name_en || cat.title,
        parent_id: cat.parent_id,
        hadiths_count: cat.hadiths_count || cat.total_hadith || 0,
        description: cat.description || null,
        created_at: cat.created_at,
        updated_at: cat.updated_at,
      }));
    }

    return [];
  } catch (error) {
    console.warn('Failed to fetch root categories from API, falling back to local data:', error);
    // Fallback to local data
    try {
      const localCategories = await import('../data/categories.json');
      return Array.isArray(localCategories.default) 
        ? localCategories.default
            .filter(cat => !cat.parent_id) // Only root categories
            .map(cat => ({
              id: cat.id,
              name_en: cat.name_en || cat.name || cat.title,
              name_ar: cat.name_ar,
              title: cat.name_en || cat.title,
              parent_id: cat.parent_id,
              hadiths_count: cat.hadiths_count || cat.total_hadith || 0,
              description: cat.description || null,
              created_at: cat.created_at,
              updated_at: cat.updated_at,
            }))
        : [];
    } catch (localError) {
      console.error('Failed to load local categories data:', localError);
      return [];
    }
  }
}

export async function getAllCategories(page = 1, limit = 50) {
  try {
    const url = `${apiBaseUrl}/categories`;
    const data = await fetchWithRetry(url);

    if (data && data.success && Array.isArray(data.data)) {
      const start = (page - 1) * limit;
      const paged = data.data.slice(start, start + limit);
      return {
        categories: paged.map(cat => ({
          id: cat.id,
          name_en: cat.name_en || cat.name || cat.title,
          name_ar: cat.name_ar,
          title: cat.name_en || cat.title,
          parent_id: cat.parent_id,
          hadiths_count: cat.hadiths_count || cat.total_hadith || 0,
          description: cat.description || null,
          created_at: cat.created_at,
          updated_at: cat.updated_at,
        })),
        pagination: { current_page: page, per_page: limit, total: data.total || data.data.length }
      };
    }

    return { categories: [] };
  } catch (error) {
    console.warn('Failed to fetch all categories from API, falling back to local data:', error);
    // Fallback to local data
    try {
      const localCategories = await import('../data/categories.json');
      return {
        categories: Array.isArray(localCategories.default) 
          ? localCategories.default.slice(0, limit).map(cat => ({
              id: cat.id,
              name_en: cat.name_en || cat.name || cat.title,
              name_ar: cat.name_ar,
              title: cat.name_en || cat.title,
              parent_id: cat.parent_id,
              hadiths_count: cat.hadiths_count || cat.total_hadith || 0,
              description: cat.description || null,
              created_at: cat.created_at,
              updated_at: cat.updated_at,
            }))
          : [],
        pagination: {}
      };
    } catch (localError) {
      console.error('Failed to load local categories data:', localError);
      return { categories: [] };
    }
  }
}

export async function getCategoryById(categoryId) {
  try {
    const data = await fetchWithRetry(`${apiBaseUrl}/categories/${categoryId}`);
    const category = data && data.success ? data.data : null;

    if (!category) return null;

    return {
      id: category.id,
      name_en: category.name_en || category.name || category.title,
      name_ar: category.name_ar,
      title: category.name_en || category.title,
      parent_id: category.parent_id,
      hadiths_count: category.hadiths_count || category.total_hadith || 0,
      description: category.description || null,
      created_at: category.created_at,
      updated_at: category.updated_at,
    };
  } catch (error) {
    console.error(`Failed to fetch category ${categoryId}:`, error);
    return null;
  }
}

export async function getSubcategories(parentId) {
  try {
    const data = await fetchWithRetry(`${apiBaseUrl}/categories?parent_id=${parentId}`);
    const categories = data && data.success ? data.data : null;

    return Array.isArray(categories) ? categories.map(cat => ({
      id: cat.id,
      name_en: cat.name_en || cat.name || cat.title,
      name_ar: cat.name_ar,
      title: cat.name_en || cat.title,
      parent_id: cat.parent_id || parentId,
      hadiths_count: cat.hadiths_count || cat.total_hadith || 0,
      description: cat.description || null,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
    })) : [];
  } catch (error) {
    console.error(`Failed to fetch subcategories for ${parentId}:`, error);
    return [];
  }
}

// Real server-side pagination (one Laravel page = one call), unlike getHadithsByCategory
// which returns a single fixed-size batch. Use this for "load page N" UI controls.
export async function getPaginatedHadithsByCategory(categoryId, page = 1, perPage = 20) {
  try {
    const data = await fetchWithRetry(
      `${apiBaseUrl}/categories/${categoryId}/hadiths?lang=${language}&page=${page}&limit=${Math.min(100, perPage)}`
    );

    const hadiths = data && data.success ? data.data : [];

    const mapped = (hadiths || []).map(hadith => ({
      id: hadith.id,
      book_id: hadith.book_id,
      chapter_id: hadith.chapter_id,
      hadith_number: hadith.hadith_number || hadith.number || hadith.id,
      arabic_text: hadith.arabic_text || hadith.text_ar || hadith.text || '',
      grade: hadith.grade,
      narrator: hadith.narrator,
      explanation: hadith.explanation,
      hints: hadith.hints,
      references: hadith.references,
      word_meanings: hadith.word_meanings,
      translations: hadith.translation ? { [language]: hadith.translation } : {},
      book: hadith.book_name ? { name_en: hadith.book_name, code: hadith.book_code } : hadith.book,
      chapter: hadith.chapter_name ? { name_en: hadith.chapter_name, chapter_no: hadith.chapter_no } : hadith.chapter,
      category_id: categoryId,
      created_at: hadith.created_at,
      updated_at: hadith.updated_at,
    }));

    return {
      data: ensureSerializable(mapped),
      pagination: data?.pagination || { current_page: page, per_page: perPage, total_items: mapped.length, total_pages: 1 },
    };
  } catch (error) {
    console.error(`Failed to fetch page ${page} of hadiths for category ${categoryId}:`, error);
    return { data: [], pagination: { current_page: page, per_page: perPage, total_items: 0, total_pages: 1 } };
  }
}

export async function getHadithsByCategory(categoryId, limit = 50) {
  try {
    const data = await fetchWithRetry(
      `${apiBaseUrl}/categories/${categoryId}/hadiths?lang=${language}&limit=${Math.min(100, limit)}`
    );

    const rawHadiths = data && data.success ? data.data : [];

    const hadiths = (rawHadiths || []).map(hadith => ({
      id: hadith.id,
      book_id: hadith.book_id,
      chapter_id: hadith.chapter_id,
      hadith_number: hadith.hadith_number || hadith.number || hadith.id,
      arabic_text: hadith.arabic_text || hadith.text_ar || hadith.text || '',
      grade: hadith.grade,
      narrator: hadith.narrator,
      explanation: hadith.explanation,
      hints: hadith.hints,
      references: hadith.references,
      word_meanings: hadith.word_meanings,
      translations: hadith.translation ? { [language]: hadith.translation } : {},
      book: hadith.book_name ? { name_en: hadith.book_name, code: hadith.book_code } : hadith.book,
      chapter: hadith.chapter_name ? { name_en: hadith.chapter_name, chapter_no: hadith.chapter_no } : hadith.chapter,
      category_id: categoryId,
      created_at: hadith.created_at,
      updated_at: hadith.updated_at,
    }));

    return ensureSerializable(hadiths);
  } catch (error) {
    console.error(`Failed to fetch hadiths for category ${categoryId}:`, error);
    return [];
  }
}

// Alias used by some pages that want the full hadith list for a category.
export async function getAllHadithsByCategory(categoryId, limit = 500) {
  return getHadithsByCategory(categoryId, limit);
}

// ==================== UTILITY FUNCTIONS ====================

// Fetch a single hadith's translation text in one language, by hadith id.
// (bookId is accepted for call-site convenience but is not needed for the lookup.)
export async function getTranslations(bookId, hadithId, lang) {
  const translation = await getTranslation(hadithId, lang);
  return translation ? translation.text : null;
}

export async function getTranslation(hadithId, lang) {
  try {
    const data = await fetchWithRetry(`${apiBaseUrl}/hadiths/${hadithId}/translations`);
    const translations = data && data.success ? data.data : [];

    const translation = (translations || []).find(t => t.localization_code === lang);

    if (translation) {
      return {
        text: translation.translation_text || '',
        narrator: translation.translator_name,
      };
    }

    return null;
  } catch (error) {
    console.warn(`Failed to fetch ${lang} translation for hadith ${hadithId}:`, error);
    return null;
  }
}

export async function getAvailableLanguages(hadithId) {
  try {
    const data = await fetchWithRetry(`${apiBaseUrl}/hadiths/${hadithId}/translations`);
    const translations = data && data.success ? data.data : [];

    if (Array.isArray(translations)) {
      const languages = translations.map(t => t.localization_code).filter(Boolean);
      return [...new Set(languages)]; // Remove duplicates
    }
    return [config.language];
  } catch (error) {
    console.warn(`Failed to fetch available languages for hadith ${hadithId}:`, error);
    return [config.language];
  }
}

export async function getRandomHadith() {
  try {
    const data = await fetchWithRetry(`${apiBaseUrl}/hadiths/random?lang=${language}`);
    const hadith = data && data.success ? data.data : null;

    if (hadith && hadith.id) {
      const details = await getHadithDetailsById(hadith.id);
      return details;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch random hadith:', error);
    return null;
  }
}

// ==================== NEW STATS FUNCTIONS ====================

export async function getStats() {
  try {
    const url = `${apiBaseUrl}/stats`;
    const data = await fetchWithRetry(url);

    if (data && data.success && data.data) {
      const s = data.data;
      return {
        total_books: s.books || 0,
        total_chapters: s.chapters || 0,
        total_hadiths: s.hadiths || 0,
        total_translations: s.translations || 0,
        languages_available: (s.languages_breakdown || []).map(l => l.localization_code),
      };
    }

    return null;
  } catch (error) {
    console.warn('Failed to fetch stats from API, using fallback data:', error);
    // Fallback stats
    return {
      total_books: 10,
      total_chapters: 407,
      total_hadiths: 36104,
      total_translations: 223217,
      languages_available: ['ar', 'en', 'bn', 'ur', 'fr', 'id', 'tr', 'ru', 'ta', 'vi']
    };
  }
}

export async function getLanguageStats() {
  try {
    const url = `${apiBaseUrl}/stats`;
    const data = await fetchWithRetry(url);

    if (data && data.success && data.data && Array.isArray(data.data.languages_breakdown)) {
      const totalHadiths = data.data.hadiths || 0;
      const result = {};
      data.data.languages_breakdown.forEach(l => {
        result[l.localization_code] = {
          count: l.count,
          percentage: totalHadiths > 0 ? Math.round((l.count / totalHadiths) * 10000) / 100 : 0,
        };
      });
      return result;
    }

    return null;
  } catch (error) {
    console.warn('Failed to fetch language stats from API, using fallback data:', error);
    // Fallback language stats
    return {
      ar: { count: 36104, percentage: 100 },
      en: { count: 36093, percentage: 99.97 },
      bn: { count: 35755, percentage: 99.03 },
      ur: { count: 33211, percentage: 91.99 },
      fr: { count: 31702, percentage: 87.81 },
      id: { count: 30778, percentage: 85.25 },
      tr: { count: 30267, percentage: 83.83 },
      ru: { count: 14764, percentage: 40.89 },
      ta: { count: 9912, percentage: 27.45 },
      vi: { count: 735, percentage: 2.04 }
    };
  }
}

async function getLanguages() {
  try {
    const data = await fetchWithRetry(`${apiBaseUrl}/languages`);
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('Failed to fetch languages:', error);
    return [];
  }
}

async function getHadithsWithMetadata(chapterId, limit = 1) {
  try {
    const data = await fetchWithRetry(`${apiBaseUrl}/hadiths_with_metadata?chapter_id=${chapterId}&limit=${limit}`);
    return normalizeApiResponse(data);
  } catch (error) {
    console.error('Failed to fetch hadiths with metadata:', error);
    return [];
  }
}

async function searchHadiths(query, options = {}) {
  try {
    const params = new URLSearchParams({
      q: query,
      language: language,
      limit: options.limit || 20,
      ...options,
    });
    
    const data = await fetchWithRetry(
      `${apiBaseUrl}/search?${params.toString()}`
    );
    
    const results = normalizeApiResponse(data);
    
    return Array.isArray(results) ? results.map(result => ({
      id: result.id,
      title: result.title || `Hadith ${result.id}`,
      arabic_text: result.arabic_text || result.text_ar || '',
      translations: normalizeTranslations(result.translations),
      book: result.book,
      chapter: result.chapter,
    })) : [];
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

// ==================== PAGINATION FUNCTIONS ====================

export async function getPaginatedHadiths(endpoint, page = 1, perPage = 20) {
  try {
    const url = endpoint.includes('?') 
      ? `${endpoint}&page=${page}&per_page=${perPage}`
      : `${endpoint}?page=${page}&per_page=${perPage}`;
    
    const data = await fetchWithRetry(url);
    const response = normalizeApiResponse(data);
    
    let hadiths = [];
    let total = 0;
    let lastPage = 1;
    
    if (Array.isArray(response)) {
      hadiths = response;
      total = response.length;
    } else if (response && response.data) {
      hadiths = Array.isArray(response.data) ? response.data : [];
      total = response.meta?.total_items || hadiths.length;
      lastPage = response.meta?.last_page || 1;
    }
    
    return {
      data: hadiths.map(hadith => ({
        id: hadith.id,
        book_id: hadith.book_id,
        chapter_id: hadith.chapter_id,
        hadith_number: hadith.hadith_number || hadith.number || hadith.id,
        arabic_text: hadith.arabic_text || hadith.text_ar || hadith.text || '',
        grade: hadith.grade,
        narrator: hadith.narrator,
        translations: normalizeTranslations(hadith.translations),
        book: hadith.book,
        chapter: hadith.chapter,
        category_id: hadith.category_id,
        created_at: hadith.created_at,
        updated_at: hadith.updated_at,
      })),
      pagination: {
        current_page: page,
        per_page: perPage,
        total: total,
        last_page: lastPage,
      },
    };
  } catch (error) {
    console.error(`Failed to fetch paginated data from ${endpoint}:`, error);
    return {
      data: [],
      pagination: {
        current_page: page,
        per_page: perPage,
        total: 0,
        last_page: 1,
      },
    };
  }
}

// ==================== COMPATIBILITY FUNCTIONS ====================

// Empty local data functions (API-only mode)
function getLocalBooks() {
  if (useApiOnly) {
    console.warn('Local data functions disabled in API-only mode');
    return [];
  }
  return [];
}

function getLocalCategories() {
  if (useApiOnly) {
    console.warn('Local data functions disabled in API-only mode');
    return [];
  }
  return [];
}

function getLocalChaptersByBook() {
  if (useApiOnly) {
    console.warn('Local data functions disabled in API-only mode');
    return [];
  }
  return [];
}

function getLocalHadithsByChapter() {
  if (useApiOnly) {
    console.warn('Local data functions disabled in API-only mode');
    return [];
  }
  return [];
}

function getLocalHadithsByCategory() {
  if (useApiOnly) {
    console.warn('Local data functions disabled in API-only mode');
    return [];
  }
  return [];
}

function getLocalSubcategories() {
  if (useApiOnly) {
    console.warn('Local data functions disabled in API-only mode');
    return [];
  }
  return [];
}

function getLocalRootCategories() {
  if (useApiOnly) {
    console.warn('Local data functions disabled in API-only mode');
    return [];
  }
  return [];
}

// Build category tree
function buildCategoryTree(categories) {
  if (!Array.isArray(categories)) return [];
  
  const categoryMap = new Map();
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });
  
  const rootCategories = [];
  categories.forEach(category => {
    const node = categoryMap.get(category.id);
    
    if (!category.parent_id || category.parent_id === null) {
      rootCategories.push(node);
    } else {
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    }
  });
  
  return rootCategories;
}

export async function getAllCategoriesTree() {
  try {
    const categories = await getAllCategories();
    const tree = buildCategoryTree(categories);
    return ensureSerializable(tree);
  } catch (error) {
    console.error('Failed to build category tree:', error);
    return [];
  }
}

// Export for getStaticProps
export {
  getLocalBooks,
  getLocalCategories,
  getLocalChaptersByBook,
  getLocalHadithsByChapter
};
export function safeProps(props) {
  return ensureSerializable(props);
}